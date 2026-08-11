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


def count_severities(findings: List[Dict]) -> Dict[str, int]:
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


# Backward-compatible alias.
_count_severities = count_severities


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
    # Fetch the most recent snapshots (descending), then reverse to oldest-first
    # so the trend chart reads left-to-right in chronological order. Limiting
    # AFTER the descending sort guarantees we keep the latest `limit` points.
    docs = (
        await database[SNAPSHOT_COLLECTION]
        .find({"user_id": str(user_id)})
        .sort("created_at", -1)
        .limit(limit)
        .to_list(length=limit)
    )
    for doc in reversed(docs):
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
        # No snapshots recorded yet — return an empty series so the charts
        # render honestly (no fabricated/static trend data).
        return []
    return out


async def latest_snapshot(user_id: str, project_id: Optional[str] = None) -> Optional[Dict]:
    """Return the most recent snapshot for the given user/project (or None)."""
    query: Dict = {"user_id": str(user_id)}
    if project_id:
        query["project_id"] = str(project_id)
    return await database[SNAPSHOT_COLLECTION].find_one(query, sort=[("created_at", -1)])
