"""
Dashboard routes for aggregating all user data in one place.
"""
from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any, List
import traceback
from app.utils.security import get_current_user
from app.services.dashboard_service import dashboard_service

router = APIRouter()


@router.get("/dashboard/{user_id}")
async def get_dashboard(user_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get complete dashboard data for a user.
    
    Aggregates data from all modules into a single response.
    
    Returns:
        Complete dashboard data
    """
    try:
        # Verify user can access this dashboard
        current_id = str(current_user.get("_id") or current_user.get("id"))
        if current_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Get dashboard data from service
        dashboard = await dashboard_service.get_dashboard_data(user_id)
        
        return dashboard
        
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching dashboard: {str(e)}"
        )


@router.get("/dashboard/{user_id}/quick-stats")
async def get_quick_stats(user_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get quick statistics for dashboard widgets.
    
    Returns:
        Quick stats summary
    """
    try:
        current_id = str(current_user.get("_id") or current_user.get("id"))
        if current_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Get dashboard data
        dashboard = await dashboard_service.get_dashboard_data(user_id)
        
        return {
            "xp": dashboard.get("profile", {}).get("xp", 0),
            "level": dashboard.get("profile", {}).get("level", 1),
            "labs_completed": dashboard.get("learning", {}).get("labs_completed", 0),
            "quizzes_completed": dashboard.get("learning", {}).get("quizzes_attempted", 0),
            "scans_completed": dashboard.get("security", {}).get("total_scans", 0),
            "achievements": len(dashboard.get("achievements", [])),
            "streak_days": 0  # TODO: Implement streak tracking
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching quick stats: {str(e)}"
        )


