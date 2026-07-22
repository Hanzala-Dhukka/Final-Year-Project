"""
Daily Challenge service (Module 7.4, spec Steps 9 & 22).

Generates one random vulnerability+difficulty challenge per day, expires after
24 hours, and grants the reward (100 XP) only once per user. Persists to
`daily_challenges`. Also reuses existing defense scenarios categories where
available.
"""
import random
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, Tuple

from app.database.db import database
from app.data.attack_scenarios import ATTACK_SCENARIOS, get_attack_scenario
from app.models.owasp_progress import daily_challenge_document

CHALLENGES = "daily_challenges"
DAILY_REWARD = 100
DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Expert"]


def _utc() -> datetime:
    return datetime.now(timezone.utc)


def _today() -> str:
    return _utc().date().isoformat()


async def get_or_create_today() -> Dict[str, Any]:
    """
    Return today's active challenge, creating one if missing or expired.
    """
    today = _utc()
    existing = await database[CHALLENGES].find_one({"date": today.date().isoformat()})
    if existing:
        return existing

    # Expire any stale challenges (older than 24h) — housekeeping
    name = random.choice(list(ATTACK_SCENARIOS.keys()))
    difficulty = random.choice(DIFFICULTIES)
    expires = today + timedelta(hours=24)
    doc = daily_challenge_document(name, difficulty, DAILY_REWARD, expires)
    await database[CHALLENGES].insert_one(doc)
    return doc


async def get_daily(user_id: str) -> Dict[str, Any]:
    """Return today's challenge with a 'completed' flag for this user."""
    doc = await get_or_create_today()
    completed = user_id in (doc.get("completed_by") or [])
    return {
        "vulnerability": doc["vulnerability"],
        "difficulty": doc["difficulty"],
        "reward_xp": doc["reward_xp"],
        "expires_at": doc["expires_at"].isoformat() if doc.get("expires_at") else "",
        "completed": completed,
    }


async def complete_daily(user_id: str) -> Tuple[Dict[str, Any], int]:
    """
    Mark the daily challenge completed for a user and award XP once.
    Returns (challenge_dict, xp_awarded). xp_awarded is 0 if already done.
    """
    doc = await get_or_create_today()
    completed_by = doc.get("completed_by") or []

    if user_id in completed_by:
        return _public(doc, True), 0

    # Verify the challenge isn't expired
    expires = doc.get("expires_at")
    if expires and expires < _utc():
        return _public(doc, False), 0

    completed_by.append(user_id)
    await database[CHALLENGES].update_one(
        {"_id": doc["_id"]}, {"$set": {"completed_by": completed_by}}
    )

    # Award XP via shared progress store
    try:
        from app.services.progress_service import ProgressService
        ProgressService.add_xp(user_id, "daily_challenge", score=100, perfect_score=True)
    except Exception as e:
        print(f"Daily challenge XP failed: {e}")

    return _public(doc, True), doc.get("reward_xp", DAILY_REWARD)


def _public(doc: Dict[str, Any], completed: bool) -> Dict[str, Any]:
    return {
        "vulnerability": doc["vulnerability"],
        "difficulty": doc["difficulty"],
        "reward_xp": doc["reward_xp"],
        "expires_at": doc["expires_at"].isoformat() if doc.get("expires_at") else "",
        "completed": completed,
    }
