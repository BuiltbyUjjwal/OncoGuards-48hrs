from enum import Enum
from dataclasses import dataclass
from schemas import RiskTier, CancerType, most_severe_tier
from brain.rule_engine import RuleEngineResult
from brain.ml_layer import Layer2Result
from brain.protocol_chunks import protocol_chunks

from sentence_transformers import SentenceTransformer
import faiss
import os
from dotenv import load_dotenv

load_dotenv()
USE_LIVE_LLM = os.environ.get("USE_LIVE_LLM", "false").lower() == "true"

_embed_model = SentenceTransformer("all-MiniLM-L6-v2")
_chunk_texts = [c["text"] for c in protocol_chunks]
_chunk_embeddings = _embed_model.encode(_chunk_texts).astype("float32")
_index = faiss.IndexFlatL2(_chunk_embeddings.shape[1])
_index.add(_chunk_embeddings)

DISTANCE_THRESHOLD = 1.0
_OVER_FETCH_MULTIPLIER = 4

_client = None
def _get_client():
    global _client
    if _client is None:
        from openai import OpenAI
        _client = OpenAI(base_url="https://openrouter.ai/api/v1",
                          api_key=os.environ.get("OPENROUTER_API_KEY"))
    return _client


def _retrieve_relevant_chunks(query: str, cancer_type: CancerType, k: int = 3) -> list[str]:
    query_embedding = _embed_model.encode([query]).astype("float32")
    distances, indices = _index.search(query_embedding, k * _OVER_FETCH_MULTIPLIER)
    allowed_tags = {cancer_type.value, "general"}
    results = []
    for dist, i in zip(distances[0], indices[0]):
        chunk = protocol_chunks[i]
        if dist < DISTANCE_THRESHOLD and allowed_tags & set(chunk["cancer_types"]):
            results.append(chunk["title"])
        if len(results) == k:
            break
    return results


def _build_query(cancer_type: CancerType, rule_result: RuleEngineResult, ml_result: Layer2Result) -> str:
    factors = set(rule_result.triggered_factors) | set(ml_result.top_factors)
    return f"{cancer_type.value} cancer: " + ", ".join(f.replace("_", " ").lower() for f in factors)


class TimelineUrgency(Enum):
    IMMEDIATE = "Immediate"
    WITHIN_1_2_WEEKS = "Within 1-2 weeks"
    ROUTINE_CHECKUP = "Routine check-up"


@dataclass
class Layer3Result:
    guidance_text: str
    recommended_actions: list[str]
    retrieved_sources: list[str]
    timeline_urgency: TimelineUrgency


RECOMMENDED_ACTIONS = {
    CancerType.LUNG: {
        RiskTier.HIGH: ["Schedule a consultation with a pulmonologist immediately",
                        "Consider a low-dose CT scan for early detection",
                        "Avoid smoking and exposure to lung irritants"],
        RiskTier.MEDIUM: ["Schedule a consultation with a healthcare professional",
                           "Consider lifestyle changes to reduce risk factors",
                           "Monitor symptoms and report any changes"],
        RiskTier.LOW: ["Maintain a healthy lifestyle and avoid smoking"],
    },
    CancerType.BREAST: {
        RiskTier.HIGH: ["Schedule a diagnostic mammogram or ultrasound immediately",
                         "Request a clinical breast examination",
                         "Do not delay evaluation of a persistent lump or skin change"],
        RiskTier.MEDIUM: ["Schedule a clinical breast examination",
                           "Ask your doctor whether your screening schedule is up to date",
                           "Monitor symptoms and report any changes"],
        RiskTier.LOW: ["Continue routine breast self-awareness and screening for your age group"],
    },
    CancerType.ORAL: {
        RiskTier.HIGH: ["Schedule a consultation with a dentist or oral oncologist immediately",
                         "Request evaluation/biopsy of any non-healing ulcer or patch",
                         "Stop tobacco and areca nut (paan/gutka) use"],
        RiskTier.MEDIUM: ["Schedule a dental or ENT consultation",
                           "Reduce or stop tobacco and alcohol use",
                           "Monitor the ulcer or patch and report if it persists beyond 3 weeks"],
        RiskTier.LOW: ["Maintain oral hygiene and avoid tobacco and areca nut products"],
    },
    CancerType.CERVICAL: {
        RiskTier.HIGH: ["Schedule a gynecological consultation immediately",
                         "Request a Pap smear and/or HPV test if overdue",
                         "Do not delay evaluation of abnormal bleeding or discharge"],
        RiskTier.MEDIUM: ["Schedule a Pap smear or HPV test with a healthcare professional",
                           "Ask your doctor whether your screening schedule is up to date",
                           "Monitor symptoms and report any changes"],
        RiskTier.LOW: ["Continue routine cervical screening as recommended for your age group"],
    },
}

FALLBACK_GUIDANCE = {
    RiskTier.HIGH: lambda ct: f"Based on your {ct.value} cancer risk assessment, it is strongly recommended to consult a healthcare professional immediately for further evaluation.",
    RiskTier.MEDIUM: lambda ct: f"Based on your {ct.value} cancer risk assessment, it is recommended to consult a healthcare professional for further evaluation.",
    RiskTier.LOW: lambda ct: f"Based on your {ct.value} cancer risk assessment, your risk appears to be low. It's still advisable to maintain regular check-ups and a healthy lifestyle.",
}

_TIMELINE = {RiskTier.HIGH: TimelineUrgency.IMMEDIATE,
             RiskTier.MEDIUM: TimelineUrgency.WITHIN_1_2_WEEKS,
             RiskTier.LOW: TimelineUrgency.ROUTINE_CHECKUP}


def generate_guidance(cancer_type: CancerType, rule_result: RuleEngineResult, ml_result: Layer2Result) -> Layer3Result:
    query = _build_query(cancer_type, rule_result, ml_result)
    sources = _retrieve_relevant_chunks(query, cancer_type)
    overall_tier = most_severe_tier(rule_result.tier, ml_result.tier)

    guidance_text = FALLBACK_GUIDANCE[overall_tier](cancer_type)
    if USE_LIVE_LLM:
        try:
            guidance_text = _call_llm(cancer_type, rule_result, ml_result, sources, overall_tier)
        except Exception as e:
            print(f"LLM generation failed, using fallback: {e}")

    return Layer3Result(
        guidance_text=guidance_text,
        recommended_actions=RECOMMENDED_ACTIONS[cancer_type][overall_tier],
        retrieved_sources=sources,
        timeline_urgency=_TIMELINE[overall_tier],
    )


def _call_llm(cancer_type, rule_result, ml_result, sources, overall_tier) -> str:
    context = "\n".join(f"- {c['title']}: {c['text']}" for c in protocol_chunks if c["title"] in sources)
    availability_note = "" if ml_result.model_available else "Note: a predictive ML risk model is not yet available for this cancer type; base guidance on the rule-based assessment only.\n"
    system_prompt = """You are an AI assistant providing patient-facing guidance based on clinical protocols.
    1. NO DIAGNOSIS: never diagnose or confirm the patient has a disease.
    2. STRICT GROUNDING: base advice strictly on the provided clinical context.
    3. Always recommend consulting a healthcare professional.
    4. TONE: calm, objective, non-alarming."""
    user_prompt = f"""{availability_note}Cancer type: {cancer_type.value}
    Risk tier: {overall_tier.value}
    Key factors: {', '.join(rule_result.triggered_factors)}
    Clinical context:\n{context}
    Write brief, calm, non-alarming patient guidance grounded only in the context above."""
    response = _get_client().chat.completions.create(
        model="openrouter/free", max_tokens=300,
        messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
    )
    return response.choices[0].message.content