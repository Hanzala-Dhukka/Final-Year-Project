"""
MongoDB document models for the AI Remediation Engine (Module 5.4).

Collections:
  remediation_reports   - one report per generated fix (the remediation advice)
  remediation_actions   - status-change / fix actions performed on a report
  fixed_vulnerabilities  - vulnerabilities confirmed resolved after re-scan
"""
import uuid
from datetime import datetime, timezone
from typing import Optional


def new_id() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def remediation_document(
    user_id: str,
    project_id: str,
    vulnerability_id: str,
    finding: str,
    severity: str,
    technology: str,
    ai_solution: dict,
    risk_before: int = None,
    risk_after: int = None,
    source: str = None,
) -> dict:
    """
    Full remediation report stored in `remediation_reports`.

    Shaped to match spec Step 3.
    """
    now = utcnow()
    return {
        "_id": new_id(),
        "user_id": user_id,
        "project_id": project_id,
        "vulnerability_id": vulnerability_id,
        "finding": finding,
        "severity": severity,
        "technology": technology,
        "source": source,  # github_scan | threat_report | code_review | manual
        "ai_solution": {
            "explanation": ai_solution.get("explanation", ""),
            "impact": ai_solution.get("impact", []),
            "root_cause": ai_solution.get("root_cause", ""),
            "solution": ai_solution.get("solution", []),
            "secure_code": ai_solution.get("secure_code", ""),
            "prevention": ai_solution.get("prevention", []),
            "category": ai_solution.get("category", ""),
            "owasp": ai_solution.get("owasp", ""),
            "cwe": ai_solution.get("cwe", ""),
            "risk_before": risk_before,
            "risk_after": risk_after,
        },
        "status": "Open",  # Open | In Progress | Fixed
        "created_at": now,
        "updated_at": now,
    }


def remediation_action_document(
    report_id: str,
    user_id: str,
    action: str,
    detail: dict = None,
) -> dict:
    """An audit/action entry stored in `remediation_actions`."""
    now = utcnow()
    return {
        "_id": new_id(),
        "report_id": report_id,
        "user_id": user_id,
        "action": action,  # generate | status_change | mark_fixed
        "detail": detail or {},
        "created_at": now,
    }


def fixed_vulnerability_document(
    report_id: str,
    user_id: str,
    project_id: str,
    finding: str,
    severity: str,
    technology: str,
    rescan_summary: dict = None,
) -> dict:
    """A confirmed-resolved vulnerability stored in `fixed_vulnerabilities`."""
    now = utcnow()
    return {
        "_id": new_id(),
        "report_id": report_id,
        "user_id": user_id,
        "project_id": project_id,
        "finding": finding,
        "severity": severity,
        "technology": technology,
        "rescan_summary": rescan_summary or {},
        "fixed_at": now,
    }


def to_object_id(value: str):
    from bson import ObjectId

    try:
        return ObjectId(value)
    except Exception:
        return None
