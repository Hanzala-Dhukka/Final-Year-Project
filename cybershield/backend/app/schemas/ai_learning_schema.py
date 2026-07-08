from pydantic import BaseModel
from typing import Optional, Dict, Any, List


class ExplainRequest(BaseModel):
    topic: str
    payload: str
    result: str  # "correct" or "incorrect"
    skill_level: str  # "Beginner", "Intermediate", "Advanced"
    user_id: Optional[str] = "anonymous"
    attempt_number: Optional[int] = 1
    context: Optional[Dict[str, Any]] = {}


class ExplainResponse(BaseModel):
    explanation: str
    personalized_feedback: str
    recommendations: List[str]
    next_topics: List[str]
    skill_level: str
    confidence_score: Optional[float] = None


class HintRequest(BaseModel):
    topic: str
    payload: str
    hint_number: int  # 1, 2, or 3
    skill_level: str
    user_id: Optional[str] = "anonymous"
    previous_attempts: Optional[List[str]] = []


class HintResponse(BaseModel):
    hint: str
    hint_level: int
    next_hint_available: bool
    skill_level: str


class PracticeQuestionRequest(BaseModel):
    topic: str
    skill_level: str
    user_id: Optional[str] = "anonymous"
    question_type: Optional[str] = "multiple_choice"  # multiple_choice, code_fix, write_payload


class PracticeQuestionResponse(BaseModel):
    question: str
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: str
    difficulty: str
    skill_level: str


class ProgressUpdateRequest(BaseModel):
    user_id: str
    topic: str
    result: str  # "correct" or "incorrect"
    score: int
    time_taken: int  # seconds
    attempts: int
    weakness: Optional[str] = None
    lab_id: Optional[str] = None


class AdaptiveDifficultyRequest(BaseModel):
    user_id: str
    topic: str
    current_difficulty: str


class AdaptiveDifficultyResponse(BaseModel):
    recommended_difficulty: str
    confidence: float
    reasoning: str
    next_steps: List[str]


class LearningHistory(BaseModel):
    user_id: str
    history: List[Dict[str, Any]]
    total_attempts: int
    correct_attempts: int
    accuracy: float
    skill_level: str
    completed_labs: int
    average_score: float
    weakest_area: Optional[str]
    strongest_area: Optional[str]


class ProgressResponse(BaseModel):
    user_id: str
    topic: str
    total_attempts: int
    correct_attempts: int
    accuracy: float
    skill_level: str
    weakness: Optional[str]
    last_score: float
    last_updated: str


class LearningHistoryResponse(BaseModel):
    user_id: str
    topics: List[Dict[str, Any]]
    overall_accuracy: float
    skill_level: str
    completed_labs: int
    average_score: float
    weakest_area: Optional[str]


class FollowUpQuestionRequest(BaseModel):
    topic: str
    skill_level: str
    user_id: Optional[str] = "anonymous"


class FollowUpQuestionResponse(BaseModel):
    questions: List[str]
    related_topics: List[str]