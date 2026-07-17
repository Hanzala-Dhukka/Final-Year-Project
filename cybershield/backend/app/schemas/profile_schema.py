"""
Profile schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


class ProfileResponse(BaseModel):
    """Schema for user profile response."""
    full_name: str
    email: str
    phone: Optional[str] = None
    bio: Optional[str] = None
    college: Optional[str] = None
    course: Optional[str] = None
    year: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    website: Optional[str] = None
    profile_image: Optional[str] = None
    role: str


class UpdateProfileRequest(BaseModel):
    """Schema for updating user profile."""
    full_name: str
    phone: Optional[str] = None
    bio: Optional[str] = None
    college: Optional[str] = None
    course: Optional[str] = None
    year: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    website: Optional[str] = None


class ProfileUpdate(BaseModel):
    """Schema for updating user profile."""
    full_name: str
    bio: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[List[str]] = None
    profile_image: Optional[str] = None


class SettingsUpdate(BaseModel):
    """Schema for updating user settings."""
    theme: Optional[str] = None  # "light" or "dark"
    language: Optional[str] = None
    email_notifications: Optional[bool] = None
    security_alerts: Optional[bool] = None
    lab_notifications: Optional[bool] = None
    achievement_notifications: Optional[bool] = None


class PasswordChange(BaseModel):
    """Schema for changing password."""
    old_password: str
    new_password: str


class UserProfileResponse(BaseModel):
    """Schema for user profile response."""
    user_id: str
    username: str
    email: str
    role: str
    profile: Optional[Dict[str, Any]] = None
    settings: Optional[Dict[str, Any]] = None
    statistics: Dict[str, Any]


class SecurityScoreResponse(BaseModel):
    """Schema for security score response."""
    score: int
    level: str
    factors: Dict[str, int]
    recommendations: List[str]
    calculated_at: datetime


class LoginHistoryResponse(BaseModel):
    """Schema for login history response."""
    id: str
    ip_address: str
    device: str
    location: Optional[str]
    login_time: datetime
    status: str


class ActivityStatsResponse(BaseModel):
    """Schema for activity statistics response."""
    total_logins: int
    recent_logins: List[Dict[str, Any]]
    devices_used: List[str]
    locations: List[str]
    last_login: Optional[datetime]