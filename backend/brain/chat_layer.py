import sys
from pathlib import Path

# Same sys.path shim as the other brain/ modules - see rule_engine.py's comment.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dataclasses import dataclass

from schemas import CancerType

# Reuses Layer 3's already-loaded embedding model, FAISS index, LLM client
# getter, and safety check - NOT reloaded here. Importing rag_llm_layer just
# binds names to the objects that module already built at its own import
# time (model load + FAISS index build happens ONCE, in rag_llm_layer.py,
# no matter how many other modules import it).
#
# Deliberately additive: this file does not modify rag_llm_layer.py at all,
# so the existing /api/v1/assessment pipeline's behavior is unchanged.
try:
    from .rag_llm_layer import (
        USE_LIVE_LLM,
        _embed_model,
        _index,
        DISTANCE_THRESHOLD,
        _get_client,
        _fails_safety_check,
        _retrieve_relevant_chunks,
    )
    from .protocol_chunks import protocol_chunks
except ImportError:
    from rag_llm_layer import (
        USE_LIVE_LLM,
        _embed_model,
        _index,
        DISTANCE_THRESHOLD,
        _get_client,
        _fails_safety_check,
        _retrieve_relevant_chunks,
    )
    from protocol_chunks import protocol_chunks


@dataclass
class ChatResult:
    reply: str
    retrieved_sources: list[str]
    # True when the reply was grounded in at least one retrieved protocol
    # chunk. False for the disabled/error paths AND for live replies where
    # nothing relevant was retrieved (e.g. small talk, or a question outside
    # the protocol knowledge base) - main.py surfaces this so the frontend
    # can visually distinguish "grounded answer" from "general conversation"
    # if it wants to, same spirit as Layer 3's retrieved_sources field.
    grounded: bool


# ============================================================================
# RETRIEVAL - chat-specific wrapper
#
# Layer 3's _retrieve_relevant_chunks() always requires a CancerType (it's
# always generating guidance FOR a specific cancer type). A chat message
# doesn't always have one - "what does HPV mean?" isn't tied to any cancer
# type in particular. When cancer_type is given, delegate straight to Layer
# 3's function (identical filtering behavior, one code path). When it's
# None, search with no tag filter, keeping only the distance filter -
# implemented directly against the shared _embed_model/_index rather than
# duplicating protocol_chunks.py's tag logic for a "match anything" case.
# ============================================================================
_CHAT_OVER_FETCH_MULTIPLIER = 4


def _retrieve_chat_chunks(query: str, cancer_type: CancerType | None, k: int = 3) -> list[str]:
    if cancer_type is not None:
        return _retrieve_relevant_chunks(query, cancer_type, k=k)

    query_embedding = _embed_model.encode([query]).astype("float32")
    distances, indices = _index.search(query_embedding, k * _CHAT_OVER_FETCH_MULTIPLIER)

    matches = []
    for dist, i in zip(distances[0], indices[0]):
        if dist >= DISTANCE_THRESHOLD:
            continue
        matches.append(protocol_chunks[i]["title"])
        if len(matches) >= k:
            break
    return matches


# ============================================================================
# SYSTEM PROMPT
#
# Same 4 safety rules as Layer 3's _call_llm system prompt (no diagnosis,
# strict grounding, professional escalation, calm tone) plus two additions
# specific to chat: (a) explicit permission to handle ordinary conversational
# turns without needing grounding for those, since a real chat UI gets
# "hi" / "thanks" / "what does that mean" - not every turn is a clinical
# claim - and (b) an explicit instruction to name the gap rather than
# improvise when a clinical question ISN'T covered by the retrieved context,
# since chat is far more open-ended than the fixed-shape risk report and
# will get questions the ~26-chunk knowledge base doesn't cover.
# ============================================================================
CHAT_SYSTEM_PROMPT = """You are OncoGuard's AI Assistant - a conversational companion to \
OncoGuard's cancer risk screening tool. You are a separate feature from the structured risk \
report; you answer follow-up questions in plain conversation.

CRITICAL SAFETY RULES (same rules the rest of OncoGuard follows):
1. NO DIAGNOSIS: Never state or imply that the user does or does NOT have cancer or any \
disease. Only a qualified professional can determine that.
2. GROUND OR ADMIT IT: When "Relevant clinical context" is provided below, base any specific \
clinical claim strictly on it. If a question needs a specific clinical claim and no relevant \
context was provided for it, say plainly that you don't have grounded guidance on that point \
and suggest asking a healthcare professional - do not invent an answer from general knowledge.
3. PROFESSIONAL ESCALATION: For any specific personal health concern, include a reminder to \
consult a healthcare professional.
4. TONE: Calm, brief, objective, non-alarming. The user should feel informed, not afraid.
5. Ordinary conversational turns (greetings, thanks, "what does that mean?") don't need \
grounding - rule 2 is about clinical claims, not every sentence.

Keep replies concise - a few short paragraphs at most. This is a mobile chat interface."""


_MAX_HISTORY_MESSAGES = 10  # last N messages sent to the LLM - bounds latency/cost on the free tier

_DISABLED_REPLY = (
    "Live chat is turned off in this environment right now (USE_LIVE_LLM=false), so I can't "
    "generate a response. If this is urgent, please contact a healthcare professional directly "
    "rather than waiting."
)

_ERROR_REPLY = (
    "I'm having trouble connecting right now - sorry about that. Please try again in a moment, "
    "and if this is urgent, don't wait on me: contact a healthcare professional directly."
)

_SAFETY_DEFLECTION_REPLY = (
    "I can't confirm or rule out a diagnosis - only a healthcare professional can do that. "
    "I can help explain risk factors or general screening guidance instead - what would be useful?"
)


def generate_chat_reply(
    messages: list[dict],
    cancer_type: CancerType | None = None,
    context_summary: str | None = None,
) -> ChatResult:
    """
    Runs one turn of the RAG-grounded chat assistant.

    `messages` is the FULL client-managed conversation history: OncoGuard has no chat
    persistence yet (see README's "Stateless by design" note), so the frontend resends
    the whole conversation every turn - same pattern as the Anthropic Messages API.
    Each item is {"role": "user" | "assistant", "content": str}. Must be non-empty and
    end with a "user" turn - main.py validates this before calling in, so this function
    can assume it.

    `cancer_type` / `context_summary` are OPTIONAL grounding hints the frontend can pass
    when chat is opened from a specific risk report, e.g.:
        cancer_type=CancerType.LUNG
        context_summary="Lung cancer risk: HIGH. Key factors: persistent cough, current smoker."
    Both are optional so this also works as a general Q&A assistant with no prior report -
    same "don't force context that isn't there" principle as ml_layer.py's model_available flag.

    Mirrors Layer 3's degrade-gracefully posture throughout: disabled flag, empty
    retrieval, safety-check failure, and an outright API error all return a normal
    ChatResult with a calm, honest message - never an exception, never a crash.
    """
    if not USE_LIVE_LLM:
        return ChatResult(reply=_DISABLED_REPLY, retrieved_sources=[], grounded=False)

    latest_user_message = messages[-1]["content"]

    # Fold cancer_type into the retrieval query text itself (not just the
    # downstream tag filter) - same reasoning as Layer 3's _build_query.
    query = f"{cancer_type.value} cancer: {latest_user_message}" if cancer_type else latest_user_message
    retrieved_sources = _retrieve_chat_chunks(query, cancer_type, k=3)

    if retrieved_sources:
        context_block = "\n".join(
            f"- {c['title']}: {c['text']}"
            for c in protocol_chunks if c["title"] in retrieved_sources
        )
    else:
        context_block = (
            "(Nothing in the ICMR/WHO protocol knowledge base was closely relevant to this "
            "specific message - see safety rule 2: don't invent a clinical claim to fill this gap.)"
        )

    grounding_lines = [f"Relevant clinical context:\n{context_block}"]
    if cancer_type is not None:
        grounding_lines.insert(0, f"Cancer type in focus: {cancer_type.value}")
    if context_summary:
        grounding_lines.insert(0, f"Patient's latest risk assessment summary: {context_summary}")

    full_system_prompt = CHAT_SYSTEM_PROMPT + "\n\n" + "\n\n".join(grounding_lines)

    trimmed_history = messages[-_MAX_HISTORY_MESSAGES:]
    llm_messages = [{"role": "system", "content": full_system_prompt}] + [
        {"role": m["role"], "content": m["content"]} for m in trimmed_history
    ]

    try:
        response = _get_client().chat.completions.create(
            model="openrouter/free",
            max_tokens=400,
            # Same reasoning as Layer 3's _call_llm: bound worst-case latency
            # instead of trusting the free tier not to hang.
            timeout=20.0,
            messages=llm_messages,
            extra_headers={
                "HTTP-Referer": "http://localhost:8000",
                "X-Title": "OncoGuard",
            },
        )
        reply = response.choices[0].message.content

        if _fails_safety_check(reply):
            print("[Chat] reply failed safety check (diagnostic language) - using deflection")
            return ChatResult(
                reply=_SAFETY_DEFLECTION_REPLY,
                retrieved_sources=retrieved_sources,
                grounded=bool(retrieved_sources),
            )

        return ChatResult(
            reply=reply,
            retrieved_sources=retrieved_sources,
            grounded=bool(retrieved_sources),
        )

    except Exception as e:
        print(f"Warning: chat LLM call failed. Error: {e}")
        return ChatResult(reply=_ERROR_REPLY, retrieved_sources=[], grounded=False)