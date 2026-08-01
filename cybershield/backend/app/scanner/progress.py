"""
Progress Manager — updates scan progress in MongoDB and broadcasts via WebSocket.
"""
from datetime import datetime
from app.database.db import database
from app.websocket.manager import manager as ws_manager


async def update_progress(
    scan_id: str,
    progress: int,
    current_file: str = "",
    current_stage: str = "",
    files_completed: int = 0,
    files_total: int = 0,
    eta: str = "",
    status: str = "running",
    log: str = "",
):
    """Update scan progress in MongoDB and broadcast to connected clients."""
    update_fields = {
        "progress": progress,
        "updated_at": datetime.utcnow(),
        "status": status,
    }
    if current_file:
        update_fields["current_file"] = current_file
    if current_stage:
        update_fields["current_stage"] = current_stage
    if files_completed is not None:
        update_fields["files_completed"] = files_completed
    if files_total:
        update_fields["files_total"] = files_total
    if eta:
        update_fields["eta"] = eta

    # Update scan_jobs collection
    collection = database["scan_jobs"]
    await collection.update_one(
        {"_id": scan_id if isinstance(scan_id, str) else scan_id},
        {"$set": update_fields},
        upsert=True,
    )

    # Append log entry if provided
    if log:
        await database["scan_logs"].insert_one({
            "scan_id": scan_id,
            "message": log,
            "timestamp": datetime.utcnow(),
        })

    # Broadcast progress via WebSocket
    broadcast_data = {
        "type": "scan_progress",
        "scan_id": scan_id,
        "progress": progress,
        "current_file": current_file,
        "current_stage": current_stage,
        "files_completed": files_completed,
        "files_total": files_total,
        "eta": eta,
        "status": status,
    }
    await ws_manager.broadcast(broadcast_data)


async def add_timeline_event(scan_id: str, event: str, status: str = "completed"):
    """Record a timeline event for the scan."""
    await database["scan_timeline"].insert_one({
        "scan_id": scan_id,
        "event": event,
        "status": status,
        "timestamp": datetime.utcnow(),
    })

    # Broadcast timeline event
    await ws_manager.broadcast({
        "type": "scan_timeline",
        "scan_id": scan_id,
        "event": event,
        "status": status,
        "timestamp": datetime.utcnow().isoformat(),
    })


async def add_log_entry(scan_id: str, message: str):
    """Append a log entry for the scan."""
    entry = {
        "scan_id": scan_id,
        "message": message,
        "timestamp": datetime.utcnow(),
    }
    await database["scan_logs"].insert_one(entry)

    await ws_manager.broadcast({
        "type": "scan_log",
        "scan_id": scan_id,
        "message": message,
        "timestamp": datetime.utcnow().isoformat(),
    })


async def get_scan_logs(scan_id: str, limit: int = 100) -> list:
    """Get log entries for a scan."""
    cursor = database["scan_logs"].find({"scan_id": scan_id}).sort("timestamp", 1).limit(limit)
    logs = await cursor.to_list(length=limit)
    for log in logs:
        log["_id"] = str(log["_id"])
        if "timestamp" in log:
            log["timestamp"] = log["timestamp"].isoformat()
    return logs


async def get_timeline(scan_id: str) -> list:
    """Get timeline events for a scan."""
    cursor = database["scan_timeline"].find({"scan_id": scan_id}).sort("timestamp", 1)
    events = await cursor.to_list(length=50)
    for ev in events:
        ev["_id"] = str(ev["_id"])
        if "timestamp" in ev:
            ev["timestamp"] = ev["timestamp"].isoformat()
    return events
