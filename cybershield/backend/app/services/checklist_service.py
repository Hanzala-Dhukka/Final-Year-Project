"""
Security Checklist service (Module 6.1).

Handles seeding the predefined checklists, loading per-project progress,
updating task status, computing security scores and generating a
project-specific checklist by combining the default catalogue with the
user's findings (GitHub scan / threat report / OWASP simulator).
"""
from datetime import datetime
from typing import List, Optional

from app.database.db import database
from app.data.security_checklists import CHECKLISTS
from app.models.checklist_model import (
    build_checklist_doc,
    build_user_checklist_doc,
    build_progress_doc,
    CHECKLIST_CATEGORIES,
    CHECKLIST_STATUSES,
)

CHECK_COLLECTION = "security_checklists"
USER_CHECK_COLLECTION = "user_checklists"
PROGRESS_COLLECTION = "checklist_progress"


# ── Seeding ────────────────────────────────────────────────────────────────────
async def seed_checklists() -> int:
    """Insert the default checklist catalogue if the collection is empty."""
    existing = await database[CHECK_COLLECTION].count_documents({})
    if existing > 0:
        return existing

    docs = [build_checklist_doc(**item) for item in CHECKLISTS]
    if docs:
        await database[CHECK_COLLECTION].insert_many(docs)
    return len(docs)


# ── Loaders ──────────────────────────────────────────────────────────────────
async def get_all_checklists() -> List[dict]:
    """Return every predefined checklist item with a string id."""
    cursor = database[CHECK_COLLECTION].find({})
    items = await cursor.to_list(length=1000)
    for item in items:
        item["id"] = str(item["_id"])
    return items


async def _get_checklist_by_id(checklist_id: str) -> Optional[dict]:
    try:
        from bson import ObjectId
        oid = ObjectId(checklist_id)
    except Exception:
        return None
    return await database[CHECK_COLLECTION].find_one({"_id": oid})


async def get_user_progress(user_id: str, project_id: str) -> List[dict]:
    """Return the user's progress rows joined with checklist details."""
    rows = await database[USER_CHECK_COLLECTION].find(
        {"user_id": str(user_id), "project_id": str(project_id)}
    ).to_list(length=1000)

    # Index existing progress by checklist_id
    progress_map = {r["checklist_id"]: r for r in rows}

    # Build a full merged view over the entire catalogue (so UI shows all tasks)
    result = []
    for item in await get_all_checklists():
        prog = progress_map.get(item["id"])
        result.append({
            "id": str(prog["_id"]) if prog else None,
            "checklist_id": item["id"],
            "title": item["title"],
            "category": item["category"],
            "severity": item["severity"],
            "description": item["description"],
            "frameworks": item.get("frameworks", []),
            "status": prog["status"] if prog else "pending",
            "completed_at": prog.get("completed_at").isoformat() if prog and prog.get("completed_at") else None,
        })
    return result


async def get_project_score(user_id: str, project_id: str) -> dict:
    """Compute the security score and per-category breakdown."""
    progress = await get_user_progress(user_id, project_id)
    total = len(progress)
    completed = sum(1 for p in progress if p["status"] == "completed")

    score = round((completed / total) * 100, 1) if total else 0.0

    # Per-category aggregation
    cat_totals = {c: {"total": 0, "completed": 0} for c in CHECKLIST_CATEGORIES}
    for p in progress:
        cat = p["category"]
        if cat not in cat_totals:
            cat_totals[cat] = {"total": 0, "completed": 0}
        cat_totals[cat]["total"] += 1
        if p["status"] == "completed":
            cat_totals[cat]["completed"] += 1

    by_category = []
    for cat, vals in cat_totals.items():
        if vals["total"] == 0:
            continue
        cat_score = round((vals["completed"] / vals["total"]) * 100, 1)
        by_category.append({
            "category": cat,
            "total": vals["total"],
            "completed": vals["completed"],
            "score": cat_score,
        })

    # Persist an aggregated snapshot
    await database[PROGRESS_COLLECTION].update_one(
        {"user_id": str(user_id), "project_id": str(project_id)},
        {"$set": build_progress_doc(str(user_id), str(project_id), total, completed, score)},
        upsert=True,
    )

    return {
        "project_id": str(project_id),
        "total_tasks": total,
        "completed_tasks": completed,
        "score": score,
        "by_category": by_category,
    }


# ── Mutations ──────────────────────────────────────────────────────────────────
async def update_status(user_id: str, project_id: str, checklist_id: str, status: str) -> dict:
    """Mark a checklist item's status for the user + project."""
    if status not in CHECKLIST_STATUSES:
        raise ValueError(f"Invalid status '{status}'. Must be one of {CHECKLIST_STATUSES}")

    item = await _get_checklist_by_id(checklist_id)
    if not item:
        raise ValueError("Checklist item not found")

    now = datetime.utcnow()
    update = {"status": status, "updated_at": now}
    if status == "completed":
        update["completed_at"] = now

    result = await database[USER_CHECK_COLLECTION].update_one(
        {"user_id": str(user_id), "project_id": str(project_id), "checklist_id": str(checklist_id)},
        {
            "$set": update,
            "$setOnInsert": build_user_checklist_doc(str(user_id), str(project_id), str(checklist_id), status),
        },
        upsert=True,
    )
    return {"matched": result.matched_count, "upserted": bool(result.upserted_id)}


async def generate_project_checklist(user_id: str, project_id: str,
                                     finding: Optional[str] = None,
                                     technology: Optional[str] = None) -> dict:
    """
    Generate (seed) a project-specific checklist.

    For Module 6.1 this seeds the user's progress rows from the full default
    catalogue (so every task is visible for the project) and stamps any extra
    requirement derived from an inbound finding. Future AI phases will expand
    the `finding` branch to analyse the threat report + tech stack.
    """
    all_items = await get_all_checklists()

    created = 0
    for item in all_items:
        res = await database[USER_CHECK_COLLECTION].update_one(
            {
                "user_id": str(user_id),
                "project_id": str(project_id),
                "checklist_id": item["id"],
            },
            {
                "$setOnInsert": build_user_checklist_doc(
                    str(user_id), str(project_id), item["id"], "pending"
                ),
            },
            upsert=True,
        )
        if res.upserted_id:
            created += 1

    return {
        "project_id": str(project_id),
        "created": created,
        "total": len(all_items),
        "message": "Project checklist generated from the security hardening catalogue.",
    }
