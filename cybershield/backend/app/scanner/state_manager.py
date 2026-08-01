"""
State Manager — manages scan job state in MongoDB (create, cancel, resume, get).
"""
from datetime import datetime
from bson import ObjectId
from app.database.db import database


async def create_scan_job(
    user_id: str,
    repository: str,
    repo_url: str,
    files: list,
    branch: str = "main",
    scan_config: dict = None,
) -> str:
    """Create a new scan job in MongoDB. Returns the job ID string."""
    doc = {
        "user_id": user_id,
        "repository": repository,
        "repo_url": repo_url,
        "branch": branch,
        "status": "queued",
        "progress": 0,
        "current_file": "",
        "current_stage": "Queued",
        "files": files,
        "files_total": len(files),
        "files_completed": 0,
        "eta": "",
        "scan_config": scan_config or {},
        "vulnerabilities": [],
        "risk_score": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await database["scan_jobs"].insert_one(doc)
    return str(result.inserted_id)


async def get_scan_job(scan_id: str) -> dict:
    """Get a scan job by ID."""
    doc = await database["scan_jobs"].find_one({"_id": ObjectId(scan_id)})
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc


async def update_scan_job(scan_id: str, updates: dict):
    """Update fields on a scan job."""
    updates["updated_at"] = datetime.utcnow()
    await database["scan_jobs"].update_one(
        {"_id": ObjectId(scan_id)},
        {"$set": updates},
    )


async def cancel_scan_job(scan_id: str) -> bool:
    """Cancel a running scan. Returns True if the job was cancelled."""
    doc = await database["scan_jobs"].find_one({"_id": ObjectId(scan_id)})
    if not doc:
        return False
    if doc.get("status") not in ("queued", "running"):
        return False

    await update_scan_job(scan_id, {
        "status": "cancelled",
        "current_stage": "Cancelled by user",
    })
    return True


async def get_user_scans(user_id: str, limit: int = 20) -> list:
    """Get recent scan jobs for a user."""
    cursor = database["scan_jobs"].find(
        {"user_id": user_id}
    ).sort("created_at", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    for doc in docs:
        doc["_id"] = str(doc["_id"])
        if "created_at" in doc:
            doc["created_at"] = doc["created_at"].isoformat()
        if "updated_at" in doc:
            doc["updated_at"] = doc["updated_at"].isoformat()
        # Don't send full file list in list view
        doc.pop("files", None)
    return docs


async def reset_stale_jobs():
    """Reset any jobs stuck in 'queued' or 'running' state (e.g. after server restart)."""
    result = await database["scan_jobs"].update_many(
        {"status": {"$in": ["queued", "running"]}},
        {"$set": {"status": "failed", "current_stage": "Interrupted — server restarted"}},
    )
    if result.modified_count > 0:
        print(f"[Scanner] Reset {result.modified_count} stale scan job(s).")
