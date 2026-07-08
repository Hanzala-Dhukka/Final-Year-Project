from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from bson import ObjectId
from typing import Optional

from app.dependencies.admin_auth import admin_required
from app.services.admin_service import admin_service
from app.services.audit_service import log_action

router = APIRouter()


# GET ALL USERS
@router.get("/users")
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user = Depends(admin_required)
):
    """
    Get all users with pagination.
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        Dictionary with total count and users list
    """
    try:
        result = admin_service.get_all_users(skip, limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")


# SEARCH USERS
@router.get("/users/search")
async def search_users(
    query: str = Query(..., min_length=1),
    current_user = Depends(admin_required)
):
    """
    Search users by name, email, or role.
    
    Args:
        query: Search query string
        
    Returns:
        List of matching users
    """
    try:
        users = admin_service.search_users(query)
        return {
            "query": query,
            "count": len(users),
            "users": users
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


# CHANGE USER ROLE
@router.put("/users/{user_id}/role")
async def change_user_role(
    user_id: str,
    role_data: dict,
    current_user = Depends(admin_required)
):
    """
    Change a user's role.
    
    Args:
        user_id: User's MongoDB ObjectId as string
        role_data: Dictionary containing new role
        
    Returns:
        Success message
    """
    try:
        new_role = role_data.get("role")
        if not new_role:
            raise HTTPException(status_code=400, detail="Role is required")
        
        result = admin_service.change_user_role(
            user_id=user_id,
            new_role=new_role,
            admin_id=current_user.get("id") or current_user.get("_id"),
            admin_username=current_user.get("username", "admin")
        )
        
        if result["success"]:
            return {"message": result["message"]}
        else:
            raise HTTPException(status_code=400, detail=result["message"])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update role: {str(e)}")


# CHANGE USER STATUS
@router.put("/users/{user_id}/status")
async def change_user_status(
    user_id: str,
    status_data: dict,
    current_user = Depends(admin_required)
):
    """
    Change a user's account status.
    
    Args:
        user_id: User's MongoDB ObjectId as string
        status_data: Dictionary containing new status
        
    Returns:
        Success message
    """
    try:
        new_status = status_data.get("status")
        if not new_status:
            raise HTTPException(status_code=400, detail="Status is required")
        
        result = admin_service.change_user_status(
            user_id=user_id,
            new_status=new_status,
            admin_id=current_user.get("id") or current_user.get("_id"),
            admin_username=current_user.get("username", "admin")
        )
        
        if result["success"]:
            return {"message": result["message"]}
        else:
            raise HTTPException(status_code=400, detail=result["message"])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update status: {str(e)}")


# DELETE USER
@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user = Depends(admin_required)
):
    """
    Delete a user and create audit log.
    
    Args:
        user_id: User's MongoDB ObjectId as string
        
    Returns:
        Success message
    """
    try:
        result = admin_service.delete_user(
            user_id=user_id,
            admin_id=current_user.get("id") or current_user.get("_id"),
            admin_username=current_user.get("username", "admin")
        )
        
        if result["success"]:
            return {"message": result["message"]}
        else:
            raise HTTPException(status_code=400, detail=result["message"])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")


# GET USER ACTIVITY
@router.get("/users/{user_id}/activity")
async def get_user_activity(
    user_id: str,
    current_user = Depends(admin_required)
):
    """
    Get user activity summary.
    
    Args:
        user_id: User's MongoDB ObjectId as string
        
    Returns:
        User activity data
    """
    try:
        activity = admin_service.get_user_activity(user_id)
        if not activity:
            raise HTTPException(status_code=404, detail="User not found")
        return activity
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch activity: {str(e)}")


# GET PLATFORM STATISTICS
@router.get("/statistics")
async def get_platform_statistics(current_user = Depends(admin_required)):
    """
    Get platform-wide statistics.
    
    Returns:
        Dictionary with platform statistics
    """
    try:
        stats = admin_service.get_platform_statistics()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch statistics: {str(e)}")


# GET SECURITY MONITORING
@router.get("/security-monitoring")
async def get_security_monitoring(current_user = Depends(admin_required)):
    """
    Get security monitoring data.
    
    Returns:
        Dictionary with security monitoring data
    """
    try:
        monitoring = admin_service.get_security_monitoring()
        return monitoring
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch monitoring data: {str(e)}")


# GET RECENT ACTIVITIES
@router.get("/activities")
async def get_recent_activities(
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(admin_required)
):
    """
    Get recent platform activities.
    
    Args:
        limit: Maximum number of activities to return
        
    Returns:
        List of recent activities
    """
    try:
        activities = admin_service.get_recent_activities(limit)
        return {
            "count": len(activities),
            "activities": activities
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch activities: {str(e)}")


# GET DASHBOARD DATA
@router.get("/dashboard")
async def get_admin_dashboard(current_user = Depends(admin_required)):
    """
    Get all dashboard data in one request.
    
    Returns:
        Dictionary with all dashboard data
    """
    try:
        # Get statistics
        statistics = admin_service.get_platform_statistics()
        
        # Get security monitoring
        security_monitoring = admin_service.get_security_monitoring()
        
        # Get recent activities
        recent_activities = admin_service.get_recent_activities(10)
        
        # Get recent users
        recent_users_result = admin_service.get_all_users(0, 5)
        
        return {
            "statistics": statistics,
            "security_monitoring": security_monitoring,
            "recent_activities": recent_activities,
            "recent_users": recent_users_result.get("users", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard data: {str(e)}")