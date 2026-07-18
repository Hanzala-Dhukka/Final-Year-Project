"""
AI Remediation Engine service (Module 5.4).

Pipeline: build prompt -> call Gemini -> parse JSON -> persist report ->
track actions -> support status updates, mark-fixed and re-scan verification.
"""
import json
import re
from typing import Optional

from app.database.db import database
from app.models.remediation_model import (
    remediation_document,
    remediation_action_document,
    fixed_vulnerability_document,
)
from app.ai.remediation_engine import build_remediation_prompt
from app.ai.gemini_client import generate, is_available

reports = database.remediation_reports
actions = database.remediation_actions
fixed = database.fixed_vulnerabilities

SEVERITY_RISK = {"Critical": 90, "High": 70, "Medium": 45, "Low": 20}


def _safe_json(text: str) -> dict:
    """
    Extract the first ```json fenced block (or whole text) and parse it.
    Returns {} on failure.
    """
    if not text:
        return {}
    # Prefer fenced json block
    m = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL | re.IGNORECASE)
    candidate = m.group(1) if m else text
    # Fallback: any fenced block
    if not m:
        m2 = re.search(r"```\s*(.*?)\s*```", text, re.DOTALL)
        if m2:
            candidate = m2.group(1)
    try:
        return json.loads(candidate)
    except Exception:
        return {}


def _fallback_solution(finding: str, severity: str, technology: str) -> dict:
    """Offline remediation when Groq is unavailable (spec Step 17 robustness)."""
    return {
        "vulnerability": finding,
        "severity": severity or "Medium",
        "category": "",
        "explanation": (
            "Groq is not configured, so this is a rule-based placeholder. "
            "Set GROQ_API_KEY to receive a full AI remediation."
        ),
        "impact": ["Potential compromise of confidentiality/integrity/availability."],
        "root_cause": "See the flagged code and the secure-coding guidance below.",
        "secure_code": "",
        "solution": [
            "Identify the vulnerable code path.",
            "Apply the technology-appropriate secure pattern.",
            "Add a regression test and re-scan.",
        ],
        "prevention": [
            "Use secure defaults and input validation.",
            "Store secrets outside source code.",
            "Run SAST in CI.",
        ],
        "owasp": "",
        "cwe": "",
        "risk_before": SEVERITY_RISK.get(severity or "Medium", 45),
        "risk_after": max(10, SEVERITY_RISK.get(severity or "Medium", 45) - 30),
    }


async def generate_fix(
    user_id: str,
    project_id: str,
    finding: str,
    severity: str = None,
    technology: str = None,
    code: str = None,
    file: str = None,
    line: int = None,
    source: str = "manual",
    context: str = None,
    vulnerability_id: str = None,
) -> str:
    """
    Generate a remediation, persist it and return the new report id.
    """
    prompt = build_remediation_prompt(
        finding=finding,
        severity=severity,
        technology=technology,
        code=code,
        file=file,
        line=line,
        context=context,
    )

    ai = {}
    if is_available():
        try:
            text = await generate(prompt)
            ai = _safe_json(text)
            # Treat explicit refusal / unsafe as an error object
            if ai.get("error"):
                ai = _fallback_solution(finding, severity, technology)
                ai["explanation"] = ai.get("explanation", "") + " (AI refused unsafe request.)"
        except Exception as e:
            ai = _fallback_solution(finding, severity, technology)
            ai["explanation"] = f"AI generation failed: {e}"
    else:
        ai = _fallback_solution(finding, severity, technology)

    ai.setdefault("severity", severity or "Medium")
    risk_before = ai.get("risk_before") or SEVERITY_RISK.get(ai["severity"], 45)
    risk_after = ai.get("risk_after")
    if risk_after is None:
        risk_after = max(5, risk_before - 30)

    doc = remediation_document(
        user_id=user_id,
        project_id=project_id,
        vulnerability_id=vulnerability_id or "",
        finding=finding,
        severity=ai["severity"],
        technology=technology or "",
        ai_solution=ai,
        risk_before=risk_before,
        risk_after=risk_after,
        source=source,
    )
    await reports.insert_one(doc)
    report_id = doc["_id"]

    await actions.insert_one(
        remediation_action_document(report_id, user_id, "generate", {"source": source})
    )
    return report_id


async def save_remediation(report_id: str, user_id: str, data: dict) -> bool:
    """Persist an externally supplied remediation (used by tests/integrations)."""
    res = await reports.update_one(
        {"_id": report_id, "user_id": user_id},
        {"$set": {"ai_solution": data, "updated_at": remediation_document.__globals__["utcnow"]()}},
    )
    return res.modified_count > 0


async def get_remediation(report_id: str, user_id: str) -> Optional[dict]:
    """Return a full report doc, ownership-checked (lookup by `_id`)."""
    doc = await reports.find_one({"_id": report_id, "user_id": user_id})
    return doc


async def list_remediations(user_id: str, project_id: str = None) -> list:
    """List remediation summaries, optionally filtered by project, newest first."""
    query = {"user_id": user_id}
    if project_id:
        query["project_id"] = project_id
    cursor = reports.find(query).sort("created_at", -1)
    out = []
    async for doc in cursor:
        sol = doc.get("ai_solution", {})
        out.append({
            "id": doc["_id"],
            "finding": doc.get("finding", ""),
            "severity": doc.get("severity", ""),
            "technology": doc.get("technology", ""),
            "status": doc.get("status", "Open"),
            "category": sol.get("category", ""),
            "owasp": sol.get("owasp", ""),
            "cwe": sol.get("cwe", ""),
            "risk_before": sol.get("risk_before"),
            "risk_after": sol.get("risk_after"),
            "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else "",
        })
    return out


async def update_status(report_id: str, user_id: str, status: str) -> bool:
    """Update the status (Open | In Progress | Fixed) of a report."""
    res = await reports.update_one(
        {"_id": report_id, "user_id": user_id},
        {"$set": {"status": status, "updated_at": remediation_document.__globals__["utcnow"]()}},
    )
    if res.modified_count > 0:
        await actions.insert_one(
            remediation_action_document(report_id, user_id, "status_change", {"status": status})
        )
        return True
    return False


async def mark_fixed(report_id: str, user_id: str, project_id: str = None,
                     rescan_summary: dict = None) -> bool:
    """
    Mark a report as Fixed and record it in `fixed_vulnerabilities`.

    Returns True if the report existed and was updated.
    """
    doc = await reports.find_one({"_id": report_id, "user_id": user_id})
    if not doc:
        return False

    from app.models.remediation_model import utcnow
    await reports.update_one(
        {"_id": report_id, "user_id": user_id},
        {"$set": {"status": "Fixed", "updated_at": utcnow()}},
    )
    await actions.insert_one(
        remediation_action_document(report_id, user_id, "mark_fixed", {})
    )
    await fixed.insert_one(
        fixed_vulnerability_document(
            report_id=report_id,
            user_id=user_id,
            project_id=project_id or doc.get("project_id"),
            finding=doc.get("finding", ""),
            severity=doc.get("severity", ""),
            technology=doc.get("technology", ""),
            rescan_summary=rescan_summary,
        )
    )
    return True


def to_summary(doc: dict) -> dict:
    sol = doc.get("ai_solution", {})
    return {
        "id": doc["_id"],
        "finding": doc.get("finding", ""),
        "severity": doc.get("severity", ""),
        "technology": doc.get("technology", ""),
        "status": doc.get("status", "Open"),
        "category": sol.get("category", ""),
        "owasp": sol.get("owasp", ""),
        "cwe": sol.get("cwe", ""),
        "risk_before": sol.get("risk_before"),
        "risk_after": sol.get("risk_after"),
        "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else "",
    }


def to_report(doc: dict) -> dict:
    sol = doc.get("ai_solution", {})
    return {
        "id": doc["_id"],
        "project_id": doc.get("project_id"),
        "vulnerability_id": doc.get("vulnerability_id"),
        "finding": doc.get("finding", ""),
        "severity": doc.get("severity", ""),
        "technology": doc.get("technology", ""),
        "source": doc.get("source"),
        "ai_solution": {
            "explanation": sol.get("explanation", ""),
            "impact": sol.get("impact", []),
            "root_cause": sol.get("root_cause", ""),
            "solution": sol.get("solution", []),
            "secure_code": sol.get("secure_code", ""),
            "prevention": sol.get("prevention", []),
            "category": sol.get("category", ""),
            "owasp": sol.get("owasp", ""),
            "cwe": sol.get("cwe", ""),
            "risk_before": sol.get("risk_before"),
            "risk_after": sol.get("risk_after"),
        },
        "status": doc.get("status", "Open"),
        "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else "",
        "updated_at": doc.get("updated_at").isoformat() if doc.get("updated_at") else "",
    }
