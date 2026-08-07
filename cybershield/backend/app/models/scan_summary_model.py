"""
MongoDB document model for AI Scan Summaries (Module E3).

Collection: scan_summaries

Document structure:
{
    "scan_id": "...",
    "repository": "...",
    "security_score": 82,
    "risk_level": "Medium",
    "summary": "...",
    "top_risks": [...],
    "priority_actions": [...],
    "created_at": "..."
}
"""
from datetime import datetime, timezone


def scan_summary_document(
    scan_id: str,
    repository: str,
    security_score: int,
    risk_level: str,
    summary: str,
    top_risks: list,
    priority_actions: list,
) -> dict:
    """Create a scan summary document for MongoDB."""
    return {
        "scan_id": scan_id,
        "repository": repository,
        "security_score": security_score,
        "risk_level": risk_level,
        "summary": summary,
        "top_risks": top_risks,
        "priority_actions": priority_actions,
        "created_at": datetime.now(timezone.utc),
    }
