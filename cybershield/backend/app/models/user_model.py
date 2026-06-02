from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "user"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: EmailStr
    role: str
    created_at: datetime


class UserUpdate(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    role: str | None = None

