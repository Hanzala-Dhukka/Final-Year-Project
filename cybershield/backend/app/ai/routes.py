"""
AI Dashboard Routes  —  /api/v1/ai-dashboard/...

All endpoints share 24-hour MongoDB caching keyed by (user_id, endpoint).
When the cache is fresh the Groq API is not called, keeping costs down and
the dashboard fast. Cache is invalidated on reset.
"""
from __future__ import annotations

import hashlib
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt

from app.config.settings import settings
from app.database.db import database
from app.ai.dashboard_ai_service import dashboard_ai_service

router = APIRouter(prefix="/ai-dashboard", tags=["AI Dashboard"])

CACHE_TTL_HOURS = 24
CACHE_COLLECTION = "ai_insights"

security_opt = HTTPBearer(auto_error=False)


# ── Auth helper ───────────────────────────────────────────────────────────────

async def _get_user_id(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security_opt),
) -> str:
    if not creds or not creds.credentials:
        return "anonymous"
    try:
        payload = jwt.decode(
            creds.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return str(payload.get("user_id") or payload.get("sub") or "anonymous")
    except Exception:
        return "anonymous"


# ── Cache helpers ─────────────────────────────────────────────────────────────

def _cache_key(user_id: str, endpoint: str, data_hash: str) -> str:
    return f"{user_id}:{endpoint}:{data_hash}"


def _hash_data(data: Any) -> str:
    import json
    try:
        raw = json.dumps(data, sort_keys=True, default=str)
    except Exception:
        raw = str(data)
    return hashlib.md5(raw.encode()).hexdigest()[:12]


async def _get_cache(key: str) -> Optional[Dict]:
    try:
        doc = await database[CACHE_COLLECTION].find_one({"cache_key": key})
        if not doc:
            return None
        expires = doc.get("expires_at")
        if expires and datetime.now(timezone.utc) > expires.replace(tzinfo=timezone.utc):
            return None
        return doc.get("result")
    except Exception:
        return None


async def _set_cache(key: str, user_id: str, endpoint: str, result: Dict) -> None:
    try:
        await database[CACHE_COLLECTION].update_one(
            {"cache_key": key},
            {
                "$set": {
                    "cache_key": key,
                    "user_id": user_id,
                    "endpoint": endpoint,
                    "result": result,
                    "created_at": datetime.now(timezone.utc),
                    "expires_at": datetime.now(timezone.utc) + timedelta(hours=CACHE_TTL_HOURS),
                }
            },
            upsert=True,
        )
    except Exception as exc:
        print(f"[AI Cache] write failed: {exc}")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/security-analysis")
async def security_analysis(
    data: Dict[str, Any] = Body(...),
    user_id: str = Depends(_get_user_id),
):
    """Full AI security overview: status, risk score, concerns, actions, learning tip."""
    key = _cache_key(user_id, "security-analysis", _hash_data(data))
    cached = await _get_cache(key)
    if cached:
        return {"analysis": cached, "cached": True}

    result = await dashboard_ai_service.security_analysis(data)
    await _set_cache(key, user_id, "security-analysis", result)
    return {"analysis": result, "cached": False}


@router.post("/risk-score")
async def risk_score(
    data: Dict[str, Any] = Body(...),
    user_id: str = Depends(_get_user_id),
):
    """AI-calculated risk score with breakdown and trend."""
    key = _cache_key(user_id, "risk-score", _hash_data(data))
    cached = await _get_cache(key)
    if cached:
        return {"risk": cached, "cached": True}

    result = await dashboard_ai_service.risk_score(data)
    await _set_cache(key, user_id, "risk-score", result)
    return {"risk": result, "cached": False}


@router.post("/recommendations")
async def recommendations(
    data: Dict[str, Any] = Body(...),
    user_id: str = Depends(_get_user_id),
):
    """Tiered (immediate / short-term / long-term) AI recommendations."""
    key = _cache_key(user_id, "recommendations", _hash_data(data))
    cached = await _get_cache(key)
    if cached:
        return {"recommendations": cached, "cached": True}

    result = await dashboard_ai_service.recommendations(data)
    await _set_cache(key, user_id, "recommendations", result)
    return {"recommendations": result, "cached": False}


@router.post("/trend-analysis")
async def trend_analysis(
    data: Dict[str, Any] = Body(...),
    user_id: str = Depends(_get_user_id),
):
    """AI trend analysis across vulnerability data."""
    key = _cache_key(user_id, "trend-analysis", _hash_data(data))
    cached = await _get_cache(key)
    if cached:
        return {"trend": cached, "cached": True}

    result = await dashboard_ai_service.trend_analysis(data)
    await _set_cache(key, user_id, "trend-analysis", result)
    return {"trend": result, "cached": False}


@router.post("/learning-recommendation")
async def learning_recommendation(
    data: Dict[str, Any] = Body(...),
    user_id: str = Depends(_get_user_id),
):
    """Personalised learning path based on user skill level and vulnerabilities."""
    key = _cache_key(user_id, "learning", _hash_data(data))
    cached = await _get_cache(key)
    if cached:
        return {"learning": cached, "cached": True}

    result = await dashboard_ai_service.learning_recommendation(data)
    await _set_cache(key, user_id, "learning", result)
    return {"learning": result, "cached": False}


@router.post("/executive-report")
async def executive_report(
    data: Dict[str, Any] = Body(...),
    user_id: str = Depends(_get_user_id),
):
    """Executive-level security report for management."""
    key = _cache_key(user_id, "executive-report", _hash_data(data))
    cached = await _get_cache(key)
    if cached:
        return {"report": cached, "cached": True}

    result = await dashboard_ai_service.executive_report(data)
    await _set_cache(key, user_id, "executive-report", result)
    return {"report": result, "cached": False}


@router.post("/assistant")
async def assistant(
    payload: Dict[str, Any] = Body(...),
    user_id: str = Depends(_get_user_id),
):
    """
    Free-form AI dashboard assistant.
    Body: { "question": "...", "context": { ...optional dashboard snapshot... } }
    """
    question = (payload.get("question") or "").strip()
    if not question:
        raise HTTPException(status_code=422, detail="question is required")

    context = payload.get("context")
    answer = await dashboard_ai_service.assistant_chat(question, context)
    return {"answer": answer}


@router.delete("/cache")
async def clear_cache(user_id: str = Depends(_get_user_id)):
    """Clear cached AI insights for the current user."""
    try:
        result = await database[CACHE_COLLECTION].delete_many({"user_id": user_id})
        return {"deleted": result.deleted_count, "message": "AI insight cache cleared"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
