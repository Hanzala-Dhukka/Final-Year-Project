"""
AI Quiz Generator API routes (Module 7.2).

Endpoints (mounted under /api/v1/quiz):
  POST   /generate        Generate an AI quiz session
  GET    /{session}       Get a quiz session's questions (answers hidden)
  POST   /submit          Submit answers, get score + XP + recommendations
  GET    /history         List the user's quiz attempts
  GET    /leaderboard     Global XP leaderboard
"""
from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies.auth import get_current_user
from app.schemas.quiz_schema import (
    GenerateQuizRequest,
    SubmitQuizRequest,
    GenerateQuizResponse,
    SubmitQuizResponse,
    QuizAttemptSummary,
    LeaderboardEntry,
)
from app.services import quiz_service
from app.services.leaderboard_service import get_leaderboard

router = APIRouter(
    prefix="/api/v1/quiz",
    tags=["AI Quiz Generator"],
)


@router.post("/generate", response_model=GenerateQuizResponse)
async def generate_quiz(payload: GenerateQuizRequest, user=Depends(get_current_user)):
    """Generate a project/tech/difficulty-aware quiz using the AI model."""
    user_id = str(user["_id"])
    data = await quiz_service.generate_quiz(
        user_id=user_id,
        difficulty=payload.difficulty,
        category=payload.category,
        technology=payload.technology,
        count=payload.count,
        project_id=payload.project_id,
    )
    questions = [
        {
            "index": i,
            "question": q["question"],
            "options": q["options"],
            "difficulty": q.get("difficulty"),
            "category": q.get("category"),
            "technology": q.get("technology"),
        }
        for i, q in enumerate(data["questions"])
    ]
    return GenerateQuizResponse(
        session_id=data["session_id"],
        difficulty=data["difficulty"],
        category=data["category"],
        technology=data["technology"],
        total_questions=data["total_questions"],
        questions=questions,
        provider=data["provider"],
    )


@router.get("/{session_id}", response_model=dict)
async def get_quiz(session_id: str, user=Depends(get_current_user)):
    """Get a quiz session's questions (correct answers hidden)."""
    user_id = str(user["_id"])
    quiz = await quiz_service.get_quiz(user_id, session_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    return quiz


@router.post("/submit", response_model=SubmitQuizResponse)
async def submit_quiz(payload: SubmitQuizRequest, user=Depends(get_current_user)):
    """Submit answers, evaluate, award XP, and return the graded result."""
    user_id = str(user["_id"])
    result = await quiz_service.submit_quiz(user_id, payload.session_id, payload.answers)
    if not result:
        raise HTTPException(status_code=404, detail="Quiz session not found")

    return SubmitQuizResponse(
        session_id=result["session_id"],
        score=result["score"],
        total=result["total"],
        correct=result["correct"],
        incorrect=result["incorrect"],
        percentage=result["percentage"],
        xp=result["xp"],
        rank=result["rank"],
        recommendations=result["recommendations"],
        results=result["results"],
    )


@router.get("/history", response_model=list[QuizAttemptSummary])
async def quiz_history(user=Depends(get_current_user), limit: int = Query(50, le=200)):
    """List the user's quiz attempts, newest first."""
    user_id = str(user["_id"])
    return await quiz_service.get_history(user_id, limit=limit)


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def leaderboard(
    limit: int = Query(20, le=100),
    skip: int = Query(0, ge=0),
):
    """Global XP leaderboard, sorted by XP descending."""
    return await get_leaderboard(limit=limit, skip=skip)
