"""
Pydantic schemas for the Compliance Center (Module 6.3).
"""
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class GenerateComplianceIn(BaseModel):
    """Request body to (re)generate a compliance report for a project."""
    project_id: str = Field(..., description="Project id to run compliance on")


# ── Per-framework breakdown ──────────────────────────────────────────────────
class FrameworkScore(BaseModel):
    """Score + gap analysis for a single compliance framework."""
    score: float = 0.0
    satisfied: int = 0
    total: int = 0
    missing: List[str] = Field(default_factory=list)


# ── AI recommendation block ───────────────────────────────────────────────────
class AIRecommendation(BaseModel):
    """AI-generated explanation + remediation guidance (best-effort)."""
    executive_summary: Optional[str] = None
    compliance_weaknesses: Optional[str] = None
    business_impact: Optional[str] = None
    priority_actions: List[str] = Field(default_factory=list)
    estimated_score_after_fixes: Optional[float] = None


# ── Gap analysis item ────────────────────────────────────────────────────────
class GapItem(BaseModel):
    """A single framework's missing controls."""
    framework: str
    score: float = 0.0
    missing: List[str] = Field(default_factory=list)


# ── Compliance summary ───────────────────────────────────────────────────────
class ComplianceSummary(BaseModel):
    overall_score: float = 0.0
    frameworks: Dict[str, float] = Field(default_factory=dict)
    highest_gap: Optional[str] = None
    highest_framework: Optional[str] = None


# ── Full compliance report response ──────────────────────────────────────────
class ComplianceReportOut(BaseModel):
    id: Optional[str] = None
    project_id: str
    project_name: Optional[str] = None
    overall_score: float = 0.0
    frameworks: Dict[str, float] = Field(default_factory=dict)
    summary: ComplianceSummary = Field(default_factory=ComplianceSummary)
    breakdown: Dict[str, FrameworkScore] = Field(default_factory=dict)
    gap_analysis: List[GapItem] = Field(default_factory=list)
    recommendations: AIRecommendation = Field(default_factory=AIRecommendation)
    history: List[Dict] = Field(default_factory=list)
    created_at: Optional[str] = None
