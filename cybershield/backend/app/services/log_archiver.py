"""
Log archiver — automatically moves resolved / old errors out of the live `log`
collection and into the `old_logs` collection.

Mechanics
---------
* ``resolve_log``  — manual move. Called from the admin API when the developer
  confirms an issue is fixed: the entry is stamped ``Status: resolved`` with
  ``Resolved_At`` / ``Resolved_By`` and moved to ``old_logs``.
* ``auto_archive_resolved_logs`` — scheduled (daily) automatic move. An issue is
  considered RESOLVED when the same error signature has not recurred within
  ``auto_resolve_hours`` (default 24 h). All of its entries then move to
  ``old_logs`` as ``auto_resolved``. Entries older than ``archive_age_days``
  (default 7) are archived regardless as housekeeping.

The signature is ``Folder_Name|File_Name|Function|Error_Type|Error_Message``.
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from bson import ObjectId

from app.database.db import database

LOG_COLLECTION = "log"
OLD_LOG_COLLECTION = "old_logs"

# Env-overridable defaults.
AUTO_RESOLVE_HOURS = int(os.getenv("LOG_AUTO_RESOLVE_HOURS", "24"))
ARCHIVE_AGE_DAYS = int(os.getenv("LOG_ARCHIVE_AGE_DAYS", "7"))


def _signature(doc: dict) -> str:
    """Stable identity of an error so recurrences can be detected."""
    return "|".join([
        str(doc.get("Folder_Name", "")),
        str(doc.get("File_Name", "")),
        str(doc.get("Function", "")),
        str(doc.get("Error_Type", "")),
        str(doc.get("Error_Message", "")),
    ])


async def _archive_doc(doc: dict, status: str, resolved_by: Optional[str] = None,
                       resolved_at: Optional[str] = None, note: Optional[str] = None) -> bool:
    """Copy *doc* into ``old_logs`` (with resolution metadata) and remove it from ``log``."""
    old = dict(doc)
    old["Status"] = status
    old["Archived_At"] = datetime.now(timezone.utc).isoformat()
    if resolved_at:
        old["Resolved_At"] = resolved_at
    if resolved_by:
        old["Resolved_By"] = resolved_by
    if note:
        old["Resolution_Note"] = note
    try:
        await database[OLD_LOG_COLLECTION].insert_one(old)
        await database[LOG_COLLECTION].delete_one({"_id": doc["_id"]})
        return True
    except Exception:
        return False


async def resolve_log(
    log_id: str,
    resolved_by: str = "admin",
    note: Optional[str] = None,
) -> bool:
    """
    Manually mark a single log entry as resolved and move it to ``old_logs``.

    Returns True if moved, False if the entry was not found.
    """
    try:
        doc = await database[LOG_COLLECTION].find_one({"_id": ObjectId(log_id)})
    except Exception:
        return False
    if doc is None:
        return False
    resolved_at = datetime.now(timezone.utc).isoformat()
    return await _archive_doc(
        doc,
        status="resolved",
        resolved_by=resolved_by,
        resolved_at=resolved_at,
        note=note,
    )


async def auto_archive_resolved_logs(
    archive_age_days: int = ARCHIVE_AGE_DAYS,
    auto_resolve_hours: int = AUTO_RESOLVE_HOURS,
) -> Dict[str, int]:
    """
    Automatic daily job.

    1. Issues whose signature has NOT recurred within ``auto_resolve_hours``
       are considered resolved → every one of their entries moves to ``old_logs``.
    2. Any entry older than ``archive_age_days`` is archived regardless.

    Returns ``{"moved": n}`` where n is how many entries were archived.
    """
    now = datetime.now(timezone.utc)
    age_cutoff = (now - timedelta(days=archive_age_days)).isoformat()
    resolve_cutoff = (now - timedelta(hours=auto_resolve_hours)).isoformat()

    try:
        docs = await database[LOG_COLLECTION].find({}).to_list(None)
    except Exception:
        return {"moved": 0}

    if not docs:
        return {"moved": 0}

    # Latest occurrence per error signature.
    latest: Dict[str, str] = {}
    for d in docs:
        sig = _signature(d)
        dt = str(d.get("DateTime", ""))
        if sig not in latest or dt > latest[sig]:
            latest[sig] = dt

    # A signature is resolved when even its latest occurrence is old.
    resolved_signatures = {sig for sig, dt in latest.items() if dt < resolve_cutoff}

    moved = 0
    for d in docs:
        sig = _signature(d)
        dt = str(d.get("DateTime", ""))
        if sig in resolved_signatures:
            if await _archive_doc(d, status="auto_resolved", resolved_at=latest[sig]):
                moved += 1
        elif dt < age_cutoff:
            if await _archive_doc(d, status="archived"):
                moved += 1

    if moved:
        print(f"[LogArchiver] Moved {moved} entries to old_logs.")
    return {"moved": moved}


# Expose repository-style helpers used by the routes.

async def get_old_logs(skip: int = 0, limit: int = 50,
                       error_type: Optional[str] = None,
                       status: Optional[str] = None) -> tuple:
    """Paginated old_logs listing. Returns (total, logs)."""
    query = {}
    if error_type:
        query["Error_Type"] = error_type
    if status:
        query["Status"] = status
    try:
        total = await database[OLD_LOG_COLLECTION].count_documents(query)
        cursor = (
            database[OLD_LOG_COLLECTION]
            .find(query)
            .sort("Archived_At", -1)
            .skip(skip)
            .limit(limit)
        )
        logs: List[dict] = []
        async for log in cursor:
            log["_id"] = str(log["_id"])
            logs.append(log)
        return total, logs
    except Exception:
        return 0, []


async def get_old_log_by_id(log_id: str) -> Optional[dict]:
    """Fetch a single old_logs entry, or None."""
    try:
        log = await database[OLD_LOG_COLLECTION].find_one({"_id": ObjectId(log_id)})
    except Exception:
        return None
    if log is not None:
        log["_id"] = str(log["_id"])
    return log


async def delete_old_log(log_id: str) -> bool:
    """Delete a single old_logs entry. Returns True on success."""
    try:
        result = await database[OLD_LOG_COLLECTION].delete_one({"_id": ObjectId(log_id)})
        return result.deleted_count > 0
    except Exception:
        return False