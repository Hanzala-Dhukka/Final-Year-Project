from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class UserInfo(BaseModel):
    full_name: str
    profile_image: Optional[str] = None


class DashboardStats(BaseModel):
    security_score: int
    total_scans: int
    threat_reports: int
    quiz_accuracy: int


class RecentScan(BaseModel):
    id: str
    repository: str
    risk_level: str
    files: int
    date: str
    status: str


class RecentReport(BaseModel):
    id: str
    project: str
    risk: str
    score: int
    created: str


class QuizProgress(BaseModel):
    completed_quizzes: int
    average_score: int
    highest_score: int
    badges: List[str]
    weekly_scores: List[int]


class LearningProgress(BaseModel):
    glossary: int
    owasp: int
    quiz: int


class ActivityItem(BaseModel):
    date: str
    action: str
    time: str


class DailyChallenge(BaseModel):
    title: str
    description: str
    difficulty: str
    reward: int
    completed: bool = False


class DashboardResponse(BaseModel):
    user: UserInfo
    stats: DashboardStats
    recent_scans: List[RecentScan]
    recent_reports: List[RecentReport]
    recent_activity: List[ActivityItem]
    quiz_progress: QuizProgress
    learning_progress: LearningProgress
    daily_challenge: Optional[DailyChallenge] = None
