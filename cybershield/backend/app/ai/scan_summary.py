"""
AI Scan Summary Service (Module E3, Step 4).

Generates an executive security summary from scan findings using Groq AI,
then persists it to MongoDB.
"""
import json
from typing import Dict, Any, Optional

from app.database.db import database
from app.ai.gemini_client import generate, is_available
from app.ai.summary_prompt import SCAN_SUMMARY_PROMPT
from app.models.scan_summary_model import scan_summary_document

# MongoDB collection
summaries_col = database.scan_summaries


async def generate_scan_summary(scan_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate an AI executive summary from scan results.

    Args:
        scan_data: The scan result data (severity counts, findings, etc.)

    Returns:
        Dict with risk_level, summary, top_risks, priority_actions.
    """
    # Prepare scan data for the prompt (compact format)
    compact = {
        "critical": scan_data.get("critical", 0),
        "high": scan_data.get("high", 0),
        "medium": scan_data.get("medium", 0),
        "low": scan_data.get("low", 0),
        "score": scan_data.get("score", scan_data.get("security_score", 50)),
        "findings": scan_data.get("findings", [])[:10],
        "risk_level": scan_data.get("risk_level", "Unknown"),
    }

    prompt = SCAN_SUMMARY_PROMPT.format(scan_data=json.dumps(compact, default=str))

    if not is_available():
        # Fallback: generate a basic summary without AI
        return _fallback_summary(compact)

    try:
        raw = await generate(prompt)
        # Strip markdown fences if present
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = "\n".join(cleaned.split("\n")[1:])
        if cleaned.endswith("```"):
            cleaned = "\n".join(cleaned.split("\n")[:-1])
        result = json.loads(cleaned)

        # Validate required fields
        if "risk_level" not in result:
            result["risk_level"] = _derive_risk_level(compact)
        if "summary" not in result:
            result["summary"] = "Security scan completed."
        if "top_risks" not in result:
            result["top_risks"] = []
        if "priority_actions" not in result:
            result["priority_actions"] = []

        return result
    except Exception as e:
        print(f"[ScanSummary] AI generation failed: {e}")
        return _fallback_summary(compact)


def _derive_risk_level(data: Dict[str, Any]) -> str:
    """Derive risk level from severity counts when AI fails."""
    if data.get("critical", 0) > 0:
        return "Critical"
    if data.get("high", 0) > 3:
        return "High"
    if data.get("high", 0) > 0 or data.get("medium", 0) > 5:
        return "Medium"
    return "Low"


def _fallback_summary(data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a basic summary when AI is unavailable."""
    risk_level = _derive_risk_level(data)
    total = data.get("critical", 0) + data.get("high", 0) + data.get("medium", 0) + data.get("low", 0)

    summary_parts = []
    if data.get("critical", 0) > 0:
        summary_parts.append(f"{data['critical']} critical vulnerabilities")
    if data.get("high", 0) > 0:
        summary_parts.append(f"{data['high']} high-severity issues")
    if data.get("medium", 0) > 0:
        summary_parts.append(f"{data['medium']} medium-severity findings")

    summary = f"Found {total} security issues." if total > 0 else "No significant security issues found."
    if summary_parts:
        summary = f"Repository has {risk_level.lower()} risk. Main findings: {', '.join(summary_parts)}."

    return {
        "risk_level": risk_level,
        "summary": summary,
        "top_risks": _extract_top_risks(data),
        "priority_actions": _extract_priority_actions(data),
    }


def _extract_top_risks(data: Dict[str, Any]) -> list:
    """Extract top risk names from findings."""
    findings = data.get("findings", [])
    risks = []
    seen = set()
    for f in findings:
        ftype = f.get("type", "") if isinstance(f, dict) else str(f)
        if ftype and ftype not in seen:
            seen.add(ftype)
            risks.append(ftype)
        if len(risks) >= 5:
            break
    return risks or ["No specific risks identified"]


def _extract_priority_actions(data: Dict[str, Any]) -> list:
    """Generate basic priority actions based on severity counts."""
    actions = []
    if data.get("critical", 0) > 0:
        actions.append("Immediately fix critical vulnerabilities")
    if data.get("high", 0) > 0:
        actions.append("Address high-severity security issues")
    if data.get("medium", 0) > 0:
        actions.append("Review and remediate medium-severity findings")
    if not actions:
        actions.append("Continue monitoring security posture")
    return actions


async def save_scan_summary(
    scan_id: str,
    repository: str,
    security_score: int,
    summary_data: Dict[str, Any],
) -> None:
    """
    Save the AI-generated summary to MongoDB.

    Args:
        scan_id: The scan identifier.
        repository: Repository name.
        security_score: The calculated security score.
        summary_data: Output from generate_scan_summary().
    """
    doc = scan_summary_document(
        scan_id=scan_id,
        repository=repository,
        security_score=security_score,
        risk_level=summary_data.get("risk_level", "Unknown"),
        summary=summary_data.get("summary", ""),
        top_risks=summary_data.get("top_risks", []),
        priority_actions=summary_data.get("priority_actions", []),
    )
    try:
        await summaries_col.insert_one(doc)
    except Exception as e:
        print(f"[ScanSummary] Failed to save summary: {e}")


async def get_scan_summary(scan_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve the AI summary for a scan.

    Args:
        scan_id: The scan identifier.

    Returns:
        Summary dict or None.
    """
    doc = await summaries_col.find_one({"scan_id": scan_id})
    if doc:
        return {
            "scan_id": doc.get("scan_id"),
            "repository": doc.get("repository"),
            "security_score": doc.get("security_score"),
            "risk_level": doc.get("risk_level"),
            "summary": doc.get("summary"),
            "top_risks": doc.get("top_risks", []),
            "priority_actions": doc.get("priority_actions", []),
            "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else "",
        }
    return None
