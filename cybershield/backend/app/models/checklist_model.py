"""
Security Checklist document models (Module 6.1).

Defines the document shapes for the three MongoDB collections used by the
Security Hardening / Compliance Management module:

- security_checklists : predefined security hardening requirements
- user_checklists     : per-user / per-project progress on a checklist item
- checklist_progress  : aggregated completion snapshot per project
"""
from datetime import datetime
from typing import List, Optional

# ── Checklist categories ──────────────────────────────────────────────────────
CHECKLIST_CATEGORIES = [
    "Authentication",
    "Authorization",
    "Input Validation",
    "Cryptography",
    "Secrets Management",
    "Logging",
    "Network Security",
    "API Security",
    "Database Security",
    "Cloud Security",
    "Secure Coding",
]

SEVERITY_LEVELS = ["Critical", "High", "Medium", "Low"]

# Valid task statuses
CHECKLIST_STATUSES = ["pending", "in_progress", "completed"]


def build_checklist_doc(
    title: str,
    category: str,
    severity: str,
    description: str,
    frameworks: Optional[List[str]] = None,
    recommended: bool = True,
) -> dict:
    """Construct a predefined security_checklists document."""
    return {
        "title": title,
        "category": category,
        "severity": severity,
        "description": description,
        "frameworks": frameworks or [],
        "recommended": recommended,
        "created_at": datetime.utcnow(),
    }


def build_user_checklist_doc(
    user_id: str,
    project_id: str,
    checklist_id: str,
    status: str = "pending",
) -> dict:
    """Construct a user_checklists (per-user progress) document."""
    return {
        "user_id": str(user_id),
        "project_id": str(project_id),
        "checklist_id": str(checklist_id),
        "status": status,
        "completed_at": datetime.utcnow() if status == "completed" else None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }


def build_progress_doc(
    user_id: str,
    project_id: str,
    total_tasks: int,
    completed_tasks: int,
    score: float,
) -> dict:
    """Construct a checklist_progress (aggregated snapshot) document."""
    return {
        "user_id": str(user_id),
        "project_id": str(project_id),
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "score": score,
        "updated_at": datetime.utcnow(),
    }
