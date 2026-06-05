from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class MonitoringTargetBase(BaseModel):
    type: str = Field(..., example="github")
    target: str = Field(..., example="https://github.com/facebook/react")
    enabled: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MonitoringTargetCreate(MonitoringTargetBase):
    pass

class MonitoringTargetResponse(MonitoringTargetBase):
    id: str

    class Config:
        from_attributes = True
