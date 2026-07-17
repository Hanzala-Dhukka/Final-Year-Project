"""
MongoDB document model for the AI Security Copilot advisories (Module 5.5).

Collection: security_advisories
"""
import uuid
from datetime import datetime, timezone
from typing import Optional


def new_id() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def advisory_document(
    user_id: str,
    project_id: str,
    project: str,
    security_score: int,
    risk_level: str,
    summary: str,
    critical_findings: list,
    recommendations: list,
    roadmap: list,
    raw_context: dict = None,
) -> dict:
    """Advisory stored in `security_advisories` (spec Step 2)."""
    now = utcnow()
    return {
        "_id": new_id(),
        "user_id": user_id,
        "project_id": project_id,
        "project": project,
        "security_score": security_score,
        "risk_level": risk_level,
        "summary": summary,
        "critical_findings": critical_findings,
        "recommendations": recommendations,
        "roadmap": roadmap,
        "raw_context": raw_context or {},
        "created_at": now,
    }
