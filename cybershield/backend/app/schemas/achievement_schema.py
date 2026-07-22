"""
Pydantic schemas for the Gamification / Achievements API (Module 7.5).
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ProgressResponse(BaseModel):
    user_id: str
    xp: int
    level: int
    level_title: str
    xp_to_next: int
    level_progress: float
    current_streak: int
    longest_streak: int
    completed_labs: int
    completed_quizzes: int
    completed_glossary: int
    security_score: int
    badges: int
    certificates: int


class AchievementOut(BaseModel):
    key: str
    name: str
    description: str
    icon: Optional[str] = None
    xp_reward: int = 0
    unlocked: bool = False
    unlocked_at: Optional[str] = None


class BadgeOut(BaseModel):
    key: str
    name: str
    description: str
    unlocked: bool = False


class CertificateOut(BaseModel):
    certificate_id: str
    course: str
    score: int
    issued_at: str
    user_name: Optional[str] = None


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    name: str
    xp: int
    level: int
    badge_count: int


class ActivityOut(BaseModel):
    id: str
    activity_type: str
    description: str
    xp: int
    created_at: str


class LearningGoalRequest(BaseModel):
    goal_type: str = Field(..., description="quizzes | glossary_terms | owasp_labs")
    target: int = Field(..., gt=0)
    period: str = Field("weekly", description="daily | weekly")


class LearningGoalOut(BaseModel):
    id: str
    goal_type: str
    target: int
    period: str
    current: int
    completed: bool
