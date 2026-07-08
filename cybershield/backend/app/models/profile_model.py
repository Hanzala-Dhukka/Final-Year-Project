"""
User profile models for MongoDB document structure.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any


class UserProfile(BaseModel):
    """User profile model."""
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    full_name: str
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    skills: List[str] = []
    social_links: Dict[str, str] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True


class UserSettings(BaseModel):
    """User settings model."""
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    theme: str = "light"  # "light" or "dark"
    language: str = "English"
    email_notifications: bool = True
    security_alerts: bool = True
    lab_notifications: bool = True
    achievement_notifications: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True


class LoginHistory(BaseModel):
    """Login history model."""
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    ip_address: str
    device: str
    location: Optional[str] = None
    login_time: datetime = Field(default_factory=datetime.utcnow)
    status: str  # "success", "failed", "suspicious"
    user_agent: Optional[str] = None
    
    class Config:
        populate_by_name = True


class SecurityScore(BaseModel):
    """Security score model."""
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    score: int = 0  # 0-100
    level: str = "Beginner"  # Beginner, Intermediate, Advanced, Expert
    factors: Dict[str, int] = {
        "password_strength": 0,
        "labs_completed": 0,
        "security_learning": 0,
        "account_security": 0
    }
    recommendations: List[str] = []
    calculated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True


class ProfileUpdate(BaseModel):
    """Schema for updating profile."""
    full_name: str
    bio: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[List[str]] = None


class SettingsUpdate(BaseModel):
    """Schema for updating settings."""
    theme: Optional[str] = None
    language: Optional[str] = None
    email_notifications: Optional[bool] = None
    security_alerts: Optional[bool] = None
    lab_notifications: Optional[bool] = None
    achievement_notifications: Optional[bool] = None


class PasswordChange(BaseModel):
    """Schema for changing password."""
    old_password: str
    new_password: str


class ProfileResponse(BaseModel):
    """Schema for profile response."""
    user_id: str
    username: str
    email: str
    role: str
    profile: Optional[UserProfile] = None
    settings: Optional[UserSettings] = None
    statistics: Dict[str, Any] = {}


class SecurityScoreResponse(BaseModel):
    """Schema for security score response."""
    score: int
    level: str
    factors: Dict[str, int]
    recommendations: List[str]
    calculated_at: datetime