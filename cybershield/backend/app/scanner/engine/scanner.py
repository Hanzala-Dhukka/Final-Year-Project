"""
SAST Scanner — Module D6

Main orchestrator for the Static Application Security Testing engine.
Processes files, applies rules, generates precise findings, stores in MongoDB.
"""

import httpx
import asyncio
from datetime import datetime, timezone
from typing import List, Dict, Optional

from app.database.db import database
from app.scanner.rules import ALL_RULES
from app.scanner.engine.rule_engine import match_rules, calculate_severity_summary
from app.scanner.engine.snippet_engine import get_file_lines

FINDINGS_COLLECTION = "scan_findings"

# File size limit (1MB)
MAX_FILE_SIZE = 1_000_000

# Files/dirs to skip
IGNORE_DIRS = {".git", "node_modules", "dist", "build", "venv", ".venv", "__pycache__", ".tox", "coverage", ".next", ".nuxt", "vendor", "target"}
IGNORE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".zip", ".gz", ".tar", ".exe", ".dll", ".so", ".dylib", ".pdf", ".mp4", ".mp3", ".wav", ".woff", ".woff2", ".ttf", ".eot", ".lock", ".min.js", ".min.css"}


def should_scan_file(file_path: str) -> bool:
    """Determine if a file should be scanned based on path and extension."""
    parts = file_path.split("/")
    # Check directory names
    for part in parts[:-1]:
        if part in IGNORE_DIRS:
            return False
    # Check extension
    for ext in IGNORE_EXTENSIONS:
        if file_path.endswith(ext):
            return False
    return True


async def scan_repository_files(
    scan_id: str,
    repo_url: str,
    files: List[str],
    branch: str = "main",
    scan_config: Optional[Dict] = None,
) -> Dict:
    """
    Scan all files in a repository using the SAST engine.
    
    Args:
        scan_id: The scan job ID
        repo_url: GitHub repository URL
        files: List of file paths from the repo tree
        branch: Git branch
        scan_config: Optional scan configuration
    
    Returns:
        Scan summary with findings
    """
    # Filter files
    scannable_files = [f for f in files if should_scan_file(f)]
    
    # Extract repo info for raw URL
    # URL format: https://github.com/owner/repo → raw: https://raw.githubusercontent.com/owner/repo/branch/
    raw_base = _get_raw_base_url(repo_url, branch)
    
    all_findings = []
    errors = []
    
    # Process files in batches
    batch_size = 20
    max_concurrent = 8
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def process_file(file_path: str):
        async with semaphore:
            try:
                content = await _fetch_file_content(raw_base, file_path)
                if content is None:
                    return
                
                # Run rule engine
                findings = match_rules(content, file_path, list(ALL_RULES.values()))
                all_findings.extend(findings)
                
            except Exception as e:
                errors.append({"file": file_path, "error": str(e)})
    
    # Process in batches
    for i in range(0, len(scannable_files), batch_size):
        batch = scannable_files[i:i + batch_size]
        tasks = [process_file(f) for f in batch]
        await asyncio.gather(*tasks)
    
    # Store findings in MongoDB
    await _store_findings(scan_id, all_findings)
    
    # Calculate summary
    summary = calculate_severity_summary(all_findings)
    
    return {
        "scan_id": scan_id,
        "total_files_scanned": len(scannable_files),
        "total_findings": len(all_findings),
        "findings": all_findings,
        "summary": summary,
        "errors": errors[:10],  # Limit error list
    }


async def scan_single_file_content(
    scan_id: str,
    file_path: str,
    content: str,
) -> List[Dict]:
    """Scan a single file's content and return findings."""
    findings = match_rules(content, file_path, list(ALL_RULES.values()))
    if findings:
        await _store_findings(scan_id, findings)
    return findings


async def _fetch_file_content(raw_base: str, file_path: str) -> Optional[str]:
    """Fetch file content from GitHub raw URL."""
    url = f"{raw_base}/{file_path}"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                content = resp.text
                if len(content.encode("utf-8")) > MAX_FILE_SIZE:
                    return None
                return content
    except Exception:
        pass
    return None


def _get_raw_base_url(repo_url: str, branch: str) -> str:
    """Convert GitHub URL to raw content base URL."""
    # https://github.com/owner/repo → https://raw.githubusercontent.com/owner/repo/branch
    url = repo_url.rstrip("/")
    if url.endswith(".git"):
        url = url[:-4]
    parts = url.replace("https://github.com/", "").split("/")
    if len(parts) >= 2:
        owner, repo = parts[0], parts[1]
        return f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}"
    return url


async def _store_findings(scan_id: str, findings: List[Dict]):
    """Store findings in the scan_findings collection."""
    if not findings:
        return
    
    collection = database[FINDINGS_COLLECTION]
    docs = []
    now = datetime.now(timezone.utc).isoformat()
    
    for f in findings:
        doc = {
            "scan_id": scan_id,
            **f,
            "created_at": now,
        }
        docs.append(doc)
    
    if docs:
        await collection.insert_many(docs)


async def get_findings_for_scan(
    scan_id: str,
    severity: Optional[str] = None,
    rule_id: Optional[str] = None,
    file_path: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 500,
    offset: int = 0,
) -> Dict:
    """
    Retrieve findings for a scan with optional filters.
    
    Returns:
    {
        "scan_id": str,
        "findings": list,
        "total": int,
        "summary": dict
    }
    """
    collection = database[FINDINGS_COLLECTION]
    
    query = {"scan_id": scan_id}
    if severity:
        query["severity"] = severity
    if rule_id:
        query["rule_id"] = rule_id
    if file_path:
        query["file"] = {"$regex": file_path, "$options": "i"}
    if status:
        query["status"] = status
    
    total = await collection.count_documents(query)
    
    cursor = collection.find(query).sort([
        ("severity", 1),  # Critical first
        ("file", 1),
        ("line", 1),
    ]).skip(offset).limit(limit)
    
    findings = await cursor.to_list(length=limit)
    for f in findings:
        f["_id"] = str(f["_id"])
    
    # Calculate live summary
    all_cursor = collection.find({"scan_id": scan_id})
    all_findings = await all_cursor.to_list(length=10000)
    summary = calculate_severity_summary(all_findings)
    
    return {
        "scan_id": scan_id,
        "findings": findings,
        "total": total,
        "summary": summary,
    }


async def get_findings_by_file(scan_id: str) -> List[Dict]:
    """Get findings grouped by file for the file tree sidebar."""
    collection = database[FINDINGS_COLLECTION]
    
    pipeline = [
        {"$match": {"scan_id": scan_id}},
        {"$group": {
            "_id": "$file",
            "count": {"$sum": 1},
            "critical": {"$sum": {"$cond": [{"$eq": ["$severity", "Critical"]}, 1, 0]}},
            "high": {"$sum": {"$cond": [{"$eq": ["$severity", "High"]}, 1, 0]}},
            "medium": {"$sum": {"$cond": [{"$eq": ["$severity", "Medium"]}, 1, 0]}},
            "low": {"$sum": {"$cond": [{"$eq": ["$severity", "Low"]}, 1, 0]}},
        }},
        {"$sort": {"count": -1}},
    ]
    
    results = await collection.aggregate(pipeline).to_list(length=1000)
    
    return [
        {
            "file": r["_id"],
            "count": r["count"],
            "critical": r["critical"],
            "high": r["high"],
            "medium": r["medium"],
            "low": r["low"],
        }
        for r in results
    ]


async def update_finding_status(finding_id: str, status: str) -> bool:
    """Update a finding's status (Open/Resolved/False Positive)."""
    collection = database[FINDINGS_COLLECTION]
    from bson import ObjectId
    result = await collection.update_one(
        {"_id": ObjectId(finding_id)},
        {"$set": {"status": status}}
    )
    return result.modified_count > 0


async def delete_findings_for_scan(scan_id: str):
    """Delete all findings for a scan."""
    collection = database[FINDINGS_COLLECTION]
    await collection.delete_many({"scan_id": scan_id})
