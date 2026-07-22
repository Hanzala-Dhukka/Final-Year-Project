"""
Pydantic models for security events stored in the `security_events` collection.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from enum import Enum

from pydantic import BaseModel, Field


class EventType(str, Enum):
    scan_completed   = "scan_completed"
    scan_progress    = "scan_progress"
    threat_detected  = "threat_detected"
    secret_found     = "secret_found"
    vulnerability    = "vulnerability"
    quiz_completed   = "quiz_completed"
    owasp_completed  = "owasp_completed"
    login            = "login"
    report_generated = "report_generated"
    critical         = "critical"
    high             = "high"
    medium           = "medium"
    low              = "low"
    info             = "info"


class SeverityLevel(str, Enum):
    critical = "Critical"
    high     = "High"
    medium   = "Medium"
    low      = "Low"
    info     = "Info"


class SecurityEventCreate(BaseModel):
    """Payload used when creating a new event."""
    type:        EventType
    title:       str
    description: str                      = ""
    project:     str                      = "CyberShield"
    severity:    SeverityLevel            = SeverityLevel.info
    user_id:     Optional[str]            = None
    metadata:    Optional[dict]           = None


class SecurityEventDB(SecurityEventCreate):
    """Shape of a document returned from MongoDB (after _id → id conversion)."""
    id:         str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SecurityEventResponse(BaseModel):
    """API response shape."""
    id:          str
    type:        str
    title:       str
    description: str
    project:     str
    severity:    str
    user_id:     Optional[str]
    created_at:  datetime
