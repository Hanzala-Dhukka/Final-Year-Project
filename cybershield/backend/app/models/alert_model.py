from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class SecurityAlertBase(BaseModel):
    title: str = Field(..., example="Critical Vulnerability Found")
    severity: str = Field(..., example="Critical")
    target: str = Field(..., example="facebook/react")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SecurityAlertCreate(SecurityAlertBase):
    pass

class SecurityAlertResponse(SecurityAlertBase):
    id: str

    class Config:
        from_attributes = True
