"""
Progress Routes - API endpoints for XP, Level, Achievements, Analytics, and Certificates
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from app.schemas.progress_schema import (
    XPResponse, AchievementResponse, AnalyticsResponse, CertificateResponse,
    ProgressDashboard
)
from app.services.progress_service import ProgressService, add_xp, get_progress, get_leaderboard
from app.services.achievement_service import AchievementService, check_achievements, get_achievements
from app.services.analytics_service import AnalyticsService, get_analytics, get_category_mastery
from app.services.certificate_service import CertificateService, check_certificate_eligibility, generate_certificate
from app.services.roadmap_service import RoadmapService, get_learning_roadmap

router = APIRouter()


@router.get("/dashboard/{user_id}", response_model=Dict[str, Any])
async def get_dashboard(user_id: str):
    """
    Get complete progress dashboard for a user
    
    - **user_id**: User identifier
    """
    try:
        # Get progress data
        progress = ProgressService.get_user_progress(user_id)
        
        # Get analytics
        analytics = AnalyticsService.get_learning_analytics(user_id)
        
        # Get category mastery
        category_mastery = AnalyticsService.get_category_mastery(user_id)
        
        # Get achievements
        badges = AchievementService.get_user_achievements(user_id)
        
        # Get certificate eligibility
        eligibility = CertificateService.check_eligibility(user_id)
        
        # Get learning roadmap
        roadmap = await RoadmapService.generate_roadmap(user_id)
        
        return {
            "success": True,
            "data": {
                "user_id": user_id,
                "xp": progress["xp"],
                "level": progress["level"],
                "skill": _get_skill_level(analytics),
                "average": analytics["average_score"],
                "completed_labs": analytics["completed_labs"],
                "total_labs": analytics["total_labs"],
                "progress_percentage": round(
                    (analytics["completed_labs"] / analytics["total_labs"] * 100) 
                    if analytics["total_labs"] > 0 else 0, 1
                ),
                "current_streak": analytics["current_streak"],
                "longest_streak": analytics["longest_streak"],
                "badges": badges,
                "category_mastery": category_mastery,
                "next_learning_path": roadmap["recommended_path"],
                "certificate_eligible": eligibility["eligible"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting dashboard: {str(e)}")


@router.post("/xp", response_model=Dict[str, Any])
async def add_xp_endpoint(user_id: str, action: str, score: int = 100,
                          perfect_score: bool = False, streak_days: int = 0):
    """
    Add XP for a user action
    
    - **user_id**: User identifier
    - **action**: Action type (daily_challenge, attack_lab, defense_lab, quiz, ai_practice)
    - **score**: Score achieved (0-100)
    - **perfect_score**: Whether the user got a perfect score
    - **streak_days**: Current streak days
    """
    try:
        result = ProgressService.add_xp(user_id, action, score, perfect_score, streak_days)
        
        # Check for achievements
        category = _get_category_from_action(action)
        achievements = AchievementService.check_achievements(user_id, "lab_completed", category, score)
        
        return {
            "success": True,
            "data": {
                **result,
                "achievements_unlocked": achievements
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding XP: {str(e)}")


@router.get("/achievements/{user_id}", response_model=Dict[str, Any])
async def get_achievements_endpoint(user_id: str):
    """
    Get achievements for a user
    
    - **user_id**: User identifier
    """
    try:
        badges = AchievementService.get_user_achievements(user_id)
        
        return {
            "success": True,
            "data": {
                "badges": badges,
                "total_badges": len(badges)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting achievements: {str(e)}")


@router.get("/analytics/{user_id}", response_model=Dict[str, Any])
async def get_analytics_endpoint(user_id: str):
    """
    Get learning analytics for a user
    
    - **user_id**: User identifier
    """
    try:
        analytics = AnalyticsService.get_learning_analytics(user_id)
        category_mastery = AnalyticsService.get_category_mastery(user_id)
        
        return {
            "success": True,
            "data": {
                "analytics": analytics,
                "category_mastery": category_mastery,
                "streak_info": {
                    "current": analytics["current_streak"],
                    "longest": analytics["longest_streak"]
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting analytics: {str(e)}")


@router.get("/certificate/{user_id}", response_model=Dict[str, Any])
async def get_certificate_endpoint(user_id: str, user_name: str = "User"):
    """
    Get or generate certificate for a user
    
    - **user_id**: User identifier
    - **user_name**: User's display name
    """
    try:
        # Check eligibility first
        eligibility = CertificateService.check_eligibility(user_id)
        
        if not eligibility["eligible"]:
            return {
                "success": True,
                "data": {
                    "certificate": None,
                    "status": "Not Eligible",
                    "eligibility": eligibility
                }
            }
        
        # Generate certificate
        result = CertificateService.generate_certificate(user_id, user_name)
        
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error with certificate: {str(e)}")


@router.get("/roadmap/{user_id}", response_model=Dict[str, Any])
async def get_roadmap_endpoint(user_id: str):
    """
    Get personalized learning roadmap for a user
    
    - **user_id**: User identifier
    """
    try:
        roadmap = await RoadmapService.generate_roadmap(user_id)
        
        return {
            "success": True,
            "data": roadmap
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting roadmap: {str(e)}")


@router.get("/leaderboard", response_model=Dict[str, Any])
async def get_leaderboard_endpoint(limit: int = 10):
    """
    Get XP leaderboard
    
    - **limit**: Maximum number of users to return
    """
    try:
        leaderboard = ProgressService.get_leaderboard(limit)
        
        return {
            "success": True,
            "data": {
                "leaderboard": leaderboard,
                "total_users": len(leaderboard)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting leaderboard: {str(e)}")


@router.get("/level/{user_id}", response_model=Dict[str, Any])
async def get_level_endpoint(user_id: str):
    """
    Get user level information
    
    - **user_id**: User identifier
    """
    try:
        progress = ProgressService.get_user_progress(user_id)
        
        return {
            "success": True,
            "data": {
                "user_id": user_id,
                "level": progress["level"],
                "current_xp": progress["xp"],
                "xp_to_next_level": progress["xp_to_next"],
                "level_progress": progress["level_progress"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting level: {str(e)}")


@router.get("/health")
async def health_check():
    """Check progress system health"""
    return {
        "status": "healthy",
        "services": {
            "progress": "ok",
            "achievements": "ok",
            "analytics": "ok",
            "certificate": "ok",
            "roadmap": "ok"
        }
    }


def _get_skill_level(analytics: Dict[str, Any]) -> str:
    """Determine skill level based on analytics"""
    avg_score = analytics.get("average_score", 0)
    completed_labs = analytics.get("completed_labs", 0)
    total_xp = analytics.get("total_xp", 0)
    
    if avg_score >= 90 and completed_labs >= 40 and total_xp >= 5000:
        return "Security Professional"
    elif avg_score >= 80 and completed_labs >= 20:
        return "Expert"
    elif avg_score >= 60 and completed_labs >= 10:
        return "Advanced"
    elif avg_score >= 40 and completed_labs >= 5:
        return "Intermediate"
    else:
        return "Beginner"


def _get_category_from_action(action: str) -> Optional[str]:
    """Get category from action type"""
    category_map = {
        "sql_lab": "SQL Injection",
        "xss_lab": "XSS",
        "command_lab": "Command Injection",
        "csrf_lab": "CSRF",
        "ssrf_lab": "SSRF",
        "idor_lab": "Insecure Direct Object Reference"
    }
    return category_map.get(action)