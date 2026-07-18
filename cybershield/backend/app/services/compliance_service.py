"""
Compliance engine for the Compliance Center (Module 6.3).

Loads the security signals produced by the rest of CyberShield (GitHub scan,
AI threat report, security checklist, OWASP simulator) for a project, maps them
onto four enterprise frameworks (OWASP Top 10, CWE, MITRE ATT&CK, NIST CSF),
computes a per-framework compliance score + gap analysis, derives an overall
score, and optionally asks Gemini to explain the weakest area with remediation
advice. Results are persisted to the ``compliance_reports`` MongoDB collection.
"""
from datetime import datetime
from typing import Dict, List, Optional

from bson import ObjectId

from app.database.db import database
from app.services.compliance_mapper import (
    map_frameworks,
    framework_all,
    framework_names,
)

COLLECTION = "compliance_reports"

FRAMEWORK_KEYS = ["owasp", "cwe", "mitre", "nist"]
FRAMEWORK_LABELS = {
    "owasp": "OWASP",
    "cwe": "CWE",
    "mitre": "MITRE",
    "nist": "NIST",
}


# ── Data loaders ───────────────────────────────────────────────────────────────
async def load_scan(user_id: str, project_id: Optional[str] = None) -> List[str]:
    """
    Pull finding labels from the latest GitHub scan linked to the user/project.

    Scans are stored in the ``github_scans`` collection with a flat ``findings``
    list of {type, severity, ...} dicts, and may also carry an
    ``ai_report.recommendations`` summary.
    """
    findings: List[str] = []
    try:
        query = {}
        if project_id:
            query["project_id"] = str(project_id)
        if user_id:
            query["user_id"] = str(user_id)
        doc = await database["github_scans"].find_one(
            query, sort=[("created_at", -1)]
        )
        if not doc:
            doc = await database["github_scans"].find_one(
                {"user_id": str(user_id)}, sort=[("created_at", -1)]
            )
        if not doc:
            return findings
        for f in doc.get("findings") or []:
            if isinstance(f, dict):
                label = f.get("type") or f.get("title") or f.get("name")
                if label:
                    findings.append(str(label))
            elif isinstance(f, str):
                findings.append(f)
    except Exception as e:  # pragma: no cover - defensive
        print(f"Compliance: error loading scan: {e}")
    return findings


async def load_threat_report(user_id: str, project_id: Optional[str] = None) -> List[str]:
    """
    Pull STRIDE / OWASP labelled findings from the latest AI threat report.
    """
    findings: List[str] = []
    try:
        query = {"user_id": str(user_id)}
        doc = await database["threat_reports"].find_one(
            query, sort=[("created_at", -1)]
        )
        if not doc:
            return findings
        # Threat report stores threats with a `stride` and `category`.
        for t in doc.get("threats") or []:
            cat = (t.get("category") or t.get("stride") or "").strip()
            threat = (t.get("threat") or "").strip()
            if cat:
                findings.append(str(cat))
            if threat:
                findings.append(str(threat))
        # Some reports keep an owasp_mapping block.
        owasp = doc.get("owasp_mapping") or {}
        for v in owasp.values():
            if isinstance(v, str):
                findings.append(v)
    except Exception as e:  # pragma: no cover - defensive
        print(f"Compliance: error loading threat report: {e}")
    return findings


async def load_checklist(user_id: str, project_id: Optional[str] = None) -> List[str]:
    """
    Pull completed security-checklist task titles (Module 6.1) so that
    finished hardening tasks contribute to compliance coverage.
    """
    labels: List[str] = []
    try:
        query = {
            "user_id": str(user_id),
            "status": "completed",
        }
        if project_id:
            query["project_id"] = str(project_id)
        async for row in database["user_checklists"].find(query):
            cl = None
            cid = row.get("checklist_id")
            if cid:
                try:
                    cl = await database["security_checklists"].find_one(
                        {"_id": ObjectId(cid)}
                    )
                except Exception:
                    cl = None
            title = (cl or {}).get("title") or row.get("title")
            framework = (cl or {}).get("frameworks") or []
            if title:
                labels.append(str(title))
            for fw in framework:
                labels.append(str(fw))
    except Exception as e:  # pragma: no cover - defensive
        print(f"Compliance: error loading checklist: {e}")
    return labels


async def load_owasp_simulator(user_id: str, project_id: Optional[str] = None) -> List[str]:
    """
    Pull completed OWASP simulator exercises (labs) so that practised attack
    categories improve OWASP compliance coverage.
    """
    labels: List[str] = []
    try:
        query = {"user_id": str(user_id), "status": "completed"}
        if project_id:
            query["project_id"] = str(project_id)
        async for lab in database["owasp_sessions"].find(query):
            name = lab.get("lab_name") or lab.get("category") or lab.get("title")
            attack = lab.get("attack_type") or lab.get("attack")
            if name:
                labels.append(str(name))
            if attack:
                labels.append(str(attack))
    except Exception as e:  # pragma: no cover - defensive
        print(f"Compliance: error loading OWASP sessions: {e}")
    return labels


# ── Scoring ───────────────────────────────────────────────────────────────────
def calculate_score(hit: set, total: int) -> float:
    """Return a rounded percentage of satisfied controls."""
    if total <= 0:
        return 0.0
    return round((len(hit) / total) * 100, 1)


# ── AI recommendation (advanced enhancement) ────────────────────────────────
async def generate_ai_recommendation(
    project_name: str,
    frameworks: Dict[str, float],
    gap: Dict[str, List[str]],
) -> Dict:
    """
    Ask Gemini to explain the weakest compliance area + top remediation actions.
    Falls back to a rule-based explanation when no API key is configured.
    """
    weakest = min(frameworks, key=frameworks.get) if frameworks else None
    try:
        from app.ai.gemini_client import is_available, generate as gemini_generate

        if is_available() and weakest:
            missing = gap.get(weakest, [])
            prompt = (
                f"Project: {project_name}\n"
                f"{FRAMEWORK_LABELS.get(weakest, weakest)} Score: {frameworks[weakest]}%\n"
                f"Missing Controls: {', '.join(missing) if missing else 'None'}\n\n"
                "You are a senior cybersecurity compliance analyst. Respond with ONLY a valid "
                "JSON object (no markdown, no commentary) with exactly these keys:\n"
                "- executive_summary: string explaining the overall posture in 2 sentences\n"
                "- compliance_weaknesses: string describing the weakest framework gaps\n"
                "- business_impact: string describing the risk to the business\n"
                "- priority_actions: array of AT LEAST 3 concrete remediation strings\n"
                "- estimated_score_after_fixes: number (must be HIGHER than the current "
                f"{frameworks[weakest]}% score, a realistic post-remediation value up to 100)\n"
            )
            raw = await gemini_generate(prompt)
            return _parse_ai(raw, frameworks, weakest, gap)
    except Exception as e:  # pragma: no cover - defensive
        print(f"Compliance: AI recommendation failed, using fallback: {e}")

    return _fallback_recommendation(project_name, frameworks, gap, weakest)


def _parse_ai(raw: str, frameworks: Dict[str, float], weakest: Optional[str],
              gap: Dict[str, List[str]] = None) -> Dict:
    """Parse Gemini JSON output, filling gaps from the rule-based fallback."""
    try:
        import json, re
        # Strip markdown code fences if present.
        cleaned = re.sub(r"```(?:json)?", "", raw).strip().strip("`").strip()
        data = json.loads(cleaned)
    except Exception:
        return _fallback_recommendation("", frameworks, gap or {}, weakest, raw_summary=raw)

    # Merge with the deterministic fallback so any field the model omits
    # (e.g. priority_actions / estimated_score) still gets sensible values.
    fb = _fallback_recommendation("", frameworks, gap or {}, weakest)
    actions = data.get("priority_actions")
    if not isinstance(actions, list) or not actions:
        actions = fb["priority_actions"]
    est = data.get("estimated_score_after_fixes")
    if not isinstance(est, (int, float)):
        est = fb["estimated_score_after_fixes"]
    return {
        "executive_summary": data.get("executive_summary") or fb["executive_summary"],
        "compliance_weaknesses": data.get("compliance_weaknesses") or fb["compliance_weaknesses"],
        "business_impact": data.get("business_impact") or fb["business_impact"],
        "priority_actions": actions,
        "estimated_score_after_fixes": est,
    }


def _fallback_recommendation(
    project_name: str,
    frameworks: Dict[str, float],
    gap: Dict[str, List[str]],
    weakest: Optional[str],
    raw_summary: Optional[str] = None,
) -> Dict:
    """Deterministic, key-free explanation of the compliance posture."""
    if not weakest:
        return {
            "executive_summary": "No compliance data available yet. Run a GitHub scan or generate a threat report first.",
            "compliance_weaknesses": "Insufficient security signals to assess compliance.",
            "business_impact": "Unknown until data is collected.",
            "priority_actions": ["Run a GitHub Security Scan", "Generate an AI Threat Report"],
            "estimated_score_after_fixes": None,
        }
    label = FRAMEWORK_LABELS.get(weakest, weakest)
    missing = gap.get(weakest, [])
    actions = {
        "owasp": ["Enable security headers", "Use parameterized queries", "Move secrets to a vault"],
        "cwe": ["Remove hard-coded credentials", "Validate and sanitize input", "Patch vulnerable components"],
        "mitre": ["Enable MFA", "Rotate credentials", "Implement audit logging", "Monitor privilege escalation"],
        "nist": ["Encrypt data at rest and in transit", "Centralize logging", "Enforce access control", "Patch and assess risks"],
    }.get(weakest, ["Review missing controls and remediate"])
    est = round(min(100.0, frameworks[weakest] + max(5.0, (100 - frameworks[weakest]) * 0.5)), 1)

    summary = (
        raw_summary
        or f"Your weakest compliance area is {label} at {frameworks[weakest]}%. "
        f"Focus remediation on: {', '.join(missing) if missing else 'the missing controls listed below'}."
    )
    return {
        "executive_summary": summary,
        "compliance_weaknesses": f"{label} coverage is incomplete. Missing controls: "
        f"{', '.join(missing) if missing else 'see gap analysis'}.",
        "business_impact": "Unaddressed gaps increase the likelihood and impact of a successful breach.",
        "priority_actions": actions,
        "estimated_score_after_fixes": est,
    }


# ── Report generation ─────────────────────────────────────────────────────────
async def generate_compliance(
    user_id: str, project_id: str, project_name: Optional[str] = None
) -> Dict:
    """
    End-to-end compliance generation for a project.

    Returns a fully-populated report dictionary (also persisted via save_report).
    """
    project = await database["projects"].find_one({"_id": ObjectId(project_id)})
    project_name = project_name or (project or {}).get("name") or "Untitled Project"

    # Step 1: gather findings from every source.
    scan_findings = await load_scan(user_id, project_id)
    threat_findings = await load_threat_report(user_id, project_id)
    checklist_findings = await load_checklist(user_id, project_id)
    owasp_findings = await load_owasp_simulator(user_id, project_id)

    all_findings: List[str] = (
        scan_findings + threat_findings + checklist_findings + owasp_findings
    )

    # Step 2: map to frameworks.
    mapped = map_frameworks(all_findings)

    # Step 3: per-framework scores + gap analysis.
    frameworks: Dict[str, float] = {}
    breakdown: Dict[str, Dict] = {}
    gap_analysis: List[Dict] = {}
    for key in FRAMEWORK_KEYS:
        all_controls = framework_all(key)
        hit = mapped.get(key, set())
        score = calculate_score(hit, len(all_controls))
        missing = sorted([c for c in all_controls if c not in hit])
        frameworks[FRAMEWORK_LABELS[key]] = score
        breakdown[key] = {
            "score": score,
            "satisfied": len(hit),
            "total": len(all_controls),
            "missing": missing,
        }
        gap_analysis.append({
            "framework": FRAMEWORK_LABELS[key],
            "score": score,
            "missing": missing,
        })

    # Step 4: overall score = average of framework scores.
    overall = round(sum(frameworks.values()) / len(frameworks), 1) if frameworks else 0.0

    # Step 5: summary (highest gap / highest framework).
    highest_gap = min(frameworks, key=frameworks.get) if frameworks else None
    highest_framework = max(frameworks, key=frameworks.get) if frameworks else None
    summary = {
        "overall_score": overall,
        "frameworks": frameworks,
        "highest_gap": highest_gap,
        "highest_framework": highest_framework,
    }

    # Step 6: AI recommendation.
    rec = await generate_ai_recommendation(project_name, frameworks, {
        g["framework"].lower(): g["missing"] for g in gap_analysis
    })

    report = {
        "project_id": str(project_id),
        "project_name": project_name,
        "overall_score": overall,
        "frameworks": frameworks,
        "summary": summary,
        "breakdown": breakdown,
        "gap_analysis": gap_analysis,
        "recommendations": rec,
        "sources": {
            "github_scan": len(scan_findings),
            "threat_report": len(threat_findings),
            "checklist": len(checklist_findings),
            "owasp_simulator": len(owasp_findings),
        },
        "created_at": datetime.utcnow(),
    }
    return report


HISTORY_COLLECTION = "compliance_history"


async def save_report(report: Dict) -> str:
    """
    Persist a compliance report and append a point to the historical score log.

    Each generation is stored verbatim (so the full report history is retained),
    and a lightweight score snapshot is appended to ``compliance_history`` for
    fast trend-chart queries.
    """
    project_id = report["project_id"]
    res = await database[COLLECTION].insert_one(report)

    # Append a trend snapshot, keeping only the most recent 24 points.
    await database[HISTORY_COLLECTION].insert_one({
        "project_id": str(project_id),
        "overall_score": report.get("overall_score", 0),
        "frameworks": report.get("frameworks", {}),
        "created_at": report.get("created_at") or datetime.utcnow(),
    })
    try:
        keep_ids = [
            d["_id"] async for d in database[HISTORY_COLLECTION]
            .find({"project_id": str(project_id)})
            .sort("created_at", -1)
            .limit(24)
        ]
        await database[HISTORY_COLLECTION].delete_many({
            "project_id": str(project_id),
            "_id": {"$nin": keep_ids},
        })
    except Exception:
        pass
    return str(res.inserted_id)


async def get_report(project_id: str) -> Optional[Dict]:
    """Return the latest compliance report for a project, or None."""
    doc = await database[COLLECTION].find_one(
        {"project_id": str(project_id)}, sort=[("created_at", -1)]
    )
    if not doc:
        return None
    return _serialise(doc)


async def get_history(project_id: str) -> List[Dict]:
    """Return the historical compliance scores for trend charts."""
    out: List[Dict] = []
    async for doc in database[HISTORY_COLLECTION].find(
        {"project_id": str(project_id)}
    ).sort("created_at", 1):
        created = doc.get("created_at")
        out.append({
            "date": created.strftime("%Y-%m-%d") if isinstance(created, datetime) else "2026-01-01",
            "overall": doc.get("overall_score", 0),
            "frameworks": doc.get("frameworks", {}),
            "project": doc.get("project_name"),
        })
    # Always provide at least a flat baseline so the trend chart renders.
    if not out:
        out = [
            {"date": "2026-01-01", "overall": 0, "project": "Baseline"},
        ]
    return out


def _serialise(doc: Dict) -> Dict:
    out = dict(doc)
    out["id"] = str(doc["_id"])
    created = doc.get("created_at")
    out["created_at"] = created.isoformat() if isinstance(created, datetime) else None
    return out
