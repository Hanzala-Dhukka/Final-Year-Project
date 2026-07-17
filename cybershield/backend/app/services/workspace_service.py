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
            user_name=user.get("full_name", "User"),
            action="Threat Report Generated",
            detail=f"Version {version} (risk {payload.risk_score})",
        )
    )
    await database.audit_logs.insert_one(
        build_audit_doc(
            user_id=str(user.get("_id")),
            user_name=user.get("full_name", "User"),
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
        user_name=user.get("full_name", "User"),
        content=content,
    )
    result = await database.report_comments.insert_one(doc)
    await database.activity_logs.insert_one(
        build_activity_doc(
            project_id=report["project_id"],
            user_id=str(user.get("_id")),
            user_name=user.get("full_name", "User"),
            action="Comment Added",
            detail=content[:60],
        )
    )
    return {
        "id": str(result.inserted_id),
        "report_id": report_id,
        "user_id": doc["user_id"],
        "user_name": doc["user_name"],
        "content": doc["content"],
        "created_at": doc["created_at"].isoformat(),
    }


async def list_comments(report_id: str) -> list:
    comments = []
    async for c in database.report_comments.find(
        {"report_id": report_id}
    ).sort("created_at", 1):
        comments.append({
            "id": str(c["_id"]),
            "report_id": c["report_id"],
            "user_id": c["user_id"],
            "user_name": c.get("user_name", "User"),
            "content": c["content"],
            "created_at": c.get("created_at").isoformat()
            if isinstance(c.get("created_at"), datetime) else None,
        })
    return comments


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
                user_name=user.get("full_name", "User"),
                action="Comment Deleted",
            )
        )


# ── Activity & audit ──────────────────────────────────────────────────────────
async def get_timeline(user: dict, project_id: str) -> list:
    await require_permission(project_id, str(user.get("_id")), "view_project")
    activities = []
    async for a in database.activity_logs.find(
        {"project_id": project_id}
    ).sort("created_at", -1):
        activities.append({
            "id": str(a["_id"]),
            "project_id": a["project_id"],
            "user_name": a.get("user_name", "User"),
            "action": a.get("action"),
            "detail": a.get("detail"),
            "created_at": a.get("created_at").isoformat()
            if isinstance(a.get("created_at"), datetime) else None,
        })
    return activities


async def get_audit(user: dict, project_id: str) -> list:
    # Audit logs are global; filter by target == project_id when available.
    await require_permission(project_id, str(user.get("_id")), "view_project")
    logs = []
    async for l in database.audit_logs.find(
        {"$or": [{"target": project_id}, {"target": None}]}
    ).sort("created_at", -1):
        logs.append({
            "id": str(l["_id"]),
            "user_name": l.get("user_name", "User"),
            "action": l.get("action"),
            "target": l.get("target"),
            "created_at": l.get("created_at").isoformat()
            if isinstance(l.get("created_at"), datetime) else None,
        })
    return logs
