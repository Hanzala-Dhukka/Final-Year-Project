"""
Pydantic schemas for Projects (Module 4.5).
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: str = ""
    tech_stack: List[str] = Field(default_factory=list)
    status: str = "Active"


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    status: Optional[str] = None


class MemberInvite(BaseModel):
    # Accept either a known user_id or an email for lookup.
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: str = "Developer"


class ProjectResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    description: str = ""
    tech_stack: List[str] = Field(default_factory=list)
    status: str = "Active"
    created_at: Optional[str] = None
    member_count: int = 0
    report_count: int = 0
    latest_risk_score: Optional[int] = None
    latest_risk_level: Optional[str] = None
