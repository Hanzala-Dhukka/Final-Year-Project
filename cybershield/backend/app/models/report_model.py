from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any

class ReportBase(BaseModel):
    title: str
    risk_level: str
    summary: str
    report_type: str
    created_at: datetime

class ReportCreate(BaseModel):
    user_id: str
    report_data: dict
    title: Optional[str] = "Security Report"
    risk_level: Optional[str] = "Unknown"
    summary: Optional[str] = ""
    report_type: str

class ReportResponse(BaseModel):
    id: str
    user_id: str
    report_data: dict
    title: str
    risk_level: str
    summary: str
    report_type: str
    created_at: datetime