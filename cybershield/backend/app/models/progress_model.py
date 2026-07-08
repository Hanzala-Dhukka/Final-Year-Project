"""
Progress model for MongoDB document structure.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any


class UserProgress(BaseModel):
    """User progress and learning model."""
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    xp: int = 0
    level: int = 1
    skill_level: str = "Beginner"  # Beginner, Intermediate, Advanced, Expert
    completed_labs: List[str] = []  # Lab IDs
    completed_quizzes: List[str] = []  # Quiz IDs
    achievements: List[str] = []  # Achievement IDs
    streak_days: int = 0
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # OWASP Progress
    owasp_progress: Dict[str, int] = {}  # Category -> score
    
    # Learning path
    current_path: Optional[str] = None
    path_progress: float = 0.0  # Percentage
    
    class Config:
        populate_by_name = True


class ProgressCreate(BaseModel):
    """Schema for creating progress."""
    user_id: str
    xp: int = 0
    level: int = 1


class ProgressResponse(BaseModel):
    """Schema for progress response."""
    id: str
    user_id: str
    xp: int
    level: int
    skill_level: str
    completed_labs: List[str]
    completed_quizzes: List[str]
    achievements: List[str]
    streak_days: int
    last_activity: datetime
    owasp_progress: Dict[str, int]
    current_path: Optional[str]
    path_progress: float


class QuizAttempt(BaseModel):
    """Quiz attempt model."""
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    quiz_id: str
    score: int
    total_questions: int
    correct_answers: int
    answers: List[Dict[str, Any]] = []
    completed_at: datetime = Field(default_factory=datetime.utcnow)
    time_taken: int  # seconds
    
    class Config:
        populate_by_name = True


class LabAttempt(BaseModel):
    """Lab attempt model."""
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    lab_id: str
    status: str  # "started", "completed", "failed"
    score: int = 0
    completed_steps: List[str] = []
    attempts: int = 1
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    time_taken: int = 0  # seconds
    
    class Config:
        populate_by_name = True