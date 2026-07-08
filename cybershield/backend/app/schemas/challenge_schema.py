from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


class DailyChallenge(BaseModel):
    challenge_id: str
    date: str
    category: str
    difficulty: str
    title: str
    description: str
    question: str
    answer: str
    xp_reward: int
    streak_bonus: int
    expires_at: str
    created_at: str


class ChallengeResponse(BaseModel):
    success: bool
    challenge: Optional[DailyChallenge] = None
    message: Optional[str] = None


class ChallengeSubmitRequest(BaseModel):
    challenge_id: str
    user_id: str
    payload: str
    time_taken: int  # seconds


class ChallengeSubmitResponse(BaseModel):
    success: bool
    xp_earned: int
    streak: int
    streak_bonus: int
    is_correct: bool
    feedback: str
    explanation: str


class UserChallenge(BaseModel):
    user_id: str
    date: str
    challenge_id: str
    completed: bool
    score: int
    attempts: int
    time_taken: int
    xp_earned: int
    completed_at: Optional[str] = None


class StreakInfo(BaseModel):
    user_id: str
    current_streak: int
    longest_streak: int
    total_xp: int
    last_completed_date: Optional[str] = None


class ChallengeStatistics(BaseModel):
    user_id: str
    total_challenges: int
    completed_challenges: int
    missed_challenges: int
    average_score: float
    total_xp: int
    best_category: Optional[str]
    weakest_category: Optional[str]
    category_stats: Dict[str, Dict[str, Any]]


class ChallengeHistoryItem(BaseModel):
    date: str
    challenge_id: str
    category: str
    difficulty: str
    title: str
    completed: bool
    score: int
    xp_earned: int