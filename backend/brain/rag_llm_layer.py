import sys
from pathlib import Path

# Same sys.path shim as brain/rule_engine.py and brain/ml_layer.py - see the
# comment in brain/rule_engine.py for why this is here.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import time  # NEW: only used for logging live-LLM latency, see generate_guidance()
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

# ============================================================================
# FACTOR HUMANIZATION (NEW)
#
# Layer 1 hands us snake_case tokens ("persistent_cough", "age_over_55") and
# Layer 2 hands us raw dataset column names ("COUGHING_OF_BLOOD", "AGEGRP").
# Both are fine as machine-readable keys, but neither reads well inside an
# LLM prompt or a patient-facing sentence. This is a single, shared lookup so
# every place in this file that needs a readable factor name (the retrieval
# query, the LLM prompt, the static fallback text) stays consistent instead
# of three slightly different ad-hoc `.replace("_", " ")` calls drifting out
# of sync with each other.
#
# Only covers ML-layer column names that don't already read fine after a
# plain "replace underscores, lowercase" pass (e.g. "SMOKING" -> "smoking"
# needs no override; "AGEGRP" -> "age group" does). Anything not in this
# table - including any new column a 5th cancer type's model introduces -
# falls through to the generic unspacing in _humanize_factor() below rather
# than crashing or needing this table updated first.
# ============================================================================
_FACTOR_LABEL_OVERRIDES = {
    "AGEGRP": "age group",
    "BALANCED_DIET": "diet balance",
    "CLUBBING_OF_FINGER_NAILS": "finger clubbing",
    "COUGHING_OF_BLOOD": "coughing blood",
    "OCCUPATIONAL_HAZARDS": "occupational hazard exposure",
    "PASSIVE_SMOKER": "passive smoking exposure",
    "SWALLOWING_DIFFICULTY": "difficulty swallowing",
    "NUM_SEXUAL_PARTNERS": "number of sexual partners",
    "FIRST_SEXUAL_INTERCOURSE_AGE": "age at first intercourse",
    "NUM_PREGNANCIES": "number of pregnancies",
    "SMOKES_YEARS": "years of smoking",
    "HORMONAL_CONTRACEPTIVES": "hormonal contraceptive use",
    "HORMONAL_CONTRACEPTIVES_YEARS": "years on hormonal contraceptives",
    "IUD": "IUD use",
    "IUD_YEARS": "years of IUD use",
    "STDS": "STD history",
    "STDS_NUMBER": "number of STDs",
    "MENOPAUS": "menopausal status",
    "DENSITY": "breast density",
    "HISPANIC": "Hispanic ethnicity",
    "BMI": "BMI",
    "AGEFIRST": "age at first birth",
    "NRELBC": "family history of breast cancer",
    "BRSTPROC": "prior breast procedure",
    "LASTMAMM": "last mammogram result",
    "SURGMENO": "surgical menopause",
    "HRT": "hormone replacement therapy use",
}


def _humanize_factor(name: str) -> str:
    """Turns a raw factor token - either Layer 1's snake_case
    ("family_history_lung_cancer") or Layer 2's ALL_CAPS column name
    ("CHRONIC_LUNG_DISEASE") - into a short, readable phrase. Checked
    against the override table first for the handful of names that read
    badly after a plain unspacing; falls back to generic "replace
    underscores, lowercase" for everything else, which is good enough for
    most tokens in this codebase (e.g. "current_smoker" -> "current
    smoker", "CHEST_PAIN" -> "chest pain")."""
    if name in _FACTOR_LABEL_OVERRIDES:
        return _FACTOR_LABEL_OVERRIDES[name]
    return name.replace("_", " ").lower()


def _relevant_humanized_factors(
    rule_result: RuleEngineResult, ml_result: Layer2Result, limit: int = 3
) -> list[str]:
    """
    Combines Layer 1's triggered factors with Layer 2's top ML factors (when
    a model exists for this cancer type) into one deduplicated, humanized
    list. Used both to build the LLM prompt below AND to personalize the
    static fallback text, so the two stay consistent with each other instead
    of the LLM path and the fallback path describing "why" differently.
    Rule-engine factors get priority (they're always present and are
    exactly what the patient answered), but a fixed number of slots are
    reserved for ML-derived factors when a model exists for this cancer
    type - otherwise, on a patient where Layer 1 alone already triggers
    `limit`-or-more factors (common for MEDIUM/HIGH tier), Layer 2's
    SHAP-derived "why" would get silently crowded out every time, which
    defeats the point of including it at all.
    """
    all_labels_so_far = []

    def _is_redundant(candidate: str) -> bool:
        # Catches near-duplicates a plain exact-match set would miss - e.g.
        # Layer 1's "age_over_55" and Layer 2's raw "AGE" SHAP feature both
        # humanize to describe the same underlying fact ("age over 55" vs
        # "age"), and would otherwise both show up looking redundant.
        return any(candidate in existing or existing in candidate for existing in all_labels_so_far)

    rule_labels = []
    for factor in rule_result.triggered_factors:
        label = _humanize_factor(factor)
        if not _is_redundant(label):
            rule_labels.append(label)
            all_labels_so_far.append(label)

    ml_labels = []
    if ml_result.model_available:
        for factor in ml_result.top_factors:
            label = _humanize_factor(factor)
            if not _is_redundant(label):
                ml_labels.append(label)
                all_labels_so_far.append(label)

    if not ml_labels:
        return rule_labels[:limit]

    ml_slots = min(len(ml_labels), max(1, limit // 3))
    rule_slots = max(0, limit - ml_slots)
    return (rule_labels[:rule_slots] + ml_labels[:ml_slots])[:limit]


def _join_factors_naturally(factors: list[str]) -> str:
    """['persistent cough'] -> 'persistent cough'
    ['persistent cough', 'current smoker'] -> 'persistent cough and current smoker'
    ['a', 'b', 'c'] -> 'a, b, and c'
    [] -> '' """
    if not factors:
        return ""
    if len(factors) == 1:
        return factors[0]
    if len(factors) == 2:
        return f"{factors[0]} and {factors[1]}"
    return ", ".join(factors[:-1]) + f", and {factors[-1]}"


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

def _build_query(
    rule_result: RuleEngineResult,
    ml_result: Layer2Result,
    cancer_type: CancerType,
    overall_tier: RiskTier,
) -> str:
    """Combines triggered risk factors from both,
       the rule engine and ML model into a single search string.
       IMPROVEMENT: prefixed with the cancer type name so the embedding
       itself carries cancer-type context, not just the downstream filter.

       IMPROVEMENT (tier-aware, NEW): now also takes overall_tier and folds
       it into the query text. protocol_chunks.py has 3 "general" chunks
       that are explicitly tier-specific in content ("Low risk guidance",
       "Medium risk follow up", "High risk referral guidance"), but before
       this change the query text never mentioned the tier at all - which
       chunk (if any) got retrieved for a given patient came down to
       embedding-similarity coincidence rather than actually matching their
       tier. Adding the tier to the query text gives FAISS the signal it
       needs to reliably surface the tier-appropriate general chunk."""

    # Combine unique factors from both layers using set union (|).
    factors = set(rule_result.triggered_factors) | set(ml_result.top_factors)

    # Format factors into a readable string (shared humanizer - see above -
    # instead of the previous inline `.replace("_", " ").lower()`, so this
    # matches the phrasing used in the LLM prompt and fallback text too).
    factor_text = ", ".join(_humanize_factor(f) for f in factors)

    return f"{cancer_type.value} cancer, {overall_tier.value} risk: {factor_text}"


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


# ============================================================================
# RESPONSE VALIDATION (NEW) - a lightweight, deliberately simple safety net.
#
# The system prompt below already instructs the LLM not to diagnose, but a
# prompt instruction is a request, not a guarantee - a free-tier/small model
# can and does ignore system prompts under certain phrasings, especially
# under `USE_LIVE_LLM=true` with a model we don't fully control. This is a
# second, code-level check: if the LLM's own output contains language that
# reads like a diagnosis - positive OR negative, since telling someone they
# definitely DON'T have cancer is just as inappropriate as telling them they
# do - we discard that text entirely and fall back to the reviewed static
# guidance instead of ever showing it to the patient.
#
# Intentionally a simple keyword tripwire, not a second LLM call or a
# trained classifier: for a patient-facing medical demo, "simple and
# auditable" beats "clever and opaque" here, and it costs zero extra
# latency/API calls. Extend this list if a live demo surfaces a phrasing it
# misses - it's meant to be a living list, not a finished one.
# ============================================================================
_DIAGNOSTIC_LANGUAGE_MARKERS = [
    "you have cancer",
    "you have been diagnosed",
    "you are diagnosed",
    "diagnosed with cancer",
    "this confirms",
    "you definitely have",
    "you do not have cancer",
    "you don't have cancer",
    "you are cancer-free",
    "you're cancer-free",
    "ruling out cancer",
    "this is cancer",
    "this is not cancer",
    "positive for cancer",
    "negative for cancer",
]


def _fails_safety_check(text: str) -> bool:
    """Returns True if `text` should be REJECTED - i.e. it reads like a
    diagnosis - and the caller should fall back to the static guidance
    instead of returning this text to the patient."""
    lowered = text.lower()
    return any(marker in lowered for marker in _DIAGNOSTIC_LANGUAGE_MARKERS)


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
    1. NO DIAGNOSIS: Never diagnose the patient, suggest a diagnosis, or state/imply they do or do NOT have a
       disease. Only a qualified professional can determine that - your job is to explain risk factors, not
       resolve them.
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
    # CHANGED: previously only rule_result.triggered_factors went into the
    # prompt (raw, un-humanized). ml_result.top_factors - what Layer 2's
    # SHAP explainer actually found significant - was computed for retrieval
    # (_build_query, above) but never told to the LLM itself. Using the same
    # shared _relevant_humanized_factors() helper here keeps this consistent
    # with both the retrieval query and the fallback text (see
    # generate_guidance below), and means the model actually a) sees what the
    # ML layer flagged when a model exists for this cancer type, and b) sees
    # readable phrases instead of raw tokens like "age_over_55".
    key_factors_text = ", ".join(_relevant_humanized_factors(rule_result, ml_result)) or "no specific risk factors flagged"

    user_prompt = f"""
    Cancer type under assessment: {cancer_type.value}
    Risk tier: {overall_tier.value}
    Key factors: {key_factors_text}{availability_note}

    Relevant clinical context:
    {context}

    Write brief, calm, non-alarming patient guidance based only on the context above.
    """

    # Execute the API call using the current recommended Sonnet model
    response = _get_client().chat.completions.create(
        # OpenRouter requires you to specify the provider in the string
        model="openrouter/free", 
        max_tokens=300,
        # NEW: bound worst-case latency. OpenRouter's free tier can be slow
        # or hang under load; without this, a single stuck request could tie
        # up a demo indefinitely instead of falling back. (If the installed
        # openai client version doesn't accept `timeout` here, the
        # equivalent is `_get_client().with_options(timeout=20.0).chat...`.)
        timeout=20.0,
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
# ---19/08/26 UPDATE: Remove outdated comment, replace with updated logic description ---
# NOTE: Guidance now explicitly uses the most severe tier between Layer 1 and Layer 2
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

    STRENGTHENED (see comments below for each change - contract unchanged,
    still returns a Layer3Result with the same 4 fields, so main.py and every
    existing caller need zero changes):
      1. Tier is now computed BEFORE retrieval and folded into the query, so
         the tier-specific "general" protocol chunks are retrieved on
         purpose, not by coincidence.
      2. If USE_LIVE_LLM=true but nothing relevant was retrieved, the live
         call is skipped entirely - this actually enforces the "Layer 3
         never speaks from its own knowledge" guarantee the README already
         claims, which previously wasn't code-enforced.
      3. Live LLM output now passes through a code-level safety check
         (_fails_safety_check) before it's trusted - if it reads like a
         diagnosis, it's discarded in favor of the static fallback.
      4. The static fallback - which is what USE_LIVE_LLM=false (the
         default) actually shows every user - now references the patient's
         real triggered factors instead of being 3 fixed sentences that
         never change. Since this is the guidance path most demo users will
         actually see, this is the single highest-leverage change here.
      5. Lightweight print-based logging of which path was used and how long
         the live call took, to help decide USE_LIVE_LLM true vs false for
         the actual demo.
    """

    # --- Tier first (CHANGED: moved up from after retrieval) --------------
    overall_tier = most_severe_tier(rule_result.tier, ml_result.tier)

    # 1. RETRIEVAL: tier-aware, cancer-type-aware. Up to 3 relevant protocols.
    query = _build_query(rule_result, ml_result, cancer_type, overall_tier)
    retrieved_sources = _retrieve_relevant_chunks(query, cancer_type, k=3)

    # --- Build the factor-aware static fallback (NEW) ----------------------
    # This used to be 3 fixed sentences per tier that never referenced what
    # actually triggered the assessment. Since USE_LIVE_LLM defaults to
    # false, this fallback IS the guidance most users see in practice - so
    # personalizing it (deterministically, zero network calls, zero added
    # latency) matters more than anything on the live-LLM path.
    relevant_factors = _relevant_humanized_factors(rule_result, ml_result)
    factor_phrase = _join_factors_naturally(relevant_factors)
    factor_clause = f", which flagged {factor_phrase}" if factor_phrase else ""

    FALLBACK_GUIDANCE = {
        RiskTier.HIGH: f"Based on your {cancer_type.value} cancer risk assessment{factor_clause}, it is strongly recommended to consult a healthcare professional immediately for further evaluation.",
        RiskTier.MEDIUM: f"Based on your {cancer_type.value} cancer risk assessment{factor_clause}, it is recommended to consult a healthcare professional for further evaluation.",
        RiskTier.LOW: f"Based on your {cancer_type.value} cancer risk assessment{factor_clause}, your risk appears to be low. However, it is still advisable to maintain regular check-ups and a healthy lifestyle.",
    }

    # 2. GENERATION (Feature Flag + Graceful Degradation + Grounding Guarantee + Safety Check)
    guidance_text = FALLBACK_GUIDANCE[overall_tier]  # default; overwritten below only on a clean live success

    if USE_LIVE_LLM:
        if not retrieved_sources:
            # NEW: nothing relevant was retrieved, so there's no clinical
            # context to ground a live call in. Calling the LLM anyway would
            # mean it answers from its own general knowledge instead of the
            # ICMR/WHO-derived protocol base - exactly what this
            # architecture is built to avoid. Use the fallback instead of
            # ever making that call.
            print(f"[Layer3] {cancer_type.value}/{overall_tier.value}: no relevant protocol chunks retrieved - skipping live LLM (would be ungrounded), using fallback")
        else:
            start = time.monotonic()
            try:
                live_text = _call_llm(rule_result, ml_result, retrieved_sources, overall_tier, cancer_type)
                elapsed_ms = (time.monotonic() - start) * 1000
                if _fails_safety_check(live_text):
                    print(f"[Layer3] {cancer_type.value}/{overall_tier.value}: live output failed safety check after {elapsed_ms:.0f}ms - using fallback")
                else:
                    guidance_text = live_text
                    print(f"[Layer3] {cancer_type.value}/{overall_tier.value}: live LLM guidance used ({elapsed_ms:.0f}ms, {len(retrieved_sources)} sources)")
            except Exception as e:
                elapsed_ms = (time.monotonic() - start) * 1000
                print(f"Warning: LLM generation failed after {elapsed_ms:.0f}ms, falling back to static text. Error: {e}")
                # guidance_text already holds the fallback from above.

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