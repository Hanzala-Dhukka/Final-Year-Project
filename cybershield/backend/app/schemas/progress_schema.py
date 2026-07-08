"""
Progress Tracking Schemas
Pydantic models for XP, Level, Skill, and Achievement tracking
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


# XP and Level System
class XPEvent(BaseModel):
    """XP event for tracking user actions"""
    user_id: str
    action: str  # "daily_challenge", "attack_lab", "defense_lab", "quiz", "ai_practice"
    xp_earned: int
    bonus_xp: int = 0
    total_xp: int
    timestamp: str


class LevelInfo(BaseModel):
    """User level information"""
    user_id: str
    level: int
    current_xp: int
    xp_to_next_level: int
    progress_percentage: float


# Skill Level System
class SkillLevel(BaseModel):
    """User skill level"""
    user_id: str
    skill: str  # "Beginner", "Intermediate", "Advanced", "Expert", "Security Professional"
    accuracy: float
    completed_labs: int
    total_xp: int
    next_level_requirements: Dict[str, Any]


# Achievement System
class Achievement(BaseModel):
    """Achievement/Badge model"""
    badge_id: str
    user_id: str
    badge_name: str
    description: str
    date_earned: str
    xp_reward: int = 0


class BadgeUnlock(BaseModel):
    """Badge unlock notification"""
    badge_name: str
    xp_reward: int
    message: str
    date: str


# Analytics Engine
class LearningAnalytics(BaseModel):
    """Learning analytics for a user"""
    user_id: str
    average_score: float
    completed_labs: int
    total_labs: int
    weakest_category: Optional[str]
    strongest_category: Optional[str]
    average_attempts: float
    total_xp: int
    current_streak: int
    longest_streak: int
    completed_challenges: int


class CategoryMastery(BaseModel):
    """Category mastery percentage"""
    category: str
    mastery_percentage: float
    completed: int
    total: int
    color: str


# Certificate System
class Certificate(BaseModel):
    """Certificate model"""
    certificate_id: str
    user_id: str
    user_name: str
    course: str
    level: str
    completed_labs: int
    average_score: float
    date_issued: str
    file_path: str


class CertificateEligibility(BaseModel):
    """Certificate eligibility check"""
    eligible: bool
    reason: str
    completion_percentage: float
    average_score: float
    required_completion: float = 80.0
    required_average: float = 75.0


# Progress Dashboard
class ProgressDashboard(BaseModel):
    """Complete progress dashboard data"""
    user_id: str
    xp: int
    level: int
    skill: str
    average: float
    completed_labs: int
    total_labs: int
    progress_percentage: float
    current_streak: int
    longest_streak: int
    badges: List[str]
    category_mastery: List[CategoryMastery]
    next_learning_path: List[str]
    certificate_eligible: bool


# Roadmap System
class LearningRoadmap(BaseModel):
    """Personalized learning roadmap"""
    user_id: str
    completed_topics: List[str]
    weak_topics: List[str]
    recommended_path: List[str]
    next_topic: str
    estimated_completion: str


# API Response Models
class XPResponse(BaseModel):
    """XP update response"""
    success: bool
    xp_earned: int
    total_xp: int
    level_up: bool = False
    new_level: Optional[int] = None


class AchievementResponse(BaseModel):
    """Achievement API response"""
    badges: List[str]
    total_badges: int
    recent_unlocks: List[Achievement]


class AnalyticsResponse(BaseModel):
    """Analytics API response"""
    analytics: LearningAnalytics
    category_mastery: List[CategoryMastery]
    streak_info: Dict[str, Any]


class CertificateResponse(BaseModel):
    """Certificate API response"""
    certificate: str
    status: str
    eligibility: CertificateEligibility