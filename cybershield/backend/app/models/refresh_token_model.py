"""
Refresh token model for MongoDB document structure.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from bson import ObjectId


class RefreshTokenCreate(BaseModel):
    """Schema for creating a refresh token."""
    user_id: str
    token_hash: str
    device: Optional[str] = None
    ip_address: Optional[str] = None
    expires_at: datetime


class RefreshTokenInDB(BaseModel):
    """Schema for refresh token document in MongoDB."""
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    token_hash: str
    device: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
    expires_at: datetime
    is_revoked: bool = False
    revoked_at: Optional[datetime] = None
    last_used: Optional[datetime] = None

    class Config:
        populate_by_name = True


class RefreshTokenResponse(BaseModel):
    """Schema for refresh token response."""
    refresh_token: str
    expires_in: int  # in seconds


class SessionInDB(BaseModel):
    """Schema for session document in MongoDB."""
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    login_time: datetime
    logout_time: Optional[datetime] = None
    device: Optional[str] = None
    ip_address: Optional[str] = None
    location: Optional[str] = None
    active: bool = True
    last_activity: Optional[datetime] = None

    class Config:
        populate_by_name = True


class SessionResponse(BaseModel):
    """Schema for session response."""
    id: str
    device: Optional[str]
    location: Optional[str]
    ip_address: Optional[str]
    login_time: datetime
    last_activity: Optional[datetime]
    active: bool