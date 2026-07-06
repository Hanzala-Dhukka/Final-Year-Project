from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


class AttackLab(BaseModel):
    lab_id: str
    title: str
    difficulty: str  # "Easy", "Medium", "Hard"
    category: str
    story: str
    objective: str
    hint: str
    solution: str
    vulnerable_code: str
    language: str
    xp_reward: int
    badge_reward: Optional[str] = None


class LabAttempt(BaseModel):
    attempt_id: str
    lab_id: str
    user_id: str
    payload: str
    success: bool
    server_response: str
    points_earned: int
    attempt_number: int
    timestamp: str


class LabSession(BaseModel):
    session_id: str
    lab_id: str
    user_id: str
    current_state: str  # "start", "scenario", "attack", "success", "defense", "completed"
    attempts: int
    max_attempts: int
    hint_used: bool
    attack_success: bool
    defense_success: bool
    total_xp: int
    started_at: str
    completed_at: Optional[str] = None


class LabSubmission(BaseModel):
    lab_id: str
    payload: str
    user_id: str = "anonymous"


class DefenseSubmission(BaseModel):
    lab_id: str
    secure_code: str
    user_id: str = "anonymous"


class LabResult(BaseModel):
    success: bool
    server_response: str
    points_earned: int
    explanation: str
    xp_earned: int
    badge_earned: Optional[str] = None
    next_step: str  # "defense", "completed", "retry"
    modified_query: Optional[str] = None


class UserProgress(BaseModel):
    user_id: str
    total_xp: int
    labs_completed: int
    total_labs: int
    badges: List[str]
    completion_percentage: float
    category_progress: Dict[str, Dict[str, int]]


class LabStats(BaseModel):
    total_labs: int
    total_attempts: int
    average_score: float
    completion_rate: float
    popular_labs: List[Dict[str, Any]]