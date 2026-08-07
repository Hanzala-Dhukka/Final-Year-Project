"""
Intelligent Scoring Service (Module SC4).

Converts checklist task completion into a risk-weighted security posture
measurement, rather than a simple completed/total count.

Risk Weight System:
  Critical → 20 points
  High     → 10 points
  Medium   →  5 points
  Low      →  2 points

Score = (reduced_risk / total_risk) * 100
"""

from collections import defaultdict
from datetime import datetime
from typing import List, Optional

from app.database.db import database
from app.models.checklist_model import RISK_WEIGHTS, get_risk_weight

POSTURE_COLLECTION = "security_posture"


# ── Core Calculations ─────────────────────────────────────────────────────────

def calculate_security_score(tasks: List[dict]) -> dict:
    """
    Calculate the risk-weighted security score for a list of tasks.

    Args:
        tasks: list of dicts with 'severity' and 'status' keys

    Returns:
        dict with score, total_risk, risk_reduced, risk_remaining
    """
    total_risk = 0
    reduced_risk = 0

    for task in tasks:
        weight = get_risk_weight(task.get("severity", "Medium"))
        total_risk += weight
        if task.get("status") == "completed":
            reduced_risk += weight

    score = round((reduced_risk / total_risk) * 100, 2) if total_risk > 0 else 0.0
    risk_remaining = total_risk - reduced_risk

    return {
        "score": score,
        "total_risk": total_risk,
        "risk_reduced": reduced_risk,
        "risk_remaining": risk_remaining,
    }


def category_scores(tasks: List[dict]) -> dict:
    """
    Calculate risk-weighted security score per category.

    Args:
        tasks: list of dicts with 'category', 'severity', 'status'

    Returns:
        dict mapping category name → score (0-100)
    """
    categories = defaultdict(lambda: {"total": 0, "completed": 0})

    for task in tasks:
        cat = task.get("category", "Unknown")
        weight = get_risk_weight(task.get("severity", "Medium"))
        categories[cat]["total"] += weight
        if task.get("status") == "completed":
            categories[cat]["completed"] += weight

    result = {}
    for cat, data in categories.items():
        if data["total"] > 0:
            result[cat] = round((data["completed"] / data["total"]) * 100, 2)
        else:
            result[cat] = 0.0

    return result


def security_level(score: float) -> str:
    """
    Convert a numeric security score into a human-readable level.

    90+ → Excellent
    75+ → Good
    50+ → Moderate
    <50 → Critical
    """
    if score >= 90:
        return "Excellent"
    elif score >= 75:
        return "Good"
    elif score >= 50:
        return "Moderate"
    else:
        return "Critical"


def category_security_level(score: float) -> str:
    """Convert a category score into a security level."""
    if score >= 80:
        return "Strong"
    elif score >= 60:
        return "Adequate"
    elif score >= 40:
        return "Weak"
    else:
        return "Critical"


# ── Full Posture Calculation ──────────────────────────────────────────────────

def calculate_posture(tasks: List[dict]) -> dict:
    """
    Calculate the complete security posture from checklist tasks.

    Args:
        tasks: list of task dicts from get_user_progress()

    Returns:
        full posture dict with score, level, categories, risk info
    """
    score_data = calculate_security_score(tasks)
    cats = category_scores(tasks)
    level = security_level(score_data["score"])

    # Build detailed category breakdown
    category_details = []
    for cat_name, cat_score in cats.items():
        category_details.append({
            "category": cat_name,
            "score": cat_score,
            "level": category_security_level(cat_score),
            "risk_weight": RISK_WEIGHTS.get(cat_name, 5),
        })

    # Find weak categories (below 50%)
    weak_categories = [c["category"] for c in category_details if c["score"] < 50]

    # Count completed tasks with severity breakdown
    completed_by_severity = {}
    total_by_severity = {}
    for task in tasks:
        sev = task.get("severity", "Medium")
        total_by_severity[sev] = total_by_severity.get(sev, 0) + 1
        if task.get("status") == "completed":
            completed_by_severity[sev] = completed_by_severity.get(sev, 0) + 1

    return {
        "score": score_data["score"],
        "level": level,
        "total_risk": score_data["total_risk"],
        "risk_reduced": score_data["risk_reduced"],
        "risk_remaining": score_data["risk_remaining"],
        "categories": cats,
        "category_details": category_details,
        "weak_categories": weak_categories,
        "completed_tasks": sum(1 for t in tasks if t.get("status") == "completed"),
        "total_tasks": len(tasks),
        "completed_by_severity": completed_by_severity,
        "total_by_severity": total_by_severity,
    }


# ── MongoDB Persistence ───────────────────────────────────────────────────────

async def save_posture_snapshot(user_id: str, project_id: str, posture: dict) -> None:
    """Save a posture snapshot to MongoDB for history tracking."""
    snapshot = {
        "user_id": str(user_id),
        "project_id": str(project_id),
        "security_score": posture["score"],
        "security_level": posture["level"],
        "risk_reduced": posture["risk_reduced"],
        "risk_remaining": posture["risk_remaining"],
        "categories": posture["categories"],
        "weak_categories": posture["weak_categories"],
        "created_at": datetime.utcnow(),
    }
    await database[POSTURE_COLLECTION].insert_one(snapshot)


async def get_posture_history(user_id: str, project_id: str, limit: int = 30) -> List[dict]:
    """Get historical posture snapshots for trend analysis."""
    cursor = database[POSTURE_COLLECTION].find(
        {"user_id": str(user_id), "project_id": str(project_id)}
    ).sort("created_at", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    for doc in docs:
        doc["_id"] = str(doc["_id"])
        if isinstance(doc.get("created_at"), datetime):
            doc["created_at"] = doc["created_at"].isoformat()
    return docs
