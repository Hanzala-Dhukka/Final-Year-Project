"""
Collaboration service (Module 4.5) — version comparison & secure sharing.
"""
import secrets
import uuid
from datetime import datetime, timedelta
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId

from app.database.db import database
from app.models.workspace_model import build_share_doc
from app.models.project_model import can
from app.schemas.collaboration_schema import SharedReportResponse


async def require_permission(project_id: str, user_id: str, action: str) -> str:
    member = await database.project_members.find_one(
        {"project_id": project_id, "user_id": user_id}
    )
    if not member:
        raise PermissionError("Not a member of this project")
    if not can(member["role"], action):
        raise PermissionError(f"Role '{member['role']}' cannot perform '{action}'")
    return member["role"]


async def compare_versions(user: dict, project_id: str,
                           version_a: int, version_b: int) -> dict:
    await require_permission(project_id, str(user.get("_id")), "view_project")
    a = await database.project_reports.find_one(
        {"project_id": project_id, "version": version_a}
    )
    b = await database.project_reports.find_one(
        {"project_id": project_id, "version": version_b}
    )
    if not a or not b:
        raise ValueError("One or both versions not found")

    score_a = a.get("risk_score", 0)
    score_b = b.get("risk_score", 0)

    # Derive threat deltas from severity breakdowns stored in data (if present).
    data_a = a.get("data", {}).get("distribution", {})
    data_b = b.get("data", {}).get("distribution", {})
    sev_a = data_a.get("critical", 0) + data_a.get("high", 0)
    sev_b = data_b.get("critical", 0) + data_b.get("high", 0)
    if sev_b >= sev_a:
        new_threats = sev_b - sev_a
        resolved_threats = 0
    else:
        new_threats = 0
        resolved_threats = sev_a - sev_b

    details = []
    for key in ["critical", "high", "medium", "low"]:
        va = data_a.get(key, 0)
        vb = data_b.get(key, 0)
        if va != vb:
            details.append({
                "severity": key,
                "from": va,
                "to": vb,
                "delta": vb - va,
            })

    return {
        "version_a": version_a,
        "version_b": version_b,
        "risk_a": score_a,
        "risk_b": score_b,
        "risk_diff": score_b - score_a,
        "new_threats": new_threats,
        "resolved_threats": resolved_threats,
        "details": details,
    }


async def create_share(user: dict, report_id: str,
                       expires_in_days: int, password: Optional[str]) -> dict:
    report = await database.project_reports.find_one({"_id": ObjectId(report_id)})
    if not report:
        raise ValueError("Report not found")
    await require_permission(report["project_id"], str(user.get("_id")), "view_project")
    token = secrets.token_urlsafe(16)
    expires_at = datetime.utcnow() + timedelta(days=max(1, expires_in_days))
    doc = build_share_doc(report_id, token, expires_at, password)
    await database.shared_links.insert_one(doc)
    return {
        "token": token,
        "url": f"/report/share/{token}",
        "expires_at": expires_at.isoformat(),
    }


async def get_shared_report(token: str, password: Optional[str] = None) -> dict:
    link = await database.shared_links.find_one({"token": token})
    if not link:
        raise ValueError("Invalid share link")
    if link.get("revoked"):
        raise ValueError("This share link has been revoked")
    expires = link.get("expires_at")
    if expires and expires < datetime.utcnow():
        raise ValueError("This share link has expired")
    if link.get("password") and link.get("password") != password:
        raise ValueError("Incorrect password")
    report = await database.project_reports.find_one({"_id": ObjectId(link["report_id"])})
    if not report:
        raise ValueError("Report not found")
    project = await database.projects.find_one({"_id": ObjectId(report["project_id"])})
    return {
        "report_id": link["report_id"],
        "project": project.get("name", "Shared Report") if project else "Shared Report",
        "version": report.get("version"),
        "risk_score": report.get("risk_score", 0),
        "risk_level": report.get("risk_level", "Medium"),
        "data": report.get("data", {}),
        "shared_at": link.get("created_at").isoformat()
        if isinstance(link.get("created_at"), datetime) else None,
    }


async def revoke_share(user: dict, token: str) -> None:
    link = await database.shared_links.find_one({"token": token})
    if not link:
        raise ValueError("Share link not found")
    report = await database.project_reports.find_one({"_id": ObjectId(link["report_id"])})
    if report:
        await require_permission(report["project_id"], str(user.get("_id")), "view_project")
    await database.shared_links.update_one({"token": token}, {"$set": {"revoked": True}})
