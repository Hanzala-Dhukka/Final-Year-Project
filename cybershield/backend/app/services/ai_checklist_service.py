"""
AI-powered dynamic security checklist service (Module 6.2).

Orchestrates:
  1. build_ai_context  -> pull project, GitHub scan, threat report, OWASP
                          results, tech stack and previous progress.
  2. checklist_prompt  -> build the Gemini prompt.
  3. gemini_client     -> call the model (falls back to a rule-based checklist
                          when no API key is configured).
  4. checklist_generator -> parse / validate / sort / score.
  5. store in `generated_checklists` (latest kept, history retained).

Also updates progress on the Module 6.1 `user_checklists` collection so the
static and AI checklists stay in sync when a task is completed.
"""
from datetime import datetime
from typing import Dict, List, Optional

from bson import ObjectId

from app.database.db import database
from app.ai.checklist_prompt import build_checklist_prompt
from app.services.checklist_generator import generate_checklist
from app.ai.gemini_client import is_available, generate as gemini_generate

GENERATED_COLLECTION = "generated_checklists"
PRIORITY_ORDER = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}


def _oid(value: str):
    try:
        return ObjectId(value)
    except Exception:
        return None


# ── Context builder (Step 4) ──────────────────────────────────────────────────
async def build_ai_context(user_id: str, project_id: str) -> Dict:
    """Collect all data Gemini needs to generate a project-specific checklist."""
    project = await database.projects.find_one({"_id": _oid(project_id)})

    # Latest GitHub scan for the project (fallback to user-level)
    scan = await database.scans.find_one(
        {"user_id": str(user_id), "project_id": str(project_id)},
        sort=[("created_at", -1)],
    ) or await database.scans.find_one(
        {"user_id": str(user_id)}, sort=[("created_at", -1)]
    )

    # Latest threat report
    report = await database.threat_reports.find_one(
        {"user_id": str(user_id)}, sort=[("created_at", -1)]
    )

    # Latest OWASP simulator session
    owasp = await database.owasp_sessions.find_one(
        {"user_id": str(user_id)}, sort=[("completed_at", -1)]
    )

    tech_stack = (project or {}).get("tech_stack", []) if project else []

    # Vulnerabilities / findings from scan
    vulnerabilities: List[str] = []
    github_findings: List[Dict] = []
    if scan:
        for v in scan.get("vulnerabilities") or scan.get("findings") or []:
            if isinstance(v, dict):
                label = v.get("type") or v.get("title") or v.get("name")
                if label:
                    vulnerabilities.append(str(label))
                github_findings.append({
                    "type": v.get("type") or v.get("title"),
                    "severity": v.get("severity"),
                    "file": v.get("file"),
                })
            elif isinstance(v, str):
                vulnerabilities.append(v)
                github_findings.append({"type": v})

    # OWASP results
    owasp_results: List[Dict] = []
    if owasp:
        owasp_results.append({
            "lab": owasp.get("lab_name") or owasp.get("category") or owasp.get("title"),
            "attack": owasp.get("attack_type") or owasp.get("attack"),
            "result": owasp.get("result"),
            "score": owasp.get("score"),
        })

    # Risk score: prefer scan risk_score, else report security_score
    risk_score = None
    if scan and scan.get("risk_score") is not None:
        risk_score = int(scan["risk_score"])
    elif report and report.get("security_score") is not None:
        risk_score = int(report["security_score"])

    # Previously completed items from Module 6.1 progress
    completed_items: List[str] = []
    async for r in database.user_checklists.find({
        "user_id": str(user_id),
        "project_id": str(project_id),
        "status": "completed",
    }):
        cl = await database.security_checklists.find_one({"_id": _oid(r.get("checklist_id"))})
        if cl:
            completed_items.append(cl.get("title"))

    return {
        "project_name": (project or {}).get("name") if project else None,
        "tech_stack": tech_stack,
        "risk_score": risk_score,
        "vulnerabilities": vulnerabilities,
        "github_findings": github_findings,
        "threat_report": _report_summary(report),
        "owasp_results": owasp_results,
        "completed_items": completed_items,
    }


def _report_summary(report: Optional[Dict]) -> Optional[Dict]:
    if not report:
        return None
    return {
        "project": report.get("project_name") or report.get("project"),
        "risk_level": report.get("risk_level") or report.get("risk"),
        "security_score": report.get("security_score") or report.get("score"),
        "stride": report.get("stride"),
        "owasp_mapping": report.get("owasp_mapping"),
    }


# ── Rule-based fallback (no Gemini key) ───────────────────────────────────────
def _fallback_checklist(context: Dict) -> Dict:
    """Generate a deterministic checklist when Gemini is unavailable."""
    vulns = context.get("vulnerabilities") or []
    tech = context.get("tech_stack") or []
    risk = context.get("risk_score")

    fb: List[Dict] = []
    if any("secret" in v.lower() for v in vulns):
        fb.append({
            "title": "Remove Hardcoded Secrets", "description": "Move secrets to environment variables / vault.",
            "priority": "Critical", "difficulty": "Easy", "estimated_time": "20 min",
            "risk_reduction": "18%", "framework": "OWASP A02",
            "reason": "Hardcoded secrets are exposed in source control.",
        })
    if any("sql" in v.lower() or "injection" in v.lower() for v in vulns):
        fb.append({
            "title": "Use Parameterized Queries", "description": "Prevent SQL Injection with ORM / prepared statements.",
            "priority": "High", "difficulty": "Medium", "estimated_time": "45 min",
            "risk_reduction": "12%", "framework": "OWASP A03",
            "reason": "Injection is a top risk for data-backed apps.",
        })
    if any("jwt" in v.lower() or "auth" in v.lower() for v in vulns):
        fb.append({
            "title": "Harden Authentication (MFA + JWT rotation)",
            "description": "Enable MFA and set short JWT expiry with rotation.",
            "priority": "High", "difficulty": "Hard", "estimated_time": "2 hours",
            "risk_reduction": "10%", "framework": "OWASP A07",
            "reason": "Weak authentication enables account takeover.",
        })
    # Default hygiene tasks
    fb.append({
        "title": "Add Content Security Policy", "description": "Set CSP and other security headers.",
        "priority": "Medium", "difficulty": "Medium", "estimated_time": "30 min",
        "risk_reduction": "5%", "framework": "OWASP A05",
        "reason": "Missing security headers widen the attack surface.",
    })
    fb.append({
        "title": "Enforce HTTPS / TLS", "description": "Redirect HTTP to HTTPS and enable HSTS.",
        "priority": "High", "difficulty": "Easy", "estimated_time": "15 min",
        "risk_reduction": "6%", "framework": "OWASP A02",
        "reason": "Plaintext transport exposes data in transit.",
    })

    items = [_task(t) for t in fb]
    items.sort(key=lambda t: PRIORITY_ORDER.get(t.priority, 99))
    remaining = risk if risk is not None else 50
    for it in items:
        remaining -= _parse_pct(it.risk_reduction)
    from app.services.checklist_generator import build_summary
    return {
        "items": items,
        "estimated_risk_after": max(0, remaining),
        "ai_summary": build_summary(items, risk, max(0, remaining)),
    }


def _task(raw: Dict):
    from app.services.checklist_generator import _normalise_task
    return _normalise_task(raw)


def _parse_pct(value: str) -> int:
    import re
    m = re.search(r"(\d+)", str(value))
    return int(m.group(1)) if m else 0


# ── Generate / store ──────────────────────────────────────────────────────────
async def generate_project_checklist(user_id: str, project_id: str) -> Dict:
    """Build context, call Gemini (or fallback), validate, store, return."""
    context = await build_ai_context(str(user_id), str(project_id))
    risk_score = context.get("risk_score")

    if is_available():
        prompt = build_checklist_prompt(context)
        ai_text = await gemini_generate(prompt)
        result = generate_checklist(ai_text, risk_score)
    else:
        result = _fallback_checklist(context)

    items = result["items"]
    estimated_risk_after = result.get("estimated_risk_after")
    ai_summary = result.get("ai_summary")

    doc = {
        "project_id": str(project_id),
        "user_id": str(user_id),
        "generated_by": "gemini" if is_available() else "fallback",
        "risk_score": risk_score,
        "estimated_risk_after": estimated_risk_after,
        "items": [it.dict() for it in items],
        "ai_summary": ai_summary,
        "created_at": datetime.utcnow(),
    }
    res = await database[GENERATED_COLLECTION].insert_one(doc)
    doc["_id"] = res.inserted_id

    return {
        "id": str(doc["_id"]),
        "project_id": str(project_id),
        "generated_by": doc["generated_by"],
        "risk_score": risk_score,
        "estimated_risk_after": estimated_risk_after,
        "items": items,
        "ai_summary": ai_summary,
        "created_at": doc["created_at"].isoformat(),
    }


async def get_latest_checklist(project_id: str) -> Optional[Dict]:
    """Return the most recent generated checklist for a project, or None."""
    doc = await database[GENERATED_COLLECTION].find_one(
        {"project_id": str(project_id)}, sort=[("created_at", -1)]
    )
    if not doc:
        return None
    return _serialise(doc)


async def get_checklist_by_id(checklist_id: str) -> Optional[Dict]:
    oid = _oid(checklist_id)
    if not oid:
        return None
    doc = await database[GENERATED_COLLECTION].find_one({"_id": oid})
    if not doc:
        return None
    return _serialise(doc)


async def delete_checklist(checklist_id: str) -> bool:
    oid = _oid(checklist_id)
    if not oid:
        return False
    res = await database[GENERATED_COLLECTION].delete_one({"_id": oid})
    return res.deleted_count > 0


async def mark_item_complete(user_id: str, project_id: str,
                             checklist_id: str, item_index: int,
                             completed: bool = True) -> Dict:
    """
    Toggle completion of a generated checklist item and mirror it into the
    Module 6.1 user_checklists progress so both views stay consistent.
    """
    doc = await get_checklist_by_id(checklist_id)
    if not doc:
        raise ValueError("Generated checklist not found")
    # Project id is taken from the checklist doc when not supplied.
    if not project_id:
        project_id = doc.get("project_id")
    items = doc["items"]
    if not (0 <= item_index < len(items)):
        raise ValueError("Invalid item index")

    # Update the generated checklist item's completed flag
    await database[GENERATED_COLLECTION].update_one(
        {"_id": _oid(checklist_id)},
        {"$set": {f"items.{item_index}.completed": completed}},
    )

    # Mirror into Module 6.1 progress using the matching default checklist title
    title = items[item_index].get("title")
    default = await database.security_checklists.find_one({"title": title})
    if default:
        from datetime import datetime as _dt
        await database.user_checklists.update_one(
            {
                "user_id": str(user_id),
                "project_id": str(project_id),
                "checklist_id": str(default["_id"]),
            },
            {
                "$set": {
                    "status": "completed" if completed else "pending",
                    "updated_at": _dt.utcnow(),
                    "completed_at": _dt.utcnow() if completed else None,
                },
                "$setOnInsert": {
                    "user_id": str(user_id),
                    "project_id": str(project_id),
                    "checklist_id": str(default["_id"]),
                    "created_at": _dt.utcnow(),
                },
            },
            upsert=True,
        )

    return {"updated": True, "item_index": item_index, "completed": completed}


def _serialise(doc: Dict) -> Dict:
    from app.schemas.ai_checklist_schema import ChecklistTask
    out = {
        "id": str(doc["_id"]),
        "project_id": doc.get("project_id"),
        "generated_by": doc.get("generated_by", "gemini"),
        "risk_score": doc.get("risk_score"),
        "estimated_risk_after": doc.get("estimated_risk_after"),
        "ai_summary": doc.get("ai_summary"),
        "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else None,
        "items": [],
    }
    for it in doc.get("items", []):
        if isinstance(it, ChecklistTask):
            out["items"].append(it.dict())
        else:
            out["items"].append(it)
    return out
