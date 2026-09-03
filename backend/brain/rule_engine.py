from dataclasses import dataclass
from schemas import PatientProfile, Gender, RiskTier, CancerType


@dataclass
class RuleEngineResult:
    score: int
    tier: RiskTier
    triggered_factors: list[str]
    applicable: bool = True


def _duration_weight(weeks: int, mild: int, moderate: int, severe: int) -> int:
    """Shared duration-severity curve used by every symptom that gets worse
    the longer it persists (cough, lump, ulcer)."""
    if weeks > 6:
        return severe
    elif weeks > 3:
        return moderate
    elif weeks >= 1:
        return mild
    return 0


def _tier_from_score(score: int) -> RiskTier:
    if score <= 33:
        return RiskTier.LOW
    elif score <= 66:
        return RiskTier.MEDIUM
    return RiskTier.HIGH


def score_lung_cancer_risk(patient: PatientProfile) -> RuleEngineResult:
    score, factors = 0, []

    if patient.age >= 65:
        score += 20; factors.append("age_over_65")
    elif patient.age >= 55:
        score += 15; factors.append("age_over_55")
    elif patient.age >= 50:
        score += 10; factors.append("age_over_50")
    elif patient.age >= 40:
        score += 5; factors.append("age_over_40")

    cough_pts = _duration_weight(patient.cough_duration_weeks, 5, 15, 20)
    if cough_pts > 0:
        score += cough_pts; factors.append("persistent_cough")

    if patient.is_current_smoker:
        score += 20; factors.append("current_smoker")
    if patient.has_family_history_lung_cancer:
        score += 10; factors.append("family_history_lung_cancer")
    if patient.has_occupational_exposure:
        score += 10; factors.append("occupational_exposure")
    if patient.has_coughing_blood:
        score += 30; factors.append("hemoptysis")
    if patient.has_difficulty_swallowing:
        score += 5; factors.append("difficulty_swallowing")
    if patient.has_neck_swelling:
        score += 5; factors.append("neck_swelling")

    score = max(0, min(score, 100))
    return RuleEngineResult(score=score, tier=_tier_from_score(score), triggered_factors=factors)


def score_breast_cancer_risk(patient: PatientProfile) -> RuleEngineResult:
    # No gender gate — deliberate simplification. Male breast cancer is real,
    # just rare; Layer 1 stays open to everyone, Layer 2 (once trained) can
    # apply a narrower, data-justified restriction if needed.
    score, factors = 0, []

    if patient.age >= 60:
        score += 20; factors.append("age_over_60")
    elif patient.age >= 50:
        score += 15; factors.append("age_over_50")
    elif patient.age >= 40:
        score += 10; factors.append("age_over_40")
    elif patient.age >= 30:
        score += 5; factors.append("age_over_30")

    if patient.has_breast_lump:
        lump_pts = _duration_weight(patient.breast_lump_duration_weeks, 10, 20, 30)
        score += lump_pts if lump_pts > 0 else 5
        factors.append("breast_lump")

    if patient.has_nipple_discharge:
        score += 15; factors.append("nipple_discharge")
    if patient.has_breast_skin_changes:
        score += 15; factors.append("breast_skin_changes")
    if patient.has_family_history_breast_cancer:
        score += 15; factors.append("family_history_breast_cancer")

    score = max(0, min(score, 100))
    return RuleEngineResult(score=score, tier=_tier_from_score(score), triggered_factors=factors)


def score_oral_cancer_risk(patient: PatientProfile) -> RuleEngineResult:
    score, factors = 0, []

    if patient.age >= 60:
        score += 20; factors.append("age_over_60")
    elif patient.age >= 50:
        score += 15; factors.append("age_over_50")
    elif patient.age >= 40:
        score += 10; factors.append("age_over_40")
    elif patient.age >= 30:
        score += 5; factors.append("age_over_30")

    if patient.has_mouth_ulcer:
        ulcer_pts = _duration_weight(patient.mouth_ulcer_duration_weeks, 10, 20, 25)
        score += ulcer_pts if ulcer_pts > 0 else 5
        factors.append("persistent_mouth_ulcer")

    if patient.has_oral_red_white_patches:
        score += 20; factors.append("oral_red_white_patches")
    if patient.uses_smokeless_tobacco:
        score += 25; factors.append("smokeless_tobacco_use")   # India-specific, highest single factor
    if patient.is_current_smoker:
        score += 15; factors.append("current_smoker")
    if patient.is_alcohol_consuming:
        score += 10; factors.append("alcohol_use")
    if patient.has_difficulty_swallowing:
        score += 10; factors.append("difficulty_swallowing")
    if patient.has_neck_swelling:
        score += 10; factors.append("neck_swelling")

    score = max(0, min(score, 100))
    return RuleEngineResult(score=score, tier=_tier_from_score(score), triggered_factors=factors)


def score_cervical_cancer_risk(patient: PatientProfile) -> RuleEngineResult:
    if patient.gender != Gender.FEMALE:
        return RuleEngineResult(score=0, tier=RiskTier.LOW,
                                 triggered_factors=["not_applicable_gender"],
                                 applicable=False)

    score, factors = 0, []

    if patient.age >= 50:
        score += 15; factors.append("age_over_50")
    elif patient.age >= 30:
        score += 10; factors.append("age_over_30")

    if patient.has_abnormal_vaginal_bleeding:
        score += 25; factors.append("abnormal_vaginal_bleeding")   # single most decisive symptom, WHO
    if patient.has_abnormal_vaginal_discharge:
        score += 15; factors.append("abnormal_vaginal_discharge")
    if patient.has_pelvic_pain:
        score += 10; factors.append("pelvic_pain")
    if patient.is_hpv_positive:
        score += 20; factors.append("hpv_positive")
    if patient.is_screening_overdue:
        score += 15; factors.append("screening_overdue")

    score = max(0, min(score, 100))
    return RuleEngineResult(score=score, tier=_tier_from_score(score), triggered_factors=factors)


def score_all_cancer_risks(patient: PatientProfile) -> dict[str, RuleEngineResult]:
    return {
        CancerType.LUNG.value: score_lung_cancer_risk(patient),
        CancerType.BREAST.value: score_breast_cancer_risk(patient),
        CancerType.ORAL.value: score_oral_cancer_risk(patient),
        CancerType.CERVICAL.value: score_cervical_cancer_risk(patient),
    }