"""
Profile routes for user profile management.
"""
from fastapi import APIRouter, HTTPException, Depends, status
from typing import Optional
from app.models.user_model import UserResponse
from app.schemas.profile_schema import (
    ProfileUpdate,
    SettingsUpdate,
    PasswordChange,
    UserProfileResponse,
    SecurityScoreResponse,
    LoginHistoryResponse
)
from app.services.profile_service import profile_service
from app.services.security_score_service import security_score_service
from app.utils.security import get_current_user

router = APIRouter()


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """
    Get current user's profile with statistics.
    
    Returns:
        User profile data with statistics
    """
    try:
        user_id = str(current_user["_id"])
        profile_data = await profile_service.get_user_profile(user_id)
        
        if not profile_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        return UserProfileResponse(**profile_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching profile: {str(e)}"
        )


@router.put("/profile/update")
async def update_profile(profile_data: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    """
    Update user profile.
    
    Args:
        profile_data: Profile update data
        
    Returns:
        Success message
    """
    try:
        user_id = str(current_user["_id"])
        
        success = await profile_service.update_profile(user_id, profile_data.model_dump())
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update profile"
            )
        
        return {"message": "Profile updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating profile: {str(e)}"
        )


@router.get("/profile/settings")
async def get_settings(current_user: dict = Depends(get_current_user)):
    """
    Get user settings.
    
    Returns:
        User settings
    """
    try:
        user_id = str(current_user["_id"])
        settings = await profile_service.get_user_settings(user_id)
        
        if not settings:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Settings not found"
            )
        
        return settings
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching settings: {str(e)}"
        )


@router.put("/profile/settings")
async def update_settings(settings_data: SettingsUpdate, current_user: dict = Depends(get_current_user)):
    """
    Update user settings.
    
    Args:
        settings_data: Settings update data
        
    Returns:
        Success message
    """
    try:
        user_id = str(current_user["_id"])
        
        # Filter out None values
        update_data = {k: v for k, v in settings_data.model_dump().items() if v is not None}
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No settings to update"
            )
        
        success = await profile_service.update_user_settings(user_id, update_data)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update settings"
            )
        
        return {"message": "Settings updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating settings: {str(e)}"
        )


@router.post("/profile/change-password")
async def change_password(password_data: PasswordChange, current_user: dict = Depends(get_current_user)):
    """
    Change user password.
    
    Args:
        password_data: Password change data
        
    Returns:
        Success message
    """
    try:
        user_id = str(current_user["_id"])
        
        success, message = await profile_service.change_password(
            user_id,
            password_data.old_password,
            password_data.new_password
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        return {"message": message}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error changing password: {str(e)}"
        )


@router.get("/profile/activity", response_model=dict)
async def get_activity(current_user: dict = Depends(get_current_user)):
    """
    Get user login activity history.
    
    Returns:
        Login activity data
    """
    try:
        user_id = str(current_user["_id"])
        
        # Get login history
        login_history = await profile_service.get_login_history(user_id, limit=50)
        
        # Format response
        recent_logins = []
        for entry in login_history:
            recent_logins.append({
                "id": str(entry["_id"]),
                "device": entry.get("device", "Unknown"),
                "ip_address": entry.get("ip_address", "Unknown"),
                "location": entry.get("location"),
                "login_time": entry.get("login_time"),
                "status": entry.get("status", "success")
            })
        
        # Get unique devices and locations
        devices_used = list(set(entry.get("device") for entry in login_history))
        locations = list(set(entry.get("location") for entry in login_history if entry.get("location")))
        
        return {
            "total_logins": len(login_history),
            "recent_logins": recent_logins,
            "devices_used": devices_used,
            "locations": locations,
            "last_login": login_history[0].get("login_time") if login_history else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching activity: {str(e)}"
        )


@router.get("/profile/security-score", response_model=SecurityScoreResponse)
async def get_security_score(current_user: dict = Depends(get_current_user)):
    """
    Get user security score.
    
    Returns:
        Security score data
    """
    try:
        user_id = str(current_user["_id"])
        
        score_data = await security_score_service.get_security_score(user_id)
        
        if not score_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Security score not found"
            )
        
        return SecurityScoreResponse(**score_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching security score: {str(e)}"
        )


@router.post("/profile/security-score/calculate")
async def calculate_security_score(current_user: dict = Depends(get_current_user)):
    """
    Recalculate user security score.
    
    Returns:
        Updated security score
    """
    try:
        user_id = str(current_user["_id"])
        
        score_data = await security_score_service.calculate_security_score(user_id)
        
        if not score_data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to calculate security score"
            )
        
        return SecurityScoreResponse(**score_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating security score: {str(e)}"
        )