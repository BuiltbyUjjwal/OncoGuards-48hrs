import sys
from pathlib import Path

# Make the project root importable (so `from schemas import ...` below works)
# whether this file is run directly (`python brain/rule_engine.py`), as a
# module (`python -m brain.rule_engine`), or imported normally by main.py.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dataclasses import dataclass
from schemas import PatientProfile, Gender, RiskTier, CancerType

# ============================================================================
# DESIGN NOTE (single-file vs. one-file-per-cancer):
#
# All 4 cancer types live in this one file on purpose. With only 4 cancer
# types, and each scoring function being short and self-contained (~30-50
# lines), splitting them into separate files would mean either duplicating
# shared bits (RuleEngineResult, most_severe_tier, the duration-weight helper)
# across files, or adding a `common.py` just to hold them - extra indirection
# for very little benefit at this scale. Keeping them side-by-side in one
# file also makes it easy to eyeball that similar symptoms are weighted
# consistently across cancer types. If this ever grows to 8-10+ cancer types,
# splitting into brain/rule_engine/lung.py, breast.py, etc. would start to
# pay for itself - but that's a "when it hurts" refactor, not a day-1 one.
# ============================================================================

# define rule engine result dataclass for output
@dataclass
class RuleEngineResult:
    score: int
    tier: RiskTier
    triggered_factors: list[str]
    # NEW: some cancer types don't apply to every patient (e.g. cervical
    # cancer screening only applies to patients with a cervix). `applicable`
    # defaults to True so every existing call site is unaffected, and is only
    # set False by the specific scoring functions below that need it.
    # This mirrors the tech report's own example output, which already shows
    # "Cervical Cancer Risk: N/A (not applicable)" for a male patient - we're
    # just making that an explicit, structured field instead of a magic string.
    applicable: bool = True


# ----------------------------------------------------------------------------
# SHARED HELPERS
# ----------------------------------------------------------------------------

def _duration_weight(duration_weeks: int, mild_pts: int, moderate_pts: int, severe_pts: int) -> int:
    """
    Generic duration-based weighting for a persistent symptom (cough, mouth
    ulcer, breast lump, ...). The 3-week / 6-week thresholds mirror the
    ICMR/WHO convention that a symptom persisting past ~3 weeks should
    prompt evaluation, and past ~6 weeks is more urgent still.
    Point values are cancer-specific (a lump is weighted differently than
    a cough) so they're passed in rather than hardcoded here.
    """
    if duration_weeks > 6:
        return severe_pts
    elif duration_weeks > 3:
        return moderate_pts
    elif duration_weeks >= 1:
        return mild_pts
    else:
        return 0


# ============================================================================
# LUNG CANCER
# (unchanged from the original version - only the two helper functions were
# renamed to the _prefixed / _duration_weight style used elsewhere in this
# file. score_lung_cancer_risk() produces identical scores to before.)
# ============================================================================

def _lung_age_weight(age: int) -> tuple[int, str]:
    """age weight modifier for lung cancer risk. returns weight and factor"""

    if age >= 65:
        return 20, "age_over_65"
    elif age >= 55:
        return 15, "age_over_55"
    elif age >= 50:
        return 10, "age_over_50"
    elif age >= 40:
        return 5, "age_over_40"
    else:
        return 0, None


def _cough_weight(duration_weeks: int) -> int:
    """duration-based cough weight (same 5 / 15 / 20 tiers as before)"""
    return _duration_weight(duration_weeks, mild_pts=5, moderate_pts=15, severe_pts=20)


def score_lung_cancer_risk(patient: PatientProfile) -> RuleEngineResult:
    """
    the weights assigned are only informed/inspired by real screening-guideline structure,
    not a literal ICMR figure.
    They are not validated clinical prediction coefficients
    and should not be interpreted as ICMR/WHO diagnostic or screening weights"""

    score = 0
    triggered_factors = []

    # 1. Age (demographic)
    age_pts, age_factor = _lung_age_weight(patient.age)
    if age_pts > 0:
        score += age_pts
    if age_factor:
        triggered_factors.append(age_factor)

    # 2. Persistent cough (symptom) - CAUTION: N (nagging cough)
    cough_pts = _cough_weight(patient.cough_duration_weeks)
    if cough_pts > 0:
        score += cough_pts
        triggered_factors.append("persistent_cough")

    # 3. Tobacco use / smoker (risk factor)
    if patient.is_current_smoker:
        score += 20
        triggered_factors.append("current_smoker")

    # 4. Family history (risk factor)
    if patient.has_family_history_lung_cancer:
        score += 10
        triggered_factors.append("family_history_lung_cancer")

    # 5. Occupational exposure (risk factor)
    if patient.has_occupational_exposure:
        score += 10
        triggered_factors.append("occupational_exposure")

    # 6. Hemoptysis (symptom) - coughing blood, major clinical red flag
    if patient.has_coughing_blood:
        score += 30
        triggered_factors.append("hemoptysis")

    # 7. Difficulty swallowing - CAUTION: I (indigestion/difficulty swallowing)
    if patient.has_difficulty_swallowing:
        score += 5  # less decisive but real signal per lung cancer
        triggered_factors.append("difficulty_swallowing")

    # 8. Neck swelling - CAUTION: T (thickening/lump) in neck
    if patient.has_neck_swelling:
        score += 5  # less decisive for lung cancer specifically
        triggered_factors.append("neck_swelling")

    # clamp
    score = max(0, min(score, 100))

    # tier
    if score <= 33:
        tier = RiskTier.LOW
    elif score <= 66:
        tier = RiskTier.MEDIUM
    else:
        tier = RiskTier.HIGH

    return RuleEngineResult(score=score, tier=tier, triggered_factors=triggered_factors)


# ============================================================================
# BREAST CANCER (NEW)
# ============================================================================

def _breast_age_weight(age: int) -> tuple[int, str]:
    """age weight modifier for breast cancer risk. Breast cancer incidence
    rises noticeably from ~40 onward, more so post-menopause (~50+)."""

    if age >= 60:
        return 20, "age_over_60"
    elif age >= 50:
        return 15, "age_over_50"
    elif age >= 40:
        return 10, "age_over_40"
    elif age >= 30:
        return 5, "age_over_30"
    else:
        return 0, None


def score_breast_cancer_risk(patient: PatientProfile) -> RuleEngineResult:
    """
    Same caveat as lung: weights below are informed by the general shape of
    ICMR/WHO breast screening guidance, not literal published coefficients.

    NOTE (named limitation, not a workaround): breast cancer can occur in
    any gender, though it's far less common in men. This v1 scoring does
    not apply a gender-based multiplier - all patients are scored on the
    same symptom/risk-factor basis. That's a simplification worth revisiting
    once real incidence-rate data is incorporated, not something we're
    silently patching around here.
    """

    score = 0
    triggered_factors = []

    # 1. Age (demographic)
    age_pts, age_factor = _breast_age_weight(patient.age)
    if age_pts > 0:
        score += age_pts
    if age_factor:
        triggered_factors.append(age_factor)

    # 2. Breast lump / thickening (symptom) - CAUTION: T (thickening/lump)
    # Weighted higher than a generic duration symptom since a lump is the
    # single most decisive presenting symptom for breast cancer.
    lump_pts = _duration_weight(patient.breast_lump_duration_weeks, mild_pts=10, moderate_pts=20, severe_pts=30)
    if patient.has_breast_lump and lump_pts > 0:
        score += lump_pts
        triggered_factors.append("breast_lump")
    elif patient.has_breast_lump:
        # lump reported but duration unknown/very recent - still worth a small flag
        score += 5
        triggered_factors.append("breast_lump")

    # 3. Nipple discharge (symptom) - CAUTION: U (unusual bleeding/discharge)
    if patient.has_nipple_discharge:
        score += 15
        triggered_factors.append("nipple_discharge")

    # 4. Skin/nipple changes - CAUTION: O (obvious change), e.g. dimpling, retraction
    if patient.has_breast_skin_changes:
        score += 15
        triggered_factors.append("breast_skin_changes")

    # 5. Family history (risk factor)
    if patient.has_family_history_breast_cancer:
        score += 15
        triggered_factors.append("family_history_breast_cancer")

    # clamp
    score = max(0, min(score, 100))

    # tier
    if score <= 33:
        tier = RiskTier.LOW
    elif score <= 66:
        tier = RiskTier.MEDIUM
    else:
        tier = RiskTier.HIGH

    return RuleEngineResult(score=score, tier=tier, triggered_factors=triggered_factors)


# ============================================================================
# ORAL CANCER (NEW)
# ============================================================================

def _oral_age_weight(age: int) -> tuple[int, str]:
    """age weight modifier for oral cancer risk. Risk climbs with age and
    with cumulative years of tobacco/areca-nut exposure."""

    if age >= 60:
        return 20, "age_over_60"
    elif age >= 50:
        return 15, "age_over_50"
    elif age >= 40:
        return 10, "age_over_40"
    elif age >= 30:
        return 5, "age_over_30"
    else:
        return 0, None


def score_oral_cancer_risk(patient: PatientProfile) -> RuleEngineResult:
    """
    Same caveat as lung/breast: illustrative weights, not literal ICMR figures.

    Oral cancer has the highest incidence of any cancer type in India per
    the tech report, driven heavily by tobacco chewing / gutka / paan (areca
    nut) use rather than smoking alone - so that's weighted as its own,
    separate factor here rather than folded into is_current_smoker.
    """

    score = 0
    triggered_factors = []

    # 1. Age (demographic)
    age_pts, age_factor = _oral_age_weight(patient.age)
    if age_pts > 0:
        score += age_pts
    if age_factor:
        triggered_factors.append(age_factor)

    # 2. Persistent mouth ulcer / sore - CAUTION: A (a sore that does not heal)
    ulcer_pts = _duration_weight(patient.mouth_ulcer_duration_weeks, mild_pts=10, moderate_pts=20, severe_pts=25)
    if patient.has_mouth_ulcer and ulcer_pts > 0:
        score += ulcer_pts
        triggered_factors.append("persistent_mouth_ulcer")
    elif patient.has_mouth_ulcer:
        score += 5
        triggered_factors.append("persistent_mouth_ulcer")

    # 3. Red or white patches (leukoplakia / erythroplakia) - early, often
    # painless warning sign, so weighted independently of the ulcer above.
    if patient.has_oral_red_white_patches:
        score += 20
        triggered_factors.append("oral_red_white_patches")

    # 4. Smokeless tobacco / gutka / paan (areca nut) - leading oral cancer
    # risk factor in India specifically (per tech report scope).
    if patient.uses_smokeless_tobacco:
        score += 25
        triggered_factors.append("smokeless_tobacco_use")

    # 5. Smoking (reused from the shared lifestyle fields)
    if patient.is_current_smoker:
        score += 15
        triggered_factors.append("current_smoker")

    # 6. Alcohol use - synergistic risk factor alongside tobacco for oral cancer
    if patient.is_alcohol_consuming:
        score += 10
        triggered_factors.append("alcohol_use")

    # 7. Difficulty swallowing - CAUTION: I (indigestion/difficulty swallowing)
    if patient.has_difficulty_swallowing:
        score += 10
        triggered_factors.append("difficulty_swallowing")

    # 8. Neck swelling - CAUTION: T (thickening/lump), possible lymph node involvement
    if patient.has_neck_swelling:
        score += 10
        triggered_factors.append("neck_swelling")

    # clamp
    score = max(0, min(score, 100))

    # tier
    if score <= 33:
        tier = RiskTier.LOW
    elif score <= 66:
        tier = RiskTier.MEDIUM
    else:
        tier = RiskTier.HIGH

    return RuleEngineResult(score=score, tier=tier, triggered_factors=triggered_factors)


# ============================================================================
# CERVICAL CANCER (NEW)
# ============================================================================

def _cervical_age_weight(age: int) -> tuple[int, str]:
    """age weight modifier for cervical cancer risk. WHO's recommended
    screening window is roughly ages 30-65, so risk weighting leans on
    being inside/past that window rather than a simple "older = riskier" curve."""

    if age >= 50:
        return 15, "age_over_50"
    elif age >= 30:
        return 10, "age_over_30"
    else:
        return 0, None


def score_cervical_cancer_risk(patient: PatientProfile) -> RuleEngineResult:
    """
    Same caveat as the other 3: illustrative weights, not literal ICMR figures.

    NOTE (named limitation, not a workaround): cervical cancer screening only
    applies to patients with a cervix. We only have `gender` to go on (no
    separate anatomy field), so:
      - Gender.FEMALE  -> scored normally below.
      - Gender.MALE    -> not applicable, returned as such (score=0, applicable=False).
      - Gender.OTHER   -> also returned as not applicable, rather than silently
                          assuming female anatomy. This is a deliberate, visible
                          simplification for v1 (matching the same "don't
                          silently default" principle already documented for
                          Gender.OTHER in the Layer 2 ML dataset) - a future
                          version should ask about anatomy directly instead of
                          inferring it from gender.
    """

    if patient.gender != Gender.FEMALE:
        return RuleEngineResult(
            score=0,
            tier=RiskTier.LOW,
            triggered_factors=["not_applicable_gender"],
            applicable=False,
        )

    score = 0
    triggered_factors = []

    # 1. Age / screening-window (demographic)
    age_pts, age_factor = _cervical_age_weight(patient.age)
    if age_pts > 0:
        score += age_pts
    if age_factor:
        triggered_factors.append(age_factor)

    # 2. Abnormal vaginal bleeding - CAUTION: U (unusual bleeding/discharge),
    # the single most decisive symptom per WHO cervical guidance.
    if patient.has_abnormal_vaginal_bleeding:
        score += 25
        triggered_factors.append("abnormal_vaginal_bleeding")

    # 3. Abnormal vaginal discharge
    if patient.has_abnormal_vaginal_discharge:
        score += 15
        triggered_factors.append("abnormal_vaginal_discharge")

    # 4. Persistent pelvic pain
    if patient.has_pelvic_pain:
        score += 10
        triggered_factors.append("pelvic_pain")

    # 5. HPV-positive status (if known) - primary causal risk factor
    if patient.is_hpv_positive:
        score += 20
        triggered_factors.append("hpv_positive")

    # 6. Screening overdue - early cervical changes are often symptom-free,
    # so being overdue for a Pap/HPV test is itself a risk-elevating factor.
    if patient.is_screening_overdue:
        score += 15
        triggered_factors.append("screening_overdue")

    # clamp
    score = max(0, min(score, 100))

    # tier
    if score <= 33:
        tier = RiskTier.LOW
    elif score <= 66:
        tier = RiskTier.MEDIUM
    else:
        tier = RiskTier.HIGH

    return RuleEngineResult(score=score, tier=tier, triggered_factors=triggered_factors)


# ============================================================================
# DISPATCHER
# ============================================================================

def score_all_cancer_risks(patient: PatientProfile) -> dict[str, RuleEngineResult]:
    """
    Runs all 4 cancer-specific rule engines against a single shared patient
    profile. This is the main entry point main.py (and, downstream, the ML
    and RAG/LLM layers) should call to get the full risk picture for a patient
    in one go, keyed by CancerType.value ("lung", "breast", "oral", "cervical").
    """
    return {
        CancerType.LUNG.value: score_lung_cancer_risk(patient),
        CancerType.BREAST.value: score_breast_cancer_risk(patient),
        CancerType.ORAL.value: score_oral_cancer_risk(patient),
        CancerType.CERVICAL.value: score_cervical_cancer_risk(patient),
    }


if __name__ == "__main__":
    # Small self-test / demo. Run with: python -m brain.rule_engine
    # (or `python brain/rule_engine.py` directly - the sys.path shim at the
    # top of this file makes both work).

    lung_patient = PatientProfile(
        age=64,
        gender=Gender.MALE,
        is_current_smoker=True,
        cough_duration_weeks=4,
        has_family_history_lung_cancer=True,
        has_occupational_exposure=True,
    )
    print("Lung:", score_lung_cancer_risk(lung_patient))

    breast_patient = PatientProfile(
        age=52,
        gender=Gender.FEMALE,
        has_breast_lump=True,
        breast_lump_duration_weeks=5,
        has_nipple_discharge=True,
        has_family_history_breast_cancer=True,
    )
    print("Breast:", score_breast_cancer_risk(breast_patient))

    oral_patient = PatientProfile(
        age=48,
        gender=Gender.MALE,
        has_mouth_ulcer=True,
        mouth_ulcer_duration_weeks=5,
        uses_smokeless_tobacco=True,
        is_alcohol_consuming=True,
    )
    print("Oral:", score_oral_cancer_risk(oral_patient))

    cervical_patient = PatientProfile(
        age=42,
        gender=Gender.FEMALE,
        has_abnormal_vaginal_bleeding=True,
        is_hpv_positive=True,
    )
    print("Cervical:", score_cervical_cancer_risk(cervical_patient))

    cervical_na_patient = PatientProfile(age=42, gender=Gender.MALE)
    print("Cervical (male, N/A case):", score_cervical_cancer_risk(cervical_na_patient))

    print("\nAll 4 at once via dispatcher, using the lung_patient profile:")
    for cancer_type, result in score_all_cancer_risks(lung_patient).items():
        print(f"  {cancer_type}: {result}")
