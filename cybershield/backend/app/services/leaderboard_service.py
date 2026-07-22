"""
Leaderboard service (Module 7.2, spec Step 18).

Aggregates XP from the user_progress collection and joins it with user
profile data (name, level, last active, quizzes completed, average score).
Sorted by XP descending with pagination.
"""
from typing import List, Dict, Any, Optional

from app.database.db import database


async def get_leaderboard(limit: int = 20, skip: int = 0) -> List[Dict[str, Any]]:
    """
    Return the top users by XP.

    Args:
        limit: Max entries to return.
        skip: Pagination offset.

    Returns:
        List of leaderboard entries (rank derived from position).
    """
    cursor = (
        database["user_progress"]
        .find({})
        .sort("xp", -1)
        .skip(skip)
        .limit(limit)
    )

    entries = []
    async for prog in cursor:
        user_id = str(prog.get("user_id") or prog.get("_id"))
        # Join with users collection for display name
        name = await _user_name(user_id)
        avg_score = prog.get("average_score", 0.0) or 0.0
        entries.append({
            "user_id": user_id,
            "name": name,
            "xp": prog.get("xp", 0) or 0,
            "average_score": round(float(avg_score), 1),
            "quizzes_completed": int(prog.get("quizzes_completed", 0) or 0),
            "level": prog.get("level", 1) or 1,
            "last_active": _iso(prog.get("last_login")),
        })

    # quizzes_completed may not be stored on user_progress; count attempts
    user_ids = [e["user_id"] for e in entries]
    quiz_counts = await _quiz_counts(user_ids)
    for e in entries:
        e["quizzes_completed"] = quiz_counts.get(e["user_id"], e["quizzes_completed"])

    # Assign 1-based ranks (respecting skip offset)
    for i, e in enumerate(entries):
        e["rank"] = skip + i + 1

    return entries


async def _user_name(user_id: str) -> str:
    try:
        user = await database["users"].find_one({"_id": user_id})
        if user:
            return user.get("full_name") or user.get("username") or user.get("email", "Unknown")
    except Exception:
        pass
    return "Unknown"


async def _quiz_counts(user_ids: List[str]) -> Dict[str, int]:
    counts: Dict[str, int] = {}
    if not user_ids:
        return counts
    try:
        pipeline = [
            {"$match": {"user_id": {"$in": user_ids}}},
            {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
        ]
        async for row in database["quiz_attempts"].aggregate(pipeline):
            counts[row["_id"]] = row.get("count", 0)
    except Exception:
        pass
    return counts


def _iso(value) -> Optional[str]:
    if value is None:
        return None
    try:
        return value.isoformat()
    except Exception:
        return str(value)
