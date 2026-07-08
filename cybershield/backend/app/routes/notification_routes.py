"""
Notification routes for user notification management.
"""
from fastapi import APIRouter, HTTPException, Depends

from app.repositories.notification_repository import notification_repository
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
def get_notifications(
    current_user=Depends(get_current_user)
):
    """
    Get all notifications for the current user.
    
    Response:
    [
        {
            "id": "123",
            "title": "Daily Challenge Available",
            "type": "DAILY_CHALLENGE",
            "is_read": false
        }
    ]
    """
    user_id = str(current_user["_id"])
    notifications = get_user_notifications(user_id)
    
    return [
        {
            "id": n["_id"],
            "title": n["title"],
            "message": n["message"],
            "type": n["type"],
            "severity": n["severity"],
            "is_read": n["is_read"],
            "created_at": n["created_at"]
        }
        for n in notifications
    ]


@router.get("/notifications/unread-count")
def get_unread_notifications_count(
    current_user=Depends(get_current_user)
):
    """
    Get count of unread notifications.
    
    Response:
    {
        "count": 5
    }
    """
    user_id = str(current_user["_id"])
    count = get_unread_count(user_id)
    
    return {
        "count": count
    }


@router.patch("/notifications/{notification_id}/read")
def mark_read(
    notification_id: str,
    current_user=Depends(get_current_user)
):
    """
    Mark a notification as read.
    
    Response:
    {
        "message": "Notification marked as read"
    }
    """
    success = mark_notification_read(notification_id)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )
    
    return {
        "message": "Notification marked as read"
    }


@router.delete("/notifications/{notification_id}")
def delete_notification(
    notification_id: str,
    current_user=Depends(get_current_user)
):
    """
    Delete a notification.
    
    Response:
    {
        "message": "Notification deleted"
    }
    """
    success = delete_user_notification(notification_id)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )
    
    return {
        "message": "Notification deleted"
    }