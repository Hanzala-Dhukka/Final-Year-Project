"""
Executive Security Dashboard analytics (Module 6.4).

Combines every previous module into a single CISO/Manager view:

* a weighted global Security Score (GitHub scanner, threat analysis,
  compliance, checklist, OWASP simulator, quiz progress),
* executive KPI cards,
* a project comparison table,
* an AI executive summary (Gemini, with a deterministic fallback).

All numbers are derived read-only from the existing collections; the trend
service owns snapshot persistence.

NOTE: this module is intentionally named executive_service to avoid
clashing with the pre-existing learning-analytics app/services/analytics_service.py.
"""
from datetime import datetime
from typing import Dict, List, Optional

from app.database.db import database
from app.services import trend_service
from app.services.compliance_service import get_report as get_compliance

# Weights (must sum to 1.0)
WEIGHTS = {
    "github": 0.30,      # GitHub Scanner
    "threat": 0.25,      # Threat Analysis
    "compliance": 0.20,   # Compliance Center
    "checklist": 0.15,    # Security Checklist
    "owasp": 0.05,        # OWASP Simulator
    "quiz": 0.05,          # Quiz Progress
}


def risk_level_from_score(score: float) -> str:
    """Map a 0-100 security score to a risk band (higher score = lower risk)."""
    if score >= 80:
        return "Low"
    if score >= 60:
        return "Medium"
    if score >= 40:
        return "High"
    return "Critical"


async def _github_score(user_id: str, project_id: Optional[str] = None) -> float:
    """Latest GitHub scan security score (100 - risk_score)."""
    try:
        query = {"user_id": str(user_id)}
        if project_id:
            query["project_id"] = str(project_id)
        doc = await database["github_scans"].find_one(query, sort=[("created_at", -1)])
        if not doc:
            doc = await database["github_scans"].find_one(
                {"user_id": str(user_id)}, sort=[("created_at", -1)]
            )
        if not doc:
            return 0.0
        risk = doc.get("risk_score")
        if risk is None:
            sev = trend_service.count_severities(
                doc.get("findings") or doc.get("vulnerabilities") or []
            )
            risk = min(100, sev["critical"] * 12 + sev["high"] * 7 + sev["medium"] * 3 + sev["low"] * 1)
        return round(max(0.0, 100.0 - float(risk)), 1)
    except Exception:
        return 0.0


async def _threat_score(user_id: str, project_id: Optional[str] = None) -> float:
    """Latest threat report security score (0-100, higher = safer)."""
    try:
        doc = await database["threat_reports"].find_one(
            {"user_id": str(user_id)}, sort=[("created_at", -1)]
        )
        if not doc:
            return 0.0
        s = doc.get("security_score")
        if s is None:
            return 0.0
        return round(float(s), 1)
    except Exception:
        return 0.0


async def _compliance_score(user_id: str, project_id: Optional[str] = None) -> float:
    """Latest compliance overall score."""
    try:
        pid = project_id
        if not pid:
            proj = await database["projects"].find_one({"owner_id": str(user_id)})
            pid = str(proj["_id"]) if proj else None
        if not pid:
            return 0.0
        rep = await get_compliance(pid)
        if not rep:
            return 0.0
        return round(float(rep.get("overall_score", 0.0)), 1)
    except Exception:
        return 0.0


async def _checklist_score(user_id: str, project_id: Optional[str] = None) -> float:
    """Checklist completion percentage."""
    try:
        from app.services import checklist_service
        if not project_id:
            proj = await database["projects"].find_one({"owner_id": str(user_id)})
            project_id = str(proj["_id"]) if proj else None
        if not project_id:
            return 0.0
        score_doc = await checklist_service.get_project_score(str(user_id), project_id)
        return round(float(score_doc.get("score", 0.0)), 1)
    except Exception:
        return 0.0


async def _owasp_score(user_id: str, project_id: Optional[str] = None) -> float:
    """OWASP simulator completion percentage."""
    try:
        total = 10
        query = {"user_id": str(user_id), "status": "completed"}
        if project_id:
            query["project_id"] = str(project_id)
        completed = await database["owasp_sessions"].count_documents(query)
        return round(min(100.0, (completed / total) * 100), 1)
    except Exception:
        return 0.0


async def _quiz_score(user_id: str) -> float:
    """Average quiz score (awareness)."""
    try:
        scores = []
        async for q in database["quiz_attempts"].find({"user_id": str(user_id)}):
            s = q.get("score")
            if isinstance(s, (int, float)):
                scores.append(float(s))
        if not scores:
            return 0.0
        return round(sum(scores) / len(scores), 1)
    except Exception:
        return 0.0


async def calculate_global_score(user_id: str, project_id: Optional[str] = None):
    """Compute the weighted global Security Score (0-100)."""
    parts = {
        "github": await _github_score(user_id, project_id),
        "threat": await _threat_score(user_id, project_id),
        "compliance": await _compliance_score(user_id, project_id),
        "checklist": await _checklist_score(user_id, project_id),
        "owasp": await _owasp_score(user_id, project_id),
        "quiz": await _quiz_score(user_id),
    }
    weighted = sum(parts[k] * WEIGHTS[k] for k in WEIGHTS)
    return round(weighted, 1), parts


async def aggregate_vulnerabilities(user_id: str, project_id: Optional[str] = None) -> Dict[str, int]:
    """Total open vulnerabilities by severity across the user's scans."""
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    try:
        query = {"user_id": str(user_id)}
        if project_id:
            query["project_id"] = str(project_id)
        async for scan in database["github_scans"].find(query):
            findings = scan.get("findings") or scan.get("vulnerabilities") or []
            sev = trend_service.count_severities(findings)
            for k in counts:
                counts[k] += sev[k]
    except Exception:
        pass
    return counts


async def last_scan_date(user_id: str, project_id: Optional[str] = None) -> Optional[str]:
    try:
        query = {"user_id": str(user_id)}
        if project_id:
            query["project_id"] = str(project_id)
        doc = await database["github_scans"].find_one(query, sort=[("created_at", -1)])
        if not doc:
            return None
        created = doc.get("created_at")
        return created.strftime("%Y-%m-%d") if isinstance(created, datetime) else None
    except Exception:
        return None


async def count_projects(user_id: str) -> int:
    try:
        return await database["projects"].count_documents({"owner_id": str(user_id)})
    except Exception:
        return 0


async def compare_projects(user_id: str, sort_by: str = "security_score") -> List[Dict]:
    """Build a per-project comparison table sorted by a metric."""
    rows: List[Dict] = []
    try:
        async for proj in database["projects"].find({"owner_id": str(user_id)}):
            pid = str(proj["_id"])
            score, _ = await calculate_global_score(user_id, pid)
            comp = await _compliance_score(user_id, pid)
            sev = await aggregate_vulnerabilities(user_id, pid)
            open_v = sev["critical"] + sev["high"] + sev["medium"] + sev["low"]
            last = await last_scan_date(user_id, pid)
            rows.append({
                "project_id": pid,
                "name": proj.get("name", "Untitled Project"),
                "security_score": score,
                "compliance_score": comp,
                "risk_level": risk_level_from_score(score),
                "open_vulnerabilities": open_v,
                "last_scan": last,
            })
    except Exception as e:
        print(f"Analytics: compare_projects error: {e}")
    risk_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3, "Unknown": 4}
    if sort_by == "risk_level":
        rows.sort(key=lambda r: risk_order.get(r["risk_level"], 9))
    elif sort_by == "compliance_score":
        rows.sort(key=lambda r: r["compliance_score"], reverse=True)
    elif sort_by == "open_vulnerabilities":
        rows.sort(key=lambda r: r["open_vulnerabilities"], reverse=True)
    elif sort_by == "last_scan":
        rows.sort(key=lambda r: r["last_scan"] or "", reverse=True)
    else:
        rows.sort(key=lambda r: r["security_score"], reverse=True)
    return rows


async def generate_executive_summary(user_id: str, kpis: Dict, trends: List[Dict]) -> Dict:
    """Ask Gemini for an executive narrative; fall back to a rule-based one."""
    try:
        from app.ai.gemini_client import is_available, generate as gemini_generate
        if is_available():
            improvement = 0.0
            scores = [t.get("security_score") for t in trends if t.get("security_score") is not None]
            if len(scores) >= 2:
                improvement = round(scores[-1] - scores[0], 1)
            prompt = (
                "Generate an executive security summary for a CISO dashboard.\n"
                f"Security Score: {kpis.get('security_score')}%\n"
                f"Risk Level: {kpis.get('risk_level')}\n"
                f"Compliance: {kpis.get('compliance')}%\n"
                f"Critical Issues: {kpis.get('critical')}\n"
                f"High Issues: {kpis.get('high')}\n"
                f"Recent Improvement: {improvement:+g}%\n\n"
                "Respond with ONLY valid JSON with these keys:\n"
                "- executive_summary (string)\n"
                "- business_risk (string)\n"
                "- priority_actions (array of at least 3 strings)\n"
                "- security_outlook (string)\n"
            )
            raw = await gemini_generate(prompt)
            return _parse_exec(raw, kpis, improvement)
    except Exception as e:
        print(f"Analytics: AI summary failed, fallback: {e}")
    return _fallback_exec(kpis, trends)


def _parse_exec(raw: str, kpis: Dict, improvement: float) -> Dict:
    try:
        import json, re
        cleaned = re.sub(r"```(?:json)?", "", raw).strip().strip("`").strip()
        data = json.loads(cleaned)
        fb = _fallback_exec(kpis, [])
        actions = data.get("priority_actions")
        if not isinstance(actions, list) or not actions:
            actions = fb["priority_actions"]
        return {
            "executive_summary": data.get("executive_summary") or fb["executive_summary"],
            "business_risk": data.get("business_risk") or fb["business_risk"],
            "priority_actions": actions,
            "security_outlook": data.get("security_outlook") or fb["security_outlook"],
        }
    except Exception:
        return _fallback_exec(kpis, [])


def _fallback_exec(kpis: Dict, trends: List[Dict]) -> Dict:
    score = kpis.get("security_score", 0)
    risk = kpis.get("risk_level", "Unknown")
    critical = kpis.get("critical", 0)
    high = kpis.get("high", 0)
    comp = kpis.get("compliance", 0)
    improvement = 0.0
    scores = [t.get("security_score") for t in (trends or []) if t.get("security_score") is not None]
    if len(scores) >= 2:
        improvement = round(scores[-1] - scores[0], 1)

    summary = (
        f"Overall security posture is rated {risk} risk with a {score}% security score "
        f"and {comp}% compliance coverage."
    )
    if improvement > 0:
        summary += f" The security score has improved by {improvement}% recently, showing positive momentum."
    elif improvement < 0:
        summary += f" The security score has declined by {abs(improvement)}% and needs attention."
    else:
        summary += " Security posture is stable; continue regular scanning."

    actions = []
    if critical > 0:
        actions.append("Rotate exposed credentials and remove hard-coded secrets")
    if high > 0:
        actions.append("Remediate high-severity vulnerabilities (injection, auth flaws)")
    actions.append("Enable MFA across privileged accounts")
    actions.append("Strengthen security headers and enable centralized logging")
    actions.append("Complete the security hardening checklist")

    outlook = (
        "With current remediation velocity, risk is trending downward. "
        "Sustained scanning and checklist completion will raise the score above 90%."
    )
    return {
        "executive_summary": summary,
        "business_risk": (
            f"{critical} critical and {high} high issues expose the organization to "
            "data-breach and compliance-failure scenarios if left unresolved."
        ),
        "priority_actions": actions[:4],
        "security_outlook": outlook,
    }


async def build_dashboard(user_id: str, sort_by: str = "security_score") -> Dict:
    """Assemble the full executive dashboard payload for a user."""
    score, parts = await calculate_global_score(user_id)
    sev = await aggregate_vulnerabilities(user_id)
    comp = parts["compliance"]
    checklist = parts["checklist"]
    projects = await count_projects(user_id)
    last = await last_scan_date(user_id)
    trends = await trend_service.get_trends(user_id)

    # Record a fresh analytics snapshot so trends stay current between scans.
    try:
        await trend_service.record_snapshot(
            user_id=user_id,
            project_id=None,
            security_score=score,
            risk_score=round(100.0 - score, 1),
            compliance_score=comp,
            sev_override=sev,
        )
    except Exception as e:  # pragma: no cover - defensive
        print(f"Analytics: snapshot recording failed: {e}")

    kpis = {
        "security_score": score,
        "risk_level": risk_level_from_score(score),
        "projects": projects,
        "critical": sev["critical"],
        "high": sev["high"],
        "compliance": comp,
        "checklist_progress": checklist,
        "open_vulnerabilities": sev["critical"] + sev["high"] + sev["medium"] + sev["low"],
        "last_scan": last,
    }

    comparison = await compare_projects(user_id, sort_by)
    ai = await generate_executive_summary(user_id, kpis, trends)

    return {
        "kpis": kpis,
        "trends": trends,
        "comparison": comparison,
        "ai_summary": ai,
        "source_scores": parts,
    }
