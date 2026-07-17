"""
Project service (Module 4.5) — manages projects and members.
"""
from datetime import datetime
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId

from app.database.db import database
from app.models.project_model import build_project_doc, build_member_doc, can
from app.schemas.project_schema import ProjectCreate, ProjectUpdate


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
        "created_at": doc.get("created_at").isoformat()
        if isinstance(doc.get("created_at"), datetime) else None,
    }


# ── Projects ───────────────────────────────────────────────────────────────────
async def create_project(user: dict, payload: ProjectCreate) -> dict:
    user_id = str(user.get("_id"))
    doc = build_project_doc(
        owner_id=user_id,
        name=payload.name,
        description=payload.description,
        tech_stack=payload.tech_stack,
        status=payload.status,
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
        serialized["latest_risk_score"] = latest.get("risk_score") if latest else None
        serialized["latest_risk_level"] = latest.get("risk_level") if latest else None
        projects.append(serialized)
    return projects


async def get_project(user: dict, project_id: str) -> dict:
    await require_permission(project_id, str(user.get("_id")), "view_project")
    doc = await database.projects.find_one({"_id": ObjectId(project_id)})
    if not doc:
        raise ValueError("Project not found")
    return _serialize_project(doc)


async def update_project(user: dict, project_id: str, payload: ProjectUpdate) -> dict:
    await require_permission(project_id, str(user.get("_id")), "edit_project")
    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not update:
        return await get_project(user, project_id)
    update["updated_at"] = datetime.utcnow()
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
    display_name = target_user.get("full_name", "A user") if target_user else "A user"
    await log_activity(project_id, user, "Member Joined",
                       detail=f"{display_name} added as {role}")
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
        "user_name": user.get("full_name", "User") if user else "User",
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
            "user_name": user_doc.get("full_name", "User") if user_doc else "User",
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
            user_name=user.get("full_name", "User"),
            action=action,
            detail=detail,
        )
    )


async def log_audit(user: dict, action: str, target: str = None):
    from app.models.workspace_model import build_audit_doc
    await database.audit_logs.insert_one(
        build_audit_doc(
            user_id=str(user.get("_id")),
            user_name=user.get("full_name", "User"),
            action=action,
            target=target,
        )
    )
