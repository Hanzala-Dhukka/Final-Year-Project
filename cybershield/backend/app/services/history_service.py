"""
Scan History Service
Saves every completed scan to the scan_history collection for permanent storage.
"""
from app.database.db import database
from datetime import datetime


collection = database["scan_history"]


async def save_scan(result: dict):
    """
    Save a completed scan to the scan_history collection.
    
    Args:
        result: The complete scan result dictionary from run_github_scan
    """
    document = {
        "scan_id": result.get("scan_id"),
        "repository": result.get("repository_info", {}).get("repository", ""),
        "repo_url": result.get("repository_info", {}).get("url", ""),
        "branch": result.get("repository_info", {}).get("default_branch", "main"),
        "created_at": datetime.utcnow(),
        "security_score": result.get("risk_dashboard", {}).get("overall_score", 0),
        "risk_level": result.get("scan_summary", {}).get("risk_level", "Unknown"),
        "summary": result.get("scan_summary", {}).get("severity_counts", {}),
        "findings": result.get("findings", []),
        "dependency_report": result.get("dependency_report", {}),
        "ai_report": result.get("ai_report", {}),
        "technologies": result.get("technologies", {}),
        "repository_info": result.get("repository_info", {}),
    }
    
    await collection.insert_one(document)


async def create_indexes():
    """Create indexes for fast searches on the scan_history collection."""
    await collection.create_index("repository")
    await collection.create_index("scan_id")
    await collection.create_index("created_at")