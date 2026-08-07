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


@router.post("/analyze-repository")
async def analyze_repository(data: dict, current_user: dict = Depends(get_current_user)):
    """Validate a GitHub repository and return metadata for the setup preview."""
    repo_url = data.get("repo_url", "")
    branch = data.get("branch", "main")

    if not repo_url:
        raise HTTPException(status_code=400, detail="Repository URL is required")

    try:
        repo_name = extract_repo_name(repo_url)
        repo = get_repository(repo_name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot access repository: {str(e)}")

    try:
        tree = repo.get_git_tree(repo.default_branch, recursive=True)
        files = [item.path for item in tree.tree if item.type == "blob"]
    except Exception:
        files = []

    try:
        branches = [b.name for b in repo.get_branches()]
    except Exception:
        branches = [repo.default_branch]

    return {
        "name": repo.name,
        "full_name": repo.full_name,
        "description": repo.description or "",
        "language": repo.language or "",
        "stars": repo.stargazers_count or 0,
        "forks": repo.forks_count or 0,
        "branch": branch,
        "default_branch": repo.default_branch,
        "branches": branches,
        "files": len(files),
        "visibility": "private" if repo.private else "public",
    }


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
    # Try MongoDB scan_jobs first
    job = await get_scan_job(scan_id)

    # Fallback: check in-memory scan_status (used by github_scan_runner)
    if not job:
        from app.services.scan_progress import get_scan
        mem = get_scan(scan_id)
        if mem:
            job = {
                "user_id": current_user["_id"],
                "status": "completed" if mem.get("completed") or mem.get("progress", 0) >= 100 else mem.get("status", "running"),
                "progress": mem.get("progress", 0),
                "current_file": mem.get("current_file", ""),
                "current_stage": mem.get("stage", mem.get("current_stage", "")),
                "files_completed": 0,
                "files_total": 0,
                "eta": "",
                "risk_score": 0,
                "vulnerabilities": [],
            }

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
    # Try MongoDB scan_jobs first
    job = await get_scan_job(scan_id)

    # Fallback: check github_scans collection (written by scan_runner.py)
    scan_doc = None
    if not job:
        from app.database.db import database
        scan_doc = await database["github_scans"].find_one({"scan_id": scan_id})
        if scan_doc:
            scan_doc["_id"] = str(scan_doc["_id"])

    if not job and not scan_doc:
        raise HTTPException(status_code=404, detail="Scan not found")

    # Build response from whichever source has data
    if scan_doc:
        # github_scans has rich data — return it directly
        return {
            "scan_id": scan_id,
            "status": "completed",
            "repository": scan_doc.get("repository"),
            "repository_info": scan_doc.get("repository_info", {}),
            "risk_score": scan_doc.get("risk_score", 0),
            "risk_level": scan_doc.get("risk_level", "Unknown"),
            "risk_dashboard": scan_doc.get("risk_dashboard", {}),
            "severity_summary": scan_doc.get("severity_summary", {}),
            "findings": scan_doc.get("findings", []),
            "top_risks": scan_doc.get("findings", []),
            "ai_report": scan_doc.get("ai_report", {}),
            "scan_summary": scan_doc.get("scan_summary", {}),
            "technologies": scan_doc.get("technologies", {}),
            "created_at": scan_doc.get("created_at"),
        }

    # scan_jobs path — build response from engine data
    findings = job.get("vulnerabilities", [])
    risk_score = job.get("risk_score", 0)

    severity_summary = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for f in findings:
        sev = str(f.get("severity", "")).lower()
        if sev in severity_summary:
            severity_summary[sev] += 1

    if risk_score >= 80:
        risk_level, grade = "Low", "A"
    elif risk_score >= 60:
        risk_level, grade = "Medium", "B"
    elif risk_score >= 40:
        risk_level, grade = "High", "C"
    else:
        risk_level, grade = "Critical", "F"

    report = job.get("report", {})
    ai_report = job.get("ai_report", {})

    return {
        "scan_id": scan_id,
        "status": job.get("status"),
        "repository": job.get("repository"),
        "repository_info": {
            "repository": job.get("repository"),
            "statistics": {"files": job.get("files_total", 0)},
            "languages": {},
        },
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_dashboard": {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "security_grade": grade,
        },
        "severity_summary": severity_summary,
        "findings": findings,
        "top_risks": findings,
        "ai_report": ai_report,
        "scan_summary": report,
        "created_at": job.get("created_at"),
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
    # Map timestamp → time so the frontend ScanLogs component can render it
    for log in logs:
        log["time"] = log.get("timestamp", log.get("time", ""))
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
    return {"scans": scans}


@router.get("/queue-status")
async def queue_status(current_user: dict = Depends(get_current_user)):
    """Get current queue depth."""
    return {"queue_size": await get_queue_size()}
