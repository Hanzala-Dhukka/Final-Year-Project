"""
MongoDB document models for the AI Code Review module (Module 5.3).

Collections:
  code_reviews         - summary row per review (history list)
  code_review_reports  - full report (findings, AI explanation, secure code)
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId


def new_id() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def review_document(user_id: str, language: str, risk_score: int,
                    severity_summary: dict, owasp: list, cwe: list,
                    project_id: str = None) -> dict:
    """Summary document stored in `code_reviews`."""
    now = utcnow()
    return {
        "_id": new_id(),
        "user_id": user_id,
        "project_id": project_id,
        "language": language,
        "risk_score": risk_score,
        "severity_summary": severity_summary,
        "owasp": owasp,
        "cwe": cwe,
        "created_at": now,
    }


def report_document(review_id: str, user_id: str, language: str,
                    code: str, findings: list, ai_explanation: str,
                    secure_code: str, risk_score: int,
                    severity_summary: dict, owasp: list, cwe: list,
                    project_id: str = None) -> dict:
    """Full report document stored in `code_review_reports`."""
    now = utcnow()
    return {
        "_id": new_id(),
        "review_id": review_id,
        "user_id": user_id,
        "project_id": project_id,
        "language": language,
        "code": code,
        "findings": findings,
        "ai_explanation": ai_explanation,
        "secure_code": secure_code,
        "risk_score": risk_score,
        "severity_summary": severity_summary,
        "owasp": owasp,
        "cwe": cwe,
        "created_at": now,
    }


def to_object_id(value: str) -> Optional[ObjectId]:
    try:
        return ObjectId(value)
    except Exception:
        return None
