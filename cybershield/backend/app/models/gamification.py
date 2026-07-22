"""
MongoDB document models for gamification (Module 7.5).

Collections:
  activity_log   - per-user timeline of learning events (spec Step 16)
  learning_goals - user-defined goals with automatic tracking (spec Step 17)
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId


def new_id() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def activity_document(
    user_id: str, activity_type: str, description: str, xp: int = 0, meta: dict = None
) -> dict:
    return {
        "_id": new_id(),
        "user_id": user_id,
        "activity_type": activity_type,  # quiz | owasp_lab | badge | glossary | threat | certificate | level_up
        "description": description,
        "xp": xp,
        "meta": meta or {},
        "created_at": utcnow(),
    }


def learning_goal_document(
    user_id: str,
    goal_type: str,
    target: int,
    period: str = "weekly",  # daily | weekly
) -> dict:
    return {
        "_id": new_id(),
        "user_id": user_id,
        "goal_type": goal_type,  # quizzes | glossary_terms | owasp_labs
        "target": target,
        "period": period,
        "current": 0,
        "completed": False,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }


def to_object_id(value: str) -> Optional[ObjectId]:
    try:
        return ObjectId(value)
    except Exception:
        return None
