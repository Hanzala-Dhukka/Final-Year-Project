"""
Learning Goal service (Module 7.5, spec Step 17).

Users set goals (e.g. 5 quizzes/week, 10 glossary terms/day, 1 OWASP lab/day).
Progress is tracked automatically from activity: the service counts matching
events within the current period and marks the goal complete.
"""
from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta

from app.database.db import database
from app.models.gamification import learning_goal_document
from app.schemas.achievement_schema import LearningGoalOut

GOALS = "learning_goals"
ACTIVITY = "activity_log"

PERIOD_DAYS = {"daily": 1, "weekly": 7}


async def list_goals(user_id: str) -> List[Dict[str, Any]]:
    cursor = database[GOALS].find({"user_id": user_id}).sort("created_at", -1)
    out = []
    async for g in cursor:
        out.append(await _enrich(g))
    return out


async def create_goal(user_id: str, payload) -> Dict[str, Any]:
    doc = learning_goal_document(
        user_id=user_id,
        goal_type=payload.goal_type,
        target=payload.target,
        period=payload.period,
    )
    await database[GOALS].insert_one(doc)
    return await _enrich(doc)


async def _enrich(goal: Dict[str, Any]) -> Dict[str, Any]:
    """Count matching activity since the period start and update progress."""
    goal_type = goal.get("goal_type")
    # Map goal type -> activity_type in the activity log
    activity_map = {
        "quizzes": "quiz",
        "glossary_terms": "glossary",
        "owasp_labs": "owasp_lab",
    }
    atype = activity_map.get(goal_type, goal_type)
    days = PERIOD_DAYS.get(goal.get("period", "weekly"), 7)
    since = datetime.now(timezone.utc) - timedelta(days=days)

    current = 0
    try:
        current = await database[ACTIVITY].count_documents({
            "user_id": goal["user_id"],
            "activity_type": atype,
            "created_at": {"$gte": since},
        })
    except Exception:
        current = 0

    target = goal.get("target", 0)
    completed = current >= target

    # Persist current/completed
    try:
        await database[GOALS].update_one(
            {"_id": goal["_id"]},
            {"$set": {"current": current, "completed": completed, "updated_at": datetime.now(timezone.utc)}},
        )
    except Exception:
        pass

    return {
        "id": str(goal["_id"]),
        "goal_type": goal_type,
        "target": target,
        "period": goal.get("period", "weekly"),
        "current": current,
        "completed": completed,
    }
