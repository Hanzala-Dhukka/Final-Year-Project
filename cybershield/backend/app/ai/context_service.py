"""
AI Context Service (Module E5, Part 1).

Stores and retrieves the user's latest security scan context so the
AI Assistant can provide personalised, context-aware answers.

Collection: ai_context
"""
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from app.database.db import database

ai_context_col = database.ai_context


async def store_scan_context(
    user_id: str,
    repository: str,
    score: int,
    issues: list,
    risk_level: str = "Unknown",
) -> None:
    """
    Store the user's latest scan context for the AI Assistant.

    Called after each GitHub scan completes so the AI always has fresh data.

    Args:
        user_id: The authenticated user's ID.
        repository: Repository name.
        score: Security score (0-100).
        issues: List of issue type strings (e.g. ["SQL Injection", "XSS"]).
        risk_level: Risk level string.
    """
    doc = {
        "user_id": user_id,
        "repository": repository,
        "latest_scan": {
            "score": score,
            "issues": issues,
            "risk_level": risk_level,
        },
        "updated_at": datetime.now(timezone.utc),
    }
    try:
        await ai_context_col.update_one(
            {"user_id": user_id},
            {"$set": doc},
            upsert=True,
        )
    except Exception as e:
        print(f"[AI Context] Failed to store scan context: {e}")


async def get_user_security_context(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve the user's security context for AI personalisation.

    Args:
        user_id: The authenticated user's ID.

    Returns:
        Dict with user_id, repository, latest_scan, or None.
    """
    try:
        doc = await ai_context_col.find_one({"user_id": user_id})
        if doc:
            doc.pop("_id", None)
            return doc
    except Exception as e:
        print(f"[AI Context] Failed to retrieve context: {e}")
    return None
