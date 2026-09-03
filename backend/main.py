from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from schemas import PatientProfile, Gender, CancerType, most_severe_tier
from brain.rule_engine import score_all_cancer_risks
from brain.ml_layer import predict_ml_risk
from brain.rag_llm_layer import generate_guidance

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", "http://127.0.0.1:3000",
        "http://localhost:5173", "http://127.0.0.1:5173",
    ],  # adjust once frontend confirms its actual dev port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PatientInput(BaseModel):
    age: int
    gender: Gender
    is_current_smoker: bool = False
    cough_duration_weeks: int = 0
    has_family_history_lung_cancer: bool = False
    has_occupational_exposure: bool = False
    has_coughing_blood: bool = False
    has_difficulty_swallowing: bool = False
    has_neck_swelling: bool = False
    has_breast_lump: bool = False
    breast_lump_duration_weeks: int = 0
    has_nipple_discharge: bool = False
    has_breast_skin_changes: bool = False
    has_family_history_breast_cancer: bool = False
    has_mouth_ulcer: bool = False
    mouth_ulcer_duration_weeks: int = 0
    has_oral_red_white_patches: bool = False
    uses_smokeless_tobacco: bool = False
    is_alcohol_consuming: bool = False
    has_abnormal_vaginal_bleeding: bool = False
    has_abnormal_vaginal_discharge: bool = False
    has_pelvic_pain: bool = False
    is_hpv_positive: bool = False
    is_screening_overdue: bool = False


@app.post("/api/v1/assessment")
def assessment(patient: PatientInput):
    profile = PatientProfile(**patient.model_dump())
    rule_results = score_all_cancer_risks(profile)

    response = {}
    for cancer_type_value, rule_result in rule_results.items():
        cancer_type = CancerType(cancer_type_value)
        if not rule_result.applicable:
            response[cancer_type_value] = {
                "overall_tier": "not_applicable", "layer1": rule_result,
                "layer2": None, "layer3": None,
            }
            continue
        ml_result = predict_ml_risk(profile, rule_result, cancer_type)
        layer3_result = generate_guidance(cancer_type, rule_result, ml_result)
        response[cancer_type_value] = {
            "overall_tier": most_severe_tier(rule_result.tier, ml_result.tier).value,
            "layer1": rule_result, "layer2": ml_result, "layer3": layer3_result,
        }
    return response