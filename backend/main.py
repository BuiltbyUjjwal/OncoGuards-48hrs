from fastapi import FastAPI
from pydantic import BaseModel
from schemas import PatientProfile, Gender, CancerType, most_severe_tier
from brain.rule_engine import score_all_cancer_risks
from brain.ml_layer import predict_ml_risk
from brain.rag_llm_layer import generate_guidance
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
    ], # which frontend URL(s) can access the API.
    allow_credentials=True, # Allows cookies/auth tokens to be sent.
    allow_methods=["*"], # Which HTTP methods are permitted. (All)
    allow_headers=["*"], # Which request headers are permitted. (All)
)

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

        # Layer 2: XGBoost + SHAP if a trained model exists for this cancer
        # type yet, otherwise a graceful Layer-1-only placeholder (see
        # brain/ml_layer.py's _MODEL_REGISTRY).
        ml_result = predict_ml_risk(profile, rule_result, cancer_type=cancer_type)

        # Layer 3: RAG-grounded guidance, cancer-type-aware.
        layer3_result = generate_guidance(rule_result, ml_result, cancer_type=cancer_type)

        report[cancer_type_value] = {
            "overall_tier": most_severe_tier(rule_result.tier, ml_result.tier).value,
            "layer1": rule_result,
            "layer2": ml_result,
            "layer3": layer3_result,
        }

    return report