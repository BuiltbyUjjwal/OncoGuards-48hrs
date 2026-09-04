import sqlite3
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Database path in brain directory
DB_PATH = Path(__file__).resolve().parent / "oncoguard.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """
    Initializes the SQLite database with assessments and followups tables.
    Includes index for fast longitudinal patient queries.
    """
    conn = get_connection()
    try:
        with conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS assessments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    patient_id TEXT NOT NULL,
                    cancer_type TEXT NOT NULL,
                    overall_tier TEXT NOT NULL,
                    rule_score INTEGER NOT NULL,
                    triggered_factors TEXT NOT NULL,
                    ml_probability REAL,
                    created_at TEXT NOT NULL,
                    followup_status TEXT DEFAULT 'no_followup'
                )
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_assessments_patient_cancer_time 
                ON assessments(patient_id, cancer_type, created_at)
            """)
    finally:
        conn.close()


def save_assessment(
    patient_id: str,
    cancer_type: str,
    overall_tier: str,
    rule_score: int,
    triggered_factors: list[str],
    ml_probability: float | None = None,
    created_at: str | None = None,
    followup_status: str = "no_followup",
) -> int:
    """
    Saves a single cancer type assessment record to the database.
    """
    if created_at is None:
        created_at = datetime.now(timezone.utc).isoformat()

    factors_json = json.dumps(triggered_factors)

    conn = get_connection()
    try:
        with conn:
            cursor = conn.execute(
                """
                INSERT INTO assessments 
                (patient_id, cancer_type, overall_tier, rule_score, triggered_factors, ml_probability, created_at, followup_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    patient_id,
                    cancer_type.lower(),
                    overall_tier.upper(),
                    rule_score,
                    factors_json,
                    ml_probability,
                    created_at,
                    followup_status,
                ),
            )
            return cursor.lastrowid
    finally:
        conn.close()


def get_history(
    patient_id: str,
    cancer_type: str | None = None,
    limit: int = 50,
) -> list[dict]:
    """
    Retrieves chronological assessment history for a patient (newest first).
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        if cancer_type:
            cursor.execute(
                """
                SELECT id, patient_id, cancer_type, overall_tier, rule_score, 
                       triggered_factors, ml_probability, created_at, followup_status
                FROM assessments
                WHERE patient_id = ? AND cancer_type = ?
                ORDER BY created_at DESC, id DESC
                LIMIT ?
                """,
                (patient_id, cancer_type.lower(), limit),
            )
        else:
            cursor.execute(
                """
                SELECT id, patient_id, cancer_type, overall_tier, rule_score, 
                       triggered_factors, ml_probability, created_at, followup_status
                FROM assessments
                WHERE patient_id = ?
                ORDER BY created_at DESC, id DESC
                LIMIT ?
                """,
                (patient_id, limit),
            )

        rows = cursor.fetchall()
        results = []
        for r in rows:
            try:
                factors = json.loads(r["triggered_factors"])
            except Exception:
                factors = []
            
            results.append({
                "id": r["id"],
                "patient_id": r["patient_id"],
                "cancer_type": r["cancer_type"],
                "overall_tier": r["overall_tier"],
                "rule_score": r["rule_score"],
                "triggered_factors": factors,
                "ml_probability": r["ml_probability"],
                "created_at": r["created_at"],
                "followup_status": r["followup_status"] or "no_followup",
            })
        return results
    finally:
        conn.close()


def check_escalation(
    patient_id: str,
    cancer_type: str,
    window_days: int = 21,
    threshold: int = 3,
) -> dict:
    """
    Checks if any triggered clinical factor has appeared >= `threshold` times
    for the given patient and cancer type within the last `window_days` days.

    Returns:
      {
        "triggered": bool,
        "factor": str | None,
        "occurrences": int,
        "window_days": int
      }
    """
    cutoff_time = (datetime.now(timezone.utc) - timedelta(days=window_days)).isoformat()

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT triggered_factors
            FROM assessments
            WHERE patient_id = ? 
              AND cancer_type = ? 
              AND created_at >= ?
            ORDER BY created_at DESC
            """,
            (patient_id, cancer_type.lower(), cutoff_time),
        )
        rows = cursor.fetchall()

        factor_counts: dict[str, int] = {}
        for r in rows:
            try:
                factors = json.loads(r["triggered_factors"])
                for f in set(factors):  # count once per assessment
                    factor_counts[f] = factor_counts.get(f, 0) + 1
            except Exception:
                continue

        # Check for factor meeting or exceeding threshold
        escalated_factor = None
        max_occurrences = 0
        for factor, count in factor_counts.items():
            if count > max_occurrences:
                max_occurrences = count
            if count >= threshold and escalated_factor is None:
                escalated_factor = factor

        if escalated_factor:
            return {
                "triggered": True,
                "factor": escalated_factor,
                "occurrences": factor_counts[escalated_factor],
                "window_days": window_days,
            }

        return {
            "triggered": False,
            "factor": None,
            "occurrences": max_occurrences,
            "window_days": window_days,
        }
    finally:
        conn.close()


def update_followup_status(assessment_id: int, status: str) -> bool:
    """
    Updates the follow-up status for a specific assessment record.
    Allowed statuses: 'no_followup', 'pending', 'completed'.
    """
    conn = get_connection()
    try:
        with conn:
            cursor = conn.execute(
                "UPDATE assessments SET followup_status = ? WHERE id = ?",
                (status, assessment_id),
            )
            return cursor.rowcount > 0
    finally:
        conn.close()
