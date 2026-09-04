"""
Comprehensive Test Suite for OncoGuard / Onco48hr
Tests 3-Layer Pipeline, SQLite Persistence, 21-Day Follow-Up Escalation, and FastAPI Endpoints.
"""

import os
import sys
import unittest
from datetime import datetime, timedelta, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from schemas import PatientProfile, Gender, CancerType, RiskTier
from brain.db import (
    init_db,
    save_assessment,
    get_history,
    check_escalation,
    update_followup_status,
)
from brain.rule_engine import score_lung_cancer_risk
from brain.ml_layer import predict_ml_risk
from brain.rag_llm_layer import generate_guidance


class TestOncoGuardDB(unittest.TestCase):
    """Test SQLite Database operations and 21-Day Escalation logic."""

    def setUp(self):
        init_db()

    def test_save_and_retrieve_history(self):
        test_pid = "test_unit_patient_001"
        rec_id = save_assessment(
            patient_id=test_pid,
            cancer_type="lung",
            overall_tier="tier 3",
            rule_score=45,
            triggered_factors=["has_coughing_blood", "cough_duration_weeks"],
            ml_probability=0.78,
            followup_status="pending"
        )
        self.assertIsInstance(rec_id, int)
        self.assertGreater(rec_id, 0)

        history = get_history(test_pid)
        self.assertGreaterEqual(len(history), 1)
        found = any(h["id"] == rec_id for h in history)
        self.assertTrue(found)
        first = [h for h in history if h["id"] == rec_id][0]
        self.assertEqual(first["cancer_type"], "lung")
        self.assertEqual(first["overall_tier"], "TIER 3")
        self.assertIn("has_coughing_blood", first["triggered_factors"])

    def test_update_followup_status(self):
        test_pid = "test_unit_patient_002"
        rec_id = save_assessment(
            patient_id=test_pid,
            cancer_type="breast",
            overall_tier="medium",
            rule_score=30,
            triggered_factors=["has_breast_lump"],
            ml_probability=0.62,
            followup_status="pending"
        )
        # Update to completed
        success = update_followup_status(rec_id, "completed")
        self.assertTrue(success)

        history = get_history(test_pid)
        record = [h for h in history if h["id"] == rec_id][0]
        self.assertEqual(record["followup_status"], "completed")

    def test_21_day_escalation_detection(self):
        import uuid
        test_pid = f"test_esc_{uuid.uuid4().hex[:8]}"
        # 1st occurrence: 10 days ago
        d1 = (datetime.now(timezone.utc) - timedelta(days=10)).isoformat()
        save_assessment(test_pid, "lung", "medium", 30, ["cough_duration_weeks"], 0.45, created_at=d1)

        # 2nd occurrence: 5 days ago
        d2 = (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
        save_assessment(test_pid, "lung", "medium", 30, ["cough_duration_weeks"], 0.50, created_at=d2)

        # Check before 3rd: should NOT escalate yet (occurrences = 2 < 3)
        esc_before = check_escalation(test_pid, "lung")
        self.assertFalse(esc_before["triggered"])
        self.assertEqual(esc_before["occurrences"], 2)

        # 3rd occurrence: today
        d3 = datetime.now(timezone.utc).isoformat()
        save_assessment(test_pid, "lung", "high", 45, ["cough_duration_weeks"], 0.85, created_at=d3)
        
        esc_after = check_escalation(test_pid, "lung")
        self.assertTrue(esc_after["triggered"])
        self.assertEqual(esc_after["factor"], "cough_duration_weeks")
        self.assertEqual(esc_after["occurrences"], 3)


class TestOncoGuardThreeLayerPipeline(unittest.TestCase):
    """Test Layer 1 Rule Engine, Layer 2 ML Model, and Layer 3 Grounded RAG."""

    def test_layer1_rule_engine_lung(self):
        profile = PatientProfile(
            age=62,
            gender=Gender.MALE,
            is_current_smoker=True,
            cough_duration_weeks=6,
            has_coughing_blood=True,
            has_neck_swelling=True
        )
        rule_result = score_lung_cancer_risk(profile)
        self.assertIn(rule_result.tier, [RiskTier.MEDIUM, RiskTier.HIGH])
        self.assertGreaterEqual(rule_result.score, 30)
        self.assertTrue(rule_result.applicable)

    def test_layer2_ml_prediction(self):
        profile = PatientProfile(
            age=62,
            gender=Gender.MALE,
            is_current_smoker=True,
            cough_duration_weeks=6,
            lung_coughing_blood_severity=7,
            lung_smoking_severity=8
        )
        ml_result = predict_ml_risk(profile, CancerType.LUNG)
        self.assertIsNotNone(ml_result.probability)
        self.assertIn(ml_result.tier, [RiskTier.LOW, RiskTier.MEDIUM, RiskTier.HIGH])
        self.assertIsInstance(ml_result.top_factors, list)

    def test_layer3_rag_generation(self):
        profile = PatientProfile(
            age=62,
            gender=Gender.MALE,
            is_current_smoker=True,
            cough_duration_weeks=6,
            has_coughing_blood=True
        )
        rule_res = score_lung_cancer_risk(profile)
        ml_res = predict_ml_risk(profile, CancerType.LUNG)
        rag_output = generate_guidance(
            rule_result=rule_res,
            ml_result=ml_res,
            cancer_type=CancerType.LUNG
        )
        self.assertIsNotNone(rag_output)
        self.assertTrue(len(rag_output.guidance_text) > 0)
        self.assertIsInstance(rag_output.recommended_actions, list)


class TestFastAPIEndpoints(unittest.TestCase):
    """Test full FastAPI application endpoints."""

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_check(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("status", data)
        self.assertEqual(data["status"], "online")

    def test_assessment_endpoint(self):
        payload = {
            "patient_id": "test_api_patient_100",
            "age": 55,
            "gender": "female",
            "has_breast_lump": True,
            "breast_lump_duration_weeks": 4,
            "has_breast_skin_changes": True
        }
        res = self.client.post("/api/v1/assessment", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertIn("breast", data)
        breast_res = data["breast"]
        self.assertIn("layer1", breast_res)
        self.assertIn("layer2", breast_res)
        self.assertIn("layer3", breast_res)
        self.assertIn("overall_tier", breast_res)
        self.assertIn("escalation", breast_res)

    def test_history_and_followup_flow(self):
        pid = "test_history_flow_patient"
        payload = {
            "patient_id": pid,
            "age": 32,
            "gender": "female",
            "cervical_hpv_positive": True,
            "cervical_post_coital_bleeding": True,
            "cervical_screening_overdue": True
        }
        # Run assessment
        post_res = self.client.post("/api/v1/assessment", json=payload)
        self.assertEqual(post_res.status_code, 200)

        # Retrieve history
        get_res = self.client.get(f"/api/v1/history/{pid}")
        self.assertEqual(get_res.status_code, 200)
        history = get_res.json()
        self.assertIsInstance(history, list)
        self.assertGreaterEqual(len(history), 1)
        record_id = history[0]["id"]

        # Update followup status
        update_res = self.client.post("/api/v1/followup/update", json={
            "assessment_id": record_id,
            "status": "completed"
        })
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.json()["status"], "success")

    def test_chat_endpoint(self):
        payload = {
            "messages": [
                {"role": "user", "content": "What are the common screening guidelines for breast cancer?"}
            ],
            "cancer_type": "breast"
        }
        res = self.client.post("/api/v1/chat", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("reply", data)
        self.assertIn("retrieved_sources", data)
        self.assertTrue(len(data["reply"]) > 0)


if __name__ == "__main__":
    unittest.main()
