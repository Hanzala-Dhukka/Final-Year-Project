"""
Security Context Engine for the AI Security Copilot (Module 5.5).

Aggregates every security signal CyberShield holds about a project:
  - GitHub scan results
  - Threat model / threat report
  - OWASP simulator sessions
  - AI code review findings
  - AI remediation engine status (open / fixed)
  - Quiz / learning progress

and derives a single 0-100 security score from severity-weighted issues
(spec Step 6).

Reuses the existing Module 5.2 context_service for scan / threat / owasp /
quiz data so the copilot stays consistent with the rest of the platform.
"""
from typing import Optional

from app.database.db import database
from app.services import context_service

SEVERITY_DEDUCTION = {"Critical": 20, "High": 10, "Medium": 5, "Low": 2}
SEVERITY_ORDER = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}


async def _code_review_summary(user_id: str, project_id: Optional[str]) -> Optional[dict]:
    """Compact summary of the latest AI code review report for the project/user."""
    query = {"user_id": user_id}
    if project_id:
        query["project_id"] = project_id
    report = await database.code_review_reports.find_one(
        query, sort=[("created_at", -1)]
    )
    if not report:
        return None
    findings = report.get("findings", [])
    severities = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    for f in findings:
        sev = f.get("severity")
        if sev in severities:
            severities[sev] += 1
    return {
        "critical": severities["Critical"],
        "high": severities["High"],
        "medium": severities["Medium"],
        "low": severities["Low"],
        "total": len(findings),
        "risk_score": report.get("risk_score"),
        "language": report.get("language"),
    }


async def _remediation_summary(user_id: str, project_id: Optional[str]) -> Optional[dict]:
    """Open / fixed remediation counts plus the most urgent open findings."""
    query = {"user_id": user_id}
    if project_id:
        query["project_id"] = project_id
    open_docs = database.remediation_reports.find({**query, "status": {"$ne": "Fixed"}})
    fixed_docs = database.remediation_reports.find({**query, "status": "Fixed"})

    open_list = []
    open_count = 0
    async for d in open_docs:
        open_count += 1
        sol = d.get("ai_solution", {})
        open_list.append({
            "finding": d.get("finding"),
            "severity": d.get("severity"),
            "owasp": sol.get("owasp"),
            "cwe": sol.get("cwe"),
        })
    fixed_count = 0
    async for _ in fixed_docs:
        fixed_count += 1

    open_list.sort(key=lambda x: SEVERITY_ORDER.get(x.get("severity"), 9))
    return {
        "open": open_count,
        "fixed": fixed_count,
        "urgent": open_list[:5],
    }


def compute_security_score(context: dict) -> tuple:
    """
    Compute a 0-100 security score from the aggregated context.

    Starts at 100 and deducts severity-weighted points for every issue
    across GitHub scan, threat report, code review and open remediations.

    Returns: (score, risk_level)
    """
    score = 100

    scan = context.get("github_scan")
    if scan:
        for v in scan.get("vulnerabilities", []):
            score -= SEVERITY_DEDUCTION.get(v.get("severity"), 2)

    cr = context.get("code_review")
    if cr:
        score -= (
            cr.get("critical", 0) * SEVERITY_DEDUCTION["Critical"]
            + cr.get("high", 0) * SEVERITY_DEDUCTION["High"]
            + cr.get("medium", 0) * SEVERITY_DEDUCTION["Medium"]
            + cr.get("low", 0) * SEVERITY_DEDUCTION["Low"]
        )

    rem = context.get("remediation")
    if rem:
        score -= rem.get("open", 0) * 3  # each unresolved item drags the score

    score = max(0, min(100, score))

    if score >= 80:
        risk = "Low"
    elif score >= 60:
        risk = "Medium"
    elif score >= 40:
        risk = "High"
    else:
        risk = "Critical"
    return score, risk


async def build_security_context(user_id: str, project_id: Optional[str] = None) -> dict:
    """
    Assemble the complete security context for the copilot (spec Step 3).

    Reuses context_service.build_context for the core domains and layers on
    code-review + remediation data, plus the derived security score.
    """
    base = await context_service.build_context(user_id, project_id)
    proj_id = str(base["project"].get("_id")) if base.get("project") else project_id

    scan_summary = base.get("latest_scan")
    threat_summary = base.get("latest_threat_report")
    owasp_summary = base.get("latest_owasp")

    code_review = await _code_review_summary(user_id, proj_id)
    remediation = await _remediation_summary(user_id, proj_id)

    # OWASP pass/fail estimate from simulator score (if available)
    owasp_block = None
    if owasp_summary:
        score = owasp_summary.get("score")
        try:
            s = float(score)
            owasp_block = {"passed": round(s), "failed": max(0, 100 - round(s))}
        except (TypeError, ValueError):
            owasp_block = {"passed": None, "failed": None}

    context = {
        "project": base["project"].get("name") if base.get("project") else None,
        "tech_stack": base["project"].get("tech_stack", []) if base.get("project") else [],
        "github_scan": (
            {
                "risk": scan_summary.get("risk_level") if scan_summary else None,
                "issues": scan_summary.get("total_vulnerabilities") if scan_summary else 0,
                "vulnerabilities": scan_summary.get("vulnerabilities", []) if scan_summary else [],
            }
            if scan_summary else None
        ),
        "threat_model": (
            {
                "risk": threat_summary.get("risk_level") if threat_summary else None,
                "threats": _count_threats(threat_summary),
                "summary": threat_summary.get("summary") if threat_summary else None,
            }
            if threat_summary else None
        ),
        "owasp": owasp_block,
        "code_review": code_review,
        "remediation": remediation,
        "learning_progress": base.get("learning_progress", {}),
    }

    score, risk = compute_security_score(context)
    context["security_score"] = score
    context["risk_level"] = risk
    return context


def _count_threats(report: dict) -> int:
    if not report:
        return 0
    stride = report.get("stride")
    if isinstance(stride, list):
        return len(stride)
    if isinstance(stride, dict):
        return sum(len(v) if isinstance(v, list) else 1 for v in stride.values())
    return 0
