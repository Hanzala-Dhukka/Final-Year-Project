"""
Dashboard routes for aggregating all user data in one place.
"""
from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any
import traceback
from app.utils.security import get_current_user
from app.services import dashboard_service
from app.schemas.dashboard_schema import DashboardResponse

router = APIRouter()


def _extract_user_id(current_user: dict) -> str:
    """Extract the user id string from the JWT payload."""
    raw = current_user.get("_id") or current_user.get("id") or current_user.get("sub")
    return str(raw) if raw is not None else ""


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    """
    Get complete dashboard data for the authenticated user.

    Aggregates data from all modules into a single response.

    Returns:
        Complete dashboard data
    """
    try:
        user_id = _extract_user_id(current_user)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not identify user from token"
            )

        dashboard = await dashboard_service.get_dashboard(user_id)
        return dashboard

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching dashboard: {str(e)}"
        )


@router.get("/dashboard/quick-stats")
async def get_quick_stats(current_user: dict = Depends(get_current_user)):
    """
    Get quick statistics for dashboard widgets.

    Returns:
        Quick stats summary
    """
    try:
        user_id = _extract_user_id(current_user)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not identify user from token"
            )

        dashboard = await dashboard_service.get_dashboard(user_id)

        return {
            "xp": dashboard.get("user", {}).get("xp", 0),
            "level": dashboard.get("user", {}).get("level", 1),
            "labs_completed": dashboard.get("learning_progress", {}).get("owasp", 0),
            "quizzes_completed": dashboard.get("quiz_progress", {}).get("completed_quizzes", 0),
            "scans_completed": dashboard.get("stats", {}).get("total_scans", 0),
            "achievements": len(dashboard.get("recent_activity", [])),
            "streak_days": 0
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching quick stats: {str(e)}"
        )
