"""
Pydantic schemas for Collaboration (Module 4.5).
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class VersionCompareResponse(BaseModel):
    version_a: int
    version_b: int
    risk_a: int
    risk_b: int
    risk_diff: int
    new_threats: int = 0
    resolved_threats: int = 0
    details: List[dict] = Field(default_factory=list)


class SharedReportResponse(BaseModel):
    report_id: str
    project: str
    version: int
    risk_score: int
    risk_level: str
    data: dict = Field(default_factory=dict)
    shared_at: Optional[str] = None
