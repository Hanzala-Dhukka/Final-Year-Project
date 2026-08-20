"""
AI Learning Recommendation API routes (Module E2, Steps 6-7).

Endpoints (mounted under /learning):
  POST /learning/recommendations  Generate learning recommendations
  GET  /learning/recommendations  Get latest recommendations
  GET  /learning/progress         Get user learning progress
  POST /learning/progress         Mark a topic as completed
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from typing import Dict, Any, List, Optional

from app.config.settings import settings
from app.learning import recommendation_service as svc
from app.services.error_log_service import fire_and_forget_log

router = APIRouter(prefix="/learning", tags=["Learning"])

security_opt = HTTPBearer(auto_error=False)


async def _get_user_id(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security_opt),
) -> str:
    if not creds or not creds.credentials:
        return "anonymous"
    try:
        payload = jwt.decode(
            creds.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return str(payload.get("user_id") or payload.get("sub") or "anonymous")
    except Exception:
        fire_and_forget_log()
        return "anonymous"


@router.post("/recommendations")
async def recommendations(
    data: Dict[str, Any],
    user_id: str = Depends(_get_user_id),
):
    """
    Generate learning recommendations from vulnerabilities.

    Body:
        vulnerabilities: [{"type": "SQL Injection", "severity": "High"}, ...]
        scan_id: optional scan reference
    """
    vulnerabilities = data.get("vulnerabilities", [])
    if not vulnerabilities:
        raise HTTPException(status_code=422, detail="vulnerabilities list is required")

    scan_id = data.get("scan_id")
    result = await svc.get_full_recommendations(user_id, vulnerabilities, scan_id)
    return result


@router.get("/recommendations")
async def get_recommendations(
    user_id: str = Depends(_get_user_id),
):
    """Get the user's latest learning recommendations."""
    return await svc.get_latest_recommendations(user_id)


@router.get("/progress")
async def get_progress(
    user_id: str = Depends(_get_user_id),
):
    """Get the user's learning progress."""
    return await svc.get_learning_progress(user_id)


@router.post("/progress")
async def update_progress(
    data: Dict[str, Any],
    user_id: str = Depends(_get_user_id),
):
    """
    Mark a topic as completed.

    Body:
        topic: str — The topic name to mark as completed
    """
    topic = (data.get("topic") or "").strip()
    if not topic:
        raise HTTPException(status_code=422, detail="topic is required")

    return await svc.mark_topic_completed(user_id, topic)
