from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class ThreatAnalysisRequest(BaseModel):
    project_name: str = Field(..., min_length=1, description="Project name")
    description: str = Field(default="")
    tech_stack: List[str] = Field(default_factory=list)
    deployment: Optional[str] = None
    authentication: Optional[str] = None
    internet_facing: bool = False
    database: Optional[str] = None
    api_type: Optional[str] = None
    user_roles: List[str] = Field(default_factory=list)
    sensitive_data: List[str] = Field(default_factory=list)


class ThreatAnalysisResponse(BaseModel):
    report_id: str
    project_name: str
    risk_score: int
    risk_level: str
    assets: List[str] = Field(default_factory=list)
    attack_surface: List[str] = Field(default_factory=list)
    stride: Dict[str, str] = Field(default_factory=dict)
    recommendations: List[str] = Field(default_factory=list)
    executive_summary: Optional[str] = None
    technical_summary: Optional[str] = None
    business_impact: List[str] = Field(default_factory=list)
    owasp_top10: List[str] = Field(default_factory=list)
    mitre_attack: List[Dict[str, str]] = Field(default_factory=list)
    security_score_reason: Optional[str] = None
    ai_provider: str = "Rule Engine"
    model: Optional[str] = None
    message: Optional[str] = None
