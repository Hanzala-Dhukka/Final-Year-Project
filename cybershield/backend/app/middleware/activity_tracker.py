"""
Activity tracking middleware for auto-logout after inactivity.
"""
from datetime import datetime, timezone, timedelta
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from app.repositories.session_repository import session_repository
from app.repositories.refresh_token_repository import refresh_token_repository
from app.config.settings import settings


class ActivityTrackerMiddleware(BaseHTTPMiddleware):
    """
    Middleware to track user activity and handle auto-logout after inactivity.
    
    Features:
    - Updates last_activity timestamp on each request
    - Checks if session has expired (30 minutes of inactivity)
    - Automatically logs out expired sessions
    """
    
    def __init__(self, app, inactivity_timeout: int = 30):
        """
        Initialize middleware.
        
        Args:
            app: FastAPI app instance
            inactivity_timeout: Minutes of inactivity before logout (default: 30)
        """
        super().__init__(app)
        self.inactivity_timeout = inactivity_timeout
    
    async def dispatch(self, request: Request, call_next):
        """
        Process each request and track activity.
        
        Args:
            request: FastAPI request
            call_next: Next middleware/endpoint
            
        Returns:
            Response from next endpoint
        """
        # Skip activity tracking for certain paths
        path = request.url.path
        if self._should_skip_tracking(path):
            return await call_next(request)
        
        # Get user from request state (set by auth middleware)
        user = getattr(request.state, "user", None)
        
        if user:
            user_id = str(user.get("_id"))
            
            # Check session activity
            session_expired = await self._check_session_activity(user_id)
            
            if session_expired:
                # Session expired - return 401 to trigger re-authentication
                raise HTTPException(
                    status_code=401,
                    detail="Session expired due to inactivity. Please login again."
                )
        
        # Process the request
        response = await call_next(request)
        
        # Update activity after successful request
        if user and response.status_code < 400:
            await self._update_activity(user_id)
        
        return response
    
    async def _check_session_activity(self, user_id: str) -> bool:
        """
        Check if user session has expired due to inactivity.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            True if session expired, False otherwise
        """
        try:
            sessions = session_repository.get_user_sessions(user_id)
            
            for session in sessions:
                if not session.get("active"):
                    continue
                
                last_activity = session.get("last_activity")
                if not last_activity:
                    continue
                
                # Calculate time difference
                time_diff = datetime.now(timezone.utc) - last_activity
                minutes_inactive = int(time_diff.total_seconds() / 60)
                
                # Check if session expired
                if minutes_inactive >= self.inactivity_timeout:
                    # Auto-logout: close session and revoke tokens
                    session_id = str(session["_id"])
                    session_repository.close_session(session_id)
                    refresh_token_repository.revoke_all_user_tokens(user_id)
                    return True
            
            return False
            
        except Exception as e:
            print(f"Error checking session activity: {e}")
            return False
    
    async def _update_activity(self, user_id: str):
        """
        Update last activity timestamp for user's active sessions.
        
        Args:
            user_id: User's MongoDB ObjectId as string
        """
        try:
            sessions = session_repository.get_user_sessions(user_id)
            
            for session in sessions:
                if session.get("active"):
                    session_id = str(session["_id"])
                    session_repository.update_session_activity(session_id)
        except Exception as e:
            print(f"Error updating activity: {e}")
    
    def _should_skip_tracking(self, path: str) -> bool:
        """
        Check if path should skip activity tracking.
        
        Args:
            path: Request path
            
        Returns:
            True if should skip, False otherwise
        """
        # Skip tracking for auth endpoints
        skip_paths = [
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/auth/logout",
            "/api/v1/auth/register",
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json"
        ]
        
        return any(path.startswith(skip_path) for skip_path in skip_paths)


def cleanup_inactive_sessions_task():
    """
    Background task to cleanup inactive sessions.
    This should be run periodically (e.g., every 30 minutes).
    """
    try:
        # Cleanup sessions inactive for more than 30 minutes
        cleaned_count = session_repository.cleanup_inactive_sessions(timeout_minutes=30)
        print(f"Cleaned up {cleaned_count} inactive sessions")
        return cleaned_count
    except Exception as e:
        print(f"Error cleaning up inactive sessions: {e}")
        return 0