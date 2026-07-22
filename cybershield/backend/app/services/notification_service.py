"""
Notification service for creating, querying and managing security
notifications and the security activity feed (Module 6.5).

Database access uses the async Motor client (app.database.db.database).
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

from bson import ObjectId

from app.database.db import database

NOTIFICATIONS = "notifications"
ACTIVITY = "security_activity"


# ── Notifications ────────────────────────────────────────────────────────────
async def create_notification(user_id: str, title: str, message: str,
                               notification_type: str = "information",
                               severity: str = "INFO",
                               project_id: Optional[str] = None,
                               link: Optional[str] = None) -> str:
    """Create a notification document and return its id."""
    doc = {
        "user_id": str(user_id),
        "project_id": str(project_id) if project_id else None,
        "title": title,
        "message": message,
        "type": notification_type,
        "severity": severity,
        "read": False,
        "link": link,
        "created_at": datetime.utcnow(),
    }
    res = await database[NOTIFICATIONS].insert_one(doc)
    return str(res.inserted_id)


async def get_user_notifications(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Return notifications for a user, newest first."""
    docs = await database[NOTIFICATIONS].find({"user_id": str(user_id)}).sort(
        "created_at", -1).limit(limit).to_list(length=limit)
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs


async def get_unread_count(user_id: str) -> int:
    """Count unread notifications for a user."""
    return await database[NOTIFICATIONS].count_documents(
        {"user_id": str(user_id), "read": False}
    )


async def mark_notification_read(notification_id: str) -> bool:
    try:
        r = await database[NOTIFICATIONS].update_one(
            {"_id": ObjectId(notification_id)},
            {"$set": {"read": True}},
        )
        return r.modified_count > 0
    except Exception:
        return False


async def mark_all_notifications_read(user_id: str) -> int:
    r = await database[NOTIFICATIONS].update_many(
        {"user_id": str(user_id), "read": False},
        {"$set": {"read": True}},
    )
    return r.modified_count


async def delete_user_notification(notification_id: str) -> bool:
    try:
        r = await database[NOTIFICATIONS].delete_one({"_id": ObjectId(notification_id)})
        return r.deleted_count > 0
    except Exception:
        return False


async def delete_old_notifications(older_than_days: int = 30) -> int:
    """Delete notifications older than N days. Used by the scheduler."""
    cutoff = datetime.utcnow() - timedelta(days=older_than_days)
    r = await database[NOTIFICATIONS].delete_many({"created_at": {"$lt": cutoff}})
    return r.deleted_count


# ── Security activity feed ────────────────────────────────────────────────────
async def log_activity(user_id: Optional[str], event: str, title: str,
                       description: str = "", project_id: Optional[str] = None,
                       metadata: Optional[Dict[str, Any]] = None) -> str:
    """Append an event to the security_activity feed. Returns the id."""
    doc = {
        "user_id": str(user_id) if user_id else None,
        "project_id": str(project_id) if project_id else None,
        "event": event,
        "title": title,
        "description": description,
        "metadata": metadata or {},
        "created_at": datetime.utcnow(),
    }
    res = await database[ACTIVITY].insert_one(doc)
    return str(res.inserted_id)


async def get_activity_feed(user_id: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
    """Return the security activity timeline, newest first."""
    query = {"user_id": str(user_id)} if user_id else {}
    docs = await database[ACTIVITY].find(query).sort("created_at", -1).limit(limit).to_list(length=limit)
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs


async def get_project_activity_feed(project_id: str, limit: int = 100) -> List[Dict[str, Any]]:
    docs = await database[ACTIVITY].find({"project_id": str(project_id)}).sort(
        "created_at", -1).limit(limit).to_list(length=limit)
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs


# ── User email helper ─────────────────────────────────────────────────────────
async def get_user_email(user_id: str) -> Optional[str]:
    """Return a user's email for email alerts, or None."""
    try:
        user = await database.users.find_one({"_id": ObjectId(user_id)})
        return user.get("email") if user else None
    except Exception:
        return None


# ── Helper constructors (kept for existing callers) ───────────────────────────
async def notify_scan_completed(user_id: str, repo_name: str) -> str:
    return await create_notification(
        user_id=user_id,
        title="Security Scan Completed",
        message=f"Your {repo_name} security scan has finished.",
        notification_type="success",
        severity="SUCCESS",
    )


async def notify_security_alert(user_id: str, alert_title: str, alert_message: str) -> str:
    return await create_notification(
        user_id=user_id,
        title=alert_title,
        message=alert_message,
        notification_type="critical",
        severity="CRITICAL",
    )


async def notify_quiz_completed(user_id: str, score: int) -> str:
    return await create_notification(
        user_id=user_id, title="Quiz Completed",
        message=f"You scored {score}% on your security quiz!",
        notification_type="success", severity="SUCCESS",
    )


async def notify_achievement_unlocked(user_id: str, achievement_name: str) -> str:
    return await create_notification(
        user_id=user_id, title="Achievement Unlocked",
        message=f"You earned the {achievement_name} badge!",
        notification_type="success", severity="SUCCESS",
    )


async def notify_certificate_generated(user_id: str) -> str:
    return await create_notification(
        user_id=user_id, title="Certificate Generated",
        message="Your security certificate is ready for download.",
        notification_type="success", severity="SUCCESS",
    )


async def notify_daily_challenge(user_id: str) -> str:
    return await create_notification(
        user_id=user_id, title="Daily Challenge Available",
        message="A new daily security challenge is waiting for you!",
        notification_type="information", severity="INFO",
    )
