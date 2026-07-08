"""
Report model for MongoDB document structure.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any


class SecurityReport(BaseModel):
    """Security scan report model."""
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    scan_type: str  # "github" or "security"
    target: str  # Repository URL or website URL
    status: str  # "pending", "in_progress", "completed", "failed"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    summary: Optional[str] = None
    critical_issues: int = 0
    high_issues: int = 0
    medium_issues: int = 0
    low_issues: int = 0
    findings: List[Dict[str, Any]] = []
    recommendations: List[str] = []
    
    class Config:
        populate_by_name = True


class ReportCreate(BaseModel):
    """Schema for creating a report."""
    user_id: str
    scan_type: str
    target: str
    status: str = "pending"


class ReportResponse(BaseModel):
    """Schema for report response."""
    id: str
    user_id: str
    scan_type: str
    target: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime]
    summary: Optional[str]
    critical_issues: int
    high_issues: int
    medium_issues: int
    low_issues: int