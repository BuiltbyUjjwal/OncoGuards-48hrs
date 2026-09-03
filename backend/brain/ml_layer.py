import sys
from pathlib import Path

# Same sys.path shim as brain/rule_engine.py - see the comment there.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import xgboost as xgb
import shap
import pandas as pd
from dataclasses import dataclass
from schemas import PatientProfile, RiskTier, CancerType, Gender

# Import RuleEngineResult from the sibling module. Try the package-relative
# form first (used when this file is imported normally, e.g. by main.py via
# `from brain.ml_layer import ...`); fall back to a plain import if this file
# is ever run directly as a standalone script, where relative imports don't work.
try:
    from .rule_engine import RuleEngineResult
except ImportError:
    from rule_engine import RuleEngineResult

BASE_DIR = Path(__file__).resolve().parent      # .../brain
PROJECT_ROOT = BASE_DIR.parent                  # project root
MODELS_DIR = PROJECT_ROOT / "models"            # project root's models/ folder (unchanged location)


@dataclass
class Layer2Result:
    # `probability` is None when no trained model exists yet for this cancer
    # type - see `model_available` below.
    probability: float | None
    tier: RiskTier
    top_factors: list[str]
    protective_factors: list[str]
    # NEW: False means this result is a Layer-1-only placeholder, not a real
    # XGBoost prediction. main.py and the RAG/LLM layer use this to decide
    # whether to mention that predictive ML analysis isn't available yet for
    # this cancer type.
    model_available: bool = True


# ============================================================================
# MODULARITY FOR FUTURE MODELS
#
# Only the lung model exists today. Once you've trained the breast / oral /
# cervical XGBoost models yourself, adding each one is a 3-step, localized
# change - no changes needed anywhere else in this file or in main.py:
#
#   1. Drop the trained model .json file into /models
#   2. Uncomment its line in _MODEL_REGISTRY below
#   3. Write a `_<cancer>_patient_to_row()` function (see _lung_patient_to_row
#      for the pattern) and add it to _ROW_BUILDERS, plus its
#      "clinically defensible" SHAP feature set in _CLINICALLY_DEFENSIBLE
#
# Until step 1+2 are done for a cancer type, predict_ml_risk() below returns
# a graceful placeholder Layer2Result instead of crashing, so the rest of the
# pipeline (rule engine + RAG/LLM guidance) keeps working normally for that
# cancer type in the meantime.
# ============================================================================

_MODEL_REGISTRY: dict[CancerType, str] = {
    CancerType.LUNG: "lung_xgb_model.json",
    CancerType.CERVICAL: "cervical_xgb_model.json",
    CancerType.BREAST: "breast_xgb_model.json",
    # CancerType.ORAL: "oral_xgb_model.json",         # <- uncomment once a proper risk dataset is found
}

# ---- Lung model: feature columns + SHAP explainability config ----
# UPDATED for the new 1,000-row "Cancer Patients & Air Pollution" dataset
# (23 features, ordinal 1-9 severity/exposure scales instead of the old
# 15-column dataset's plain binary 0/1 flags). Column names below must
# exactly match what the training notebook produces - the notebook's
# cleanup step is:
#     df.columns = df.columns.str.strip().str.upper().str.replace(" ", "_")
# which turns e.g. "OccuPational Hazards" -> "OCCUPATIONAL_HAZARDS" and
# "chronic Lung Disease" -> "CHRONIC_LUNG_DISEASE" (verified against the
# real CSV, not guessed).
LUNG_FEATURE_COLUMNS = [
    "AGE", "GENDER", "AIR_POLLUTION", "ALCOHOL_USE", "DUST_ALLERGY",
    "OCCUPATIONAL_HAZARDS", "GENETIC_RISK", "CHRONIC_LUNG_DISEASE",
    "BALANCED_DIET", "OBESITY", "SMOKING", "PASSIVE_SMOKER", "CHEST_PAIN",
    "COUGHING_OF_BLOOD", "FATIGUE", "WEIGHT_LOSS", "SHORTNESS_OF_BREATH",
    "WHEEZING", "SWALLOWING_DIFFICULTY", "CLUBBING_OF_FINGER_NAILS",
    "FREQUENT_COLD", "DRY_COUGH", "SNORING",
]

# Re-triaged for the new dataset (same test as the original PEER_PRESSURE/
# ANXIETY exclusion: is this an established real-world lung cancer risk
# factor, or just something statistically present in THIS dataset's labels?).
#
# Excluded, with reasons (not just "low SHAP", these are excluded even
# though several of them - OBESITY especially - are strongly correlated
# with this dataset's Level label):
#   GENDER          - demographic, not a "why" a user acts on
#   OBESITY         - not an established primary lung-cancer risk factor in
#                     clinical literature; its 0.83 correlation in this
#                     dataset is itself evidence the label is synthetic,
#                     not grounds to tell a user "your weight is why"
#   BALANCED_DIET   - not an established primary lung-cancer-specific driver
#   DUST_ALLERGY    - an allergic response isn't itself a carcinogenic
#                     pathway; OCCUPATIONAL_HAZARDS/AIR_POLLUTION already
#                     capture the actual exposure routes
#   ALCOHOL_USE     - established for oral/liver cancers, weak/inconsistent
#                     specifically for lung cancer in mainstream literature
#   FREQUENT_COLD   - nonspecific viral-susceptibility marker
#   SNORING         - OSA-adjacent, not a recognized lung cancer indicator
LUNG_CLINICALLY_DEFENSIBLE = {
    "AGE", "SMOKING", "PASSIVE_SMOKER", "AIR_POLLUTION",
    "OCCUPATIONAL_HAZARDS", "GENETIC_RISK", "CHRONIC_LUNG_DISEASE",
    "CHEST_PAIN", "COUGHING_OF_BLOOD", "DRY_COUGH", "SHORTNESS_OF_BREATH",
    "WEIGHT_LOSS", "WHEEZING", "SWALLOWING_DIFFICULTY",
    "CLUBBING_OF_FINGER_NAILS", "FATIGUE",
}

# ---- Cervical model: feature columns + SHAP explainability config ----
# UCI Cervical Cancer Risk Factors dataset (858 rows). Column names below
# must exactly match what the training notebook produces after its rename
# step (an explicit dict, not a regex - see notebooks/train_cervical_model.ipynb
# - because the source column names use inconsistent spacing/parentheses,
# unlike lung's uniformly-formatted headers).
CERVICAL_FEATURE_COLUMNS = [
    "AGE", "NUM_SEXUAL_PARTNERS", "FIRST_SEXUAL_INTERCOURSE_AGE",
    "NUM_PREGNANCIES", "SMOKES", "SMOKES_YEARS", "HORMONAL_CONTRACEPTIVES",
    "HORMONAL_CONTRACEPTIVES_YEARS", "IUD", "IUD_YEARS", "STDS", "STDS_NUMBER",
]

# Every individual STD sub-type flag (condylomatosis, HIV, Hepatitis B, HPV,
# etc.) and the two "time since diagnosis" columns were EXCLUDED from
# CERVICAL_FEATURE_COLUMNS entirely, not just from this defensible set - see
# the write-up accompanying this change. At 858 rows with as few as 0-2
# positive cases per sub-type, they're not learnable signal, they're
# overfitting risk that SHAP would report as misleadingly "important."
#
# NUM_SEXUAL_PARTNERS and FIRST_SEXUAL_INTERCOURSE_AGE are valid MODEL
# INPUTS (real, literature-supported risk factors) but deliberately EXCLUDED
# here - not a clinical-validity call like the lung exclusions, a product-tone
# one: surfacing "your number of past partners" as a user-facing "why" cuts
# against the UX doc's own "never feel afraid, only informed" principle even
# though the factor is real. Revisit if the frontend ever wants to handle
# this kind of factor with more care than a plain top_factors string allows.
#
# IUD / IUD_YEARS are excluded for a THIRD, different reason: more recent
# literature associates IUD use with REDUCED cervical cancer risk (protective,
# not risk-increasing) - the opposite direction from what "risk factor"
# framing assumes. Verify the actual direction in this specific dataset
# before including it as a "why" - same "don't assume the label matches the
# name" caution as lung's BALANCED_DIET.
CERVICAL_CLINICALLY_DEFENSIBLE = {
    "AGE", "SMOKES_YEARS", "STDS", "STDS_NUMBER",
    "HORMONAL_CONTRACEPTIVES_YEARS", "NUM_PREGNANCIES",
}

# ---- Breast model: feature columns + SHAP explainability config ----
# BCSC (Breast Cancer Surveillance Consortium) Risk Estimation Dataset -
# 2,392,998 real screening mammograms, aggregated into 280,660 rows by exact
# combination of risk factors + outcome. See notebooks/train_breast_model.ipynb
# for the full walkthrough, including why this dataset needs sample-weighting
# instead of a plain train/test split.
BREAST_FEATURE_COLUMNS = [
    "MENOPAUS", "AGEGRP", "DENSITY", "RACE", "HISPANIC", "BMI",
    "AGEFIRST", "NRELBC", "BRSTPROC", "LASTMAMM", "SURGMENO", "HRT",
]

# Same "would you tell a patient this is their 'why'?" triage as lung/cervical
# above - excluded here, with reasons:
#   RACE, HISPANIC   - real inputs to BCSC's own published risk model, but the
#                      same product-tone call already made for cervical's
#                      NUM_SEXUAL_PARTNERS: valid signal, not something to
#                      surface as a plain "your race is a risk factor" string.
#   SURGMENO, HRT    - same caution as cervical's IUD exclusion: checked
#                      directly against this dataset (not assumed) and both
#                      show a NEGATIVE raw correlation with the outcome -
#                      which, for HRT especially, conflicts with the direction
#                      mainstream literature would suggest. Could be real,
#                      could be confounding in a simple marginal check -
#                      either way, don't surface a "why" whose direction
#                      hasn't been verified end to end.
BREAST_CLINICALLY_DEFENSIBLE = {
    "AGEGRP", "MENOPAUS", "DENSITY", "BMI", "AGEFIRST", "NRELBC",
    "BRSTPROC", "LASTMAMM",
}

_CLINICALLY_DEFENSIBLE: dict[CancerType, set[str]] = {
    CancerType.LUNG: LUNG_CLINICALLY_DEFENSIBLE,
    CancerType.CERVICAL: CERVICAL_CLINICALLY_DEFENSIBLE,
    CancerType.BREAST: BREAST_CLINICALLY_DEFENSIBLE
    # CancerType.ORAL: {...},
}


def _lung_patient_to_row(patient: PatientProfile) -> pd.DataFrame:
    """Builds the exact feature row the trained lung XGBoost model expects.

    UPDATED for the new dataset. All severity fields are read straight from
    the new lung_* ordinal PatientProfile fields (see schemas.py) - these are
    intentionally separate from the boolean fields the rule engine uses.
    """
    return pd.DataFrame([{
        "AGE": patient.age,
        # NOTE: this dataset encodes Gender as 1/2 (NOT 0/1 like the old
        # dataset - verify this before training, don't assume). Named
        # limitation: Gender.OTHER has no equivalent category in this
        # dataset, so it's mapped to 2 as a visible, documented default
        # rather than a silent guess - same "don't silently assume"
        # principle already used for Gender.OTHER in
        # score_cervical_cancer_risk(). Revisit if a better dataset shows up.
        "GENDER": 1 if patient.gender == Gender.MALE else 2,
        "AIR_POLLUTION": patient.lung_air_pollution_exposure,
        "ALCOHOL_USE": patient.lung_alcohol_use_severity,
        "DUST_ALLERGY": patient.lung_dust_allergy_severity,
        "OCCUPATIONAL_HAZARDS": patient.lung_occupational_hazard_severity,
        "GENETIC_RISK": patient.lung_genetic_risk,
        "CHRONIC_LUNG_DISEASE": patient.lung_chronic_disease_severity,
        # NOTE: direction unverified - this column positively correlates
        # with risk (0.71) in the raw CSV, which only makes physiological
        # sense if higher values mean a WORSE diet, not a more balanced one.
        # Confirm against the dataset's own data dictionary before trusting
        # this at face value - don't assume "Balanced Diet" means what its
        # name suggests, the same way you didn't assume SMOKING would
        # correlate with the old dataset's label.
        "BALANCED_DIET": patient.lung_diet_balance,
        "OBESITY": patient.lung_obesity_level,
        "SMOKING": patient.lung_smoking_severity,
        "PASSIVE_SMOKER": patient.lung_passive_smoking_severity,
        "CHEST_PAIN": patient.lung_chest_pain_severity,
        "COUGHING_OF_BLOOD": patient.lung_coughing_blood_severity,
        "FATIGUE": patient.lung_fatigue_severity,
        "WEIGHT_LOSS": patient.lung_weight_loss_severity,
        "SHORTNESS_OF_BREATH": patient.lung_shortness_of_breath_severity,
        "WHEEZING": patient.lung_wheezing_severity,
        "SWALLOWING_DIFFICULTY": patient.lung_swallowing_difficulty_severity,
        "CLUBBING_OF_FINGER_NAILS": patient.lung_finger_clubbing_severity,
        "FREQUENT_COLD": patient.lung_frequent_cold_severity,
        "DRY_COUGH": patient.lung_dry_cough_severity,
        "SNORING": patient.lung_snoring_severity,
    }])


def _cervical_patient_to_row(patient: PatientProfile) -> pd.DataFrame:
    """Builds the exact feature row the trained cervical XGBoost model expects.

    No gender-guard needed here: main.py's assessment loop already skips
    Layer 2/3 entirely whenever score_cervical_cancer_risk() returns
    applicable=False (non-female patients), so this function is structurally
    unreachable for them - see main.py's `if not rule_result.applicable`
    check.
    """
    return pd.DataFrame([{
        "AGE": patient.age,
        "NUM_SEXUAL_PARTNERS": patient.cervical_num_sexual_partners,
        "FIRST_SEXUAL_INTERCOURSE_AGE": patient.cervical_first_intercourse_age,
        "NUM_PREGNANCIES": patient.cervical_num_pregnancies,
        # Reused directly from the rule-engine field - real binary/binary
        # match, no precision lost (unlike lung's smoking severity, which
        # needed its own separate ordinal field).
        "SMOKES": int(patient.is_current_smoker),
        "SMOKES_YEARS": patient.cervical_smoking_years,
        "HORMONAL_CONTRACEPTIVES": int(patient.cervical_uses_hormonal_contraceptives),
        "HORMONAL_CONTRACEPTIVES_YEARS": patient.cervical_hormonal_contraceptive_years,
        "IUD": int(patient.cervical_has_used_iud),
        "IUD_YEARS": patient.cervical_iud_years,
        "STDS": int(patient.cervical_has_std_history),
        "STDS_NUMBER": patient.cervical_std_count,
    }])

def _breast_patient_to_row(patient: PatientProfile) -> pd.DataFrame:
    """Builds the exact feature row the trained breast XGBoost model expects.

    Two fields are computed rather than read straight off the profile:

    - AGEGRP: BCSC buckets age into 5-year groups, 35-39 (1) up to 80-84 (10),
      instead of using raw age. Patients outside that 35-84 range are clamped
      to the nearest bucket - a named limitation (the model has never seen
      anyone younger than 35 or older than 84), not a silent guess.
    - MENOPAUS: BCSC's own coding rule treats every woman aged 55+ as
      postmenopausal by definition, regardless of self-report (per the
      dataset's documentation). Only under-55 patients actually rely on
      patient.breast_menopausal_status below.
    """
    agegrp = (patient.age - 35) // 5 + 1
    agegrp = max(1, min(agegrp, 10))  # clamp to the dataset's known 35-84 range

    menopaus = 1 if patient.age >= 55 else patient.breast_menopausal_status

    return pd.DataFrame([{
        "MENOPAUS": menopaus,
        "AGEGRP": agegrp,
        "DENSITY": patient.breast_density,
        "RACE": patient.breast_race,
        "HISPANIC": patient.breast_is_hispanic,
        "BMI": patient.breast_bmi_category,
        "AGEFIRST": patient.breast_age_at_first_birth_category,
        "NRELBC": patient.breast_num_relatives_with_breast_cancer,
        "BRSTPROC": patient.breast_has_prior_breast_procedure,
        "LASTMAMM": patient.breast_last_mammogram_result,
        "SURGMENO": patient.breast_had_surgical_menopause,
        "HRT": patient.breast_uses_hormone_therapy,
    }])


# Row-builder registry - one function per cancer type that knows how to turn
# a PatientProfile into the exact feature row its trained model expects.
# Add an entry here alongside each new _MODEL_REGISTRY entry.
_ROW_BUILDERS = {
    CancerType.LUNG: _lung_patient_to_row,
    CancerType.CERVICAL: _cervical_patient_to_row,
    CancerType.BREAST: _breast_patient_to_row, 
    # CancerType.ORAL: _oral_patient_to_row,         # define + add once a proper risk dataset is found
}


# ---- Load every model currently in the registry, once, at import time ----
# (This is the same eager-loading approach the original file used for lung -
# it's simple, and it fails loudly/immediately at startup if a registered
# model file is missing, which is exactly the behavior we want.)
_models: dict[CancerType, xgb.XGBClassifier] = {}
_explainers: dict[CancerType, shap.TreeExplainer] = {}

for _cancer_type, _filename in _MODEL_REGISTRY.items():
    _model = xgb.XGBClassifier()
    _model.load_model(str(MODELS_DIR / _filename))
    _models[_cancer_type] = _model
    _explainers[_cancer_type] = shap.TreeExplainer(_model)


# If/when a cancer model is trained as a true 3-class classifier (predicting
# Low/Medium/High directly, like lung's new model) rather than a binary
# yes/no, its training labels MUST be encoded 0=Low, 1=Medium, 2=High so
# argmax(predict_proba(...)) below lines up with this ordering. This is a
# convention every future 3-class model in this app needs to follow, not a
# lung-specific hack.
_MULTICLASS_TIER_ORDER = [RiskTier.LOW, RiskTier.MEDIUM, RiskTier.HIGH]


def predict_ml_risk(
    patient: PatientProfile,
    rule_result: RuleEngineResult,
    cancer_type: CancerType = CancerType.LUNG,
) -> Layer2Result:
    """
    Runs Layer 2 (XGBoost + SHAP) for the given cancer type.

    If no trained model is registered yet for this cancer type, this falls
    back to a placeholder result (probability=None, tier copied from Layer 1,
    model_available=False) instead of raising - that's what lets breast/oral
    flow through the rest of the pipeline today, before their models exist,
    without special-casing every caller.
    """
        # The breast model was trained exclusively on BCSC screening-mammography
    # data, which only includes female patients. Running it on a male
    # patient would be extrapolating to a population it has zero training
    # examples from - a different problem from "no model exists yet"
    # (breast/oral's old state), so it gets its own check rather than being
    # folded into the generic "not in _models" branch below. Layer 1's rule
    # engine intentionally stays open to every gender (male breast cancer is
    # real, just rare) - this check is scoped to Layer 2 only, so male
    # patients still get a full Layer 1 + Layer 3 assessment, just without
    # an ML-predicted probability attached.
    if cancer_type == CancerType.BREAST and patient.gender != Gender.FEMALE:
        return Layer2Result(
            probability=None,
            tier=rule_result.tier,
            top_factors=[],
            protective_factors=[],
            model_available=False,
        )

    if cancer_type not in _models:
        return Layer2Result(
            probability=None,
            tier=rule_result.tier,
            top_factors=[],
            protective_factors=[],
            model_available=False,
        )

    row_builder = _ROW_BUILDERS[cancer_type]
    row = row_builder(patient)

    model = _models[cancer_type]
    explainer = _explainers[cancer_type]

    proba = model.predict_proba(row)[0]  # shape (n_classes,)

    if len(proba) == 2:
        # ---- Binary model path (unchanged behavior - e.g. any future
        # cancer type trained as plain yes/no, same as lung used to be) ----
        probability = float(proba[1])
        tier = RiskTier.HIGH if probability >= 0.67 else RiskTier.MEDIUM if probability >= 0.34 else RiskTier.LOW
        predicted_class_idx = 1 if probability >= 0.5 else 0
    else:
        # ---- True 3-class model path (lung's new model) ----
        # tier comes directly from the model's own predicted class - no
        # threshold hack needed, because the model was trained to predict
        # Low/Medium/High directly (see _MULTICLASS_TIER_ORDER above).
        predicted_class_idx = int(proba.argmax())
        tier = _MULTICLASS_TIER_ORDER[predicted_class_idx]
        # "probability" now means "how confident the model is in the tier
        # it just assigned" (e.g. 0.81 = 81% confident this patient is
        # Medium), NOT "probability of having cancer" like the old binary
        # field meant. Nothing downstream currently reads this field as a
        # percentage shown to the user (checked: rag_llm_layer.py only uses
        # .tier and .top_factors) - but if that ever changes, the copy needs
        # to reflect this new meaning, not the old one.
        probability = float(proba[predicted_class_idx])


    shap_output = explainer.shap_values(row)
    if isinstance(shap_output, list):
        shap_row = shap_output[predicted_class_idx][0]
    elif shap_output.ndim == 3:
        # (n_samples, n_features, n_classes) - need the sample, every feature,
        # AND the predicted class dimension - not just the sample.
        shap_row = shap_output[0, :, predicted_class_idx]
    else:
        shap_row = shap_output[0]

    contributions = sorted(zip(row.columns, shap_row), key=lambda x: -x[1])

    defensible = _CLINICALLY_DEFENSIBLE.get(cancer_type, set(row.columns))
    top_factors = [n for n, v in contributions if v > 0 and n in defensible][:3]
    protective_factors = [n for n, v in reversed(contributions) if v < 0 and n in defensible][:3]

    return Layer2Result(
        probability=probability,
        tier=tier,
        top_factors=top_factors,
        protective_factors=protective_factors,
        model_available=True,
    )