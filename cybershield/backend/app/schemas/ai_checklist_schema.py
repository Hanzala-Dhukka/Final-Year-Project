"""
Pydantic schemas for the AI-powered dynamic security checklist (Module 6.2).
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ChecklistTask(BaseModel):
    """A single AI-generated remediation task."""
    title: str
    description: str = ""
    priority: str = "Medium"  # Critical | High | Medium | Low
    difficulty: str = "Medium"  # Easy | Medium | Hard
    estimated_time: str = ""
    risk_reduction: str = "0%"
    framework: str = ""
    reason: str = ""


class GeneratedChecklistOut(BaseModel):
    """A stored generated checklist document."""
    id: str
    project_id: str
    generated_by: str = "groq"
    risk_score: Optional[int] = None
    estimated_risk_after: Optional[int] = None
    items: List[ChecklistTask] = Field(default_factory=list)
    ai_summary: Optional[str] = None
    created_at: Optional[str] = None


class GenerateChecklistIn(BaseModel):
    """Request body for generating a project checklist."""
    project_id: str


class RegenerateChecklistIn(BaseModel):
    """Request body for regenerating a project checklist."""
    project_id: str


class GenerateChecklistOut(BaseModel):
    """Response for generate / regenerate."""
    project_id: str
    generated_by: str = "groq"
    risk_score: Optional[int] = None
    estimated_risk_after: Optional[int] = None
    items: List[ChecklistTask] = Field(default_factory=list)
    ai_summary: Optional[str] = None
    message: str = "AI checklist generated."
