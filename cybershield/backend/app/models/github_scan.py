"""
GitHub scan model for MongoDB document structure.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Dict, Any, Optional


class GitHubScan(BaseModel):
    """Schema for GitHub scan document in MongoDB."""
    repo_url: str
    repository: str
    files_scanned: int = 0
    vulnerabilities_found: int = 0
    risk_score: int = 0
    risk_level: str = "Unknown"
    technologies: List[str] = []
    findings: List[Dict[str, Any]] = []
    file_report: List[Dict[str, Any]] = []
    ai_report: Dict[str, Any] = {}
    secret_summary: Dict[str, Any] = {}
    dependency_report: Dict[str, Any] = {}
    risk_dashboard: Dict[str, Any] = {}
    severity_summary: Dict[str, Any] = {}
    category_summary: Dict[str, Any] = {}
    distribution: Dict[str, Any] = {}
    repository_health: Dict[str, Any] = {}
    top_risks: List[Dict[str, Any]] = []
    recommendations: List[str] = []
    score_card: Dict[str, Any] = {}
    executive_summary: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    user_id: Optional[str] = None


class GitHubScanResponse(BaseModel):
    """Schema for GitHub scan response."""
    id: str
    repository: str
    risk_score: int
    risk_level: str
    files_scanned: int
    vulnerabilities_found: int
    created_at: datetime
    user_id: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "id": "...",
                "repository": "OWASP/WebGoat",
                "risk_score": 82,
                "risk_level": "High",
                "files_scanned": 145,
                "vulnerabilities_found": 27,
                "created_at": "2026-07-08T14:20:00Z"
            }
        }