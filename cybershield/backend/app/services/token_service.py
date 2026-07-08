"""
Token service for generating and managing password reset tokens.
"""
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional
from app.models.reset_token_model import PasswordResetToken
from app.repositories.reset_token_repository import reset_token_repository
from app.repositories.user_repository import user_repository


class TokenService:
    """Service for token operations."""
    
    @staticmethod
    def generate_secure_token(length: int = 32) -> str:
        """
        Generate a cryptographically secure random token.
        
        Args:
            length: Token length in bytes (default: 32)
            
        Returns:
            URL-safe base64 encoded token
        """
        return secrets.token_urlsafe(length)
    
    @staticmethod
    async def create_password_reset_token(user_id: str, expires_in_minutes: int = 15) -> Optional[str]:
        """
        Create a password reset token for a user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            expires_in_minutes: Token expiration time in minutes (default: 15)
            
        Returns:
            Reset token if successful, None otherwise
        """
        try:
            # Invalidate any existing tokens for this user
            await reset_token_repository.invalidate_user_tokens(user_id)
            
            # Generate new token
            token = TokenService.generate_secure_token()
            
            # Store token in database
            token_id = await reset_token_repository.create_reset_token(
                user_id=user_id,
                token=token,
                expires_in_minutes=expires_in_minutes
            )
            
            if token_id:
                return token
            return None
            
        except Exception as e:
            print(f"Error creating password reset token: {e}")
            return None
    
    @staticmethod
    async def verify_reset_token(token: str) -> Optional[dict]:
        """
        Verify a password reset token.
        
        Args:
            token: Reset token string
            
        Returns:
            Token document if valid, None otherwise
        """
        try:
            # Get valid token from database
            reset_token = await reset_token_repository.get_valid_token(token)
            
            if not reset_token:
                return None
            
            return reset_token
            
        except Exception as e:
            print(f"Error verifying reset token: {e}")
            return None
    
    @staticmethod
    async def use_reset_token(token: str) -> bool:
        """
        Mark a reset token as used.
        
        Args:
            token: Reset token string
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Get token document
            reset_token = await reset_token_repository.get_valid_token(token)
            
            if not reset_token:
                return False
            
            # Mark as used
            token_id = str(reset_token["_id"])
            return await reset_token_repository.mark_token_as_used(token_id)
            
        except Exception as e:
            print(f"Error using reset token: {e}")
            return False
    
    @staticmethod
    async def cleanup_expired_tokens() -> int:
        """
        Clean up expired reset tokens.
        
        Returns:
            Number of tokens deleted
        """
        try:
            return await reset_token_repository.cleanup_expired_tokens()
        except Exception as e:
            print(f"Error cleaning up expired tokens: {e}")
            return 0


# Create singleton instance
token_service = TokenService()