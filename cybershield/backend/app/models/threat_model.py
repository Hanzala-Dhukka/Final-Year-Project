
from pydantic import BaseModel, Field
from typing import List, Optional
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


class ThreatModelResponse(BaseModel):
    success: bool
    project_id: str
    message: str

