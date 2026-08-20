"""
Log viewer routes — inspect the `log` collection (admin only).

Lets the developer see every error the server has recorded in real time.
"""
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database.db import database
from app.dependencies.admin_auth import admin_required
from app.services.error_log_service import fire_and_forget_log

router = APIRouter()

LOG_COLLECTION = "log"


def _serialize(log: dict) -> dict:
    """Convert a raw MongoDB document into a JSON-safe dict."""
    log["_id"] = str(log["_id"])
    return log


@router.get("/logs")
async def get_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    error_type: Optional[str] = Query(None, description="Filter by Error_Type (e.g. ValueError)"),
    function: Optional[str] = Query(None, description="Filter by Function name"),
    file_name: Optional[str] = Query(None, description="Filter by File_Name"),
    current_user=Depends(admin_required),
):
    """
    List the most recent server error logs (newest first).
    """
    try:
        query = {}
        if error_type:
            query["Error_Type"] = error_type
        if function:
            query["Function"] = {"$regex": function, "$options": "i"}
        if file_name:
            query["File_Name"] = {"$regex": file_name, "$options": "i"}

        total = await database[LOG_COLLECTION].count_documents(query)
        cursor = (
            database[LOG_COLLECTION]
            .find(query)
            .sort("DateTime", -1)
            .skip(skip)
            .limit(limit)
        )
        logs: List[dict] = []
        async for log in cursor:
            logs.append(_serialize(log))
        return {"total": total, "skip": skip, "limit": limit, "logs": logs}
    except Exception as e:
        fire_and_forget_log()
        raise HTTPException(status_code=500, detail=f"Failed to fetch logs: {str(e)}")


@router.get("/logs/stats")
async def get_log_stats(current_user=Depends(admin_required)):
    """
    Quick overview: total errors + count grouped by error type.
    """
    try:
        total = await database[LOG_COLLECTION].count_documents({})
        pipeline = [
            {"$group": {"_id": "$Error_Type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        by_type = []
        async for doc in database[LOG_COLLECTION].aggregate(pipeline):
            by_type.append({"type": doc["_id"] or "Unknown", "count": doc["count"]})
        return {"total": total, "by_type": by_type}
    except Exception as e:
        fire_and_forget_log()
        raise HTTPException(status_code=500, detail=f"Failed to compute log stats: {str(e)}")


@router.get("/logs/old")
async def get_old_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    error_type: Optional[str] = Query(None, description="Filter by Error_Type"),
    status: Optional[str] = Query(None, description="Filter by Status (resolved / auto_resolved / archived)"),
    current_user=Depends(admin_required),
):
    """
    List entries that were moved to old_logs (resolved issues).
    """
    from app.services.log_archiver import get_old_logs as fetch_old_logs
    total, logs = await fetch_old_logs(skip, limit, error_type, status)
    return {"total": total, "skip": skip, "limit": limit, "logs": logs}


@router.get("/logs/old/{log_id}")
async def get_old_log_by_id(log_id: str, current_user=Depends(admin_required)):
    """
    Fetch a single resolved entry from old_logs.
    """
    from app.services.log_archiver import get_old_log_by_id as fetch_old_log
    log = await fetch_old_log(log_id)
    if log is None:
        raise HTTPException(status_code=404, detail="Old log entry not found")
    return log


@router.delete("/logs/old/{log_id}")
async def delete_old_log(log_id: str, current_user=Depends(admin_required)):
    """
    Delete a single old_logs entry (housekeeping).
    """
    from app.services.log_archiver import delete_old_log as remove_old_log
    if not await remove_old_log(log_id):
        raise HTTPException(status_code=404, detail="Old log entry not found")
    return {"deleted": True, "id": log_id}


@router.post("/logs/{log_id}/resolve")
async def resolve_log(log_id: str, note: Optional[str] = None,
                      current_user=Depends(admin_required)):
    """
    Mark a log entry as resolved and move it from `log` to `old_logs`.
    """
    from app.services.log_archiver import resolve_log as archive_resolved_log
    resolved_by = str(current_user.get("email") or current_user.get("username") or "admin")
    moved = await archive_resolved_log(log_id, resolved_by=resolved_by, note=note)
    if not moved:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return {"resolved": True, "id": log_id, "moved_to": "old_logs"}


@router.get("/logs/{log_id}")
async def get_log_by_id(log_id: str, current_user=Depends(admin_required)):
    """
    Fetch a single log entry by its MongoDB ObjectId.
    """
    try:
        log = await database[LOG_COLLECTION].find_one({"_id": ObjectId(log_id)})
    except Exception:
        fire_and_forget_log()
        raise HTTPException(status_code=400, detail="Invalid log id")
    if log is None:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return _serialize(log)


@router.delete("/logs/{log_id}")
async def delete_log(log_id: str, current_user=Depends(admin_required)):
    """
    Delete a single log entry (housekeeping).
    """
    try:
        result = await database[LOG_COLLECTION].delete_one({"_id": ObjectId(log_id)})
    except Exception:
        fire_and_forget_log()
        raise HTTPException(status_code=400, detail="Invalid log id")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return {"deleted": True, "id": log_id}