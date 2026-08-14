"""
Report Service — Module D5

Core service for generating, storing, and retrieving security reports.
Handles security score calculation, executive summaries, and report storage.
"""

import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId

from app.database.db import database
from app.ai.gemini_client import generate

REPORTS_COLLECTION = "reports"
SCORE_HISTORY_COLLECTION = "security_score_history"


def calculate_security_score(critical: int, high: int, medium: int, low: int) -> int:
    """Calculate security score from severity counts. Score = 100 - penalties."""
    score = 100
    score -= critical * 10
    score -= high * 5
    score -= medium * 2
    score -= low
    return max(score, 0)


def get_risk_level(score: int) -> str:
    """Determine risk level from security score."""
    if score >= 85:
        return "LOW"
    elif score >= 65:
        return "MEDIUM"
    elif score >= 40:
        return "HIGH"
    return "CRITICAL"


def count_severities(vulnerabilities: List[Dict]) -> Dict[str, int]:
    """Count vulnerabilities by severity level."""
    counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    for v in vulnerabilities:
        sev = v.get("severity", "Medium")
        if sev in counts:
            counts[sev] += 1
        else:
            counts["Medium"] += 1
    return counts


def calculate_report_hash(report_data: Dict) -> str:
    """Generate SHA-256 hash for report integrity verification."""
    content = str(sorted(report_data.items()))
    return hashlib.sha256(content.encode()).hexdigest()


def generate_report_id() -> str:
    """Generate a unique report ID."""
    now = datetime.now(timezone.utc)
    return f"CSR-{now.strftime('%Y%m%d')}-{now.strftime('%H%M%S')}"


async def get_report_for_scan(scan_id: str) -> Dict[str, Any]:
    """Build a full professional report from scan job data."""
    scan_jobs = database["scan_jobs"]
    doc = await scan_jobs.find_one({"_id": __import__("bson").ObjectId(scan_id)})
    if not doc:
        raise ValueError(f"Scan job not found: {scan_id}")

    vulnerabilities = doc.get("vulnerabilities", [])
    severe_counts = count_severities(vulnerabilities)
    score = calculate_security_score(
        severe_counts["Critical"], severe_counts["High"],
        severe_counts["Medium"], severe_counts["Low"]
    )
    risk_level = get_risk_level(score)

    report_data = {
        "report_id": generate_report_id(),
        "scan_id": scan_id,
        "repository": doc.get("repository", "Unknown"),
        "repo_url": doc.get("repo_url", ""),
        "branch": doc.get("branch", "main"),
        "security_score": score,
        "risk_level": risk_level,
        "critical": severe_counts["Critical"],
        "high": severe_counts["High"],
        "medium": severe_counts["Medium"],
        "low": severe_counts["Low"],
        "total_findings": len(vulnerabilities),
        "vulnerabilities": vulnerabilities,
        "report": doc.get("report", {}),
        "ai_report": doc.get("ai_report", {}),
        "scan_config": doc.get("scan_config", {}),
        "files_total": doc.get("files_total", 0),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "report_version": "1.0",
        "scanner_version": "CyberShield Scanner v1.0",
    }

    report_data["integrity_hash"] = calculate_report_hash(report_data)

    # Store report in MongoDB
    await _store_report(report_data)

    # Store score history
    await _store_score_history(report_data["repository"], score)

    return report_data


async def _store_report(report_data: Dict):
    """Store a report in MongoDB."""
    collection = database[REPORTS_COLLECTION]
    await collection.update_one(
        {"scan_id": report_data["scan_id"]},
        {"$set": report_data},
        upsert=True,
    )


async def _store_score_history(repository: str, score: int):
    """Store security score in history collection for trend tracking."""
    collection = database[SCORE_HISTORY_COLLECTION]
    await collection.insert_one({
        "repository": repository,
        "score": score,
        "scan_date": datetime.now(timezone.utc).isoformat(),
    })


async def get_report_by_id(report_id: str) -> Optional[Dict]:
    """Get a report by report_id."""
    collection = database[REPORTS_COLLECTION]
    doc = await collection.find_one({"report_id": report_id})
    if doc:
        doc.pop("_id", None)
    return doc


async def get_report_by_scan_id(scan_id: str) -> Optional[Dict]:
    """Get a report by scan_id."""
    collection = database[REPORTS_COLLECTION]
    doc = await collection.find_one({"scan_id": scan_id})
    if doc:
        doc.pop("_id", None)
    return doc


async def get_report_history(user_id: str = None, limit: int = 50) -> List[Dict]:
    """Get report history, optionally filtered by user."""
    collection = database[REPORTS_COLLECTION]
    query = {}
    if user_id:
        query["user_id"] = user_id
    cursor = collection.find(query).sort("created_at", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    for doc in docs:
        doc.pop("_id", None)
        # Keep only summary fields for list view
        doc.pop("vulnerabilities", None)
        doc.pop("integrity_hash", None)
    return docs


async def get_score_history(repository: str, limit: int = 30) -> List[Dict]:
    """Get security score trend history for a repository."""
    collection = database[SCORE_HISTORY_COLLECTION]
    cursor = collection.find({"repository": repository}).sort("scan_date", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    for doc in docs:
        doc.pop("_id", None)
    return list(reversed(docs))  # Return chronological order


async def compare_scans(scan_id_old: str, scan_id_new: str) -> Dict:
    """Compare two scan results and return improvement/regression metrics."""
    old_report = await get_report_by_scan_id(scan_id_old)
    new_report = await get_report_by_scan_id(scan_id_new)

    if not old_report or not new_report:
        raise ValueError("One or both reports not found")

    old_score = old_report.get("security_score", 0)
    new_score = new_report.get("security_score", 0)

    old_sev = {"Critical": old_report.get("critical", 0), "High": old_report.get("high", 0),
               "Medium": old_report.get("medium", 0), "Low": old_report.get("low", 0)}
    new_sev = {"Critical": new_report.get("critical", 0), "High": new_report.get("high", 0),
               "Medium": new_report.get("medium", 0), "Low": new_report.get("low", 0)}

    improvements = []
    regressions = []

    for sev in ["Critical", "High", "Medium", "Low"]:
        diff = old_sev[sev] - new_sev[sev]
        if diff > 0:
            improvements.append({"severity": sev, "change": diff})
        elif diff < 0:
            regressions.append({"severity": sev, "change": abs(diff)})

    improvement_pct = 0
    if old_score > 0:
        improvement_pct = round(((new_score - old_score) / old_score) * 100, 1)

    return {
        "comparison": True,
        "old_scan_id": scan_id_old,
        "new_scan_id": scan_id_new,
        "old_score": old_score,
        "new_score": new_score,
        "score_change": new_score - old_score,
        "improvement_pct": improvement_pct,
        "old_severities": old_sev,
        "new_severities": new_sev,
        "improvements": improvements,
        "regressions": regressions,
        "old_repository": old_report.get("repository", ""),
        "new_repository": new_report.get("repository", ""),
        "old_created_at": old_report.get("created_at", ""),
        "new_created_at": new_report.get("created_at", ""),
    }


async def generate_ai_executive_summary(report_data: Dict) -> str:
    """Generate an AI executive summary for a report."""
    prompt = f"""You are a Senior Security Consultant. Summarize this scan for a CTO.
Maximum 150 words. Highlight business risks. Suggest top 3 priorities.

Repository: {report_data.get('repository', 'Unknown')}
Security Score: {report_data.get('security_score', 0)}/100
Risk Level: {report_data.get('risk_level', 'Unknown')}
Critical: {report_data.get('critical', 0)}
High: {report_data.get('high', 0)}
Medium: {report_data.get('medium', 0)}
Low: {report_data.get('low', 0)}
Total Findings: {report_data.get('total_findings', 0)}

Return ONLY the summary text, no JSON, no formatting."""

    try:
        result = await generate(prompt)
        return result.strip()
    except Exception as e:
        return f"Executive Summary: {report_data.get('total_findings', 0)} vulnerabilities found. Score: {report_data.get('security_score', 0)}/100. Risk level: {report_data.get('risk_level', 'Unknown')}."


async def delete_report(report_id: str) -> bool:
    """Delete a report from MongoDB."""
    try:
        # Professional security reports (D5) are keyed by a human-readable
        # report_id (CSR-...) in the "reports" collection.
        result = await database[REPORTS_COLLECTION].delete_one({"report_id": report_id})
        if result.deleted_count > 0:
            return True

        # Threat model reports are stored in "threat_reports" and keyed by
        # their MongoDB _id (also sent by the frontend as the report id).
        if ObjectId.is_valid(report_id):
            result = await database["threat_reports"].delete_one({"_id": ObjectId(report_id)})
            if result.deleted_count > 0:
                return True

        # Some clients reference threat reports by project_id or report_id.
        result = await database["threat_reports"].delete_one({"project_id": report_id})
        if result.deleted_count > 0:
            return True
        result = await database["threat_reports"].delete_one({"report_id": report_id})
        return result.deleted_count > 0
    except Exception:
        return False