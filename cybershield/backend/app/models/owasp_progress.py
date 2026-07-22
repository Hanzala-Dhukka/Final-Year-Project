"""
MongoDB document models for the OWASP Simulator (Module 7.4).

Collections:
  owasp_progress       - per-user completed labs, XP, level, badges
  simulation_history   - every attack/defense attempt (practice history)
  daily_challenges     - one active challenge per day (24h expiry)
  simulation_sessions  - in-flight simulation sessions
  owasp_badges         - awarded badges (optional)
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId


def new_id() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def progress_document(user_id: str) -> dict:
    return {
        "_id": new_id(),
        "user_id": user_id,
        "completed_attack": [],
        "completed_defense": [],
        "xp": 0,
        "level": 1,
        "badges": [],
        "streak": 0,
        "last_activity": utcnow(),
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }


def history_document(
    user_id: str,
    mode: str,
    vulnerability: str,
    difficulty: str,
    payload: str = None,
    success: bool = False,
    xp_earned: int = 0,
    hints_used: int = 0,
) -> dict:
    return {
        "_id": new_id(),
        "user_id": user_id,
        "mode": mode,  # "attack" | "defense"
        "vulnerability": vulnerability,
        "difficulty": difficulty,
        "payload": payload,
        "success": success,
        "xp_earned": xp_earned,
        "hints_used": hints_used,
        "created_at": utcnow(),
    }


def daily_challenge_document(
    vulnerability: str, difficulty: str, reward_xp: int, expires_at: datetime
) -> dict:
    return {
        "_id": new_id(),
        "date": utcnow().date().isoformat(),
        "vulnerability": vulnerability,
        "difficulty": difficulty,
        "reward_xp": reward_xp,
        "completed_by": [],
        "expires_at": expires_at,
        "created_at": utcnow(),
    }


def session_document(
    user_id: str, mode: str, vulnerability: str, difficulty: str, hints_used: int = 0
) -> dict:
    return {
        "_id": new_id(),
        "user_id": user_id,
        "mode": mode,
        "vulnerability": vulnerability,
        "difficulty": difficulty,
        "hints_used": hints_used,
        "status": "in_progress",
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }


def badge_document(user_id: str, name: str) -> dict:
    return {
        "_id": new_id(),
        "user_id": user_id,
        "badge": name,
        "created_at": utcnow(),
    }


def to_object_id(value: str) -> Optional[ObjectId]:
    try:
        return ObjectId(value)
    except Exception:
        return None
