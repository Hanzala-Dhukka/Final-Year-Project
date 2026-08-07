"""
AI Security Assistant API routes (Module E1).

Endpoints (mounted under /assistant):
  POST /assistant/chat       Ask the AI a security question
  GET  /assistant/history    Retrieve the user's chat history
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from typing import Dict, Any, Optional

from app.config.settings import settings
from app.database.db import database
from app.ai_assistant import service

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])

security_opt = HTTPBearer(auto_error=False)


# ── Auth helper ───────────────────────────────────────────────────────────────

async def _get_user_id(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security_opt),
) -> str:
    """Extract user_id from JWT token, or return 'anonymous'."""
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
        return "anonymous"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/chat")
async def chat(
    data: Dict[str, Any],
    user_id: str = Depends(_get_user_id),
):
    """
    Ask the AI a cybersecurity question.

    Body:
        question: str — The user's question
        scan_data: dict — Optional scan results for context
        scan_id: str — Optional scan ID for reference
    """
    question = (data.get("question") or "").strip()
    if not question:
        raise HTTPException(status_code=422, detail="question is required")

    scan_data = data.get("scan_data")
    scan_id = data.get("scan_id")

    # Get AI response
    answer = await service.ask_ai(question, scan_data, user_id)

    # Save to chat history (Step 6)
    await service.save_chat_history(user_id, question, answer, scan_id)

    return {"answer": answer}


@router.get("/history")
async def history(
    user_id: str = Depends(_get_user_id),
):
    """
    Retrieve the authenticated user's chat history (Step 13).

    Returns the most recent conversations, newest first.
    """
    records = await service.get_chat_history(user_id)
    return {"history": records}
