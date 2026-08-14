"""
Workspace service (Module 4.5) — reports, comments, activity, audit.
"""
from datetime import datetime
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId

from app.database.db import database
from app.models.workspace_model import (
    build_report_doc,
    build_comment_doc,
    build_activity_doc,
    build_audit_doc,
)
from app.models.project_model import can
from app.schemas.workspace_schema import ReportCreate, CommentCreate
from app.utils.user_names import display_name


def _serialize_report(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "project_id": doc.get("project_id"),
        "version": doc.get("version"),
        "risk_score": doc.get("risk_score", 0),
        "risk_level": doc.get("risk_level", "Medium"),
        "created_at": doc.get("created_at").isoformat()
        if isinstance(doc.get("created_at"), datetime) else None,
    }


async def require_permission(project_id: str, user_id: str, action: str) -> str:
    member = await database.project_members.find_one(
        {"project_id": project_id, "user_id": user_id}
    )
    if not member:
        raise PermissionError("Not a member of this project")
    if not can(member["role"], action):
        raise PermissionError(f"Role '{member['role']}' cannot perform '{action}'")
    return member["role"]


async def create_report(user: dict, project_id: str, payload: ReportCreate) -> dict:
    await require_permission(project_id, str(user.get("_id")), "run_analysis")
    version = await database.project_reports.count_documents({"project_id": project_id}) + 1
    doc = build_report_doc(
        project_id=project_id,
        user_id=str(user.get("_id")),
        version=version,
        risk_score=payload.risk_score,
        risk_level=payload.risk_level,
        data=payload.data,
    )
    result = await database.project_reports.insert_one(doc)
    await database.activity_logs.insert_one(
        build_activity_doc(
            project_id=project_id,
            user_id=str(user.get("_id")),
            user_name=display_name(user, "User"),
            action="Threat Report Generated",
            detail=f"Version {version} (risk {payload.risk_score})",
        )
    )
    await database.audit_logs.insert_one(
        build_audit_doc(
            user_id=str(user.get("_id")),
            user_name=display_name(user, "User"),
            action="Generated Threat Report",
            target=project_id,
        )
    )
    return _serialize_report({**doc, "_id": result.inserted_id})


async def list_reports(user: dict, project_id: str) -> list:
    await require_permission(project_id, str(user.get("_id")), "view_project")
    reports = []
    async for doc in database.project_reports.find(
        {"project_id": project_id}
    ).sort("version", -1):
        reports.append(_serialize_report(doc))
    if reports:
        return reports
    # Fall back to linked scan/threat data so project dashboards have content
    project_doc = await database.projects.find_one({"_id": ObjectId(project_id)})
    if not project_doc:
        return reports
    from app.services.project_service import _linked_risk_data
    linked = await _linked_risk_data(project_doc)
    if not linked:
        return reports
    for idx, item in enumerate(linked["linked_reports"], start=1):
        created = item["created_at"]
        reports.append({
            "id": f"linked-{idx}",
            "project_id": project_id,
            "version": idx,
            "risk_score": item["risk_score"],
            "risk_level": item["risk_level"],
            "created_at": created.isoformat() if isinstance(created, datetime) else created,
        })
    return reports


async def get_report_version(user: dict, project_id: str, version: int) -> dict:
    await require_permission(project_id, str(user.get("_id")), "view_project")
    doc = await database.project_reports.find_one(
        {"project_id": project_id, "version": version}
    )
    if not doc:
        raise ValueError("Report version not found")
    serialized = _serialize_report(doc)
    serialized["data"] = doc.get("data", {})
    return serialized


# ── Comments ───────────────────────────────────────────────────────────────────
async def add_comment(user: dict, report_id: str, content: str) -> dict:
    report = await database.project_reports.find_one({"_id": ObjectId(report_id)})
    if not report:
        raise ValueError("Report not found")
    await require_permission(report["project_id"], str(user.get("_id")), "add_comments")
    doc = build_comment_doc(
        report_id=report_id,
        user_id=str(user.get("_id")),
        user_name=display_name(user, "User"),
        content=content,
    )
    result = await database.report_comments.insert_one(doc)
    await database.activity_logs.insert_one(
        build_activity_doc(
            project_id=report["project_id"],
            user_id=str(user.get("_id")),
            user_name=display_name(user, "User"),
            action="Comment Added",
            detail=content[:60],
        )
    )
    return {
        "id": str(result.inserted_id),
        "report_id": report_id,
        "user_id": doc["user_id"],
        "user_name": display_name(doc, "User"),
        "content": doc["content"],
        "created_at": doc["created_at"].isoformat(),
    }


async def list_comments(report_id: str) -> list:
    comments = []
    async for c in database.report_comments.find(
        {"report_id": report_id}
    ).sort("created_at", 1):
        comments.append(c)
    names = await _resolve_actor_names(comments)
    return [{
        "id": str(c["_id"]),
        "report_id": c["report_id"],
        "user_id": c["user_id"],
        "user_name": names.get(c.get("user_id"), c.get("user_name", "User")),
        "content": c["content"],
        "created_at": c.get("created_at").isoformat()
        if isinstance(c.get("created_at"), datetime) else None,
    } for c in comments]


async def delete_comment(user: dict, comment_id: str) -> None:
    comment = await database.report_comments.find_one({"_id": ObjectId(comment_id)})
    if not comment:
        raise ValueError("Comment not found")
    report = await database.project_reports.find_one({"_id": ObjectId(comment["report_id"])})
    project_id = report["project_id"] if report else None
    role = await database.project_members.find_one(
        {"project_id": project_id, "user_id": str(user.get("_id"))}
    )
    role = role["role"] if role else None
    if comment["user_id"] != str(user.get("_id")) and role not in ("Owner", "Admin"):
        raise PermissionError("Cannot delete this comment")
    await database.report_comments.delete_one({"_id": ObjectId(comment_id)})
    if project_id:
        await database.activity_logs.insert_one(
            build_activity_doc(
                project_id=project_id,
                user_id=str(user.get("_id")),
                user_name=display_name(user, "User"),
                action="Comment Deleted",
            )
        )


# ── Activity & audit ──────────────────────────────────────────────────────────
async def _resolve_actor_names(records: list) -> dict:
    """Map user_id -> display name for a list of log/activity records."""
    ids = {r.get("user_id") for r in records if r.get("user_id")}
    names = {}
    for uid in ids:
        if not ObjectId.is_valid(uid):
            continue
        user_doc = await database.users.find_one({"_id": ObjectId(uid)})
        names[uid] = display_name(user_doc, "User")
    return names


async def get_timeline(user: dict, project_id: str) -> list:
    await require_permission(project_id, str(user.get("_id")), "view_project")
    activities = []
    async for a in database.activity_logs.find(
        {"project_id": project_id}
    ).sort("created_at", -1):
        activities.append(a)
    names = await _resolve_actor_names(activities)
    return [{
        "id": str(a["_id"]),
        "project_id": a["project_id"],
        "user_name": names.get(a.get("user_id"), a.get("user_name", "User")),
        "action": a.get("action"),
        "detail": a.get("detail"),
        "created_at": a.get("created_at").isoformat()
        if isinstance(a.get("created_at"), datetime) else None,
    } for a in activities]


async def get_audit(user: dict, project_id: str) -> list:
    # Audit logs are global; filter by target == project_id when available.
    await require_permission(project_id, str(user.get("_id")), "view_project")
    logs = []
    async for l in database.audit_logs.find(
        {"$or": [{"target": project_id}, {"target": None}]}
    ).sort("created_at", -1):
        logs.append(l)
    names = await _resolve_actor_names(logs)
    return [{
        "id": str(l["_id"]),
        "user_name": names.get(l.get("user_id"), l.get("user_name", "User")),
        "action": l.get("action"),
        "target": l.get("target"),
        "created_at": l.get("created_at").isoformat()
        if isinstance(l.get("created_at"), datetime) else None,
    } for l in logs]
