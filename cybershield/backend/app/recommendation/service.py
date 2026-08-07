"""
Auto Recommendation Service (Module SC3).

Pipeline:
  1. Read findings from github_scans / scan_findings collections
  2. Map findings → checklist tasks via SC2 rule engine
  3. Deduplicate against existing user_checklists
  4. Insert new recommended entries with SC1 scanner fields
"""

from datetime import datetime
from typing import List, Optional

from app.database.db import database
from app.rules.rule_engine import process_findings
from app.models.checklist_model import build_user_checklist_doc

GITHUB_SCANS_COLLECTION = "github_scans"
SCAN_FINDINGS_COLLECTION = "scan_findings"
USER_CHECKLIST_COLLECTION = "user_checklists"


async def _read_findings_from_github_scans(scan_id: str) -> List[dict]:
    """Read findings from the github_scans collection (embedded array)."""
    scan = await database[GITHUB_SCANS_COLLECTION].find_one({"scan_id": scan_id})
    if not scan:
        return []
    return scan.get("findings", [])


async def _read_findings_from_scan_findings(scan_id: str) -> List[dict]:
    """Read findings from the scan_findings collection (individual docs)."""
    cursor = database[SCAN_FINDINGS_COLLECTION].find({"scan_id": scan_id})
    docs = await cursor.to_list(length=1000)
    # Normalize to the format expected by the rule engine
    return [
        {
            "type": doc.get("rule_name", doc.get("message", "")),
            "description": doc.get("message", ""),
            "severity": doc.get("severity", ""),
            "file": doc.get("file", ""),
            "_id": str(doc["_id"]),
        }
        for doc in docs
    ]


async def _read_findings_from_vulnerabilities(scan_id: str) -> List[dict]:
    """Read findings from the legacy vulnerabilities collection."""
    cursor = database["vulnerabilities"].find({"scan_id": scan_id})
    docs = await cursor.to_list(length=1000)
    return [
        {
            "type": doc.get("type", ""),
            "description": doc.get("recommendation", doc.get("evidence", "")),
            "severity": doc.get("severity", ""),
            "file": doc.get("file", ""),
            "_id": str(doc["_id"]),
        }
        for doc in docs
    ]


async def read_scan_findings(scan_id: str) -> List[dict]:
    """
    Read findings from all scanner collections for a given scan_id.

    Tries github_scans first (most complete), then scan_findings,
    then vulnerabilities (legacy).
    """
    findings = await _read_findings_from_github_scans(scan_id)
    if findings:
        return findings

    findings = await _read_findings_from_scan_findings(scan_id)
    if findings:
        return findings

    return await _read_findings_from_vulnerabilities(scan_id)


async def _check_duplicate(user_id: str, project_id: str, checklist_rule: str) -> bool:
    """Check if a recommendation for this rule already exists for this user+project."""
    existing = await database[USER_CHECKLIST_COLLECTION].find_one({
        "user_id": str(user_id),
        "project_id": str(project_id),
        "matched_rule": checklist_rule,
        "recommended": True,
    })
    return existing is not None


async def create_recommendations(
    scan_id: str,
    user_id: str,
    project_id: str,
) -> List[dict]:
    """
    Main entry point: read scan findings → map rules → create checklist items.

    This is the core SC3 pipeline:
      Scan Findings → Rule Engine → Dedup Check → user_checklists

    Args:
        scan_id:   the scanner's UUID scan identifier
        user_id:   the authenticated user's _id
        project_id: the project to associate recommendations with

    Returns:
        list of created recommendation dicts
    """
    # Step 1: Read findings from scanner collections
    findings = await read_scan_findings(scan_id)
    if not findings:
        return []

    # Step 2: Map findings → checklist rules via SC2 engine
    mapped_rules = process_findings(findings)
    if not mapped_rules:
        return []

    created = []
    now = datetime.utcnow()

    for rule in mapped_rules:
        rule_id = rule["checklist_rule"]

        # Step 3: Deduplicate — skip if already recommended for this user+project
        if await _check_duplicate(user_id, project_id, rule_id):
            continue

        # Step 4: Create user_checklist entry with SC1 scanner fields
        checklist_doc = {
            "user_id": str(user_id),
            "project_id": str(project_id),
            "checklist_id": rule_id,
            "status": "pending",
            "completed_at": None,
            "created_at": now,
            "updated_at": now,
            # Scanner Integration Fields (SC1)
            "scan_id": scan_id,
            "recommended": True,
            "matched_rule": rule_id,
            # Extra metadata from the rule engine
            "title": rule["task"],
            "category": rule["category"],
            "severity": rule["severity"],
            "source": "SCAN_RECOMMENDATION",
            "linked_finding": rule["scan_finding"].get("_id", ""),
            "description": rule["scan_finding"].get("description", rule["task"]),
            "file": rule["scan_finding"].get("file", ""),
        }

        await database[USER_CHECKLIST_COLLECTION].insert_one(checklist_doc)
        created.append({
            "checklist_rule": rule_id,
            "task": rule["task"],
            "category": rule["category"],
            "severity": rule["severity"],
            "source": "SCAN_RECOMMENDATION",
            "linked_finding": checklist_doc["linked_finding"],
        })

    return created


async def get_recommendations(
    user_id: str,
    project_id: str,
    scan_id: Optional[str] = None,
) -> List[dict]:
    """
    Retrieve all SCAN_RECOMMENDATION items for a user+project.

    Args:
        user_id:    the authenticated user's _id
        project_id: the project to query
        scan_id:    optional — filter by specific scan

    Returns:
        list of recommendation documents
    """
    query = {
        "user_id": str(user_id),
        "project_id": str(project_id),
        "source": "SCAN_RECOMMENDATION",
    }
    if scan_id:
        query["scan_id"] = scan_id

    cursor = database[USER_CHECKLIST_COLLECTION].find(query)
    docs = await cursor.to_list(length=1000)
    return docs


async def get_recommendation_stats(user_id: str, project_id: str) -> dict:
    """
    Get summary statistics for scan recommendations.

    Returns counts by severity and completion status.
    """
    docs = await get_recommendations(user_id, project_id)

    total = len(docs)
    completed = sum(1 for d in docs if d.get("status") == "completed")
    by_severity = {}
    for d in docs:
        sev = d.get("severity", "Unknown")
        by_severity[sev] = by_severity.get(sev, 0) + 1

    return {
        "total": total,
        "completed": completed,
        "pending": total - completed,
        "by_severity": by_severity,
    }
