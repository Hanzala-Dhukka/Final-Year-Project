"""
Score Tracker Service (Module SC5).

Tracks security score improvements over time:
  - Records score snapshots with reasons (which task was completed)
  - Provides before/after comparisons
  - Feeds dashboard and reporting widgets

Uses a dedicated `checklist_score_history` collection (separate from
the scanner's `security_score_history` to keep concerns isolated).
"""

from datetime import datetime
from typing import List, Optional

from app.database.db import database
from app.services.scoring_service import calculate_security_score, security_level

SCORE_HISTORY_COLLECTION = "checklist_score_history"


async def record_score_snapshot(
    user_id: str,
    project_id: str,
    score: float,
    risk_reduced: int = 0,
    risk_remaining: int = 0,
    reason: str = "",
    task_title: str = "",
    task_severity: str = "",
) -> dict:
    """Save a score snapshot to history."""
    doc = {
        "user_id": str(user_id),
        "project_id": str(project_id),
        "score": round(score, 2),
        "level": security_level(score),
        "risk_reduced": risk_reduced,
        "risk_remaining": risk_remaining,
        "reason": reason,
        "task_title": task_title,
        "task_severity": task_severity,
        "created_at": datetime.utcnow(),
    }
    await database[SCORE_HISTORY_COLLECTION].insert_one(doc)
    return doc


async def get_score_history(
    user_id: str,
    project_id: str,
    limit: int = 30,
) -> List[dict]:
    """Get score history for a project, newest first."""
    cursor = database[SCORE_HISTORY_COLLECTION].find(
        {"user_id": str(user_id), "project_id": str(project_id)}
    ).sort("created_at", -1).limit(limit)

    docs = await cursor.to_list(length=limit)
    for doc in docs:
        doc["_id"] = str(doc["_id"])
        if isinstance(doc.get("created_at"), datetime):
            doc["created_at"] = doc["created_at"].isoformat()
    return docs


async def get_improvement_summary(
    user_id: str,
    project_id: str,
) -> dict:
    """
    Get a before/after improvement summary.

    Compares the earliest score snapshot with the latest.
    """
    history = await get_score_history(user_id, project_id, limit=100)

    if len(history) < 2:
        return {
            "has_data": False,
            "old_score": 0,
            "new_score": 0,
            "improvement": 0,
            "tasks_completed": 0,
            "history_count": len(history),
        }

    # Newest first, so index 0 = latest, index -1 = earliest
    latest = history[0]
    earliest = history[-1]

    improvement = round(latest["score"] - earliest["score"], 2)
    tasks_completed = sum(1 for h in history if h.get("reason") == "Task Completed")

    return {
        "has_data": True,
        "old_score": earliest["score"],
        "old_level": earliest.get("level", "Critical"),
        "new_score": latest["score"],
        "new_level": latest.get("level", "Critical"),
        "improvement": improvement,
        "tasks_completed": tasks_completed,
        "history_count": len(history),
    }


async def track_task_completion(
    user_id: str,
    project_id: str,
    tasks: List[dict],
    completed_task: Optional[dict] = None,
) -> Optional[dict]:
    """
    Record a score snapshot after a task is completed.

    Called by the toggle endpoint to track score changes.

    Args:
        user_id, project_id: identifiers
        tasks: full task list (for recalculation)
        completed_task: the task that was just completed (optional)

    Returns:
        snapshot dict if recorded, None if no change
    """
    score_data = calculate_security_score(tasks)
    reason = "Task Completed" if completed_task else "Score Recalculated"
    task_title = completed_task.get("title", "") if completed_task else ""
    task_severity = completed_task.get("severity", "") if completed_task else ""

    return await record_score_snapshot(
        user_id=user_id,
        project_id=project_id,
        score=score_data["score"],
        risk_reduced=score_data["risk_reduced"],
        risk_remaining=score_data["risk_remaining"],
        reason=reason,
        task_title=task_title,
        task_severity=task_severity,
    )
