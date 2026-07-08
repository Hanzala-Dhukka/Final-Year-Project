"""
Audit logging schemas for MongoDB document structure.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class AuditLogCreate(BaseModel):
    """Schema for creating an audit log entry."""
    user_id: str
    username: str
    action: str
    module: str
    description: str
    ip_address: Optional[str] = None
    device: Optional[str] = None
    status: str = "SUCCESS"


class AuditLogResponse(BaseModel):
    """Schema for audit log response."""
    id: str
    user_id: str
    username: str
    action: str
    module: str
    description: str
    ip_address: Optional[str] = None
    device: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "id": "65f123abc",
                "user_id": "12345",
                "username": "john",
                "action": "LOGIN",
                "module": "AUTH",
                "description": "User logged in successfully",
                "ip_address": "192.168.1.10",
                "device": "Chrome Windows",
                "status": "SUCCESS",
                "created_at": "2026-07-08T10:30:00Z"
            }
        }