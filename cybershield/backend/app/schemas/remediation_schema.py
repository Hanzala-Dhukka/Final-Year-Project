"""
Pydantic schemas for the AI Remediation Engine (Module 5.4).
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ── Requests ──────────────────────────────────────────────────────────────────
class RemediationGenerateRequest(BaseModel):
    """Body for POST /remediation/generate (spec Step 8)."""
    project_id: Optional[str] = None
    finding_id: Optional[str] = None  # id of an existing vulnerability (scan/review)
    # The vulnerability itself (required when not resolving an existing finding)
    finding: Optional[str] = Field(None, description="Vulnerability name/description")
    severity: Optional[str] = None
    technology: Optional[str] = None
    file: Optional[str] = None
    line: Optional[int] = None
    code: Optional[str] = None
    source: Optional[str] = "manual"  # github_scan | threat_report | code_review | manual
    context: Optional[str] = None


class RemediationStatusUpdate(BaseModel):
    """Body for PUT /remediation/{id}/status."""
    status: str = Field(..., description="Open | In Progress | Fixed")


# ── AI solution sub-shape ─────────────────────────────────────────────────────
class AISolucion(BaseModel):
    explanation: str = ""
    impact: List[str] = []
    root_cause: str = ""
    solution: List[str] = []
    secure_code: str = ""
    prevention: List[str] = []
    category: str = ""
    owasp: str = ""
    cwe: str = ""
    risk_before: Optional[int] = None
    risk_after: Optional[int] = None


# ── Responses ─────────────────────────────────────────────────────────────────
class RemediationGenerateResponse(BaseModel):
    message: str
    report_id: str


class RemediationSummary(BaseModel):
    """List item returned by GET /remediation/{project_id}."""
    id: str
    finding: str
    severity: str
    technology: str
    status: str
    category: str = ""
    owasp: str = ""
    cwe: str = ""
    risk_before: Optional[int] = None
    risk_after: Optional[int] = None
    created_at: str


class RemediationReport(BaseModel):
    """Full report returned by GET /remediation/report/{id}."""
    id: str
    project_id: Optional[str]
    vulnerability_id: Optional[str]
    finding: str
    severity: str
    technology: str
    source: Optional[str]
    ai_solution: AISolucion
    status: str
    created_at: str
    updated_at: str


class RemediationStatusResponse(BaseModel):
    message: str
    status: str
    report_id: str
