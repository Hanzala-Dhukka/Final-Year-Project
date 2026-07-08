"""
Session management routes.
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import List
from app.repositories.session_repository import session_repository
from app.repositories.refresh_token_repository import refresh_token_repository
from app.dependencies.auth import get_current_user
from app.models.refresh_token_model import SessionResponse

router = APIRouter()


@router.get("/session/list", response_model=List[SessionResponse])
async def get_active_sessions(current_user: dict = Depends(get_current_user)):
    """
    Get all active sessions for the current user.
    
    Returns:
        List of active sessions with device info and last activity
    """
    try:
        user_id = str(current_user["_id"])
        sessions = session_repository.get_user_sessions(user_id)
        
        session_responses = []
        for session in sessions:
            session_responses.append(SessionResponse(
                id=str(session["_id"]),
                device=session.get("device", "Unknown Device"),
                location=session.get("location"),
                ip_address=session.get("ip_address"),
                login_time=session.get("login_time"),
                last_activity=session.get("last_activity"),
                active=session.get("active", True)
            ))
        
        return session_responses
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching sessions: {str(e)}"
        )


@router.delete("/session/{session_id}")
async def logout_session(session_id: str, current_user: dict = Depends(get_current_user)):
    """
    Logout from a specific session (device).
    
    Args:
        session_id: Session ID to logout
        
    Returns:
        Success message
    """
    try:
        user_id = str(current_user["_id"])
        
        # Verify session belongs to user
        session = session_repository.get_session_by_id(session_id)
        if not session or session.get("user_id") != user_id:
            raise HTTPException(
                status_code=404,
                detail="Session not found"
            )
        
        # Close session
        success = session_repository.close_session(session_id)
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to close session"
            )
        
        # Revoke associated refresh token
        tokens = refresh_token_repository.get_user_tokens(user_id)
        for token in tokens:
            if token.get("device") == session.get("device"):
                refresh_token_repository.revoke_token(token.get("token_hash"))
        
        return {
            "message": "Session closed successfully",
            "session_id": session_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error closing session: {str(e)}"
        )


@router.post("/session/logout-all")
async def logout_all_sessions(current_user: dict = Depends(get_current_user)):
    """
    Logout from all sessions (all devices).
    
    Returns:
        Success message
    """
    try:
        user_id = str(current_user["_id"])
        
        # Close all sessions
        session_repository.close_all_user_sessions(user_id)
        
        # Revoke all refresh tokens
        refresh_token_repository.revoke_all_user_tokens(user_id)
        
        return {
            "message": "All sessions closed successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error closing all sessions: {str(e)}"
        )


@router.get("/session/activity")
async def get_session_activity(current_user: dict = Depends(get_current_user)):
    """
    Get current session activity status.
    
    Returns:
        Session activity information
    """
    try:
        user_id = str(current_user["_id"])
        sessions = session_repository.get_user_sessions(user_id)
        
        # Find the most recent active session
        active_session = None
        for session in sessions:
            if session.get("active"):
                active_session = session
                break
        
        if not active_session:
            return {
                "status": "inactive",
                "last_activity": None,
                "message": "No active session"
            }
        
        last_activity = active_session.get("last_activity")
        if last_activity:
            time_diff = datetime.now(timezone.utc) - last_activity
            minutes_inactive = int(time_diff.total_seconds() / 60)
            
            return {
                "status": "active" if minutes_inactive < 30 else "expired",
                "last_activity": last_activity,
                "minutes_inactive": minutes_inactive,
                "device": active_session.get("device"),
                "ip_address": active_session.get("ip_address")
            }
        
        return {
            "status": "unknown",
            "last_activity": None
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching session activity: {str(e)}"
        )