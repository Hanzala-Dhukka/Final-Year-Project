"""
Session service for session management.
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from app.repositories.session_repository import session_repository
from app.repositories.refresh_token_repository import refresh_token_repository
from app.repositories.user_repository import user_repository
from app.models.refresh_token_model import SessionInDB, SessionResponse
from app.utils.security import create_access_token
from app.config.settings import settings


class SessionService:
    """Service for session management operations."""
    
    def __init__(self):
        self.session_repo = session_repository
        self.refresh_repo = refresh_token_repository
    
    def create_session(self, user_id: str, device: Optional[str] = None, 
                      ip_address: Optional[str] = None) -> Optional[str]:
        """
        Create a new session for a user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            device: Device information
            ip_address: User's IP address
            
        Returns:
            Session ID if successful, None otherwise
        """
        try:
            session_data = SessionInDB(
                user_id=user_id,
                login_time=datetime.now(timezone.utc),
                device=device,
                ip_address=ip_address,
                location=None,  # Can be enhanced with IP geolocation
                active=True,
                last_activity=datetime.now(timezone.utc)
            )
            
            return self.session_repo.create_session(session_data)
        except Exception as e:
            print(f"Error creating session: {e}")
            return None
    
    def get_user_sessions(self, user_id: str) -> List[SessionResponse]:
        """
        Get all active sessions for a user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            List of session response objects
        """
        try:
            sessions = self.session_repo.get_user_sessions(user_id)
            
            session_responses = []
            for session in sessions:
                session_responses.append(SessionResponse(
                    id=str(session["_id"]),
                    device=session.get("device"),
                    location=session.get("location"),
                    ip_address=session.get("ip_address"),
                    login_time=session.get("login_time"),
                    last_activity=session.get("last_activity"),
                    active=session.get("active", True)
                ))
            
            return session_responses
        except Exception as e:
            print(f"Error getting user sessions: {e}")
            return []
    
    def close_session(self, session_id: str, user_id: str) -> bool:
        """
        Close a specific session.
        
        Args:
            session_id: Session's MongoDB ObjectId as string
            user_id: User's MongoDB ObjectId as string (for verification)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Verify session belongs to user
            session = self.session_repo.get_session_by_id(session_id)
            if not session or session.get("user_id") != user_id:
                return False
            
            # Close session
            success = self.session_repo.close_session(session_id)
            
            # Revoke associated refresh token
            if success:
                # Find and revoke the refresh token for this session
                tokens = self.refresh_repo.get_user_tokens(user_id)
                for token in tokens:
                    if token.get("device") == session.get("device"):
                        self.refresh_repo.revoke_token(token.get("token_hash"))
            
            return success
        except Exception as e:
            print(f"Error closing session: {e}")
            return False
    
    def logout_user(self, user_id: str, refresh_token: Optional[str] = None) -> bool:
        """
        Logout user from all sessions or specific session.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            refresh_token: Optional specific refresh token to revoke
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if refresh_token:
                # Revoke specific refresh token
                self.refresh_repo.revoke_token(refresh_token)
            else:
                # Revoke all user tokens
                self.refresh_repo.revoke_all_user_tokens(user_id)
            
            # Close all active sessions
            self.session_repo.close_all_user_sessions(user_id)
            
            return True
        except Exception as e:
            print(f"Error logging out user: {e}")
            return False
    
    def cleanup_inactive_sessions(self, timeout_minutes: int = 30) -> int:
        """
        Clean up inactive sessions.
        
        Args:
            timeout_minutes: Minutes of inactivity before cleanup
            
        Returns:
            Number of sessions cleaned up
        """
        try:
            return self.session_repo.cleanup_inactive_sessions(timeout_minutes)
        except Exception as e:
            print(f"Error cleaning up inactive sessions: {e}")
            return 0
    
    def update_user_activity(self, user_id: str) -> bool:
        """
        Update user's last activity timestamp.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Update user's last_activity field
            user_repository.update_user(
                user_id,
                {"last_activity": datetime.now(timezone.utc)}
            )
            return True
        except Exception as e:
            print(f"Error updating user activity: {e}")
            return False
    
    def get_session_stats(self, user_id: str) -> Dict[str, Any]:
        """
        Get session statistics for a user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            Dict with session statistics
        """
        try:
            sessions = self.session_repo.get_user_sessions(user_id)
            
            active_sessions = sum(1 for s in sessions if s.get("active", False))
            total_sessions = len(sessions)
            
            # Get device breakdown
            devices = {}
            for session in sessions:
                device = session.get("device", "Unknown")
                devices[device] = devices.get(device, 0) + 1
            
            return {
                "total_sessions": total_sessions,
                "active_sessions": active_sessions,
                "devices": devices
            }
        except Exception as e:
            print(f"Error getting session stats: {e}")
            return {
                "total_sessions": 0,
                "active_sessions": 0,
                "devices": {}
            }


# Create singleton instance
session_service = SessionService()