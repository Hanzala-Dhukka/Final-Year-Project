"""
Pydantic schemas for the AI Code Review module (Module 5.3).
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class CodeReviewRequest(BaseModel):
    """Body for POST /code-review (paste code)."""
    code: str = Field(..., min_length=1, description="Source code to review")
    language: Optional[str] = Field(
        None, description="Language hint (e.g. 'python'). Auto-detected if omitted."
    )
    project_id: Optional[str] = None


class FindingOut(BaseModel):
    line: int
    rule_id: str
    title: str
    severity: str
    owasp: str
    cwe: str
    recommendation: str
    snippet: Optional[str] = None


class CodeReviewResponse(BaseModel):
    """Response for POST /code-review (and /upload)."""
    review_id: str
    language: str
    risk_score: int
    severity_summary: Dict[str, int]
    owasp: List[str]
    cwe: List[str]
    findings: List[FindingOut]
    ai_explanation: str
    secure_code: str


class CodeReviewHistoryItem(BaseModel):
    id: str
    language: str
    risk_score: int
    severity_summary: Dict[str, int]
    owasp: List[str]
    cwe: List[str]
    created_at: str


class CodeReviewReport(BaseModel):
    """Full report (GET /code-review/{id})."""
    review_id: str
    language: str
    code: str
    findings: List[FindingOut]
    ai_explanation: str
    secure_code: str
    risk_score: int
    severity_summary: Dict[str, int]
    owasp: List[str]
    cwe: List[str]
    created_at: str
