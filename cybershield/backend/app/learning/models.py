"""
MongoDB document models for AI Learning Recommendations (Module E2).

Collections:
  learning_recommendations — stores generated recommendations per user/scan
  user_learning_progress   — tracks completed topics and completion percentage
"""
from datetime import datetime, timezone


def recommendation_document(
    user_id: str,
    scan_id: str,
    recommendations: list,
) -> dict:
    """Create a learning recommendations document."""
    return {
        "user_id": user_id,
        "scan_id": scan_id,
        "recommendations": recommendations,
        "created_at": datetime.now(timezone.utc),
    }


def learning_progress_document(
    user_id: str,
    completed: list = None,
    percentage: float = 0.0,
) -> dict:
    """Create or update a learning progress document."""
    return {
        "user_id": user_id,
        "completed": completed or [],
        "percentage": percentage,
        "updated_at": datetime.now(timezone.utc),
    }
