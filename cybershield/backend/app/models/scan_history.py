from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime
from bson import ObjectId


class ScanHistory(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    scan_id: str
    repository: str
    repo_url: str
    branch: str
    created_at: datetime
    security_score: int
    risk_level: str
    summary: Dict
    findings: List
    dependency_report: Dict
    ai_report: Dict
    technologies: Dict
    repository_info: Dict

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }