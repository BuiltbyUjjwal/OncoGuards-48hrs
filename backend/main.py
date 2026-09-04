import time
from collections import defaultdict
from typing import Literal

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from schemas import PatientProfile, Gender, CancerType, most_severe_tier
from brain.rule_engine import score_all_cancer_risks
from brain.ml_layer import predict_ml_risk
from brain.rag_llm_layer import generate_guidance
from brain.chat_layer import generate_chat_reply
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:3000",   # actual Vite dev server port (see vite.config.ts)
    "http://127.0.0.1:3000",
    "http://localhost:5173",   # Vite's default — kept in case anything else assumes it
    "http://127.0.0.1:5173",
    "http://localhost:3001/"
    ], # which frontend URL(s) can access the API.
    allow_credentials=True, # Allows cookies/auth tokens to be sent.
    allow_methods=["*"], # Which HTTP methods are permitted. (All)
    allow_headers=["*"], # Which request headers are permitted. (All)
)

# ============================================================================
# MINIMAL RATE LIMITING (chat endpoint only)
#
# In-memory, per-process, per-IP sliding window. Named limitation, not a
# production claim: this resets on restart and doesn't coordinate across
# multiple worker processes - a real deployment would do this at the
# gateway/proxy level (nginx, Cloudflare) or with Redis. Its only job here is
# to stop an unauthenticated endpoint from accidentally burning through the
# free OpenRouter quota (repeated testing, a stray loop on the frontend,
# etc.) - not to defend against a determined attacker. Scoped to /api/v1/chat
# only; /api/v1/assessment's behavior is untouched.
# ============================================================================
_RATE_LIMIT_WINDOW_SECONDS = 60
_RATE_LIMIT_MAX_REQUESTS = 10  # per IP, per window
_request_log: dict[str, list[float]] = defaultdict(list)


def _enforce_rate_limit(request: Request) -> None:
    client_ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    window_start = now - _RATE_LIMIT_WINDOW_SECONDS

    recent = [t for t in _request_log[client_ip] if t > window_start]
    if len(recent) >= _RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail="Too many chat requests - please wait a moment and try again.",
        )

    recent.append(now)
    _request_log[client_ip] = recent


# ============================================================================
# CHAT SCHEMAS
#
# Stateless by design (matches README's "Current Scope & Known Limitations" -
# no DB yet): `messages` is the FULL client-managed conversation history,
# resent every turn, same pattern as the Anthropic Messages API. `cancer_type`
# / `context_summary` are optional grounding hints - see brain/chat_layer.py's
# generate_chat_reply() docstring for exactly how they're used.
# ============================================================================
class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    cancer_type: CancerType | None = None
    context_summary: str | None = None

class ChatResponse(BaseModel):
    reply: str
    retrieved_sources: list[str]
    grounded: bool

_MAX_MESSAGE_CHARS = 2000
_MAX_MESSAGES_PER_REQUEST = 40

class PatientInput(BaseModel):
    age: int
    gender: Gender

    # --- Lung fields: rule engine (unchanged) ---
    is_current_smoker: bool = False
    cough_duration_weeks: int = 0
    has_family_history_lung_cancer: bool = False
    has_occupational_exposure: bool = False
    has_coughing_blood: bool = False
    has_difficulty_swallowing: bool = False
    has_neck_swelling: bool = False
    is_alcohol_consuming: bool = False

    # --- Lung fields: ML layer (Layer 2) - "Cancer Patients & Air Pollution"
    # dataset. Ordinal 1-9 severity/exposure ratings, no "0/none" value exists
    # in the training data - see schemas.PatientProfile for the full rationale.
    lung_air_pollution_exposure: int = 1
    lung_alcohol_use_severity: int = 1
    lung_dust_allergy_severity: int = 1
    lung_occupational_hazard_severity: int = 1
    lung_genetic_risk: int = 1
    lung_chronic_disease_severity: int = 1
    lung_diet_balance: int = 1
    lung_obesity_level: int = 1
    lung_smoking_severity: int = 1
    lung_passive_smoking_severity: int = 1
    lung_chest_pain_severity: int = 1
    lung_coughing_blood_severity: int = 1
    lung_fatigue_severity: int = 1
    lung_weight_loss_severity: int = 1
    lung_shortness_of_breath_severity: int = 1
    lung_wheezing_severity: int = 1
    lung_swallowing_difficulty_severity: int = 1
    lung_finger_clubbing_severity: int = 1
    lung_frequent_cold_severity: int = 1
    lung_dry_cough_severity: int = 1
    lung_snoring_severity: int = 1

    # --- NEW: Breast fields ---
    has_breast_lump: bool = False
    breast_lump_duration_weeks: int = 0
    has_nipple_discharge: bool = False
    has_breast_skin_changes: bool = False
    has_family_history_breast_cancer: bool = False
    
    # --- NEW: Breast fields: ML layer (Layer 2) - BCSC dataset. See schemas.py
    # for the per-field coding/default rationale.
    breast_menopausal_status: int = 9
    breast_density: int = 9
    breast_race: int = 9
    breast_is_hispanic: int = 9
    breast_bmi_category: int = 9
    breast_age_at_first_birth_category: int = 9
    breast_num_relatives_with_breast_cancer: int = 9
    breast_has_prior_breast_procedure: int = 9
    breast_last_mammogram_result: int = 9
    breast_had_surgical_menopause: int = 9
    breast_uses_hormone_therapy: int = 9

    # --- NEW: Oral fields ---
    has_mouth_ulcer: bool = False
    mouth_ulcer_duration_weeks: int = 0
    has_oral_red_white_patches: bool = False
    uses_smokeless_tobacco: bool = False

    # --- NEW: Cervical fields: rule engine (unchanged) ---
    has_abnormal_vaginal_bleeding: bool = False
    has_abnormal_vaginal_discharge: bool = False
    has_pelvic_pain: bool = False
    is_hpv_positive: bool = False
    is_screening_overdue: bool = False

    # --- NEW: Cervical fields: ML layer (Layer 2) - UCI Cervical Cancer Risk
    # Factors dataset. See schemas.PatientProfile for per-field default
    # rationale (most are true zeros; cervical_first_intercourse_age is not).
    cervical_num_sexual_partners: int = 1
    cervical_first_intercourse_age: int = 17
    cervical_num_pregnancies: int = 0
    cervical_smoking_years: int = 0
    cervical_uses_hormonal_contraceptives: bool = False
    cervical_hormonal_contraceptive_years: int = 0
    cervical_has_used_iud: bool = False
    cervical_iud_years: int = 0
    cervical_has_std_history: bool = False
    cervical_std_count: int = 0


@app.post("/api/v1/assessment")
def assessment(patient: PatientInput):
    """
    Runs the full 3-layer pipeline for ALL 4 cancer types against one shared
    patient profile, and returns a report keyed by cancer type.

    RESPONSE SHAPE CHANGE FROM THE LUNG-ONLY VERSION:
    This used to return a single flat {overall_tier, layer1, layer2, layer3}
    object for lung only. Now that the pipeline covers 4 cancer types, the
    response is nested one level deeper, keyed by cancer type:

        {
          "lung":     {"overall_tier": ..., "layer1": ..., "layer2": ..., "layer3": ...},
          "breast":   {"overall_tier": ..., "layer1": ..., "layer2": ..., "layer3": ...},
          "oral":     {"overall_tier": ..., "layer1": ..., "layer2": ..., "layer3": ...},
          "cervical": {"overall_tier": "not_applicable", "layer1": {...applicable: false...},
                       "layer2": None, "layer3": None}   # e.g. for a male patient
        }

    This is a deliberate, necessary consequence of "add more cancer types to
    the pipeline" - flagging it clearly here (and in the project docs) so
    it's not a surprise when the frontend work resumes.
    """
    profile = PatientProfile(
        age=patient.age,
        gender=patient.gender,
        is_current_smoker=patient.is_current_smoker,
        cough_duration_weeks=patient.cough_duration_weeks,
        has_family_history_lung_cancer=patient.has_family_history_lung_cancer,
        has_occupational_exposure=patient.has_occupational_exposure,
        has_coughing_blood=patient.has_coughing_blood,
        has_difficulty_swallowing=patient.has_difficulty_swallowing,
        has_neck_swelling=patient.has_neck_swelling,
        is_alcohol_consuming=patient.is_alcohol_consuming,
        # lung ML layer (new dataset)
        lung_air_pollution_exposure=patient.lung_air_pollution_exposure,
        lung_alcohol_use_severity=patient.lung_alcohol_use_severity,
        lung_dust_allergy_severity=patient.lung_dust_allergy_severity,
        lung_occupational_hazard_severity=patient.lung_occupational_hazard_severity,
        lung_genetic_risk=patient.lung_genetic_risk,
        lung_chronic_disease_severity=patient.lung_chronic_disease_severity,
        lung_diet_balance=patient.lung_diet_balance,
        lung_obesity_level=patient.lung_obesity_level,
        lung_smoking_severity=patient.lung_smoking_severity,
        lung_passive_smoking_severity=patient.lung_passive_smoking_severity,
        lung_chest_pain_severity=patient.lung_chest_pain_severity,
        lung_coughing_blood_severity=patient.lung_coughing_blood_severity,
        lung_fatigue_severity=patient.lung_fatigue_severity,
        lung_weight_loss_severity=patient.lung_weight_loss_severity,
        lung_shortness_of_breath_severity=patient.lung_shortness_of_breath_severity,
        lung_wheezing_severity=patient.lung_wheezing_severity,
        lung_swallowing_difficulty_severity=patient.lung_swallowing_difficulty_severity,
        lung_finger_clubbing_severity=patient.lung_finger_clubbing_severity,
        lung_frequent_cold_severity=patient.lung_frequent_cold_severity,
        lung_dry_cough_severity=patient.lung_dry_cough_severity,
        lung_snoring_severity=patient.lung_snoring_severity,
        # NEW: breast
        has_breast_lump=patient.has_breast_lump,
        breast_lump_duration_weeks=patient.breast_lump_duration_weeks,
        has_nipple_discharge=patient.has_nipple_discharge,
        has_breast_skin_changes=patient.has_breast_skin_changes,
        has_family_history_breast_cancer=patient.has_family_history_breast_cancer,
        # NEW: breast ML layer (Layer 2)
        breast_menopausal_status=patient.breast_menopausal_status,
        breast_density=patient.breast_density,
        breast_race=patient.breast_race,
        breast_is_hispanic=patient.breast_is_hispanic,
        breast_bmi_category=patient.breast_bmi_category,
        breast_age_at_first_birth_category=patient.breast_age_at_first_birth_category,
        breast_num_relatives_with_breast_cancer=patient.breast_num_relatives_with_breast_cancer,
        breast_has_prior_breast_procedure=patient.breast_has_prior_breast_procedure,
        breast_last_mammogram_result=patient.breast_last_mammogram_result,
        breast_had_surgical_menopause=patient.breast_had_surgical_menopause,
        breast_uses_hormone_therapy=patient.breast_uses_hormone_therapy,
        # NEW: oral
        has_mouth_ulcer=patient.has_mouth_ulcer,
        mouth_ulcer_duration_weeks=patient.mouth_ulcer_duration_weeks,
        has_oral_red_white_patches=patient.has_oral_red_white_patches,
        uses_smokeless_tobacco=patient.uses_smokeless_tobacco,
        # NEW: cervical
        has_abnormal_vaginal_bleeding=patient.has_abnormal_vaginal_bleeding,
        has_abnormal_vaginal_discharge=patient.has_abnormal_vaginal_discharge,
        has_pelvic_pain=patient.has_pelvic_pain,
        is_hpv_positive=patient.is_hpv_positive,
        is_screening_overdue=patient.is_screening_overdue,
        cervical_num_sexual_partners=patient.cervical_num_sexual_partners,
        cervical_first_intercourse_age=patient.cervical_first_intercourse_age,
        cervical_num_pregnancies=patient.cervical_num_pregnancies,
        cervical_smoking_years=patient.cervical_smoking_years,
        cervical_uses_hormonal_contraceptives=patient.cervical_uses_hormonal_contraceptives,
        cervical_hormonal_contraceptive_years=patient.cervical_hormonal_contraceptive_years,
        cervical_has_used_iud=patient.cervical_has_used_iud,
        cervical_iud_years=patient.cervical_iud_years,
        cervical_has_std_history=patient.cervical_has_std_history,
        cervical_std_count=patient.cervical_std_count,
    )

    # Layer 1: run the rule engine for every supported cancer type at once.
    rule_results = score_all_cancer_risks(profile)

    report = {}
    for cancer_type_value, rule_result in rule_results.items():
        cancer_type = CancerType(cancer_type_value)

        # Some cancer types don't apply to every patient (e.g. cervical
        # cancer for a male patient). Skip Layer 2/3 entirely in that case
        # rather than running ML/RAG logic against irrelevant data.
        if not rule_result.applicable:
            report[cancer_type_value] = {
                "overall_tier": "not_applicable",
                "layer1": rule_result,
                "layer2": None,
                "layer3": None,
            }
            continue

        # Layer 2 + Layer 3, isolated per cancer type (NEW). Layer 3 already
        # degrades gracefully on its own (an LLM failure falls back to static
        # text inside generate_guidance() and never raises). This try/except
        # is the outer safety net for anything ELSE unexpected - most
        # plausibly Layer 2, which has no such fallback of its own: a bad
        # model file, an unexpected SHAP shape, whatever. Without this, one
        # cancer type raising turns the WHOLE multi-cancer response into a
        # 500 - the patient loses lung+breast+cervical results just because,
        # say, oral's placeholder path had an edge case. Layer 1's result
        # (already computed above) is always safe to return regardless.
        try:
            # Layer 2: XGBoost + SHAP if a trained model exists for this
            # cancer type yet, otherwise a graceful Layer-1-only placeholder
            # (see brain/ml_layer.py's _MODEL_REGISTRY).
            ml_result = predict_ml_risk(profile, rule_result, cancer_type=cancer_type)

            # Layer 3: RAG-grounded guidance, cancer-type-aware.
            layer3_result = generate_guidance(rule_result, ml_result, cancer_type=cancer_type)

            report[cancer_type_value] = {
                "overall_tier": most_severe_tier(rule_result.tier, ml_result.tier).value,
                "layer1": rule_result,
                "layer2": ml_result,
                "layer3": layer3_result,
            }
        except Exception as e:
            print(f"[assessment] {cancer_type_value}: Layer 2/3 failed unexpectedly, "
                  f"degrading to Layer-1-only for this cancer type. Error: {e}")
            report[cancer_type_value] = {
                "overall_tier": rule_result.tier.value,
                "layer1": rule_result,
                "layer2": None,
                "layer3": None,
            }

    return report

@app.post("/api/v1/chat", response_model=ChatResponse)
def chat(chat_request: ChatRequest, request: Request):
    """
    Conversational counterpart to /api/v1/assessment - see brain/chat_layer.py
    for the full design (retrieval, grounding, safety check, degrade-gracefully
    behavior). Stateless: no DB yet (see README), so the frontend resends the
    whole conversation each turn.

    Meant to replace the Frontend's current AIAssistantPage.tsx integration,
    which calls Groq/Gemini directly from the browser today - ungrounded by
    the ICMR/WHO protocol base and with client-exposed API keys (see README's
    "Current Scope & Known Limitations"). This endpoint runs through the same
    FAISS-grounded pipeline Layer 3 uses for the risk report, and keeps the
    LLM key server-side like everything else in brain/.
    """
    _enforce_rate_limit(request)

    if not chat_request.messages:
        raise HTTPException(status_code=422, detail="messages must not be empty.")
    if chat_request.messages[-1].role != "user":
        raise HTTPException(status_code=422, detail="The last message must be from the user.")
    if len(chat_request.messages) > _MAX_MESSAGES_PER_REQUEST:
        raise HTTPException(
            status_code=422,
            detail=f"Too many messages in one request (max {_MAX_MESSAGES_PER_REQUEST}).",
        )
    if any(len(m.content) > _MAX_MESSAGE_CHARS for m in chat_request.messages):
        raise HTTPException(
            status_code=422,
            detail=f"A message exceeds the {_MAX_MESSAGE_CHARS}-character limit.",
        )

    result = generate_chat_reply(
        messages=[m.model_dump() for m in chat_request.messages],
        cancer_type=chat_request.cancer_type,
        context_summary=chat_request.context_summary,
    )

    return ChatResponse(
        reply=result.reply,
        retrieved_sources=result.retrieved_sources,
        grounded=result.grounded,
    )