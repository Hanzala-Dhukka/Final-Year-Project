from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId

class ScanModel(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    repo_url: str
    branch: str = "main"
    status: str = "queued"  # queued, scanning, completed, failed
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    files_scanned: int = 0
    risk_score: int = 0
    total_vulnerabilities: int = 0
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }

class VulnerabilityModel(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    scan_id: str
    file: str
    line: int
    type: str
    severity: str  # Critical, High, Medium, Low
    evidence: str
    impact: str
    recommendation: str
    code_snippet: Optional[str] = None
    ai_remediation: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }

class ScanProgressModel(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    scan_id: str
    status: str
    current_file: Optional[str] = None
    files_processed: int = 0
    total_files: int = 0
    percentage: int = 0
    current_stage: str = "Initializing"
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }

class ScanReportModel(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    scan_id: str
    format: str  # json, pdf
    file_url: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }

class SecurityScoreModel(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    repo: str
    previous_score: int
    current_score: int
    improvement: int
    date: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }