"""
Gamification service facade (Module 7.5).

Aggregates XP/level progress, achievements, badges, certificates, the activity
timeline, streaks, and learning-goal progress into the spec-shaped responses.

The activity log (``activity_log``) is the single source of truth: every quiz /
glossary / OWASP-lab completion is stored there, so streaks and progress
counters are derived live from it and achievements are awarded automatically
and idempotently on each new activity event.
"""
from typing import List, Dict, Any, Optional, Set
from datetime import datetime, timezone, timedelta

from app.database.db import database
from app.services.progress_service import ProgressService
from app.services.achievement_service import AchievementService
from app.services.certificate_service import CertificateService
from app.services.leaderboard_service import get_leaderboard
from app.models.gamification import activity_document, utcnow
from app.services.error_log_service import fire_and_forget_log

PROGRESS = "user_progress"
ACTIVITY = "activity_log"
ACHIEVEMENTS = "achievements"

# Activity types used by the learners (Module 7.5)
ACT_QUIZ = "quiz"
ACT_GLOSSARY = "glossary"
ACT_OWASP = "owasp_lab"
ACT_BADGE = "badge"
ACT_LEVEL_UP = "level_up"

_AI_TYPES = {"ai", "ai_assistant", "ai_tutor", "assistant", "chatbot"}


# ── Progress ────────────────────────────────────────────────────────────────
async def _load_progress(user_id: str) -> Dict[str, Any]:
    """Load persisted progress from MongoDB (fallback to in-memory cache)."""
    try:
        doc = await database[PROGRESS].find_one({"user_id": user_id})
        if doc:
            return doc
    except Exception:
        fire_and_forget_log()
        pass
    # Fallback to ProgressService in-memory
    return ProgressService.get_user_progress(user_id)


def _progress_snapshot(user_id: str) -> Dict[str, Any]:
    """Sync snapshot of xp / level using the shared ProgressService store."""
    try:
        data = ProgressService.get_user_progress(user_id)
        return {
            "xp": data.get("xp", 0) or 0,
            "level": data.get("level", 1) or 1,
            "average_score": data.get("average_score", 0) or 0,
        }
    except Exception:
        fire_and_forget_log()
        return {"xp": 0, "level": 1, "average_score": 0}


async def get_progress(user_id: str) -> Dict[str, Any]:
    doc = await _load_progress(user_id)
    xp = doc.get("xp", 0) or 0
    level = ProgressService.calculate_level(xp)
    title = ProgressService.LEVEL_TITLES.get(level, "Beginner")
    xp_to_next = ProgressService.get_xp_to_next_level(xp)
    level_progress = ProgressService.get_level_progress(xp)

    # Derive live counters + streaks from the activity log
    stats = await _collect_stats(user_id)
    streaks = await _compute_streak(user_id)

    # Award any newly-eligible achievements (idempotent)
    try:
        await _unlock_all(user_id)
    except Exception as e:
        fire_and_forget_log()
        print(f"Achievement evaluation failed: {e}")
    unlocked_keys = await _unlocked_keys(user_id)

    try:
        certs = await _cert_count(user_id)
    except Exception:
        fire_and_forget_log()
        certs = 0

    return {
        "user_id": user_id,
        "xp": xp,
        "level": level,
        "level_title": title,
        "xp_to_next": xp_to_next,
        "level_progress": round(level_progress, 1),
        "current_streak": streaks["current"],
        "longest_streak": streaks["longest"],
        "completed_labs": stats["labs"],
        "completed_quizzes": stats["quiz_total"],
        "completed_glossary": stats["glossary"],
        # A weighted composite score so the number reflects real activity
        "security_score": stats["security_score"],
        "badges": len(unlocked_keys),
        "certificates": certs,
    }


async def _cert_count(user_id: str) -> int:
    try:
        return await database["certificates"].count_documents({"user_id": user_id})
    except Exception:
        fire_and_forget_log()
        return 0


# ── Activity-derived stats (single source of truth) ─────────────────────────
async def _collect_stats(user_id: str) -> Dict[str, Any]:
    """
    Aggregate a user's learning stats purely from the activity log. This is what
    everyone else (progress, achievements, UI counters) reads from.
    """
    stats = {
        "labs": 0,
        "quiz_total": 0,
        "glossary": 0,
        "vulns": {},
        "xss_defense": 0,
        "perfect_labs": 0,      # labs completed without hints
        "perfect_quizzes": 0,   # quizzes with 100%
        "ai_uses": 0,
        "quiz_percentages": [],
        "security_score": 0,
    }

    try:
        cursor = database[ACTIVITY].find({"user_id": user_id})
        async for a in cursor:
            atype = a.get("activity_type")
            meta = a.get("meta") or {}

            if atype == ACT_OWASP:
                stats["labs"] += 1
                vuln = meta.get("vulnerability")
                if vuln:
                    stats["vulns"][vuln] = stats["vulns"].get(vuln, 0) + 1
                if vuln == "XSS" and meta.get("mode") == "defense":
                    stats["xss_defense"] += 1
                if meta.get("no_hint"):
                    stats["perfect_labs"] += 1
            elif atype == ACT_QUIZ:
                stats["quiz_total"] += 1
                pct = meta.get("percentage")
                if pct is not None:
                    stats["quiz_percentages"].append(float(pct))
                    if pct >= 100:
                        stats["perfect_quizzes"] += 1
            elif atype == ACT_GLOSSARY:
                stats["glossary"] += 1
            elif atype in _AI_TYPES:
                stats["ai_uses"] += 1
    except Exception as e:
        fire_and_forget_log()
        print(f"Failed to collect stats for {user_id}: {e}")

    # Composite security score (0–100) so the counter reflects real activity
    quiz_avg = (
        sum(stats["quiz_percentages"]) / len(stats["quiz_percentages"])
        if stats["quiz_percentages"]
        else 0
    )
    score = 0
    if quiz_avg:
        score += min(40, quiz_avg * 0.4)
    score += min(35, stats["labs"] * 2)          # up to 35
    score += min(15, stats["glossary"] * 0.5)     # up to 15
    stats["security_score"] = min(100, round(score))
    return stats


def _as_date(value) -> Any:
    """Normalize a stored timestamp to a UTC date (or None)."""
    if value is None:
        return None
    if isinstance(value, datetime):
        dt = value
    elif isinstance(value, str):
        try:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except Exception:
            fire_and_forget_log()
            return None
    else:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).date()


async def _compute_streak(user_id: str) -> Dict[str, int]:
    """Current + longest consecutive-day streak, derived from activity dates."""
    days: Set[Any] = set()
    try:
        cursor = database[ACTIVITY].find({"user_id": user_id}, {"created_at": 1})
        async for a in cursor:
            d = _as_date(a.get("created_at"))
            if d is not None:
                days.add(d)
    except Exception:
        fire_and_forget_log()
        return {"current": 0, "longest": 0}

    if not days:
        return {"current": 0, "longest": 0}

    sorted_days = sorted(days)
    longest = 1
    run = 1
    for i in range(1, len(sorted_days)):
        if (sorted_days[i] - sorted_days[i - 1]).days == 1:
            run += 1
            longest = max(longest, run)
        else:
            run = 1

    today = datetime.now(timezone.utc).date()
    yesterday = today - timedelta(days=1)
    current = 0
    if today in days:
        day = today
        while day in days:
            current += 1
            day -= timedelta(days=1)
    elif yesterday in days:
        day = yesterday
        while day in days:
            current += 1
            day -= timedelta(days=1)

    return {"current": current, "longest": longest}


# ── Achievements + Badges ───────────────────────────────────────────────────
_ACHIE_DEFS = AchievementService.ACHIEVEMENTS

_INJECTION_CATEGORIES = [
    "SQL Injection",
    "XSS",
    "Command Injection",
    "CSRF",
    "SSRF",
    "IDOR",
]


async def _condition_met(stats: Dict[str, Any], streaks: Dict[str, int], user_id: str, key: str) -> bool:
    level = _progress_snapshot(user_id)["level"]
    if key == "first_blood":
        return stats["labs"] >= 1
    if key == "sql_hunter":
        return stats["vulns"].get("SQL Injection", 0) >= 2
    if key == "xss_defender":
        return stats["xss_defense"] >= 2
    if key == "injection_master":
        return all(stats["vulns"].get(v, 0) >= 1 for v in _INJECTION_CATEGORIES)
    if key == "cyber_explorer":
        return stats["labs"] >= 20
    if key == "perfect_defender":
        return stats["perfect_labs"] >= 10
    if key == "quiz_champion":
        return stats["perfect_quizzes"] >= 10
    if key == "ai_learner":
        return stats["ai_uses"] >= 20
    if key == "daily_warrior":
        return streaks["current"] >= 7
    if key == "streak_master":
        return streaks["longest"] >= 30
    if key == "level_10":
        return level >= 10
    if key == "security_professional":
        snap = _progress_snapshot(user_id)
        return snap["xp"] >= 5000 and stats["labs"] >= 40
    return False


async def _unlocked_keys(user_id: str) -> Set[str]:
    """Set of earned achievement keys (supports both new key-based and legacy name-based rows)."""
    keys: Set[str] = set()
    try:
        cursor = database[ACHIEVEMENTS].find({"user_id": user_id})
        async for doc in cursor:
            k = doc.get("key")
            if k:
                keys.add(k)
            else:
                stored = doc.get("badge") or doc.get("name")
                if stored:
                    for key, defn in _ACHIE_DEFS.items():
                        if defn.get("name") == stored:
                            keys.add(key)
    except Exception as e:
        fire_and_forget_log()
        print(f"Failed to load unlocked achievements: {e}")
    return keys


async def _is_unlocked(user_id: str, key: str, name: str) -> bool:
    try:
        n = await database[ACHIEVEMENTS].count_documents(
            {
                "user_id": user_id,
                "$or": [
                    {"key": key},
                    {"badge": name},
                    {"name": name},
                ],
            }
        )
        return n > 0
    except Exception:
        fire_and_forget_log()
        return False


async def _unlock(user_id: str, key: str, defn: Dict[str, Any]) -> bool:
    name = defn.get("name", key)
    if await _is_unlocked(user_id, key, name):
        return False
    try:
        await database[ACHIEVEMENTS].insert_one(
            {
                "user_id": user_id,
                "key": key,
                "badge": name,
                "name": name,
                "xp_reward": defn.get("xp_reward", 0),
                "date": utcnow().isoformat(),
                "created_at": utcnow().isoformat(),
            }
        )
    except Exception as e:
        fire_and_forget_log()
        print(f"Failed to save achievement {key}: {e}")
        return False
    return True


async def _unlock_all(user_id: str) -> None:
    """Check every streaming achievement once and persist newly earned ones."""
    stats = await _collect_stats(user_id)
    streaks = await _compute_streak(user_id)
    for key, defn in _ACHIE_DEFS.items():
        try:
            if await _condition_met(stats, streaks, user_id, key):
                if await _unlock(user_id, key, defn):
                    try:
                        await log_activity(
                            user_id,
                            ACT_BADGE,
                            f"Achievement unlocked: {defn.get('name')}",
                            defn.get("xp_reward", 0),
                            {"achievement": key},
                        )
                    except Exception:
                        fire_and_forget_log()
                        pass
        except Exception as e:
            fire_and_forget_log()
            print(f"Reward check failed for {key}: {e}")


async def get_achievements(user_id: str) -> List[Dict[str, Any]]:
    try:
        await _unlock_all(user_id)
    except Exception:
        fire_and_forget_log()
        pass
    unlocked_map: Dict[str, str] = {}
    try:
        async for doc in database[ACHIEVEMENTS].find({"user_id": user_id}):
            k = doc.get("key")
            if k:
                unlocked_map[k] = doc.get("date") or doc.get("created_at") or ""
    except Exception:
        fire_and_forget_log()
        pass

    out = []
    for key, defn in _ACHIE_DEFS.items():
        out.append({
            "key": key,
            "name": defn.get("name"),
            "description": defn.get("description"),
            "icon": defn.get("icon"),
            "xp_reward": defn.get("xp_reward", 0),
            "unlocked": key in unlocked_map,
            "unlocked_at": unlocked_map.get(key),
        })
    return out


async def get_badges(user_id: str) -> List[Dict[str, Any]]:
    keys = await _unlocked_keys(user_id)
    out = []
    for key, defn in _ACHIE_DEFS.items():
        out.append({
            "key": key,
            "name": defn.get("name"),
            "description": defn.get("description"),
            "unlocked": key in keys,
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
        fire_and_forget_log()
        print(f"Activity log failed: {e}")
        return
    # Every learning event can unlock achievements (idempotent)
    try:
        await _unlock_all(user_id)
    except Exception as e:
        fire_and_forget_log()
        print(f"Achievement evaluation failed: {e}")

    # Auto-generate category certificate when all labs of a type are done
    if activity_type == ACT_OWASP and meta:
        vuln = meta.get("vulnerability")
        if vuln:
            try:
                await _try_generate_category_cert(user_id, vuln)
            except Exception as e:
                fire_and_forget_log()
                print(f"Auto category cert generation failed: {e}")
            try:
                await _try_generate_professional_cert(user_id)
            except Exception as e:
                fire_and_forget_log()
                print(f"Auto professional cert generation failed: {e}")


async def _try_generate_category_cert(user_id: str, vulnerability_type: str) -> None:
    """Check if all labs for a category are done; if so, generate cert if not already issued."""
    from app.services.certificate_service import CertificateService

    # Check if cert already exists for this category
    existing = await database["certificates"].count_documents(
        {
            "user_id": user_id,
            "course": {"$regex": vulnerability_type, "$options": "i"},
        }
    )
    if existing > 0:
        return

    completion = await CertificateService.async_check_category_completion(user_id, vulnerability_type)
    if not completion["completed"] or completion["labs_done"] < 2:
        return

    # Fetch user name from DB (handle both ObjectId and string _id)
    user_name = "CyberShield User"
    try:
        from bson import ObjectId
        user_doc = await database["users"].find_one({"_id": ObjectId(user_id)})
    except Exception:
        user_doc = await database["users"].find_one({"_id": user_id})
    if user_doc:
        user_name = user_doc.get("name") or user_doc.get("username") or "CyberShield User"

    CertificateService.generate_category_certificate(
        user_id=user_id,
        user_name=user_name,
        vulnerability_type=vulnerability_type,
        difficulty="Mixed",
        score=completion["average_score"],
        labs_completed=completion["labs_done"],
        total_labs=completion["total_labs"],
    )
    print(f"Auto-generated certificate for {user_id}: {vulnerability_type}")


async def _try_generate_professional_cert(user_id: str) -> None:
    """Check if all 15 categories are done; if so, generate professional cert."""
    from app.services.certificate_service import CertificateService

    # Check if professional cert already exists
    existing = await database["certificates"].count_documents(
        {
            "user_id": user_id,
            "course": {"$regex": "Professional", "$options": "i"},
        }
    )
    if existing > 0:
        return

    eligibility = await CertificateService.async_check_professional_eligibility(user_id)
    if not eligibility["eligible"]:
        return

    # Fetch user name from DB (handle both ObjectId and string _id)
    user_name = "CyberShield User"
    try:
        from bson import ObjectId
        user_doc = await database["users"].find_one({"_id": ObjectId(user_id)})
    except Exception:
        user_doc = await database["users"].find_one({"_id": user_id})
    if user_doc:
        user_name = user_doc.get("name") or user_doc.get("username") or "CyberShield User"

    CertificateService.generate_professional_certificate(
        user_id=user_id,
        user_name=user_name,
        labs_completed=15,
        average_score=0,
    )
    print(f"Auto-generated professional certificate for {user_id}")


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