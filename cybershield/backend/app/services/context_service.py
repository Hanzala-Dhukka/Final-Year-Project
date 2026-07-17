"""
Context service for the AI Security Assistant (Module 5.2).

Reads the user's CyberShield data from existing collections:
  projects, scans (GitHub), threat_reports, owasp_sessions, quiz_attempts

and assembles a compact context object the prompt builder injects into the
Gemini prompt so answers are personalised to the user's actual data.

Functions (per spec):
  get_current_project, get_latest_scan, get_latest_threat_report,
  get_latest_owasp, get_latest_quiz, build_context
"""
from typing import Optional
from bson import ObjectId

from app.database.db import database


def _oid(value: str):
    try:
        return ObjectId(value)
    except Exception:
        return None


async def get_current_project(user_id: str, project_id: Optional[str] = None) -> Optional[dict]:
    """
    Return the active project dict, or None.

    If project_id is provided and the user owns/is a member, returns it;
    otherwise returns the user's most recently updated project.
    """
    if project_id:
        oid = _oid(project_id)
        if oid:
            proj = await database.projects.find_one({"_id": oid})
            if proj and (
                str(proj.get("owner_id")) == str(user_id)
                or any(str(m.get("user_id")) == str(user_id) for m in proj.get("members", []))
            ):
                return proj

    # Fallback: most recent project the user owns or belongs to
    cursor = database.projects.find({
        "$or": [
            {"owner_id": user_id},
            {"members.user_id": user_id},
        ]
    }).sort("updated_at", -1).limit(1)
    async for proj in cursor:
        return proj
    return None


async def get_latest_scan(user_id: str, project_id: Optional[str] = None) -> Optional[dict]:
    """
    Return the user's most recent GitHub scan (collection `scans`), optionally
    filtered to a project, or None when nothing has been scanned yet.
    """
    query = {"user_id": user_id}
    if project_id:
        query["project_id"] = project_id
    return await database.scans.find_one(query, sort=[("created_at", -1)])


async def get_latest_threat_report(user_id: str, project_id: Optional[str] = None) -> Optional[dict]:
    """Return the user's most recent threat report, or None."""
    query = {"user_id": user_id}
    if project_id:
        query["project_id"] = project_id
    return await database.threat_reports.find_one(query, sort=[("created_at", -1)])


async def get_latest_owasp(user_id: str) -> Optional[dict]:
    """Return the user's most recent OWASP simulator session, or None."""
    return await database.owasp_sessions.find_one(
        {"user_id": user_id}, sort=[("completed_at", -1)]
    )


async def get_latest_quiz(user_id: str) -> Optional[dict]:
    """Return the user's most recent quiz attempt, or None."""
    return await database.quiz_attempts.find_one(
        {"user_id": user_id}, sort=[("completed_at", -1)]
    )


def _scan_summary(scan: dict) -> Optional[dict]:
    """Compact, prompt-friendly summary of a GitHub scan."""
    if not scan:
        return None
    vulns = scan.get("vulnerabilities") or scan.get("findings") or []
    vuln_list = []
    for v in vulns:
        if isinstance(v, dict):
            vuln_list.append({
                "type": v.get("type") or v.get("title") or v.get("name"),
                "severity": v.get("severity"),
                "file": v.get("file"),
            })
        elif isinstance(v, str):
            vuln_list.append({"type": v})
    return {
        "repository": scan.get("repository_name") or scan.get("repo_url"),
        "risk_score": scan.get("risk_score"),
        "total_vulnerabilities": scan.get("total_vulnerabilities", len(vuln_list)),
        "vulnerabilities": vuln_list,
    }


def _report_summary(report: dict) -> Optional[dict]:
    """Compact summary of a threat report."""
    if not report:
        return None
    return {
        "project": report.get("project_name") or report.get("project"),
        "risk_level": report.get("risk_level") or report.get("risk"),
        "security_score": report.get("security_score") or report.get("score"),
        "stride": report.get("stride"),
        "mitre": report.get("mitre"),
        "owasp_mapping": report.get("owasp_mapping"),
        "summary": report.get("summary"),
    }


def _owasp_summary(session: dict) -> Optional[dict]:
    """Compact summary of an OWASP simulator session."""
    if not session:
        return None
    return {
        "lab": session.get("lab_name") or session.get("category") or session.get("title"),
        "status": session.get("status"),
        "attack": session.get("attack_type") or session.get("attack"),
        "defense": session.get("defense") or session.get("defense_applied"),
        "result": session.get("result"),
        "score": session.get("score"),
    }


def _quiz_summary(quiz: dict) -> Optional[dict]:
    """Compact summary of a quiz attempt."""
    if not quiz:
        return None
    return {
        "score": quiz.get("score"),
        "category": quiz.get("category"),
        "total_questions": quiz.get("total_questions"),
        "correct_answers": quiz.get("correct_answers"),
        "answers": quiz.get("answers"),
    }


async def build_context(user_id: str, project_id: Optional[str] = None) -> dict:
    """
    Assemble the full context object used to personalise AI answers.

    Returns a dict with: project, latest_scan, latest_threat_report,
    latest_owasp, latest_quiz, learning_progress.
    """
    project = await get_current_project(user_id, project_id)
    proj_id = str(project["_id"]) if project else project_id

    scan = await get_latest_scan(user_id, proj_id)
    report = await get_latest_threat_report(user_id, proj_id)
    owasp = await get_latest_owasp(user_id)
    quiz = await get_latest_quiz(user_id)

    # Learning progress (counts/averages) for personalisation
    try:
        quiz_count = await database.quiz_attempts.count_documents({"user_id": user_id})
        owasp_count = await database.owasp_sessions.count_documents({"user_id": user_id})
    except Exception:
        quiz_count = owasp_count = 0

    return {
        "project": {
            "name": project.get("name") if project else None,
            "tech_stack": project.get("tech_stack", []) if project else [],
            "description": project.get("description") if project else None,
        },
        "latest_scan": _scan_summary(scan),
        "latest_threat_report": _report_summary(report),
        "latest_owasp": _owasp_summary(owasp),
        "latest_quiz": _quiz_summary(quiz),
        "learning_progress": {
            "quizzes_completed": quiz_count,
            "owasp_labs_completed": owasp_count,
        },
    }
