from dataclasses import dataclass
from schemas import RiskTier, CancerType
from brain.rule_engine import RuleEngineResult


@dataclass
class Layer2Result:
    probability: float | None
    tier: RiskTier
    top_factors: list[str]
    protective_factors: list[str]
    model_available: bool = True


# ============================================================================
# Empty right now — no datasets sourced or models trained yet. Once one is
# ready: (1) drop the .json into /models, (2) add its line here, (3) write a
# _<cancer>_patient_to_row() + register it in _ROW_BUILDERS. Nothing else in
# this file, or in main.py, needs to change.
# ============================================================================
_MODEL_REGISTRY: dict[CancerType, str] = {}
_ROW_BUILDERS = {}
_models: dict = {}
_explainers: dict = {}


def predict_ml_risk(patient, rule_result: RuleEngineResult, cancer_type: CancerType) -> Layer2Result:
    """Every cancer type falls through to this placeholder until its model is
    trained — same graceful-degradation contract as oral will keep even after
    lung/breast/cervical get real models. main.py and Layer 3 already know
    how to handle model_available=False; nothing downstream needs to change
    as models come online."""
    if cancer_type not in _models:
        return Layer2Result(probability=None, tier=rule_result.tier,
                             top_factors=[], protective_factors=[], model_available=False)
    # real prediction path goes here once a model is registered