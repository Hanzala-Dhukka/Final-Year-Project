"""
Project service (Module 4.5) — manages projects and members.
"""
import re
from datetime import datetime
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId

from app.database.db import database
from app.models.project_model import build_project_doc, build_member_doc, can
from app.schemas.project_schema import ProjectCreate, ProjectUpdate
from app.services.risk_engine import calculate_risk_score_from_severity
from app.utils.user_names import display_name
from app.services.error_log_service import fire_and_forget_log


# ── Membership helpers ─────────────────────────────────────────────────────────
async def get_member_role(project_id: str, user_id: str) -> Optional[str]:
    member = await database.project_members.find_one(
        {"project_id": project_id, "user_id": user_id}
    )
    return member.get("role") if member else None


async def require_permission(project_id: str, user_id: str, action: str) -> str:
    """Return the member role if permitted, else raise 403."""
    role = await get_member_role(project_id, user_id)
    if role is None:
        raise PermissionError("You are not a member of this project")
    if not can(role, action):
        raise PermissionError(f"Role '{role}' cannot perform '{action}'")
    return role


def _serialize_project(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "owner_id": doc.get("owner_id"),
        "name": doc.get("name"),
        "description": doc.get("description", ""),
        "tech_stack": doc.get("tech_stack", []),
        "status": doc.get("status", "Active"),
        "repo_url": doc.get("repo_url", ""),
        "created_at": doc.get("created_at").isoformat()
        if isinstance(doc.get("created_at"), datetime) else None,
    }


def _score_from_source(src: dict, key: str):
    """Return a risk score field favouring the numeric value."""
    for field in (key, "security_score", "risk_score"):
        val = src.get(field)
        if isinstance(val, (int, float)) and not isinstance(val, bool):
            return int(val)
    return None


async def _linked_risk_data(project_doc: dict) -> Optional[dict]:
    """Find scan/threat data for a project when it has no report versions.

    Precedence:
      1. github_scans matching the project id (primary live scan store).
      2. github_scans matching the project repo_url.
      3. threat_reports matching the project name (case-insensitive).
      4. reports matching the project repo_url (case-insensitive).
    Returns a dict with latest_risk_score / latest_risk_level / latest_scan_at
    and a list of linked reports, or None when nothing matches.
    """
    project_id = str(project_doc.get("_id") or "")
    name = (project_doc.get("name") or "").strip()
    repo_url = (project_doc.get("repo_url") or "").strip()

    def _when(doc) -> datetime:
        raw = doc.get("created_at")
        if isinstance(raw, datetime):
            return raw
        if isinstance(raw, str):
            try:
                return datetime.fromisoformat(raw.replace("Z", "+00:00"))
            except ValueError:
                fire_and_forget_log()
                return datetime.min
        return datetime.min

    linked = []

    def _add(doc, created_at):
        cache = doc.get("dashboard_cache") or {}
        risk_score = _score_from_source(cache, "risk_score")
        if risk_score is None:
            risk_score = _score_from_source(doc, "risk_score")
        if risk_score is None:
            risk_score = _score_from_source(doc, "security_score") or 0
        # Prefer a severity-derived risk score (higher = worse) for GitHub
        # scans so the dashboard gauge matches the scanner UI.
        severity = doc.get("severity_summary") or \
            (doc.get("risk_dashboard") or {}).get("severity_distribution") or {}
        if severity:
            derived = calculate_risk_score_from_severity(severity)
            if derived > 0:
                risk_score = derived
        risk_level = cache.get("risk_level") or doc.get("risk_level", "Unknown")
        linked.append({
            "risk_score": risk_score,
            "risk_level": risk_level,
            "created_at": created_at,
        })

    # 1+2. Live GitHub scans (stored with project_id + repo_url).
    scan_query = {"project_id": project_id} if project_id else {}
    scan_docs = [d async for d in database.github_scans.find(scan_query)] \
        if scan_query else []
    if not scan_docs and repo_url:
        scan_docs = [d async for d in database.github_scans.find(
            {"repo_url": {"$regex": f"^{re.escape(repo_url)}$", "$options": "i"}}
        )]
    for doc in scan_docs:
        _add(doc, _when(doc))

    # 3. AI threat reports by project name.
    threat_query = {}
    if name:
        threat_query = {"project_name": {"$regex":
            f"^{re.escape(name)}$", "$options": "i"}}
    threat_docs = [d async for d in database.threat_reports.find(threat_query)] \
        if name else []

    # 4. Legacy reports by repo_url.
    legacy_query = {}
    if repo_url:
        legacy_query = {"repo_url": {"$regex":
            f"^{re.escape(repo_url)}$", "$options": "i"}}
    legacy_docs = [d async for d in database.reports.find(legacy_query)] \
        if repo_url else []

    for doc in threat_docs:
        _add(doc, _when(doc))
    for doc in legacy_docs:
        _add(doc, _when(doc))

    if not linked:
        return None

    linked.sort(key=lambda r: r["created_at"] or datetime.min, reverse=True)
    latest = linked[0]
    return {
        "latest_risk_score": latest["risk_score"],
        "latest_risk_level": latest["risk_level"],
        "latest_scan_at": latest["created_at"],
        "linked_reports": linked,
    }


# ── Projects ───────────────────────────────────────────────────────────────────
async def _trigger_auto_scan(project_id: str, repo_url: str, user_id: str) -> None:
    """Kick off a background GitHub scan for a project without blocking the request."""
    import asyncio
    from app.services import scheduled_scan
    try:
        asyncio.create_task(
            scheduled_scan.schedule_project_scan(project_id, repo_url, user_id)
        )
    except Exception as e:
        fire_and_forget_log()
        print(f"[projects] failed to start auto scan for {project_id}: {e}")


async def create_project(user: dict, payload: ProjectCreate) -> dict:
    user_id = str(user.get("_id"))
    doc = build_project_doc(
        owner_id=user_id,
        name=payload.name,
        description=payload.description,
        tech_stack=payload.tech_stack,
        status=payload.status,
        repo_url=payload.repo_url,
    )
    result = await database.projects.insert_one(doc)
    project_id = str(result.inserted_id)
    # Owner membership
    await database.project_members.insert_one(
        build_member_doc(project_id, user_id, "Owner")
    )
    await log_activity(project_id, user, "Project Created",
                       detail=f"Created project '{payload.name}'")
    await log_audit(user, "Created Project", target=project_id)
    # Automatically scan the linked GitHub repository (non-blocking).
    if payload.repo_url and payload.repo_url.strip():
        await _trigger_auto_scan(project_id, payload.repo_url.strip(), user_id)
    return _serialize_project({**doc, "_id": result.inserted_id})


async def list_projects(user: dict) -> list:
    user_id = str(user.get("_id"))
    member_project_ids = [
        m["project_id"] async for m in database.project_members.find({"user_id": user_id})
    ]
    projects = []
    async for doc in database.projects.find(
        {"_id": {"$in": [ObjectId(pid) for pid in member_project_ids if ObjectId.is_valid(pid)]}}
    ).sort("created_at", -1):
        serialized = _serialize_project(doc)
        serialized["member_count"] = await database.project_members.count_documents(
            {"project_id": str(doc["_id"])}
        )
        serialized["report_count"] = await database.project_reports.count_documents(
            {"project_id": str(doc["_id"])}
        )
        latest = await database.project_reports.find_one(
            {"project_id": str(doc["_id"])}, sort=[("created_at", -1)]
        )
        if latest:
            serialized["latest_risk_score"] = latest.get("risk_score")
            serialized["latest_risk_level"] = latest.get("risk_level")
            serialized["latest_scan_at"] = latest.get("created_at")
        else:
            linked = await _linked_risk_data(doc)
            serialized["latest_risk_score"] = linked["latest_risk_score"] if linked else None
            serialized["latest_risk_level"] = linked["latest_risk_level"] if linked else None
            serialized["latest_scan_at"] = linked["latest_scan_at"] if linked else None
        projects.append(serialized)
    return projects


async def get_project(user: dict, project_id: str) -> dict:
    await require_permission(project_id, str(user.get("_id")), "view_project")
    doc = await database.projects.find_one({"_id": ObjectId(project_id)})
    if not doc:
        raise ValueError("Project not found")
    serialized = _serialize_project(doc)
    # Enrich with counts (same as list_projects)
    serialized["member_count"] = await database.project_members.count_documents(
        {"project_id": project_id}
    )
    serialized["report_count"] = await database.project_reports.count_documents(
        {"project_id": project_id}
    )
    latest = await database.project_reports.find_one(
        {"project_id": project_id}, sort=[("created_at", -1)]
    )
    if latest:
        serialized["latest_risk_score"] = latest.get("risk_score")
        serialized["latest_risk_level"] = latest.get("risk_level")
        serialized["latest_scan_at"] = latest.get("created_at")
    else:
        linked = await _linked_risk_data(doc)
        serialized["latest_risk_score"] = linked["latest_risk_score"] if linked else None
        serialized["latest_risk_level"] = linked["latest_risk_level"] if linked else None
        serialized["latest_scan_at"] = linked["latest_scan_at"] if linked else None
    return serialized


async def update_project(user: dict, project_id: str, payload: ProjectUpdate) -> dict:
    await require_permission(project_id, str(user.get("_id")), "edit_project")
    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not update:
        return await get_project(user, project_id)
    update["updated_at"] = datetime.utcnow()
    # Re-scan when the repository URL changes.
    new_repo = (update.get("repo_url") or "").strip()
    if new_repo:
        current = await database.projects.find_one({"_id": ObjectId(project_id)})
        if not current or (current.get("repo_url") or "").strip() != new_repo:
            await _trigger_auto_scan(project_id, new_repo, str(user.get("_id")))
    await database.projects.update_one({"_id": ObjectId(project_id)}, {"$set": update})
    await log_activity(project_id, user, "Project Updated")
    await log_audit(user, "Updated Project", target=project_id)
    return await get_project(user, project_id)


async def delete_project(user: dict, project_id: str) -> None:
    await require_permission(project_id, str(user.get("_id")), "edit_project")
    await database.projects.delete_one({"_id": ObjectId(project_id)})
    # Cascade
    await database.project_members.delete_many({"project_id": project_id})
    await database.project_reports.delete_many({"project_id": project_id})
    await database.report_comments.delete_many({"project_id": project_id})
    await database.activity_logs.delete_many({"project_id": project_id})
    await log_audit(user, "Deleted Project", target=project_id)


# ── Members ────────────────────────────────────────────────────────────────────
async def invite_member(user: dict, project_id: str, user_id: str, email: str,
                        role: str) -> dict:
    await require_permission(project_id, str(user.get("_id")), "invite_members")
    target_id = user_id
    if not target_id and email:
        target = await database.users.find_one({"email": email})
        if not target:
            raise ValueError("No user found with that email")
        target_id = str(target["_id"])
    if not target_id:
        raise ValueError("user_id or email is required")
    if role not in ["Owner", "Admin", "Developer", "Viewer"]:
        raise ValueError("Invalid role")
    existing = await database.project_members.find_one(
        {"project_id": project_id, "user_id": target_id}
    )
    if existing:
        raise ValueError("User is already a member")
    await database.project_members.insert_one(
        build_member_doc(project_id, target_id, role)
    )
    target_user = await database.users.find_one({"_id": ObjectId(target_id)})
    member_name = display_name(target_user, "A user")
    await log_activity(project_id, user, "Member Joined",
                       detail=f"{member_name} added as {role}")
    await log_audit(user, "Invited Member", target=project_id)
    return await get_member(project_id, target_id)


async def get_member(project_id: str, user_id: str) -> dict:
    member = await database.project_members.find_one(
        {"project_id": project_id, "user_id": user_id}
    )
    if not member:
        raise ValueError("Member not found")
    user = await database.users.find_one({"_id": ObjectId(member["user_id"])})
    return {
        "id": str(member["_id"]),
        "project_id": member["project_id"],
        "user_id": member["user_id"],
        "user_name": display_name(user, "User"),
        "email": user.get("email", "") if user else "",
        "role": member["role"],
    }


async def list_members(user: dict, project_id: str) -> list:
    await require_permission(project_id, str(user.get("_id")), "view_project")
    members = []
    async for m in database.project_members.find({"project_id": project_id}):
        user_doc = await database.users.find_one({"_id": ObjectId(m["user_id"])})
        members.append({
            "id": str(m["_id"]),
            "project_id": m["project_id"],
            "user_id": m["user_id"],
            "user_name": display_name(user_doc, "User"),
            "email": user_doc.get("email", "") if user_doc else "",
            "role": m["role"],
        })
    return members


async def remove_member(user: dict, project_id: str, target_user_id: str) -> None:
    role = await require_permission(project_id, str(user.get("_id")), "manage_members")
    member = await database.project_members.find_one(
        {"project_id": project_id, "user_id": target_user_id}
    )
    if not member:
        raise ValueError("Member not found")
    if member["role"] == "Owner" and role != "Owner":
        raise PermissionError("Only the owner can remove the owner")
    await database.project_members.delete_one({"_id": member["_id"]})
    await log_activity(project_id, user, "Member Removed")
    await log_audit(user, "Removed Member", target=project_id)


# ── Activity / audit logging ──────────────────────────────────────────────────
async def log_activity(project_id: str, user: dict, action: str, detail: str = None):
    from app.models.workspace_model import build_activity_doc
    await database.activity_logs.insert_one(
        build_activity_doc(
            project_id=project_id,
            user_id=str(user.get("_id")),
            user_name=display_name(user, "User"),
            action=action,
            detail=detail,
        )
    )


async def log_audit(user: dict, action: str, target: str = None):
    from app.models.workspace_model import build_audit_doc
    await database.audit_logs.insert_one(
        build_audit_doc(
            user_id=str(user.get("_id")),
            user_name=display_name(user, "User"),
            action=action,
            target=target,
        )
    )
