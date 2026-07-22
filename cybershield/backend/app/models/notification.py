"""
Notification document model for the Security Notifications module (Module 6.5).

Stored in the `notifications` collection.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

NOTIFICATION_TYPES = ["critical", "high", "medium", "low", "information", "success"]
NOTIFICATION_SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO", "SUCCESS"]


class NotificationIn(BaseModel):
    """Payload to create a notification."""
    user_id: str
    project_id: Optional[str] = None
    title: str
    message: str
    type: str = "information"          # critical/high/medium/low/information/success
    severity: str = "INFO"             # CRITICAL/HIGH/MEDIUM/LOW/INFO/SUCCESS
    link: Optional[str] = None         # optional deep-link (e.g. /scan-history)


class NotificationDoc(BaseModel):
    """Full document as persisted in MongoDB."""
    user_id: str
    project_id: Optional[str] = None
    title: str
    message: str
    type: str = "information"
    severity: str = "INFO"
    read: bool = False
    link: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
