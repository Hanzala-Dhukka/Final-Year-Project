"""
Pydantic schemas for the Security Checklist module (Module 6.1).
"""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class ChecklistItemOut(BaseModel):
    """A predefined security checklist item (security_checklists)."""
    id: str
    title: str
    category: str
    severity: str
    description: str
    frameworks: List[str] = Field(default_factory=list)
    recommended: bool = True


class UserChecklistOut(BaseModel):
    """A user's progress entry for a single checklist item."""
    id: str
    checklist_id: str
    title: str
    category: str
    severity: str
    description: str
    frameworks: List[str] = Field(default_factory=list)
    status: str = "pending"
    completed_at: Optional[str] = None
    # Scanner Integration Fields (Module SC1)
    scan_id: Optional[str] = None
    recommended: bool = False
    matched_rule: Optional[str] = None


class StatusUpdateIn(BaseModel):
    """Request body for updating a checklist item's status."""
    status: str = Field(..., description="pending | in_progress | completed")


class GenerateChecklistIn(BaseModel):
    """Optional request body for generating a project-specific checklist."""
    finding: Optional[str] = None
    technology: Optional[str] = None
    scan_id: Optional[str] = None  # Module SC1: link to scan


class ScanRecommendationIn(BaseModel):
    """Request body for creating a scanner-recommended checklist item."""
    checklist_id: str
    scan_id: str
    matched_rule: str
    status: str = "pending"


class ScanRecommendationOut(BaseModel):
    """Response for a scanner-recommended checklist item."""
    checklist_id: str
    scan_id: str
    matched_rule: str
    recommended: bool = True
    status: str = "pending"
    matched: int = 0
    upserted: bool = False


class CategoryProgress(BaseModel):
    """Aggregated progress for a single category."""
    category: str
    total: int = 0
    completed: int = 0
    score: float = 0.0


class ChecklistScoreOut(BaseModel):
    """Aggregated security score for a project's checklist."""
    project_id: str
    total_tasks: int = 0
    completed_tasks: int = 0
    score: float = 0.0
    by_category: List[CategoryProgress] = Field(default_factory=list)


class GenerateChecklistOut(BaseModel):
    """Result of generating a project-specific checklist."""
    project_id: str
    created: int = 0
    total: int = 0
    message: str = ""


# ── Module SC4: Security Posture ─────────────────────────────────────────────

class CategoryPostureOut(BaseModel):
    """Per-category risk-weighted security score."""
    category: str
    score: float = 0.0
    level: str = "Critical"


class SecurityPostureOut(BaseModel):
    """Intelligent security posture measurement."""
    score: float = 0.0
    level: str = "Critical"
    total_risk: int = 0
    risk_reduced: int = 0
    risk_remaining: int = 0
    categories: dict = Field(default_factory=dict)
    category_details: List[CategoryPostureOut] = Field(default_factory=list)
    weak_categories: List[str] = Field(default_factory=list)
    completed_tasks: int = 0
    total_tasks: int = 0


class PostureHistoryOut(BaseModel):
    """Historical posture snapshot."""
    id: str
    security_score: float = 0.0
    security_level: str = "Critical"
    risk_reduced: int = 0
    risk_remaining: int = 0
    categories: dict = Field(default_factory=dict)
    created_at: Optional[str] = None
