"""
Refresh token service for token management.
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from app.utils.security import create_refresh_token, verify_token
from app.repositories.refresh_token_repository import refresh_token_repository
from app.repositories.session_repository import session_repository
from app.repositories.user_repository import user_repository
from app.config.settings import settings


class RefreshService:
    """Service for refresh token operations."""
    
    def __init__(self):
        self.refresh_repo = refresh_token_repository
        self.session_repo = session_repository
    
    def create_refresh_token_for_user(self, user_id: str, device: Optional[str] = None, 
                                     ip_address: Optional[str] = None) -> Optional[str]:
        """
        Create a new refresh token for a user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            device: Device information
            ip_address: User's IP address
            
        Returns:
            Plain refresh token if successful, None otherwise
        """
        try:
            # Create JWT refresh token
            token_data = {
                "sub": user_id,
                "type": "refresh"
            }
            plain_token = create_refresh_token(token_data)
            
            # Calculate expiry
            expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
            
            # Store in database
            from app.models.refresh_token_model import RefreshTokenCreate
            token_create = RefreshTokenCreate(
                user_id=user_id,
                token_hash=plain_token,
                device=device,
                ip_address=ip_address,
                expires_at=expires_at
            )
            
            self.refresh_repo.create_refresh_token(token_create)
            
            return plain_token
        except Exception as e:
            print(f"Error creating refresh token: {e}")
            return None
    
    def refresh_access_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """
        Generate a new access token using refresh token.
        
        Args:
            refresh_token: Plain refresh token
            
        Returns:
            Dict with new access token and expiry, or None if invalid
        """
        try:
            # Verify refresh token
            payload = verify_token(refresh_token, token_type="refresh")
            if not payload:
                return None
            
            user_id = payload.get("sub")
            if not user_id:
                return None
            
            # Check if token exists in database and is not revoked
            token_doc = self.refresh_repo.get_token_by_hash(refresh_token)
            if not token_doc:
                return None
            
            # Check expiry
            expires_at = token_doc.get("expires_at")
            if expires_at and expires_at < datetime.now(timezone.utc):
                return None
            
            # Get user
            user = user_repository.get_user_by_id(user_id)
            if not user:
                return None
            
            # Generate new access token
            access_token_data = {
                "sub": user["email"],
                "user_id": user_id,
                "role": user.get("role", "student")
            }
            new_access_token = create_refresh_token(access_token_data, 
                expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
            
            # Update last_used timestamp
            self.refresh_repo.update_last_used(str(token_doc["_id"]))
            
            # Update session activity
            session = self.session_repo.get_session_by_token_hash(refresh_token)
            if session:
                self.session_repo.update_session_activity(str(session["_id"]))
            
            return {
                "access_token": new_access_token,
                "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
            }
            
        except Exception as e:
            print(f"Error refreshing access token: {e}")
            return None
    
    def revoke_refresh_token(self, refresh_token: str) -> bool:
        """
        Revoke a refresh token.
        
        Args:
            refresh_token: Plain refresh token
            
        Returns:
            True if successful, False otherwise
        """
        try:
            return self.refresh_repo.revoke_token(refresh_token)
        except Exception as e:
            print(f"Error revoking refresh token: {e}")
            return False
    
    def revoke_all_user_tokens(self, user_id: str) -> bool:
        """
        Revoke all refresh tokens for a user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            True if successful, False otherwise
        """
        try:
            return self.refresh_repo.revoke_all_user_tokens(user_id)
        except Exception as e:
            print(f"Error revoking all user tokens: {e}")
            return False


# Create singleton instance
refresh_service = RefreshService()