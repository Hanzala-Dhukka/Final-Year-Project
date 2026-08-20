"""
Scan Findings API — Module D6

Endpoints for precise code location findings.
"""

import httpx
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from bson import ObjectId

from app.dependencies.auth import get_current_user
from app.database.db import database
from app.scanner.engine.scanner import (
    get_findings_for_scan,
    get_findings_by_file,
    update_finding_status,
    delete_findings_for_scan,
)
from app.services.error_log_service import fire_and_forget_log

router = APIRouter()


@router.get("/{scan_id}/findings")
async def list_findings(
    scan_id: str,
    severity: Optional[str] = Query(None),
    rule_id: Optional[str] = Query(None),
    file: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(500, le=2000),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    """Get findings for a scan with optional filters."""
    result = await get_findings_for_scan(
        scan_id=scan_id,
        severity=severity,
        rule_id=rule_id,
        file_path=file,
        status=status,
        limit=limit,
        offset=offset,
    )
    return result


@router.get("/{scan_id}/findings/by-file")
async def findings_by_file(
    scan_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get findings grouped by file for the file tree sidebar."""
    result = await get_findings_by_file(scan_id)
    return {"scan_id": scan_id, "files": result}


@router.get("/{scan_id}/findings/summary")
async def findings_summary(
    scan_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get summary statistics for scan findings."""
    collection = database["scan_findings"]
    all_findings = await collection.find({"scan_id": scan_id}).to_list(length=10000)
    
    from app.scanner.engine.rule_engine import calculate_severity_summary
    summary = calculate_severity_summary(all_findings)
    
    # Get unique OWASP and CWE
    owasp_set = set()
    cwe_set = set()
    for f in all_findings:
        if f.get("owasp"):
            owasp_set.add(f["owasp"])
        if f.get("cwe"):
            cwe_set.add(f["cwe"])
    
    summary["owasp_categories"] = sorted(owasp_set)
    summary["cwe_categories"] = sorted(cwe_set)
    
    return {"scan_id": scan_id, "summary": summary}


@router.patch("/{finding_id}/status")
async def change_finding_status(
    finding_id: str,
    body: dict,
    current_user: dict = Depends(get_current_user),
):
    """Update a finding's status (Open, Resolved, False Positive)."""
    new_status = body.get("status", "Open")
    if new_status not in ("Open", "Resolved", "False Positive"):
        raise HTTPException(status_code=400, detail="Invalid status")
    
    success = await update_finding_status(finding_id, new_status)
    if not success:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    return {"message": "Status updated", "finding_id": finding_id, "status": new_status}


@router.delete("/{scan_id}/findings")
async def clear_findings(
    scan_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete all findings for a scan."""
    await delete_findings_for_scan(scan_id)
    return {"message": f"Findings deleted for scan {scan_id}"}


# --- Module D7: Code Viewer ---

# File extension → language map for the code viewer
EXTENSION_MAP = {
    ".py": "python", ".js": "javascript", ".jsx": "javascript",
    ".ts": "typescript", ".tsx": "typescript", ".java": "java",
    ".cpp": "cpp", ".c": "c", ".cs": "csharp", ".go": "go",
    ".php": "php", ".rb": "ruby", ".rs": "rust", ".swift": "swift",
    ".html": "html", ".css": "css", ".scss": "scss", ".less": "less",
    ".json": "json", ".yaml": "yaml", ".yml": "yaml", ".xml": "xml",
    ".sql": "sql", ".sh": "shell", ".bash": "shell", ".md": "markdown",
    ".dockerfile": "dockerfile", ".tf": "terraform", ".vue": "html",
}

# Max file size to fetch (1MB)
_MAX_FILE_SIZE = 1_000_000


def _detect_language(file_path: str) -> str:
    """Detect language from file extension."""
    dot_idx = file_path.rfind(".")
    if dot_idx == -1:
        return "plaintext"
    ext = file_path[dot_idx:].lower()
    return EXTENSION_MAP.get(ext, "plaintext")


@router.get("/{scan_id}/file-content")
async def get_file_content(
    scan_id: str,
    path: str = Query(..., description="File path in the repository"),
    current_user: dict = Depends(get_current_user),
):
    """Fetch file content from GitHub for the code viewer."""
    # Look up the scan job to get repo_url and branch
    scan_jobs = database["scan_jobs"]
    scan_job = await scan_jobs.find_one({"_id": ObjectId(scan_id)})
    if not scan_job:
        raise HTTPException(status_code=404, detail="Scan job not found")

    repo_url = scan_job.get("repo_url", "")
    branch = scan_job.get("branch", "main")

    # Build raw GitHub URL
    # https://github.com/owner/repo → https://raw.githubusercontent.com/owner/repo/branch/path
    clean_url = repo_url.rstrip("/")
    if clean_url.endswith(".git"):
        clean_url = clean_url[:-4]
    parts = clean_url.replace("https://github.com/", "").split("/")
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="Invalid repository URL in scan job")

    owner, repo = parts[0], parts[1]
    raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"

    # Fetch file content
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(raw_url)
    except httpx.TimeoutException:
        fire_and_forget_log()
        raise HTTPException(status_code=504, detail="GitHub request timed out")
    except httpx.RequestError as exc:
        fire_and_forget_log()
        raise HTTPException(status_code=502, detail=f"Failed to reach GitHub: {exc}")

    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail="File not found in repository")
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"GitHub returned status {resp.status_code}")

    content = resp.text
    if len(content.encode("utf-8")) > _MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large to display")

    return {
        "content": content,
        "path": path,
        "language": _detect_language(path),
    }
