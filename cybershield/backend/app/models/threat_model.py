
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class ThreatModelCreate(BaseModel):
    project_name: str = Field(..., min_length=1, description="Project name, required")
    description: str = Field(..., description="Project description")
    frontend: str = Field(..., description="Frontend framework (e.g., React, Angular)")
    backend: str = Field(..., description="Backend framework (e.g., FastAPI, Flask)")
    database: str = Field(..., description="Database type (e.g., MongoDB, PostgreSQL)")
    authentication: str = Field(..., description="Authentication method (e.g., JWT, OAuth, Session)")
    cloud: Optional[str] = Field(None, description="Cloud provider (e.g., AWS, Azure, GCP)")
    third_party: Optional[List[str]] = Field(default_factory=list, description="Third-party APIs used")
    assets: Optional[List[str]] = Field(default_factory=list, description="Sensitive assets")


class Recommendation(BaseModel):
    threat_id: str
    technology: str
    threat: str
    severity: str
    fix_priority: str
    recommendation: str
    implementation_steps: List[str]
    code_example: str


class FixPlanItem(BaseModel):
    priority: str
    threat: str
    action: str


class SecurityReport(BaseModel):
    executive_summary: str
    top_risks: List[str]
    total_vulnerabilities: int
    critical_risks: int


class Threat(BaseModel):
    id: str
    technology: str
    threat: str
    category: str
    severity: str
    impact: str
    recommendation: str
    likelihood: int = 0
    risk_score: int = 0
    risk_level: str = "Low"
    priority: str = "P4"
    coordinates: dict = {}
    likelihood_label: str = ""
    impact_label: str = ""


class ThreatModelResponse(BaseModel):
    project: str
    threats_found: int
    risk_level: str
    overall_risk: str
    average_score: int
    risk_summary: Dict[str, int]
    top_risks: List[Dict[str, Any]]
    threats: List[Threat]
    recommendations: List[Recommendation]
    fix_plan: List[FixPlanItem]
    security_report: SecurityReport


