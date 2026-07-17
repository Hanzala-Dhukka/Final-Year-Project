"""
Pydantic schemas for the Interactive Threat Modeling Dashboard (Module 4.4).
"""
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class StrideData(BaseModel):
    Spoofing: int = 0
    Tampering: int = 0
    Repudiation: int = 0
    InformationDisclosure: int = 0
    DoS: int = 0
    Elevation: int = 0


class RiskDistribution(BaseModel):
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0


class OWASPCategory(BaseModel):
    id: str
    name: str
    severity: str
    description: Optional[str] = None


class MITRETechnique(BaseModel):
    technique: str
    name: str
    severity: str
    description: Optional[str] = None
    affected_assets: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)


class AttackSurfaceNode(BaseModel):
    id: str
    label: str
    type: str
    risk: str
    description: Optional[str] = None
    recommendations: List[str] = Field(default_factory=list)


class RecommendationItem(BaseModel):
    priority: str  # Critical | High | Medium | Low
    title: str
    description: Optional[str] = None


class ExecutiveSummary(BaseModel):
    overall_risk: str
    security_score: int
    internet_facing: bool = False
    sensitive_data: List[str] = Field(default_factory=list)
    top_threat: str = ""


class TimelinePoint(BaseModel):
    date: str
    score: int
    project: Optional[str] = None


class ThreatDashboardResponse(BaseModel):
    report_id: str
    project: str = "Untitled Project"
    risk_score: int = 0
    risk_level: str = "Low"
    stride: StrideData = Field(default_factory=StrideData)
    distribution: RiskDistribution = Field(default_factory=RiskDistribution)
    owasp: List[OWASPCategory] = Field(default_factory=list)
    mitre: List[MITRETechnique] = Field(default_factory=list)
    recommendations: List[RecommendationItem] = Field(default_factory=list)
    attack_surface: List[AttackSurfaceNode] = Field(default_factory=list)
    timeline: List[TimelinePoint] = Field(default_factory=list)
    executive: ExecutiveSummary = Field(default_factory=ExecutiveSummary)
    created_at: Optional[str] = None


class RiskTrendPoint(BaseModel):
    date: str
    score: int
    report_id: Optional[str] = None
    project: Optional[str] = None


class CompareRequest(BaseModel):
    report_a: str
    report_b: str


class CompareResponse(BaseModel):
    report_a: Dict[str, Any] = Field(default_factory=dict)
    report_b: Dict[str, Any] = Field(default_factory=dict)
    risk_diff: int = 0
    new_threats: int = 0
    resolved_threats: int = 0
    owasp_diff: List[Dict[str, Any]] = Field(default_factory=list)
    mitre_diff: List[Dict[str, Any]] = Field(default_factory=list)
