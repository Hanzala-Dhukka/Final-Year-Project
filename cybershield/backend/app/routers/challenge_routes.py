from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.schemas.challenge_schema import (
    ChallengeSubmitRequest,
    ChallengeSubmitResponse,
    StreakInfo,
    ChallengeStatistics,
    ChallengeHistoryItem
)
from app.services.challenge_generator import ChallengeGenerator
from app.services.streak_service import StreakService
from app.services.challenge_history import ChallengeHistoryService
from app.services.challenge_scheduler import ChallengeScheduler
from app.services.gemini_service import generate_daily_explanation

router = APIRouter()

# Initialize services
challenge_generator = ChallengeGenerator()
streak_service = StreakService()
history_service = ChallengeHistoryService()
scheduler = ChallengeScheduler()


@router.get("/today")
async def get_todays_challenge(user_id: str = "anonymous") -> Dict[str, Any]:
    """
    Get today's daily challenge
    
    Returns:
        Today's challenge with time remaining and user status
    """
    try:
        # Get today's challenge
        challenge = challenge_generator.get_today_challenge()
        
        if not challenge:
            # Generate if not exists
            challenge = challenge_generator.generate_daily_challenge()
        
        # Get user streak info
        user_streak = streak_service.get_user_streak(user_id)
        
        # Check if user completed today's challenge
        today = datetime.now().strftime("%Y-%m-%d")
        user_completed = False
        
        # Get time remaining
        time_remaining = challenge_generator.get_time_remaining(challenge)
        
        return {
            "success": True,
            "challenge": challenge,
            "time_remaining": time_remaining,
            "user_completed": user_completed,
            "current_streak": user_streak["current_streak"],
            "longest_streak": user_streak["longest_streak"],
            "total_xp": user_streak["total_xp"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/submit")
async def submit_challenge(request: ChallengeSubmitRequest) -> ChallengeSubmitResponse:
    """
    Submit challenge answer
    
    Args:
        request: Challenge submission with user_id, challenge_id, and payload
    
    Returns:
        Submission result with XP earned and streak info
    """
    try:
        # Get the challenge
        challenge = challenge_generator.get_today_challenge()
        
        if not challenge:
            raise HTTPException(status_code=404, detail="No challenge available for today")
        
        # Validate challenge ID matches
        if challenge["challenge_id"] != request.challenge_id:
            raise HTTPException(status_code=400, detail="Challenge ID mismatch")
        
        # Validate answer
        validation = challenge_generator.validate_challenge_answer(
            challenge, 
            request.payload
        )
        
        if validation["is_correct"]:
            # Calculate score based on time taken (faster = better)
            # Max score 100, min score 50 for correct answer
            time_bonus = max(0, 50 - (request.time_taken // 60))  # Lose 1 point per minute
            score = min(100, 50 + time_bonus)
            
            # Record completion
            result = streak_service.record_challenge_completion(
                user_id=request.user_id,
                challenge_id=request.challenge_id,
                score=score,
                time_taken=request.time_taken
            )
            
            # Get AI explanation
            explanation = await generate_daily_explanation(
                category=challenge["category"],
                title=challenge["title"],
                user_answer=request.payload
            )
            
            return ChallengeSubmitResponse(
                success=True,
                xp_earned=result["xp_earned"],
                streak=result["streak"],
                streak_bonus=result["streak_bonus"],
                is_correct=True,
                feedback="🎉 Correct! Well done!",
                explanation=explanation
            )
        else:
            return ChallengeSubmitResponse(
                success=True,
                xp_earned=0,
                streak=0,
                streak_bonus=0,
                is_correct=False,
                feedback=f"❌ Incorrect. The correct answer was: {challenge['answer']}",
                explanation="Try again tomorrow!"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_challenge_history(
    user_id: str,
    limit: int = 30
) -> List[ChallengeHistoryItem]:
    """
    Get user's challenge history
    
    Args:
        user_id: User identifier
        limit: Maximum number of records to return
    
    Returns:
        List of challenge history items
    """
    try:
        history = history_service.get_user_challenge_history(user_id, limit)
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/streak")
async def get_user_streak(user_id: str) -> StreakInfo:
    """
    Get user's streak information
    
    Args:
        user_id: User identifier
    
    Returns:
        Streak information
    """
    try:
        streak = streak_service.get_user_streak(user_id)
        return StreakInfo(**streak)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistics")
async def get_challenge_statistics(user_id: str) -> ChallengeStatistics:
    """
    Get user's challenge statistics
    
    Args:
        user_id: User identifier
    
    Returns:
        Challenge statistics
    """
    try:
        stats = streak_service.get_streak_statistics(user_id)
        return ChallengeStatistics(**stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/calendar")
async def get_challenge_calendar(
    user_id: str,
    year: Optional[int] = None,
    month: Optional[int] = None
) -> Dict[str, Any]:
    """
    Get challenge calendar view (GitHub-style contribution graph)
    
    Args:
        user_id: User identifier
        year: Optional year (defaults to current)
        month: Optional month (defaults to current)
    
    Returns:
        Calendar data with completion status
    """
    try:
        calendar = history_service.get_challenge_calendar(user_id, year, month)
        return calendar
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/leaderboard")
async def get_leaderboard(limit: int = 10) -> List[Dict[str, Any]]:
    """
    Get top users by XP
    
    Args:
        limit: Maximum number of users to return
    
    Returns:
        Leaderboard list
    """
    try:
        rankings = history_service.get_user_rankings(limit)
        return rankings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate")
async def generate_challenge(
    date: Optional[str] = None,
    user_id: str = "system"
) -> Dict[str, Any]:
    """
    Generate a new daily challenge (admin/testing endpoint)
    
    Args:
        date: Optional date (YYYY-MM-DD) for testing
        user_id: User making the request
    
    Returns:
        Generated challenge
    """
    try:
        challenge = challenge_generator.generate_daily_challenge(force_date=date)
        return {
            "success": True,
            "challenge": challenge
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories")
async def get_categories() -> List[str]:
    """
    Get all available challenge categories
    
    Returns:
        List of categories
    """
    try:
        from app.data.daily_templates import get_all_categories
        return get_all_categories()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))