"""
Onboarding service — handles first-time user setup persistence.

Stores the personalization collected during the onboarding wizard:
profile (name/avatar/bio), skill level, and learning goals. Completing
onboarding flips ``first_login`` to False so the user is sent straight to
the dashboard on subsequent logins.
"""
from typing import Optional, List, Dict, Any

from app.repositories.user_repository import user_repository

# Allowed skill levels (validated upstream by the route schema as well).
SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Professional"]

# Supported learning-goal options (kept in sync with the frontend list).
LEARNING_GOALS = [
    "Secure Coding",
    "OWASP",
    "API Security",
    "DevSecOps",
    "Cloud Security",
    "Threat Modeling",
    "Pen Testing",
    "GitHub Security",
    "Linux Security",
    "AI Security",
    "Compliance",
]


async def get_onboarding_status(user: Dict[str, Any]) -> Dict[str, Any]:
    """
    Return the current onboarding state for the authenticated user.

    Args:
        user: User document from the JWT (provided by get_current_user)

    Returns:
        Dictionary with first_login, profile flags, skill level, goals, etc.
    """
    return {
        "first_login": user.get("first_login", False),
        "profile_completed": user.get("profile_completed", False),
        "dashboard_tour_completed": user.get("dashboard_tour_completed", False),
        "skill_level": user.get("skill_level", ""),
        "learning_goals": user.get("learning_goals", []),
        "name": user.get("name", ""),
        "avatar": user.get("avatar", ""),
        "bio": user.get("bio", ""),
    }


async def complete_onboarding(user: Dict[str, Any], data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Persist the onboarding results and mark onboarding as finished.

    Args:
        user: User document from the JWT
        data: Validated payload (name, avatar, bio, skill_level, learning_goals)

    Returns:
        Success message
    """
    user_id = str(user["_id"])

    update_data = {
        # Onboarding is now complete
        "profile_completed": True,
        "first_login": False,
        "dashboard_tour_completed": True,
        # Personalization
        "skill_level": data.get("skill_level", "") or "",
        "learning_goals": data.get("learning_goals", []) or [],
        "avatar": data.get("avatar") or "",
        "bio": data.get("bio") or "",
        "name": data.get("name") or user.get("name", ""),
    }

    success = await user_repository.update_user(user_id, update_data)
    if not success:
        raise Exception("Failed to save onboarding preferences")

    return {"message": "Onboarding completed"}


async def skip_onboarding(user: Dict[str, Any]) -> Dict[str, Any]:
    """
    Skip the onboarding flow entirely (user opts out).

    Args:
        user: User document from the JWT

    Returns:
        Success message
    """
    user_id = str(user["_id"])

    success = await user_repository.update_user(user_id, {
        "first_login": False,
        "dashboard_tour_completed": True,
    })
    if not success:
        raise Exception("Failed to skip onboarding")

    return {"message": "Onboarding skipped"}
