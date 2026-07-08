"""
Notification schemas for MongoDB document structure.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class NotificationCreate(BaseModel):
    """Schema for creating a notification."""
    user_id: str
    title: str
    message: str
    type: str
    severity: str = "INFO"


class NotificationResponse(BaseModel):
    """Schema for notification response."""
    id: str
    user_id: str
    title: str
    message: str
    type: str
    severity: str
    is_read: bool = False
    created_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "id": "65f123abc",
                "user_id": "12345",
                "title": "Security Scan Completed",
                "message": "Your GitHub repository scan has finished.",
                "type": "SCAN",
                "severity": "INFO",
                "is_read": False,
                "created_at": "2026-07-08T10:30:00Z"
            }
        }


class NotificationUnreadCount(BaseModel):
    """Schema for unread notification count."""
    count: int