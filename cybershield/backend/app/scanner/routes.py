"""
Scanner API routes — start, cancel, resume, status, logs, timeline.
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId

from app.dependencies.auth import get_current_user
from app.database.db import database
from app.scanner.queue import enqueue_scan, get_queue_size
from app.scanner.state_manager import (
    create_scan_job,
    get_scan_job,
    cancel_scan_job,
    get_user_scans,
    update_scan_job,
)
from app.scanner.progress import get_scan_logs, get_timeline
from app.github.utils import extract_repo_name
from app.github.parser import get_repository, scan_tree
from app.websocket.manager import manager as ws_manager

router = APIRouter()


@router.post("/start")
async def start_scan(data: dict, current_user: dict = Depends(get_current_user)):
    """Start a new security scan — validates, fetches file list, enqueues job."""
    repo_url = data.get("repo_url", "")
    branch = data.get("branch", "main")
    scan_config = data.get("scan_config", {})

    if not repo_url:
        raise HTTPException(status_code=400, detail="Repository URL is required")

    # Check for duplicate active scans
    existing = await database["scan_jobs"].find_one({
        "user_id": current_user["_id"],
        "repo_url": repo_url,
        "status": {"$in": ["queued", "running"]},
    })
    if existing:
        raise HTTPException(
            status_code=409,
            detail="A scan is already in progress for this repository.",
        )

    # Validate and fetch repo
    try:
        repo_name = extract_repo_name(repo_url)
        repo = get_repository(repo_name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot access repository: {str(e)}")

    # Fetch file tree
    try:
        tree = repo.get_git_tree(repo.default_branch, recursive=True)
        files = [item.path for item in tree.tree if item.type == "blob"]
    except Exception:
        files = []

    if not files:
        raise HTTPException(status_code=400, detail="No files found in repository")

    # Create scan job
    scan_id = await create_scan_job(
        user_id=current_user["_id"],
        repository=repo_name,
        repo_url=repo_url,
        files=files,
        branch=branch,
        scan_config=scan_config,
    )

    # Enqueue
    await enqueue_scan({"scan_id": scan_id, "user_id": current_user["_id"]})

    # Broadcast scan started
    await ws_manager.broadcast({
        "type": "scan_started",
        "scan_id": scan_id,
        "repository": repo_name,
        "files_total": len(files),
        "user_id": current_user["_id"],
    })

    return {
        "scan_id": scan_id,
        "status": "queued",
        "files_total": len(files),
        "queue_position": await get_queue_size(),
    }


@router.get("/{scan_id}/status")
async def get_status(scan_id: str, current_user: dict = Depends(get_current_user)):
    """Get real-time scan status and progress."""
    job = await get_scan_job(scan_id)
    if not job:
        raise HTTPException(status_code=404, detail="Scan not found")
    if job.get("user_id") != current_user["_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    return {
        "scan_id": scan_id,
        "status": job.get("status"),
        "progress": job.get("progress", 0),
        "current_file": job.get("current_file", ""),
        "current_stage": job.get("current_stage", ""),
        "files_completed": job.get("files_completed", 0),
        "files_total": job.get("files_total", 0),
        "eta": job.get("eta", ""),
        "risk_score": job.get("risk_score", 0),
        "vulnerabilities_count": len(job.get("vulnerabilities", [])),
    }


@router.get("/{scan_id}/results")
async def get_results(scan_id: str, current_user: dict = Depends(get_current_user)):
    """Get completed scan results."""
    job = await get_scan_job(scan_id)
    if not job:
        raise HTTPException(status_code=404, detail="Scan not found")
    if job.get("user_id") != current_user["_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    return {
        "scan_id": scan_id,
        "status": job.get("status"),
        "repository": job.get("repository"),
        "risk_score": job.get("risk_score", 0),
        "vulnerabilities": job.get("vulnerabilities", []),
        "report": job.get("report", {}),
        "ai_report": job.get("ai_report", {}),
    }


@router.post("/{scan_id}/cancel")
async def cancel_scan(scan_id: str, current_user: dict = Depends(get_current_user)):
    """Cancel a running scan."""
    job = await get_scan_job(scan_id)
    if not job:
        raise HTTPException(status_code=404, detail="Scan not found")
    if job.get("user_id") != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    success = await cancel_scan_job(scan_id)
    if not success:
        raise HTTPException(status_code=400, detail="Scan cannot be cancelled (not running)")

    await ws_manager.broadcast({
        "type": "scan_cancelled",
        "scan_id": scan_id,
    })

    return {"message": "Scan cancelled", "scan_id": scan_id}


@router.get("/{scan_id}/logs")
async def get_logs(scan_id: str, current_user: dict = Depends(get_current_user)):
    """Get scan logs."""
    logs = await get_scan_logs(scan_id)
    return {"scan_id": scan_id, "logs": logs}


@router.get("/{scan_id}/timeline")
async def get_timeline_events(scan_id: str, current_user: dict = Depends(get_current_user)):
    """Get scan timeline events."""
    events = await get_timeline(scan_id)
    return {"scan_id": scan_id, "timeline": events}


@router.get("/my-scans")
async def my_scans(current_user: dict = Depends(get_current_user)):
    """Get current user's scan history."""
    scans = await get_user_scans(current_user["_id"])
    return scans


@router.get("/queue-status")
async def queue_status(current_user: dict = Depends(get_current_user)):
    """Get current queue depth."""
    return {"queue_size": await get_queue_size()}
