from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

class User(BaseModel):
    full_name: str
    email: EmailStr
    hashed_password: str
    role: str = "student"
    is_verified: bool = False
    is_active: bool = True
    profile_image: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    college: Optional[str] = None
    course: Optional[str] = None
    year: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    website: Optional[str] = None
    theme: str = "dark"
    verification_token: Optional[str] = None
    reset_token: Optional[str] = None
    refresh_token: Optional[str] = None
    last_login: Optional[datetime] = None
    last_activity: Optional[datetime] = None
    login_history: List[dict] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "student"


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    device: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    is_verified: bool
    created_at: datetime


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    role: str | None = None


class TokenResponse(BaseModel):
    """Schema for token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int