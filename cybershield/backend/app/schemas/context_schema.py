"""
Pydantic schemas for AI Security Assistant context endpoints (Module 5.2).
"""
from typing import Optional
from pydantic import BaseModel


class ContextUpdate(BaseModel):
    """Body for POST /chat/context."""
    project_id: Optional[str] = None
    context: str = "general"  # general | github_scan | threat_report | owasp | quiz | glossary


class ContextResponse(BaseModel):
    """Response for GET /chat/context."""
    project: Optional[str] = None
    project_id: Optional[str] = None
    context: str = "general"
    has_scan: bool = False
    has_threat_report: bool = False
    has_owasp: bool = False
    has_quiz: bool = False
