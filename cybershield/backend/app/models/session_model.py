"""
Session model for MongoDB document structure.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class SessionInDB(BaseModel):
    """Schema for session document in MongoDB."""
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    access_token_hash: str
    refresh_token_hash: str
    device: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
    last_activity: datetime
    expires_at: datetime
    active: bool = True

    class Config:
        populate_by_name = True


class SessionCreate(BaseModel):
    """Schema for creating a session."""
    user_id: str
    access_token_hash: str
    refresh_token_hash: str
    device: Optional[str] = None
    ip_address: Optional[str] = None
    expires_at: datetime


class SessionResponse(BaseModel):
    """Schema for session response."""
    id: str
    device: Optional[str] = None
    ip_address: Optional[str] = None
    last_activity: datetime
    expires_at: datetime
    active: bool = True