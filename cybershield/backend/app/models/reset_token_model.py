"""
Password reset token model for MongoDB document structure.
"""
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from typing import Optional


class PasswordResetToken(BaseModel):
    """Password reset token model."""
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    token: str  # Secure random token
    expires_at: datetime
    used: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True


class PasswordResetRequest(BaseModel):
    """Schema for password reset request."""
    email: str


class PasswordResetConfirm(BaseModel):
    """Schema for password reset confirmation."""
    token: str
    new_password: str


class PasswordResetResponse(BaseModel):
    """Schema for password reset response."""
    message: str