"""
Pydantic schemas for the OWASP Simulator API (Module 7.4).
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class StartSimulationRequest(BaseModel):
    vulnerability: str
    mode: str = "attack"  # attack | defense
    difficulty: Optional[str] = "Beginner"


class AttackRequest(BaseModel):
    session_id: str
    payload: str
    hints_used: int = 0


class DefenseRequest(BaseModel):
    session_id: str
    user_code: str
    hints_used: int = 0


class CoachRequest(BaseModel):
    vulnerability: str
    difficulty: str = "Beginner"
    payload: str
    success: bool = True


class SimulationOut(BaseModel):
    session_id: str
    vulnerability: str
    mode: str
    difficulty: str
    title: str
    scenario: str
    field: Optional[str] = None
    example_payload: Optional[str] = None
    hints: List[str] = []
    learning_path: List[str] = []


class AttackResult(BaseModel):
    success: bool
    vulnerability: str
    analysis: str
    xp_earned: int
    hints_used: int
    no_hint_bonus: bool
    coach: str
    provider: str
    owasp: Optional[str] = None
    business_impact: Optional[str] = None
    fix: Optional[str] = None


class DefenseResult(BaseModel):
    status: str  # Passed | Partial | Failed
    score: int
    feedback: str
    recommendation: str
    owasp_reference: Optional[str] = None
    best_practices: List[str] = []
    secure_code_example: str = ""
    xp_earned: int
    coach: Optional[str] = None


class CoachResponse(BaseModel):
    vulnerability: str
    explanation: str
    provider: str


class DailyChallengeOut(BaseModel):
    vulnerability: str
    difficulty: str
    reward_xp: int
    expires_at: str
    completed: bool = False


class ProgressOut(BaseModel):
    user_id: str
    completed_attack: List[str] = []
    completed_defense: List[str] = []
    xp: int
    level: int
    badges: List[str] = []
    streak: int
    total_attempts: int
