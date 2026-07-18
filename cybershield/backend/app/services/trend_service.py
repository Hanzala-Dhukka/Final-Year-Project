"""
Trend / snapshot service for the Executive Dashboard (Module 6.4).

Persists an ``analytics_snapshots`` document every time a scan completes so the
security-score, risk and vulnerability trends can be charted over time. Also
reads historical snapshots back into chart-ready ``TrendPoint`` rows.
"""
from datetime import datetime
from typing import Dict, List, Optional

from app.database.db import database

SNAPSHOT_COLLECTION = "analytics_snapshots"


def _count_severities(findings: List[Dict]) -> Dict[str, int]:
    """Count findings by severity (supports both scan + threat shapes)."""
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for f in findings or []:
        if not isinstance(f, dict):
            continue
        sev = (f.get("severity") or f.get("risk") or "low")
        sev = str(sev).strip().lower()
        if sev in counts:
            counts[sev] += 1
    return counts


async def record_snapshot(
    user_id: str,
    project_id: Optional[str],
    security_score: float,
    risk_score: float,
    compliance_score: float,
    findings: Optional[List[Dict]] = None,
    sev_override: Optional[Dict[str, int]] = None,
) -> str:
    """
    Insert a new analytics snapshot for a completed scan.

    Args:
        user_id: owner of the scan.
        project_id: project the scan belongs to (may be None).
        security_score: weighted global security score (0-100).
        risk_score: raw risk score (0-100, higher = riskier).
        compliance_score: latest compliance overall (0-100).
        findings: the scan's findings list ({type, severity}); counted when
            sev_override is not supplied.
        sev_override: precomputed severity counts {critical,high,medium,low}.

    Returns:
        Inserted snapshot id.
    """
    if sev_override:
        sev = {
            "critical": sev_override.get("critical", 0),
            "high": sev_override.get("high", 0),
            "medium": sev_override.get("medium", 0),
            "low": sev_override.get("low", 0),
        }
    else:
        sev = _count_severities(findings or [])
    doc = {
        "user_id": str(user_id),
        "project_id": str(project_id) if project_id else None,
        "security_score": round(security_score, 1),
        "risk_score": round(risk_score, 1),
        "compliance_score": round(compliance_score, 1),
        "critical_vulnerabilities": sev["critical"],
        "high_vulnerabilities": sev["high"],
        "medium_vulnerabilities": sev["medium"],
        "low_vulnerabilities": sev["low"],
        "created_at": datetime.utcnow(),
    }
    res = await database[SNAPSHOT_COLLECTION].insert_one(doc)
    return str(res.inserted_id)


async def get_trends(user_id: str, limit: int = 30) -> List[Dict]:
    """
    Return the user's historical snapshots oldest newest for trend charts.
    Falls back to a demo trend when no snapshots exist yet.
    """
    out: List[Dict] = []
    async for doc in (
        database[SNAPSHOT_COLLECTION]
        .find({"user_id": str(user_id)})
        .sort("created_at", 1)
        .limit(limit)
    ):
        created = doc.get("created_at")
        out.append({
            "date": created.strftime("%Y-%m-%d") if isinstance(created, datetime) else "2026-01-01",
            "security_score": doc.get("security_score"),
            "risk_score": doc.get("risk_score"),
            "compliance_score": doc.get("compliance_score"),
            "critical": doc.get("critical_vulnerabilities"),
            "high": doc.get("high_vulnerabilities"),
            "medium": doc.get("medium_vulnerabilities"),
            "low": doc.get("low_vulnerabilities"),
        })
    if not out:
        # Demo trend so charts render before any scan is recorded.
        out = [
            {"date": "2026-01-01", "security_score": 52, "risk_score": 48, "compliance_score": 70, "critical": 8, "high": 12, "medium": 18, "low": 9},
            {"date": "2026-01-08", "security_score": 61, "risk_score": 39, "compliance_score": 78, "critical": 6, "high": 10, "medium": 16, "low": 8},
            {"date": "2026-01-15", "security_score": 74, "risk_score": 26, "compliance_score": 84, "critical": 4, "high": 8, "medium": 12, "low": 7},
            {"date": "2026-01-22", "security_score": 86, "risk_score": 14, "compliance_score": 91, "critical": 2, "high": 5, "medium": 9, "low": 6},
        ]
    return out
