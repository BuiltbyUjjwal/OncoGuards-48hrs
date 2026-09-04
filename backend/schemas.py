from enum import Enum
from dataclasses import dataclass

# define gender enum for patient profile
class Gender(Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

# define risk tier enum for rule engine result
class RiskTier(Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

# --- NEW: cancer type enum ---
# Central list of every cancer type the pipeline knows about. Every layer
# (rule engine, ML layer, RAG/LLM layer, main.py) keys off this enum instead
# of raw strings, so adding a 5th cancer type later means updating this list
# once and letting type-checking catch anywhere else that needs a matching update.
class CancerType(Enum):
    LUNG = "lung"
    BREAST = "breast"
    ORAL = "oral"
    CERVICAL = "cervical"

# ---19/08/26 NEW ADDITION: Risk tier severity mapping and helper ---
_TIER_SEVERITY = {RiskTier.LOW: 0, RiskTier.MEDIUM: 1, RiskTier.HIGH: 2}

def most_severe_tier(*tiers: RiskTier) -> RiskTier:
    """Returns the most severe tier. Used to ensure safe defaults when layers disagree."""
    return max(tiers, key=lambda t: _TIER_SEVERITY[t])
# -----------------------------------------------------------

# define patient profile dataclass for rule engine input
#
# NOTE: this profile is now shared across all 4 cancer types (lung, breast,
# oral, cervical) rather than being lung-only. Only `age` and `gender` are
# required, since every cancer type's rule engine needs those two. Everything
# else is defaulted so a profile can be built for any subset of cancer types
# without having to fill in fields that don't apply
# (e.g. you don't need cough_duration_weeks to assess breast cancer risk).
@dataclass
class PatientProfile:
    age: int
    gender: Gender
    patient_id: str = "anonymous"

    # --- Lung-related fields used by the RULE ENGINE (Layer 1) ---
    # These are untouched by the ML dataset swap below. score_lung_cancer_risk()
    # (and, for the two shared ones, score_oral_cancer_risk()) reads these
    # directly - they stay simple booleans/durations because Layer 1's CAUTION-
    # style scoring wants clean yes/no + duration signals, not graded severity.
    is_current_smoker: bool = False
    cough_duration_weeks: int = 0
    has_family_history_lung_cancer: bool = False
    has_occupational_exposure: bool = False
    has_coughing_blood: bool = False
    has_difficulty_swallowing: bool = False  # shared: also used by oral cancer scoring
    has_neck_swelling: bool = False          # shared: also used by oral cancer scoring
    is_alcohol_consuming: bool = False       # shared: also used by oral cancer scoring

    # --- Lung ML-layer (Layer 2) fields — "Cancer Patients & Air Pollution" dataset ---
    # REPLACES the old 15-column survey dataset's boolean flags (has_yellow_fingers,
    # has_anxiety, has_peer_pressure, has_chronic_disease, has_fatigue, has_allergy,
    # has_wheezing, has_cough, has_shortness_of_breath, has_chest_pain - all removed,
    # none of them were read by the rule engine, only by the old _lung_patient_to_row).
    #
    # Every field below is an ordinal 1-9 severity/exposure rating (exact range
    # varies per field - see ml_layer.py's _lung_patient_to_row for the source
    # dataset's real min/max per column). There is no "0 = none" value in this
    # dataset, so a skipped/unanswered question defaults to 1 (the mildest value
    # the model was actually trained on) rather than 0 or None - 0 would be an
    # out-of-distribution input the model's learned split thresholds never saw.
    #
    # These are intentionally SEPARATE from the boolean fields above even where
    # the concept overlaps (e.g. lung_smoking_severity vs. is_current_smoker,
    # lung_coughing_blood_severity vs. has_coughing_blood). Layer 1 wants a clean
    # yes/no; Layer 2's model was trained on a graded scale. Collapsing one into
    # the other would either lose Layer 1's simplicity or lose Layer 2's
    # resolution, so both representations are kept, feeding different layers.
    lung_air_pollution_exposure: int = 1
    lung_alcohol_use_severity: int = 1
    lung_dust_allergy_severity: int = 1
    lung_occupational_hazard_severity: int = 1
    lung_genetic_risk: int = 1
    lung_chronic_disease_severity: int = 1
    lung_diet_balance: int = 1               # NOTE: direction unverified - see ml_layer.py comment
    lung_obesity_level: int = 1
    lung_smoking_severity: int = 1
    lung_passive_smoking_severity: int = 1
    lung_chest_pain_severity: int = 1
    lung_coughing_blood_severity: int = 1
    lung_fatigue_severity: int = 1
    lung_weight_loss_severity: int = 1       # NEW: closes the CAUTION "weight loss" gap for
                                              # Layer 2 only - NOT wired into the rule engine's
                                              # scoring yet; that's still your parked decision.
    lung_shortness_of_breath_severity: int = 1
    lung_wheezing_severity: int = 1
    lung_swallowing_difficulty_severity: int = 1
    lung_finger_clubbing_severity: int = 1
    lung_frequent_cold_severity: int = 1
    lung_dry_cough_severity: int = 1
    lung_snoring_severity: int = 1

    # --- NEW: Breast cancer fields ---
    has_breast_lump: bool = False
    breast_lump_duration_weeks: int = 0
    has_nipple_discharge: bool = False
    has_breast_skin_changes: bool = False          # dimpling, puckering, nipple retraction
    has_family_history_breast_cancer: bool = False
    
    # --- NEW: Breast ML-layer (Layer 2) fields - BCSC Risk Estimation Dataset.
    # This dataset is female-only (screening mammography participants), which
    # is why predict_ml_risk() in ml_layer.py gates Layer 2 to female patients
    # only - Layer 1 above stays open to every gender on purpose, male breast
    # cancer is real, just not something this specific trained model has ever
    # seen an example of.
    #
    # Every field below defaults to 9 ("unknown") - not a guess, that's the
    # BCSC dataset's OWN convention for a skipped/unanswered question, and the
    # model was trained on real rows containing that exact value, so it's not
    # an out-of-distribution input the way defaulting to 0 would be (same
    # reasoning already used for lung's "default to 1, not 0" fields above).
    breast_menopausal_status: int = 9                  # BCSC 'menopaus': 0=pre, 1=post/age>=55, 9=unknown
    breast_density: int = 9                             # BCSC 'density': 1-4 BI-RADS, 9=unknown
    breast_race: int = 9                                 # BCSC 'race': 1=white,2=Asian/PI,3=Black,4=Native American,5=other/mixed,9=unknown
    breast_is_hispanic: int = 9                          # BCSC 'Hispanic': 0=no,1=yes,9=unknown
    breast_bmi_category: int = 9                         # BCSC 'bmi': 1=10-24.99,2=25-29.99,3=30-34.99,4=35+,9=unknown
    breast_age_at_first_birth_category: int = 9          # BCSC 'agefirst': 0=<30,1=30+,2=nulliparous,9=unknown
    breast_num_relatives_with_breast_cancer: int = 9     # BCSC 'nrelbc': 0/1/2("two or more")/9=unknown
    breast_has_prior_breast_procedure: int = 9           # BCSC 'brstproc': prior biopsy, 0=no,1=yes,9=unknown
    breast_last_mammogram_result: int = 9                # BCSC 'lastmamm': 0=negative,1=false positive,9=unknown
    breast_had_surgical_menopause: int = 9               # BCSC 'surgmeno': 0=natural,1=surgical,9=unknown
    breast_uses_hormone_therapy: int = 9                 # BCSC 'hrt': current HRT, 0=no,1=yes,9=unknown

    # --- NEW: Oral cancer fields ---
    # (has_difficulty_swallowing, has_neck_swelling, is_current_smoker and
    # is_alcohol_consuming above are reused here since they are real, relevant
    # risk factors for oral cancer too, not just lung.)
    has_mouth_ulcer: bool = False
    mouth_ulcer_duration_weeks: int = 0
    has_oral_red_white_patches: bool = False       # leukoplakia / erythroplakia
    uses_smokeless_tobacco: bool = False           # chewing tobacco / gutka / paan

    # --- NEW: Cervical cancer fields ---
    has_abnormal_vaginal_bleeding: bool = False    # intermenstrual / postcoital / postmenopausal
    has_abnormal_vaginal_discharge: bool = False
    has_pelvic_pain: bool = False
    is_hpv_positive: bool = False                  # known HPV test result, if any
    is_screening_overdue: bool = False             # no Pap/HPV test within the recommended interval

    # --- NEW: Cervical ML-layer (Layer 2) fields - UCI Cervical Cancer Risk
    # Factors dataset. Defaults below are grounded in the real training data
    # (checked directly against the CSV, not guessed): cervical_num_sexual_partners
    # and cervical_first_intercourse_age default to the dataset's real minimum/
    # median (1 and 17) since 0 isn't a valid value for either column in this
    # dataset; every other field below genuinely defaults to 0/False in the
    # real data (no pregnancies, never smoked, never used contraceptives/IUD,
    # no STD history), so those defaults need no special-casing.
    #
    # SMOKES is reused directly from is_current_smoker above in
    # ml_layer.py's _cervical_patient_to_row - no separate field needed here,
    # it's a real 1:1 boolean/boolean match (unlike lung's smoking severity,
    # which needed its own graded field).
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