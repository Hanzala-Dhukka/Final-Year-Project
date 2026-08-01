"""
GitHub Scan History API Routes
Provides endpoints for retrieving, comparing, and managing scan history.
"""
from fastapi import APIRouter, HTTPException, Query
from app.database.db import database

router = APIRouter()

collection = database["scan_history"]


@router.get("/history")
async def get_scan_history(repository: str = Query(..., description="Repository name (e.g., OWASP/NodeGoat)")):
    """
    Get all scans for a repository, sorted by newest first.
    
    Args:
        repository: Repository name in format owner/repo
        
    Returns:
        List of scans with basic info (scan_id, security_score, risk_level, created_at)
    """
    cursor = collection.find(
        {"repository": repository}
    ).sort("created_at", -1)

    history = []
    async for scan in cursor:
        scan["_id"] = str(scan["_id"])
        # Return only essential fields for the history list
        history.append({
            "scan_id": scan.get("scan_id"),
            "security_score": scan.get("security_score"),
            "risk_level": scan.get("risk_level"),
            "created_at": scan.get("created_at"),
            "repository": scan.get("repository"),
            "repo_url": scan.get("repo_url"),
            "branch": scan.get("branch"),
        })

    return {
        "repository": repository,
        "total_scans": len(history),
        "history": history
    }


@router.get("/history/{scan_id}")
async def get_scan(scan_id: str):
    """
    Get complete scan details by scan_id.
    
    Args:
        scan_id: Unique scan identifier
        
    Returns:
        Complete scan document
    """
    scan = await collection.find_one({"scan_id": scan_id})

    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    scan["_id"] = str(scan["_id"])
    return scan


@router.delete("/history/{scan_id}")
async def delete_scan(scan_id: str):
    """
    Delete a scan from history.
    
    Args:
        scan_id: Unique scan identifier
        
    Returns:
        Success message
    """
    result = await collection.delete_one({"scan_id": scan_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scan not found")

    return {"message": "Scan deleted"}


@router.get("/history/compare")
async def compare_scans(first: str = Query(..., description="First scan_id to compare"), second: str = Query(..., description="Second scan_id to compare")):
    """
    Compare two scans by their scan_ids.
    
    Args:
        first: First scan_id
        second: Second scan_id
        
    Returns:
        Comparison with scores, risk levels, summaries, and improvement
    """
    scan1 = await collection.find_one({"scan_id": first})
    scan2 = await collection.find_one({"scan_id": second})

    if not scan1 or not scan2:
        raise HTTPException(status_code=404, detail="One or both scans not found")

    return {
        "first": {
            "score": scan1.get("security_score", 0),
            "risk": scan1.get("risk_level", "Unknown"),
            "summary": scan1.get("summary", {})
        },
        "second": {
            "score": scan2.get("security_score", 0),
            "risk": scan2.get("risk_level", "Unknown"),
            "summary": scan2.get("summary", {})
        },
        "improvement": scan2.get("security_score", 0) - scan1.get("security_score", 0)
    }


@router.get("/history/statistics")
async def history_statistics(repository: str = Query(..., description="Repository name (e.g., OWASP/NodeGoat)")):
    """
    Get statistics for all scans of a repository.
    
    Args:
        repository: Repository name in format owner/repo
        
    Returns:
        Statistics including total scans, best/worst/average/latest scores
    """
    cursor = collection.find({"repository": repository}).sort("created_at", 1)

    scans = []
    async for item in cursor:
        scans.append(item)

    if not scans:
        return {
            "repository": repository,
            "total_scans": 0,
            "best_score": 0,
            "worst_score": 0,
            "average_score": 0,
            "latest_score": 0
        }

    scores = [s.get("security_score", 0) for s in scans]

    return {
        "repository": repository,
        "total_scans": len(scans),
        "best_score": max(scores),
        "worst_score": min(scores),
        "average_score": round(sum(scores) / len(scores), 2),
        "latest_score": scans[-1].get("security_score", 0)
    }