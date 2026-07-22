"""
Notification routes for user notification management (Module 6.5).
"""
from fastapi import APIRouter, HTTPException, Depends

from app.services.notification_service import (
    get_user_notifications,
    get_unread_count,
    mark_notification_read,
    mark_all_notifications_read,
    delete_user_notification
)
from app.dependencies.auth import get_current_user

router = APIRouter()


@router.get("/notifications")
async def get_notifications(current_user=Depends(get_current_user)):
    """Get all notifications for the current user (newest first)."""
    user_id = str(current_user["_id"])
    notifications = await get_user_notifications(user_id)
    return [
        {
            "id": n["_id"],
            "title": n["title"],
            "message": n["message"],
            "type": n["type"],
            "severity": n["severity"],
            "read": n["read"],
            "link": n.get("link"),
            "project_id": n.get("project_id"),
            "created_at": n["created_at"],
        }
        for n in notifications
    ]


@router.get("/notifications/unread-count")
async def get_unread_notifications_count(current_user=Depends(get_current_user)):
    """Get count of unread notifications."""
    user_id = str(current_user["_id"])
    return {"count": await get_unread_count(user_id)}


@router.get("/notifications/summary")
async def get_notifications_summary(current_user=Depends(get_current_user)):
    """Return notifications + unread count in one call (dashboard widget)."""
    user_id = str(current_user["_id"])
    notifications = await get_user_notifications(user_id, limit=20)
    serialized = [
        {
            "id": n["_id"],
            "title": n["title"],
            "message": n["message"],
            "type": n["type"],
            "severity": n["severity"],
            "read": n["read"],
            "link": n.get("link"),
            "project_id": n.get("project_id"),
            "created_at": n["created_at"],
        }
        for n in notifications
    ]
    return {"count": await get_unread_count(user_id), "notifications": serialized}


@router.patch("/notifications/{notification_id}/read")
async def mark_read(notification_id: str, current_user=Depends(get_current_user)):
    """Mark a notification as read."""
    success = await mark_notification_read(notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}


@router.patch("/notifications/read-all")
async def mark_all_read(current_user=Depends(get_current_user)):
    """Mark all of the user's notifications as read."""
    count = await mark_all_notifications_read(str(current_user["_id"]))
    return {"message": "All notifications marked as read", "count": count}


@router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str, current_user=Depends(get_current_user)):
    """Delete a notification."""
    success = await delete_user_notification(notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification deleted"}
