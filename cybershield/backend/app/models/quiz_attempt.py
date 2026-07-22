"""
MongoDB document model for a finished quiz attempt (Module 7.2).

Collection: quiz_attempts
"""
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId


def utcnow() -> datetime:
    """Timezone-aware UTC datetime for consistent storage."""
    return datetime.now(timezone.utc)


def quiz_attempt_document(
    user_id: str,
    session_id: str,
    difficulty: str,
    category: str,
    technology: str,
    score: int,
    total: int,
    correct: int,
    incorrect: int,
    percentage: int,
    results: list,
    recommendations: list,
    xp_earned: int,
    project_id: str = None,
) -> dict:
    """
    Build a `quiz_attempts` document.

    Args:
        user_id: Owner id.
        session_id: Parent quiz session id.
        score/total/correct/incorrect/percentage: Results.
        results: Per-question result breakdown.
        recommendations: AI-generated study recommendations.
        xp_earned: XP awarded for this attempt.

    Returns:
        A dict ready to insert into MongoDB.
    """
    return {
        "_id": str(ObjectId()),
        "user_id": user_id,
        "session_id": session_id,
        "project_id": project_id,
        "difficulty": difficulty,
        "category": category,
        "technology": technology,
        "score": score,
        "total": total,
        "correct": correct,
        "incorrect": incorrect,
        "percentage": percentage,
        "results": results,
        "recommendations": recommendations,
        "xp_earned": xp_earned,
        "created_at": utcnow(),
    }
