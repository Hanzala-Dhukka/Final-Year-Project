from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class LayoutItem(BaseModel):
    i: str
    x: int
    y: int
    w: int
    h: int
    minW: Optional[int] = None
    minH: Optional[int] = None
    maxW: Optional[int] = None
    maxH: Optional[int] = None
    static: Optional[bool] = False


class DashboardFilters(BaseModel):
    project: str = "All"
    severity: str = "All"
    date: str = "7 Days"


class DashboardPreferences(BaseModel):
    user_id: str
    layout: List[LayoutItem] = []
    hidden_widgets: List[str] = []
    favorite_widgets: List[str] = []
    filters: DashboardFilters = Field(default_factory=DashboardFilters)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class DashboardPreferencesResponse(BaseModel):
    user_id: str
    layout: List[LayoutItem] = []
    hidden_widgets: List[str] = []
    favorite_widgets: List[str] = []
    filters: DashboardFilters = Field(default_factory=DashboardFilters)
    updated_at: datetime