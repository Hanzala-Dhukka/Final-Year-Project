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


class StatusUpdateIn(BaseModel):
    """Request body for updating a checklist item's status."""
    status: str = Field(..., description="pending | in_progress | completed")


class GenerateChecklistIn(BaseModel):
    """Optional request body for generating a project-specific checklist."""
    finding: Optional[str] = None
    technology: Optional[str] = None


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
