"""
Automation service — powers the Automation Center (Module 6.5).

Responsibilities:
  * Manage scheduled scans (daily/weekly/monthly) per project.
  * Manage conditional automation rules (IF ... THEN ...).
  * Compute next-run timestamps.
  * Evaluate rules after a scan and fire actions (notify / email / refresh AI
    checklist / schedule a full scan / generate report).

All database access goes through the async Motor client (app.database.db.database).
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List

from bson import ObjectId

from app.database.db import database
from app.services import notification_service as notif
from app.services import email_service
from app.services import ai_checklist_service

SCHEDULED = "scheduled_scans"
RULES = "automation_rules"

FREQUENCY_DELTAS = {
    "daily": timedelta(days=1),
    "weekly": timedelta(weeks=1),
    "monthly": timedelta(days=30),
}


# ── Scheduled scans ───────────────────────────────────────────────────────────
def _next_run(frequency: str, run_hour: int = 9, run_minute: int = 0) -> datetime:
    """Compute the next run datetime (UTC) from now for a given frequency."""
    now = datetime.now(timezone.utc).replace(
        hour=run_hour, minute=run_minute, second=0, microsecond=0
    )
    delta = FREQUENCY_DELTAS.get(frequency, timedelta(days=1))
    nxt = now + delta
    if nxt <= datetime.now(timezone.utc):
        nxt = nxt + delta
    return nxt


async def create_schedule(user_id: str, project_id: str, frequency: str = "daily",
                           enabled: bool = True, run_hour: int = 9,
                           run_minute: int = 0, repo_url: Optional[str] = None) -> Dict[str, Any]:
    frequency = (frequency or "daily").lower()
    if frequency not in FREQUENCY_DELTAS:
        frequency = "daily"
    nxt = _next_run(frequency, run_hour, run_minute)
    doc = {
        "user_id": str(user_id),
        "project_id": str(project_id),
        "repo_url": repo_url,
        "frequency": frequency,
        "enabled": enabled,
        "run_hour": run_hour,
        "run_minute": run_minute,
        "last_run": None,
        "next_run": nxt,
        "created_at": datetime.now(timezone.utc),
    }
    res = await database[SCHEDULED].insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return _serialise_schedule(doc)


async def get_schedules(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    query = {"user_id": str(user_id)} if user_id else {}
    docs = await database[SCHEDULED].find(query).sort("created_at", -1).to_list(length=200)
    return [_serialise_schedule(d) for d in docs]


async def get_schedule(schedule_id: str) -> Optional[Dict[str, Any]]:
    oid = _oid(schedule_id)
    if not oid:
        return None
    doc = await database[SCHEDULED].find_one({"_id": oid})
    return _serialise_schedule(doc) if doc else None


async def update_schedule(schedule_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    oid = _oid(schedule_id)
    if not oid:
        return None
    set_doc: Dict[str, Any] = {}
    for k in ("frequency", "enabled", "run_hour", "run_minute"):
        if k in updates and updates[k] is not None:
            set_doc[k] = updates[k]
    if "frequency" in set_doc:
        set_doc["next_run"] = _next_run(
            set_doc["frequency"],
            updates.get("run_hour", 9),
            updates.get("run_minute", 0),
        )
    if not set_doc:
        return await get_schedule(schedule_id)
    await database[SCHEDULED].update_one({"_id": oid}, {"$set": set_doc})
    return await get_schedule(schedule_id)


async def delete_schedule(schedule_id: str) -> bool:
    oid = _oid(schedule_id)
    if not oid:
        return False
    r = await database[SCHEDULED].delete_one({"_id": oid})
    return r.deleted_count > 0


async def get_due_schedules(now: Optional[datetime] = None) -> List[Dict[str, Any]]:
    """Return enabled schedules whose next_run <= now (used by the scheduler)."""
    now = now or datetime.now(timezone.utc)
    docs = await database[SCHEDULED].find({
        "enabled": True,
        "next_run": {"$lte": now},
    }).to_list(length=500)
    return docs


async def mark_schedule_run(schedule_id: str, new_next_run: datetime) -> None:
    oid = _oid(schedule_id)
    if not oid:
        return
    await database[SCHEDULED].update_one(
        {"_id": oid},
        {"$set": {"last_run": datetime.now(timezone.utc), "next_run": new_next_run}},
    )


# ── Automation rules ──────────────────────────────────────────────────────────
async def create_rule(user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    doc = {
        "user_id": str(user_id),
        "name": payload.get("name", "Untitled Rule"),
        "enabled": payload.get("enabled", True),
        "condition_type": payload.get("condition_type", "critical_count"),
        "operator": payload.get("operator", "gt"),
        "threshold": int(payload.get("threshold", 0)),
        "actions": payload.get("actions", ["notification", "email"]),
        "project_id": str(payload["project_id"]) if payload.get("project_id") else None,
        "created_at": datetime.now(timezone.utc),
    }
    res = await database[RULES].insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return _serialise_rule(doc)


async def get_rules(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    query = {"user_id": str(user_id)} if user_id else {}
    docs = await database[RULES].find(query).sort("created_at", -1).to_list(length=200)
    return [_serialise_rule(d) for d in docs]


async def update_rule(rule_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    oid = _oid(rule_id)
    if not oid:
        return None
    set_doc: Dict[str, Any] = {}
    for k in ("name", "enabled", "condition_type", "operator", "threshold", "actions"):
        if k in payload and payload[k] is not None:
            set_doc[k] = payload[k]
    if "project_id" in payload:
        set_doc["project_id"] = str(payload["project_id"]) if payload["project_id"] else None
    await database[RULES].update_one({"_id": oid}, {"$set": set_doc})
    return await get_rule(rule_id)


async def get_rule(rule_id: str) -> Optional[Dict[str, Any]]:
    oid = _oid(rule_id)
    if not oid:
        return None
    doc = await database[RULES].find_one({"_id": oid})
    return _serialise_rule(doc) if doc else None


async def delete_rule(rule_id: str) -> bool:
    oid = _oid(rule_id)
    if not oid:
        return False
    r = await database[RULES].delete_one({"_id": oid})
    return r.deleted_count > 0


# ── Rule evaluation ───────────────────────────────────────────────────────────
def _compare(value: int, op: str, threshold: int) -> bool:
    if op == "gt":
        return value > threshold
    if op == "gte":
        return value >= threshold
    if op == "lt":
        return value < threshold
    if op == "lte":
        return value <= threshold
    return False


async def evaluate_rules(user_id: str, project_id: Optional[str],
                         scan_result: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    After a scan, check every enabled rule that applies to this user/project
    and fire its actions. Returns the list of rules that triggered.
    """
    triggered: List[Dict[str, Any]] = []

    critical_count = int(scan_result.get("critical_count", 0) or
                         scan_result.get("vulnerabilities_found", 0))
    risk_score = int(scan_result.get("risk_score", 0) or 0)
    compliance = scan_result.get("compliance_score")

    rules = await get_rules(user_id)
    for rule in rules:
        if not rule.get("enabled"):
            continue
        if rule.get("project_id") and rule.get("project_id") != str(project_id):
            continue

        cond = rule.get("condition_type")
        if cond == "critical_count":
            value = critical_count
        elif cond == "risk_score":
            value = risk_score
        elif cond == "compliance":
            if compliance is None:
                continue
            value = int(compliance)
        else:
            continue

        if _compare(value, rule.get("operator", "gt"), int(rule.get("threshold", 0))):
            triggered.append(rule)
            await _fire_actions(user_id, project_id, rule, scan_result)

    return triggered


async def _fire_actions(user_id: str, project_id: Optional[str], rule: Dict[str, Any],
                        scan_result: Dict[str, Any]) -> None:
    """Execute the actions listed in a triggered rule."""
    actions = rule.get("actions", [])
    risk_score = scan_result.get("risk_score", 0)
    repo = scan_result.get("repository", "your repository")

    title = rule.get("name", "Automation Rule")
    metric_value = scan_result.get("critical_count") or scan_result.get("vulnerabilities_found", 0)

    if "notification" in actions:
        sev = "CRITICAL" if (risk_score and int(risk_score) >= 80) else "HIGH"
        nt = "critical" if sev == "CRITICAL" else "high"
        await notif.create_notification(
            user_id=user_id,
            title=title,
            message=f"{metric_value} critical issues found in {repo}.",
            notification_type=nt,
            severity=sev,
            project_id=project_id,
            link="/scan-history",
        )
        await notif.log_activity(user_id, "automation_rule", "Automation rule triggered",
                           f"'{title}' fired a notification.", project_id=project_id)

    if "email" in actions:
        email = await notif.get_user_email(user_id)
        if email:
            email_service.send_security_alert(
                to_email=email,
                title=title,
                message=f"{metric_value} critical issues detected in {repo}.",
                risk_score=int(risk_score) if risk_score else None,
            )

    if "ai_checklist" in actions:
        if project_id:
            try:
                await ai_checklist_service.generate_project_checklist(str(user_id), str(project_id))
                await notif.log_activity(user_id, "checklist_updated", "AI checklist refreshed",
                                   "Auto-refreshed after automation rule.", project_id=project_id)
            except Exception:
                pass

    if "full_scan" in actions:
        await notif.log_activity(user_id, "full_scan_queued", "Full scan queued",
                           "Automation rule scheduled a full scan.", project_id=project_id)

    if "executive_report" in actions:
        await notif.log_activity(user_id, "report_generated", "Executive report generated",
                           "Automation rule generated an executive report.", project_id=project_id)


# ── Serialisation helpers ─────────────────────────────────────────────────────
def _oid(value: str):
    try:
        return ObjectId(value)
    except Exception:
        return None


def _serialise_schedule(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "user_id": doc.get("user_id"),
        "project_id": doc.get("project_id"),
        "repo_url": doc.get("repo_url"),
        "frequency": doc.get("frequency"),
        "enabled": doc.get("enabled", True),
        "run_hour": doc.get("run_hour", 9),
        "run_minute": doc.get("run_minute", 0),
        "last_run": doc.get("last_run"),
        "next_run": doc.get("next_run"),
        "created_at": doc.get("created_at"),
    }


def _serialise_rule(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "user_id": doc.get("user_id"),
        "name": doc.get("name"),
        "enabled": doc.get("enabled", True),
        "condition_type": doc.get("condition_type"),
        "operator": doc.get("operator"),
        "threshold": doc.get("threshold"),
        "actions": doc.get("actions", []),
        "project_id": doc.get("project_id"),
        "created_at": doc.get("created_at"),
    }
