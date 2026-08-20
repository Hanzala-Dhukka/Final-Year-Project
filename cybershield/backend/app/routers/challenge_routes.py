from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from datetime import datetime
from app.schemas.challenge_schema import ChallengeSubmitRequest
from app.services.challenge_generator import ChallengeGenerator
from app.services.streak_service import StreakService
from app.services.challenge_history import ChallengeHistoryService
from app.services.gemini_service import generate_daily_explanation
from app.services.error_log_service import fire_and_forget_log

router = APIRouter()

# Initialize services
challenge_generator = ChallengeGenerator()
streak_service = StreakService()
history_service = ChallengeHistoryService()


@router.get("/today")
async def get_todays_challenge(user_id: str = "anonymous") -> Dict[str, Any]:
    """
    Get today's daily challenge.

    Returns:
        Today's challenge with time remaining and user status
    """
    try:
        today = datetime.now().strftime("%Y-%m-%d")

        challenge = await challenge_generator.get_or_create_today()
        user_streak = await streak_service.get_user_streak(user_id)
        user_completed = await streak_service.is_completed(user_id, today)
        time_remaining = challenge_generator.get_time_remaining(challenge)

        return {
            "success": True,
            "challenge": challenge,
            "time_remaining": time_remaining,
            "user_completed": user_completed,
            "current_streak": user_streak["current_streak"],
            "longest_streak": user_streak["longest_streak"],
            "total_xp": user_streak["total_xp"],
        }
    except Exception as e:
        fire_and_forget_log()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/submit")
async def submit_challenge(request: ChallengeSubmitRequest) -> Dict[str, Any]:
    """
    Submit an answer for today's daily challenge.

    Body:
        {
            "challenge_id": "DAY-2025-01-01",
            "user_id": "user123",
            "payload": "' OR 1=1 --",
            "time_taken": 45
        }
    """
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        challenge = await challenge_generator.get_or_create_today()

        if str(challenge["challenge_id"]) != str(request.challenge_id):
            raise HTTPException(status_code=400, detail="Challenge ID mismatch")

        xp_earned = challenge.get("xp_reward", 100)
        correct_answer = str(challenge.get("answer", "")).strip().lower()
        is_correct = request.payload.strip().lower() == correct_answer

        already_completed = await streak_service.is_completed(request.user_id, today)

        if is_correct:
            current_streak = await streak_service.get_user_streak(request.user_id)
            streak = current_streak["current_streak"] + 1
            streak_bonus = streak_service.get_streak_bonus(streak)

            # Record completion (idempotent per user+date) and get updated streak
            updated = await streak_service.record_challenge_completion(
                user_id=request.user_id,
                challenge_id=request.challenge_id,
                date=today,
                score=100,
                time_taken=request.time_taken,
                xp_earned=xp_earned,
                streak=streak,
                challenge_name=challenge.get("title", "Daily Challenge"),
                category=challenge.get("category", ""),
                difficulty=challenge.get("difficulty", ""),
                answered_payload=request.payload,
            )

            explanation = await generate_daily_explanation(
                category=challenge.get("category", "security"),
                title=challenge.get("title", "Daily Challenge"),
                user_answer=request.payload,
            )

            # Don't double award XP for repeats on the same day
            if already_completed:
                xp_earned = 0
                streak_bonus = 0
                feedback = "You already completed today's challenge."
            else:
                feedback = f"Correct! You earned {xp_earned} XP + {streak_bonus} streak bonus!"

            return {
                "success": True,
                "xp_earned": xp_earned,
                "streak": streak,
                "streak_bonus": streak_bonus,
                "is_correct": True,
                "feedback": feedback,
                "explanation": explanation,
            }
        else:
            return {
                "success": True,
                "xp_earned": 0,
                "streak": (await streak_service.get_user_streak(request.user_id))["current_streak"],
                "streak_bonus": 0,
                "is_correct": False,
                "feedback": "Not quite. Review the hint and try again.",
                "explanation": "",
            }
    except HTTPException:
        fire_and_forget_log()
        raise
    except Exception as e:
        fire_and_forget_log()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_challenge_history(user_id: str = "anonymous", limit: int = 30) -> Dict[str, Any]:
    """Get a user's challenge completion history."""
    try:
        history = await history_service.get_history(user_id, limit)
        return {"success": True, "history": history}
    except Exception as e:
        fire_and_forget_log()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/streak")
async def get_user_streak(user_id: str = "anonymous") -> Dict[str, Any]:
    """Get a user's streak information."""
    try:
        streak = await streak_service.get_user_streak(user_id)
        return {"success": True, "streak": streak}
    except Exception as e:
        fire_and_forget_log()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistics")
async def get_challenge_statistics(user_id: str = "anonymous") -> Dict[str, Any]:
    """Get a user's challenge statistics."""
    try:
        stats = await history_service.get_statistics(user_id)
        stats["user_id"] = user_id
        return {"success": True, "statistics": stats}
    except Exception as e:
        fire_and_forget_log()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/calendar")
async def get_challenge_calendar(
    user_id: str = "anonymous",
    year: Optional[int] = None,
    month: Optional[int] = None,
) -> Dict[str, Any]:
    """Get a GitHub-style contribution calendar of completed days."""
    try:
        calendar = await history_service.get_calendar(user_id, year, month)
        return {"success": True, "calendar": calendar}
    except Exception as e:
        fire_and_forget_log()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/leaderboard")
async def get_leaderboard(limit: int = 10) -> Dict[str, Any]:
    """Get the top users by total challenge XP."""
    try:
        leaderboard = await history_service.get_leaderboard(limit)
        return {"success": True, "leaderboard": leaderboard}
    except Exception as e:
        fire_and_forget_log()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate")
async def generate_challenge(date: Optional[str] = None) -> Dict[str, Any]:
    """Generate today's daily challenge manually (testing endpoint)."""
    try:
        challenge = challenge_generator.generate_daily_challenge(force_date=date)
        await challenge_generator.get_or_create_today()
        return {"success": True, "challenge": challenge}
    except Exception as e:
        fire_and_forget_log()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories")
async def get_categories() -> Dict[str, Any]:
    """Get all available challenge categories."""
    try:
        from app.data.daily_templates import get_all_categories
        return {"success": True, "categories": get_all_categories()}
    except Exception as e:
        fire_and_forget_log()
        raise HTTPException(status_code=500, detail=str(e))