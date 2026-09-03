import sys
from pathlib import Path

# Make the project root importable (so `from schemas import ...` below works)
# whether this file is run directly (`python brain/rule_engine.py`), as a
# module (`python -m brain.rule_engine`), or imported normally by main.py.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from enum import Enum
from dataclasses import dataclass
from schemas import RiskTier, CancerType, most_severe_tier

# Same try/relative-then-plain import pattern as brain/ml_layer.py.
try:
    from .rule_engine import RuleEngineResult
    from .ml_layer import Layer2Result
    from .protocol_chunks import protocol_chunks
except ImportError:
    from rule_engine import RuleEngineResult
    from ml_layer import Layer2Result
    from protocol_chunks import protocol_chunks

from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

import os
from dotenv import load_dotenv
from openai import OpenAI  # Swapped from Anthropic
"""DOCUMENTATION NOTE: Due to hackathon budget constraints,
   Layer 3 currently uses OpenRouter's free-tier model router
   rather than the Claude API named in our original design;
   production deployment would use Claude directly,
   and the architecture requires no changes to make that swap."""

# --- API CLIENT SETUP ---
# Load environment variables from the .env file so the API key never touches the codebase.
load_dotenv()

# Feature flag: Controls whether to call the live LLM API or use fallback guidance directly
USE_LIVE_LLM = os.environ.get("USE_LIVE_LLM", "false").lower() == "true"

# BUGFIX (found while testing this restructure - present in the original code
# too, not introduced by these changes): newer versions of the `openai`
# package raise immediately if OPENROUTER_API_KEY isn't set, at *client
# construction* time - not just when you actually try to call the API. That
# meant the whole app failed to even start without an API key configured,
# defeating the entire point of USE_LIVE_LLM's graceful fallback. The client
# is now built lazily, only the first time a live LLM call is actually made,
# so USE_LIVE_LLM=false (the default) truly needs no API key at all.
_client = None

def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.environ.get("OPENROUTER_API_KEY"),
        )
    return _client

# --- GLOBAL EMBEDDING & INDEX SETUP ---
# Initialize the embedding model once at startup to avoid reloading overhead per request
_embed_model = SentenceTransformer('all-MiniLM-L6-v2')

# Extract all text chunks from the protocol data to prepare them for vectorization
_chunk_texts = [c["text"] for c in protocol_chunks]

# Convert the text chunks into numerical vectors (embeddings) and cast to float32 for FAISS compatibility
_chunk_embeddings = _embed_model.encode(_chunk_texts).astype('float32')

# Create a FAISS index using L2 (Euclidean) distance matching the dimension size of our embeddings
_index = faiss.IndexFlatL2(_chunk_embeddings.shape[1])

# Add all protocol chunk embeddings into the FAISS index for fast similarity searching
_index.add(_chunk_embeddings)

# --- DISTANCE THRESHOLD ---
# Empirically set from test distances to prevent irrelevant chunks from being surfaced.
# Well-matched chunks typically land between 0.4 - 0.9.
# Coincidental/poor matches typically land > 1.1.
DISTANCE_THRESHOLD = 1.0

# IMPROVEMENT: how many extra candidates to over-fetch from FAISS before
# filtering by cancer_type. We keep one single global index (simple - no
# per-cancer-type index to keep in sync) and just ask FAISS for more results
# than we need, then narrow down to the ones tagged for this cancer type (or
# "general"). The knowledge base is small (~25 chunks), so over-fetching is cheap.
_OVER_FETCH_MULTIPLIER = 4

def _retrieve_relevant_chunks(query: str, cancer_type: CancerType, k: int = 3) -> list[str]:
    """
    Retrieves up to 'k' relevant chunks for the given cancer type.

    IMPROVEMENT (cancer-type-aware retrieval): previously this searched the
    whole knowledge base with no notion of cancer type, which risked e.g. a
    lung-tagged protocol being retrieved for a breast case purely because its
    embedding happened to be close. Each chunk in protocol_chunks.py now
    carries a `cancer_types` tag; here we filter to chunks tagged for this
    cancer_type or tagged "general" (guidance that applies to any cancer type,
    like tier-based referral urgency), on top of the existing distance filter.
    """

    # Embed query with the same model to match spaces.
    query_embedding = _embed_model.encode([query]).astype('float32')

    # Over-fetch, since some candidates will be filtered out by cancer_type below.
    distances, indices = _index.search(query_embedding, k * _OVER_FETCH_MULTIPLIER)

    allowed_tags = {cancer_type.value, "general"}

    matches = []
    for dist, i in zip(distances[0], indices[0]):
        if dist >= DISTANCE_THRESHOLD:
            continue
        chunk = protocol_chunks[i]
        if allowed_tags & set(chunk.get("cancer_types", [])):
            matches.append(chunk["title"])
        if len(matches) >= k:
            break

    # NOTE: returning an empty list here is still a valid state
    # if nothing highly relevant (and correctly tagged) is found.
    return matches

def _build_query(rule_result: RuleEngineResult, ml_result: Layer2Result, cancer_type: CancerType) -> str:
    """Combines triggered risk factors from both,
       the rule engine and ML model into a single search string.
       IMPROVEMENT: prefixed with the cancer type name so the embedding
       itself carries cancer-type context, not just the downstream filter."""

    # Combine unique factors from both layers using set union (|).
    factors = set(rule_result.triggered_factors) | set(ml_result.top_factors)

    # Format factors into a readable string
    factor_text = ", ".join(f.replace("_", " ").lower() for f in factors)

    return f"{cancer_type.value} cancer: {factor_text}"


# ============================================================================
# RECOMMENDED ACTIONS - per cancer type, per risk tier.
#
# This used to be hardcoded lung-only text inside generate_guidance() (e.g.
# always recommending a pulmonologist and a chest CT, regardless of cancer
# type). That's now a data-driven, cancer-type-keyed lookup instead of
# branching logic, so each cancer type's guidance is clinically sensible and
# adding a 5th cancer type later just means adding one more entry here.
# ============================================================================
RECOMMENDED_ACTIONS: dict[CancerType, dict[RiskTier, list[str]]] = {
    CancerType.LUNG: {
        RiskTier.HIGH: [
            "Schedule a consultation with a pulmonologist immediately",
            "Consider a low-dose CT scan for early detection",
            "Avoid smoking and exposure to lung irritants",
        ],
        RiskTier.MEDIUM: [
            "Schedule a consultation with a healthcare professional",
            "Consider lifestyle changes to reduce risk factors",
            "Monitor symptoms and report any changes to your doctor",
        ],
        RiskTier.LOW: [
            "Maintain a healthy lifestyle and avoid smoking",
        ],
    },
    CancerType.BREAST: {
        RiskTier.HIGH: [
            "Schedule a consultation with a breast specialist or surgeon immediately",
            "Consider a diagnostic mammogram or ultrasound",
            "Do not delay evaluation of a persistent lump or skin/nipple change",
        ],
        RiskTier.MEDIUM: [
            "Schedule a clinical breast examination with a healthcare professional",
            "Continue regular self-examination and note any changes",
            "Discuss your family history with your doctor",
        ],
        RiskTier.LOW: [
            "Continue routine self-examination and periodic screening appropriate for your age",
        ],
    },
    CancerType.ORAL: {
        RiskTier.HIGH: [
            "Schedule a consultation with a dentist or oral oncologist immediately",
            "Request evaluation/biopsy of any non-healing ulcer or patch",
            "Stop tobacco and areca nut (paan/gutka) use",
        ],
        RiskTier.MEDIUM: [
            "Schedule a dental or ENT consultation",
            "Reduce or stop tobacco and alcohol use",
            "Monitor the ulcer or patch and report if it persists beyond 3 weeks",
        ],
        RiskTier.LOW: [
            "Maintain oral hygiene and avoid tobacco and areca nut products",
        ],
    },
    CancerType.CERVICAL: {
        RiskTier.HIGH: [
            "Schedule a gynecological consultation immediately",
            "Request a Pap smear and/or HPV test if overdue",
            "Do not delay evaluation of abnormal bleeding or discharge",
        ],
        RiskTier.MEDIUM: [
            "Schedule a Pap smear or HPV test with a healthcare professional",
            "Ask your doctor whether your screening schedule is up to date",
            "Monitor symptoms and report any changes",
        ],
        RiskTier.LOW: [
            "Continue routine cervical screening as recommended for your age group",
        ],
    },
}


# --- LLM GENERATION ---
def _call_llm(
    rule_result: RuleEngineResult,
    ml_result: Layer2Result,
    sources: list[str],
    overall_tier: RiskTier,
    cancer_type: CancerType,
) -> str:
    """
    Calls the OpenRouter API to generate patient-friendly guidance based on the retrieved protocol chunks.
    This strictly enforces the 'informed, not afraid' UX philosophy via system prompting.
    """
    # Build the context block by pulling the actual text for the retrieved source titles
    context = "\n".join(
        f"- {c['title']}: {c['text']}"
        for c in protocol_chunks if c["title"] in sources
    )
    # SYSTEM PROMPT: This acts as the guardrails for the AI. 
    # It directly implements the 'Response Validation and Safety Checks' from our design spec.
    system_prompt = """You are an AI assistant providing patient-facing guidance based on clinical protocols.
    CRITICAL SAFETY RULES:
    1. NO DIAGNOSIS: Never diagnose the patient, suggest a diagnosis, or confirm they have a disease.
    2. STRICT GROUNDING: Base your advice strictly on the provided clinical context. Do not invent medical advice.
    3. PROFESSIONAL ESCALATION: You must always include a clear recommendation to consult a healthcare professional.
    4. TONE: Keep the response brief, calm, objective, and non-alarming. The patient should feel informed, not afraid."""

    # If Layer 2 (ML) doesn't have a trained model yet for this cancer type,
    # tell the LLM explicitly so it doesn't imply a predictive score exists.
    availability_note = ""
    if not ml_result.model_available:
        availability_note = (
            "\n    (Note: a predictive ML risk model is not yet available for this cancer type. "
            "Base guidance only on the clinical rule-based factors below.)"
        )

    # USER PROMPT: This injects the dynamic patient data for this specific request.
    user_prompt = f"""
    Cancer type under assessment: {cancer_type.value}
    Risk tier: {overall_tier.value}
    Key factors: {', '.join(rule_result.triggered_factors)}{availability_note}

    Relevant clinical context:
    {context}

    Write brief, calm, non-alarming patient guidance based only on the context above.
    """

    # Execute the API call using the current recommended Sonnet model
    response = _get_client().chat.completions.create(
        # OpenRouter requires you to specify the provider in the string
        model="openrouter/free", 
        max_tokens=300,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        extra_headers={
            # OpenRouter optionally requests these to identify your app in their dashboard
            "HTTP-Referer": "http://localhost:8000", 
            "X-Title": "OncoGuard" 
        }
    )
    return response.choices[0].message.content

# --- DATA MODELS ---
# Define the timeline urgency levels as an Enum
class TimelineUrgency(Enum):
    IMMEDIATE = "Immediate"
    WITHIN_1_2_WEEKS = "Within 1-2 weeks"
    ROUTINE_CHECKUP = "Routine check-up"

# Define the Layer 3 result dataclass
@dataclass
class Layer3Result:
    guidance_text: str
    recommended_actions: list[str]
    retrieved_sources: list[str]
    timeline_urgency: TimelineUrgency

# --- MAIN LAYER EXECUTION ---
# NOTE: Guidance explicitly uses the most severe tier between Layer 1 and Layer 2
# to ensure conservative defaults and prevent false negatives.
def generate_guidance(
    rule_result: RuleEngineResult,
    ml_result: Layer2Result,
    cancer_type: CancerType = CancerType.LUNG,
) -> Layer3Result:
    """
    Takes Layer 1 + Layer 2 output, runs a FAISS retrieval over clinical protocols, 
    and generates safe, grounded patient guidance via the LLM.
    Includes a graceful degradation fallback if the LLM API fails, and works
    correctly even when ml_result is a Layer-1-only placeholder (i.e. no
    trained model exists yet for this cancer type).

    `cancer_type` defaults to CancerType.LUNG so existing callers that don't
    pass it (matching the original lung-only signature) are unaffected.
    """

    # 1. RETRIEVAL: Get the top 3 most relevant clinical protocols based on the patient's factors.
    query = _build_query(rule_result, ml_result, cancer_type)
    retrieved_sources = _retrieve_relevant_chunks(query, cancer_type, k=3)

    # --- Calculate the most severe tier once to use across all Layer 3 logic ---
    overall_tier = most_severe_tier(rule_result.tier, ml_result.tier)

    # 2. GENERATION (with Feature Flag and Graceful Degradation): 
    # If the LLM API goes down during a demo, the endpoint shouldn't crash. 
    # We keep hardcoded strings as a safety net, now personalized per cancer type.
    FALLBACK_GUIDANCE = {
        RiskTier.HIGH: f"Based on your {cancer_type.value} cancer risk assessment, it is strongly recommended to consult a healthcare professional immediately for further evaluation.",
        RiskTier.MEDIUM: f"Based on your {cancer_type.value} cancer risk assessment, it is recommended to consult a healthcare professional for further evaluation.",
        RiskTier.LOW: f"Based on your {cancer_type.value} cancer risk assessment, your risk appears to be low. However, it is still advisable to maintain regular check-ups and a healthy lifestyle.",
    }

   # Only attempt network calls if the feature flag is explicitly enabled in .env
    if USE_LIVE_LLM:
        try:
            guidance_text = _call_llm(rule_result, ml_result, retrieved_sources, overall_tier, cancer_type)
        except Exception as e:
            print(f"Warning: LLM generation failed, falling back to static text. Error: {e}")
            guidance_text = FALLBACK_GUIDANCE[overall_tier]
    else:
        guidance_text = FALLBACK_GUIDANCE[overall_tier]

    # 3. ACTION DETERMINATION: data-driven lookup by cancer type + tier (see
    # RECOMMENDED_ACTIONS above) instead of hardcoded lung-only branching.
    recommended_actions = RECOMMENDED_ACTIONS[cancer_type][overall_tier]
    timeline_urgency = {
        RiskTier.HIGH: TimelineUrgency.IMMEDIATE,
        RiskTier.MEDIUM: TimelineUrgency.WITHIN_1_2_WEEKS,
        RiskTier.LOW: TimelineUrgency.ROUTINE_CHECKUP,
    }[overall_tier]

    return Layer3Result(guidance_text=guidance_text,
                        recommended_actions=recommended_actions,
                        retrieved_sources=retrieved_sources,
                        timeline_urgency=timeline_urgency)
