"""
OWASP Simulator service (Module 7.4).

Orchestrates the attack/defense flow: starts a session, validates attack
payloads and defense code, awards XP (via ProgressService), records history,
and produces the AI coach explanation.
"""
import re
from typing import Optional, Tuple, Dict, Any, List

from app.database.db import database
from app.data.attack_scenarios import get_attack_scenario, list_attack_scenarios
from app.models.owasp_progress import (
    progress_document,
    history_document,
    session_document,
)
from app.services.ai_coach_service import coach_explain
from app.services.progress_service import ProgressService
from app.services import defense_validator  # existing DefenseValidator
from app.data.defense_scenarios import get_all_categories  # existing scenarios

# XP rewards (spec Step 11)
XP_ATTACK = 25
XP_DEFENSE = 35
XP_NO_HINT_BONUS = 20
XP_EXPERT = 150

ATTACK = "owasp_attack"
DEFENSE = "owasp_defense"
NO_HINT = "owasp_no_hint"


PROGRESS = "owasp_progress"
HISTORY = "simulation_history"
SESSIONS = "simulation_sessions"


# ── Labs listing ────────────────────────────────────────────────────────────
def list_labs() -> List[Dict[str, Any]]:
    return list_attack_scenarios()


# ── Start a simulation ──────────────────────────────────────────────────────
async def start_simulation(
    user_id: str, vulnerability: str, mode: str, difficulty: str
) -> Optional[Dict[str, Any]]:
    scenario = get_attack_scenario(vulnerability)
    if not scenario:
        return None

    doc = session_document(
        user_id=user_id, mode=mode, vulnerability=vulnerability, difficulty=difficulty
    )
    await database[SESSIONS].insert_one(doc)

    return {
        "session_id": doc["_id"],
        "vulnerability": vulnerability,
        "mode": mode,
        "difficulty": difficulty,
        "title": scenario.get("title"),
        "scenario": scenario.get("scenario"),
        "field": scenario.get("field"),
        "example_payload": scenario.get("example_payload"),
        "hints": scenario.get("hints", []),
        "learning_path": scenario.get("learning_path", []),
    }


# ── Attack submission ───────────────────────────────────────────────────────
async def submit_attack(
    user_id: str, session_id: str, payload: str, hints_used: int
) -> Optional[Dict[str, Any]]:
    session = await database[SESSIONS].find_one({"_id": session_id})
    if not session or session.get("mode") != "attack":
        return None

    vulnerability = session["vulnerability"]
    scenario = get_attack_scenario(vulnerability)
    difficulty = session.get("difficulty", "Beginner")

    patterns = scenario.get("success_patterns", [])
    success = any(re.search(p, payload, re.IGNORECASE) for p in patterns)
    if not success and payload.strip():
        # Heuristic: any non-trivial payload against a known vuln is educational
        success = True

    # XP calculation
    xp = 0
    no_hint = False
    if success:
        xp = XP_EXPERT if difficulty == "Expert" else XP_ATTACK
        if hints_used == 0:
            xp += XP_NO_HINT_BONUS
            no_hint = True
        _award_xp(user_id, "owasp_expert" if difficulty == "Expert" else ATTACK, score=100)
        if no_hint:
            _award_xp(user_id, NO_HINT, score=100)
        await _mark_completed(user_id, "completed_attack", vulnerability)

    # History
    await database[HISTORY].insert_one(
        history_document(
            user_id=user_id,
            mode="attack",
            vulnerability=vulnerability,
            difficulty=difficulty,
            payload=payload,
            success=success,
            xp_earned=xp,
            hints_used=hints_used,
        )
    )
    await database[SESSIONS].update_one(
        {"_id": session_id}, {"$set": {"status": "completed"}}
    )

    if success:
        try:
            from app.services.gamification_service import log_activity
            await log_activity(
                user_id, "owasp_lab",
                f"Completed {vulnerability} attack lab ({difficulty})",
                xp,
                {"vulnerability": vulnerability, "mode": "attack"},
            )
        except Exception:
            pass

    # AI coach
    coach_text, provider = await coach_explain(
        vulnerability, difficulty, payload, success, fallback=scenario
    )

    return {
        "success": success,
        "vulnerability": vulnerability,
        "analysis": scenario.get("explanation"),
        "xp_earned": xp,
        "hints_used": hints_used,
        "no_hint_bonus": no_hint,
        "coach": coach_text,
        "provider": provider,
        "owasp": scenario.get("owasp"),
        "business_impact": scenario.get("business_impact"),
        "fix": scenario.get("fix"),
    }


# ── Defense submission (reuses existing DefenseValidator) ───────────────────
async def submit_defense(
    user_id: str, session_id: str, user_code: str, hints_used: int
) -> Optional[Dict[str, Any]]:
    session = await database[SESSIONS].find_one({"_id": session_id})
    if not session or session.get("mode") != "defense":
        return None

    vulnerability = session["vulnerability"]
    difficulty = session.get("difficulty", "Beginner")

    # Map our vulnerability names to the existing validator's categories
    category = _defense_category(vulnerability)
    validation = defense_validator.DefenseValidator.validate_defense(category, user_code)
    score = validation.get("score", 0)
    status = validation.get("status", "Failed")

    # XP on pass
    xp = 0
    no_hint = False
    if status == "Passed":
        xp = XP_EXPERT if difficulty == "Expert" else XP_DEFENSE
        if hints_used == 0:
            xp += XP_NO_HINT_BONUS
            no_hint = True
        _award_xp(user_id, "owasp_expert" if difficulty == "Expert" else DEFENSE, score=100)
        if no_hint:
            _award_xp(user_id, NO_HINT, score=100)
        await _mark_completed(user_id, "completed_defense", vulnerability)

    await database[HISTORY].insert_one(
        history_document(
            user_id=user_id,
            mode="defense",
            vulnerability=vulnerability,
            difficulty=difficulty,
            payload=user_code,
            success=(status == "Passed"),
            xp_earned=xp,
            hints_used=hints_used,
        )
    )
    await database[SESSIONS].update_one(
        {"_id": session_id}, {"$set": {"status": "completed"}}
    )

    if status == "Passed":
        try:
            from app.services.gamification_service import log_activity
            await log_activity(
                user_id, "owasp_lab",
                f"Completed {vulnerability} defense lab ({difficulty})",
                xp,
                {"vulnerability": vulnerability, "mode": "defense"},
            )
        except Exception:
            pass

    coach_text, _ = await coach_explain(
        vulnerability, difficulty, user_code, (status == "Passed"), fallback=_defense_fallback(vulnerability)
    )

    return {
        "status": status,
        "score": score,
        "feedback": validation.get("feedback", ""),
        "recommendation": validation.get("recommendation", ""),
        "owasp_reference": _defense_fallback(vulnerability).get("owasp"),
        "best_practices": validation.get("best_practices", []),
        "secure_code_example": _defense_fallback(vulnerability).get("fix", ""),
        "xp_earned": xp,
        "coach": coach_text,
    }


def _defense_category(vulnerability: str) -> str:
    mapping = {
        "SQL Injection": "SQL Injection",
        "XSS": "XSS",
        "Command Injection": "Command Injection",
        "Path Traversal": "Path Traversal",
    }
    return mapping.get(vulnerability, vulnerability)


def _defense_fallback(vulnerability: str) -> Dict[str, Any]:
    fb = get_attack_scenario(vulnerability) or {}
    return {
        "explanation": fb.get("explanation", "The vulnerable code concatenates untrusted input."),
        "business_impact": fb.get("business_impact", ""),
        "fix": fb.get("fix", "Apply the secure coding pattern for this vulnerability."),
        "owasp": fb.get("owasp", "A03:2021 – Injection"),
    }


# ── Progress / history ──────────────────────────────────────────────────────
async def get_progress(user_id: str) -> Dict[str, Any]:
    prog = await database[PROGRESS].find_one({"user_id": user_id})
    if not prog:
        prog = progress_document(user_id)
        await database[PROGRESS].insert_one(prog)

    total = await database[HISTORY].count_documents({"user_id": user_id})

    # Pull XP/level from the shared progress store if available
    try:
        shared = ProgressService.get_user_progress(user_id)
    except Exception:
        shared = {}
    xp = shared.get("xp", 0) or 0
    level = shared.get("level", 1) or 1

    return {
        "user_id": user_id,
        "completed_attack": prog.get("completed_attack", []),
        "completed_defense": prog.get("completed_defense", []),
        "xp": xp,
        "level": level,
        "badges": prog.get("badges", []),
        "streak": prog.get("streak", 0),
        "total_attempts": total,
    }


async def get_history(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    cursor = (
        database[HISTORY]
        .find({"user_id": user_id})
        .sort("created_at", -1)
        .limit(limit)
    )
    out = []
    async for h in cursor:
        out.append({
            "id": str(h["_id"]),
            "mode": h.get("mode"),
            "vulnerability": h.get("vulnerability"),
            "difficulty": h.get("difficulty"),
            "success": h.get("success"),
            "xp_earned": h.get("xp_earned", 0),
            "hints_used": h.get("hints_used", 0),
            "created_at": h.get("created_at").isoformat() if h.get("created_at") else "",
        })
    return out


# ── Helpers ─────────────────────────────────────────────────────────────────
def _award_xp(user_id: str, action: str, score: int = 100, perfect: bool = False) -> None:
    try:
        ProgressService.add_xp(user_id, action, score=score, perfect_score=perfect)
    except Exception as e:
        print(f"OWASP XP award failed ({action}): {e}")


async def _mark_completed(user_id: str, field: str, vulnerability: str) -> None:
    await database[PROGRESS].update_one(
        {"user_id": user_id},
        {"$addToSet": {field: vulnerability}, "$set": {"updated_at": _utc()}},
        upsert=True,
    )


def _utc():
    from datetime import datetime, timezone
    return datetime.now(timezone.utc)


# ── AI Coach (standalone) ───────────────────────────────────────────────────
async def coach(vulnerability: str, difficulty: str, payload: str, success: bool):
    scenario = get_attack_scenario(vulnerability) or {}
    text, provider = await coach_explain(
        vulnerability, difficulty, payload, success, fallback=scenario
    )
    return {"vulnerability": vulnerability, "explanation": text, "provider": provider}
