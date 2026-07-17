"""
Pydantic schemas for Workspaces / reports / comments (Module 4.5).
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ReportCreate(BaseModel):
    risk_score: int = 0
    risk_level: str = "Medium"
    data: Dict[str, Any] = Field(default_factory=dict)


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1)


class CompareVersionsRequest(BaseModel):
    version_a: int
    version_b: int


class ShareCreate(BaseModel):
    expires_in_days: int = 7
    password: Optional[str] = None


class ShareResponse(BaseModel):
    token: str
    url: str
    expires_at: str


class MemberResponse(BaseModel):
    id: str
    project_id: str
    user_id: str
    user_name: str
    email: str = ""
    role: str


class ReportResponse(BaseModel):
    id: str
    project_id: str
    version: int
    risk_score: int
    risk_level: str
    created_at: Optional[str] = None


class CommentResponse(BaseModel):
    id: str
    report_id: str
    user_id: str
    user_name: str
    content: str
    created_at: Optional[str] = None


class ActivityResponse(BaseModel):
    id: str
    project_id: str
    user_name: str
    action: str
    detail: Optional[str] = None
    created_at: Optional[str] = None


class AuditResponse(BaseModel):
    id: str
    user_name: str
    action: str
    target: Optional[str] = None
    created_at: Optional[str] = None
