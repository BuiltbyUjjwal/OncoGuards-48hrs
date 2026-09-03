from enum import Enum
from dataclasses import dataclass


class Gender(Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class RiskTier(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class CancerType(Enum):
    LUNG = "lung"
    BREAST = "breast"
    ORAL = "oral"
    CERVICAL = "cervical"


_TIER_SEVERITY = {RiskTier.LOW: 0, RiskTier.MEDIUM: 1, RiskTier.HIGH: 2}


def most_severe_tier(*tiers: RiskTier) -> RiskTier:
    """Returns the most severe tier. Used whenever Layer 1 (rules) and Layer 2
    (ML) disagree — we always trust the higher-risk verdict, never silently
    default to one layer. This is the core safety guarantee of the hybrid
    architecture: a conservative default that can't quietly under-flag risk."""
    return max(tiers, key=lambda t: _TIER_SEVERITY[t])


@dataclass
class PatientProfile:
    age: int
    gender: Gender

    # --- Lung ---
    is_current_smoker: bool = False
    cough_duration_weeks: int = 0
    has_family_history_lung_cancer: bool = False
    has_occupational_exposure: bool = False
    has_coughing_blood: bool = False
    has_difficulty_swallowing: bool = False   # shared with oral
    has_neck_swelling: bool = False           # shared with oral

    # --- Breast (no gender gate — deliberate, see rule_engine.py) ---
    has_breast_lump: bool = False
    breast_lump_duration_weeks: int = 0
    has_nipple_discharge: bool = False
    has_breast_skin_changes: bool = False
    has_family_history_breast_cancer: bool = False

    # --- Oral ---
    has_mouth_ulcer: bool = False
    mouth_ulcer_duration_weeks: int = 0
    has_oral_red_white_patches: bool = False
    uses_smokeless_tobacco: bool = False
    is_alcohol_consuming: bool = False        # shared with cervical's SMOKES-adjacent logic

    # --- Cervical (gender-gated in rule_engine.py) ---
    has_abnormal_vaginal_bleeding: bool = False
    has_abnormal_vaginal_discharge: bool = False
    has_pelvic_pain: bool = False
    is_hpv_positive: bool = False
    is_screening_overdue: bool = False

    # Layer-2 ordinal/categorical fields (lung_*_severity, breast_*, cervical_*)
    # get added here once datasets are sourced and models are trained — Layer 1
    # and Layer 3 don't need them, so they're not blocking right now.