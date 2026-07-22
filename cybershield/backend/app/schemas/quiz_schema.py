"""
Pydantic schemas for the AI Quiz Generator API (Module 7.2).
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ── Request bodies ──────────────────────────────────────────────────────────
class GenerateQuizRequest(BaseModel):
    """Body for POST /quiz/generate."""
    difficulty: str = Field("Medium", description="Easy | Medium | Hard | Expert")
    category: str = Field("OWASP", description="Quiz category (see spec Step 7)")
    technology: str = Field("FastAPI", description="Target technology (see spec Step 9)")
    count: int = Field(10, ge=1, le=30, description="Number of questions to generate")
    project_id: Optional[str] = Field(None, description="Optional linked project")


class SubmitQuizRequest(BaseModel):
    """Body for POST /quiz/submit."""
    session_id: str = Field(..., description="Quiz session id returned by /generate")
    answers: Dict[str, str] = Field(
        ...,
        description="Map of question index (str) -> selected option text",
    )


# ── Responses ───────────────────────────────────────────────────────────────
class QuizQuestionOut(BaseModel):
    """A single question returned to the client (correct answer hidden)."""
    index: int
    question: str
    options: List[str]
    difficulty: Optional[str] = None
    category: Optional[str] = None
    technology: Optional[str] = None


class GenerateQuizResponse(BaseModel):
    session_id: str
    difficulty: str
    category: str
    technology: str
    total_questions: int
    questions: List[QuizQuestionOut]
    provider: str = "Groq"


class QuestionResult(BaseModel):
    index: int
    question: str
    user_answer: Optional[str]
    correct_answer: str
    is_correct: bool
    explanation: Optional[str]
    owasp_reference: Optional[str] = None


class SubmitQuizResponse(BaseModel):
    session_id: str
    score: int
    total: int
    correct: int
    incorrect: int
    percentage: int
    xp: int
    rank: int
    recommendations: List[str]
    results: List[QuestionResult]


class QuizAttemptSummary(BaseModel):
    id: str
    session_id: str
    difficulty: str
    category: str
    technology: str
    score: int
    total: int
    percentage: int
    xp_earned: int
    created_at: str


class LeaderboardEntry(BaseModel):
    user_id: str
    name: str
    xp: int
    average_score: float
    quizzes_completed: int
    level: int
    last_active: Optional[str] = None
