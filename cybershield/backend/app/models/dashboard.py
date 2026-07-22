from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class WeeklyScanItem(BaseModel):
    day: str
    count: int


class VulnerabilityTrendItem(BaseModel):
    day: str
    critical: int
    high: int
    medium: int
    low: int


class AchievementItem(BaseModel):
    id: str
    title: str
    description: str
    unlocked: bool
    icon: Optional[str] = "🏆"


class AIInsightModel(BaseModel):
    title: str
    description: str
    priority: Optional[str] = "Medium"


class DashboardModel(BaseModel):
    user_id: str
    username: str = "Hanzala"
    security_score: int = 82
    projects: int = 6
    scans: int = 41
    threats: int = 7
    critical: int = 2
    high: int = 5
    medium: int = 9
    low: int = 21
    weekly_scans: List[WeeklyScanItem] = []
    vulnerability_trend: List[VulnerabilityTrendItem] = []
    learning_progress: int = 65
    xp: int = 1820
    rank: str = "Silver"
    level: int = 4
    next_level_xp: int = 2500
    achievements: List[AchievementItem] = []
    ai_insight: Optional[AIInsightModel] = None
    recent_activity: List[dict] = []
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
