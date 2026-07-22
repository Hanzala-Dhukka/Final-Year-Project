"""
Gamification service facade (Module 7.5).

Aggregates XP/level progress, achievements, badges, certificates, the activity
timeline, and streaks into the spec-shaped responses. Reuses the existing
AchievementService / CertificateService / ProgressService and persists streak +
activity data to MongoDB so it survives restarts (unlike the Google-Sheets
backed streak_service).
"""
from typing import List, Dict, Any, Optional

from app.database.db import database
from app.services.progress_service import ProgressService
from app.services.achievement_service import AchievementService
from app.services.certificate_service import CertificateService
from app.services.leaderboard_service import get_leaderboard
from app.models.gamification import activity_document, utcnow

PROGRESS = "user_progress"
ACTIVITY = "activity_log"


# ── Progress ────────────────────────────────────────────────────────────────
def _load_progress(user_id: str) -> Dict[str, Any]:
    """Load persisted progress from MongoDB (fallback to in-memory cache)."""
    try:
        doc = database[PROGRESS].find_one({"user_id": user_id})
        if doc:
            return doc
    except Exception:
        pass
    # Fallback to ProgressService in-memory
    return ProgressService.get_user_progress(user_id)


async def get_progress(user_id: str) -> Dict[str, Any]:
    doc = _load_progress(user_id)
    xp = doc.get("xp", 0) or 0
    level = ProgressService.calculate_level(xp)
    title = ProgressService.LEVEL_TITLES.get(level, "Beginner")
    xp_to_next = ProgressService.get_xp_to_next_level(xp)
    level_progress = ProgressService.get_level_progress(xp)

    # Counts
    try:
        badge_count = len(AchievementService.get_user_achievements(user_id))
    except Exception:
        badge_count = 0
    try:
        certs = await _cert_count(user_id)
    except Exception:
        certs = 0

    return {
        "user_id": user_id,
        "xp": xp,
        "level": level,
        "level_title": title,
        "xp_to_next": xp_to_next,
        "level_progress": round(level_progress, 1),
        "current_streak": doc.get("current_streak", 0) or 0,
        "longest_streak": doc.get("longest_streak", 0) or 0,
        "completed_labs": doc.get("completed_labs", 0) or 0,
        "completed_quizzes": doc.get("completed_quizzes", 0) or 0,
        "completed_glossary": doc.get("completed_glossary", 0) or 0,
        "security_score": doc.get("security_score", 0) or 0,
        "badges": badge_count,
        "certificates": certs,
    }


async def _cert_count(user_id: str) -> int:
    try:
        return await database["certificates"].count_documents({"user_id": user_id})
    except Exception:
        return 0


# ── Achievements + Badges ───────────────────────────────────────────────────
async def get_achievements(user_id: str) -> List[Dict[str, Any]]:
    unlocked = AchievementService.get_user_achievements(user_id) or []
    unlocked_set = {a.get("key") if isinstance(a, dict) else a for a in unlocked}
    out = []
    for key, defn in AchievementService.ACHIEVEMENTS.items():
        out.append({
            "key": key,
            "name": defn.get("name"),
            "description": defn.get("description"),
            "icon": defn.get("icon"),
            "xp_reward": defn.get("xp_reward", 0),
            "unlocked": key in unlocked_set,
            "unlocked_at": None,
        })
    return out


async def get_badges(user_id: str) -> List[Dict[str, Any]]:
    unlocked = AchievementService.get_user_achievements(user_id) or []
    unlocked_set = {a.get("key") if isinstance(a, dict) else a for a in unlocked}
    # Badges = unlocked achievements surfaced as badges
    out = []
    for key, defn in AchievementService.ACHIEVEMENTS.items():
        out.append({
            "key": key,
            "name": defn.get("name"),
            "description": defn.get("description"),
            "unlocked": key in unlocked_set,
        })
    return out


# ── Certificates ────────────────────────────────────────────────────────────
async def get_certificates(user_id: str) -> List[Dict[str, Any]]:
    cursor = database["certificates"].find({"user_id": user_id}).sort("issued_at", -1)
    out = []
    async for c in cursor:
        out.append({
            "certificate_id": str(c.get("_id")),
            "course": c.get("course", c.get("title", "CyberShield Path")),
            "score": c.get("score", 0),
            "issued_at": c.get("issued_at").isoformat() if c.get("issued_at") else "",
            "user_name": c.get("user_name"),
        })
    return out


# ── Leaderboard ─────────────────────────────────────────────────────────────
async def get_leaderboard_entries(limit: int = 20) -> List[Dict[str, Any]]:
    entries = await get_leaderboard(limit=limit, skip=0)
    # add badge count + rank
    for e in entries:
        e["badge_count"] = e.get("badges", 0) if "badges" in e else 0
    return entries


# ── Activity timeline ───────────────────────────────────────────────────────
async def log_activity(
    user_id: str, activity_type: str, description: str, xp: int = 0, meta: dict = None
) -> None:
    try:
        await database[ACTIVITY].insert_one(
            activity_document(user_id, activity_type, description, xp, meta)
        )
    except Exception as e:
        print(f"Activity log failed: {e}")


async def get_activity(user_id: str, limit: int = 30) -> List[Dict[str, Any]]:
    cursor = (
        database[ACTIVITY].find({"user_id": user_id}).sort("created_at", -1).limit(limit)
    )
    out = []
    async for a in cursor:
        out.append({
            "id": str(a["_id"]),
            "activity_type": a.get("activity_type"),
            "description": a.get("description"),
            "xp": a.get("xp", 0),
            "created_at": a.get("created_at").isoformat() if a.get("created_at") else "",
        })
    return out
