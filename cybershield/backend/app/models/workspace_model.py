"""
Workspace / collaboration document models (Module 4.5).
"""
from datetime import datetime
from typing import List, Optional


def build_report_doc(project_id: str, user_id: str, version: int,
                     risk_score: int, risk_level: str,
                     data: Optional[dict] = None) -> dict:
    """Construct a new project report version document."""
    return {
        "project_id": project_id,
        "user_id": user_id,
        "version": version,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "data": data or {},
        "created_at": datetime.utcnow(),
    }


def build_comment_doc(report_id: str, user_id: str, user_name: str,
                      content: str) -> dict:
    """Construct a report comment document."""
    return {
        "report_id": report_id,
        "user_id": user_id,
        "user_name": user_name,
        "content": content,
        "created_at": datetime.utcnow(),
    }


def build_activity_doc(project_id: str, user_id: str, user_name: str,
                       action: str, detail: Optional[str] = None) -> dict:
    """Construct an activity log entry."""
    return {
        "project_id": project_id,
        "user_id": user_id,
        "user_name": user_name,
        "action": action,
        "detail": detail,
        "created_at": datetime.utcnow(),
    }


def build_audit_doc(user_id: str, user_name: str, action: str,
                    target: Optional[str] = None) -> dict:
    """Construct an audit log entry."""
    return {
        "user_id": user_id,
        "user_name": user_name,
        "action": action,
        "target": target,
        "created_at": datetime.utcnow(),
    }


def build_share_doc(report_id: str, token: str, expires_at: datetime,
                    password: Optional[str] = None) -> dict:
    """Construct a secure share-link document."""
    return {
        "report_id": report_id,
        "token": token,
        "expires_at": expires_at,
        "password": password,
        "revoked": False,
        "created_at": datetime.utcnow(),
    }
