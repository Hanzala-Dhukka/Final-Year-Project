from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


class DefenseScenario(BaseModel):
    scenario_id: str
    category: str  # "SQL Injection", "XSS", "Command Injection", "Path Traversal"
    title: str
    vulnerable_code: str
    language: str  # "python", "javascript", "sql"
    hints: List[str]
    difficulty: str  # "Easy", "Medium", "Hard"


class DefenseSubmission(BaseModel):
    scenario_id: str
    category: str
    user_code: str
    user_id: Optional[str] = "anonymous"


class DefenseResult(BaseModel):
    scenario_id: str
    category: str
    score: int
    status: str  # "Passed", "Failed", "Partial"
    feedback: str
    recommendation: str
    owasp_reference: str
    best_practices: List[str]
    secure_code_example: str
    timestamp: str


class DefenseSession(BaseModel):
    session_id: str
    user_id: str
    category: str
    scenario_id: str
    score: int
    status: str
    time_taken: int  # seconds
    timestamp: str


class DefenseHistory(BaseModel):
    user_id: str
    sessions: List[DefenseSession]
    total_score: int
    categories_completed: List[str]
    achievements: List[str]