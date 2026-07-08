"""
Password reset token repository for MongoDB operations.
"""
from datetime import datetime, timezone, timedelta
from typing import Optional
from bson import ObjectId
from app.core.database import get_collection
from app.models.reset_token_model import PasswordResetToken


class ResetTokenRepository:
    """Repository for password reset token database operations."""
    
    def __init__(self):
        self.collection_name = "password_reset_tokens"
    
    async def create_reset_token(self, user_id: str, token: str, expires_in_minutes: int = 15) -> Optional[str]:
        """
        Create a new password reset token.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            token: Secure random token
            expires_in_minutes: Token expiration time in minutes (default: 15)
            
        Returns:
            Token ID if successful, None otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=expires_in_minutes)
            
            reset_token = PasswordResetToken(
                user_id=user_id,
                token=token,
                expires_at=expires_at,
                used=False,
                created_at=datetime.now(timezone.utc)
            )
            
            result = await collection.insert_one(reset_token.model_dump())
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error creating reset token: {e}")
            return None
    
    async def get_valid_token(self, token: str) -> Optional[dict]:
        """
        Get a valid (non-expired, non-used) reset token.
        
        Args:
            token: Reset token string
            
        Returns:
            Token document if valid, None otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            
            # Find token that is not used and not expired
            reset_token = await collection.find_one({
                "token": token,
                "used": False,
                "expires_at": {"$gt": datetime.now(timezone.utc)}
            })
            
            return reset_token
        except Exception as e:
            print(f"Error getting reset token: {e}")
            return None
    
    async def mark_token_as_used(self, token_id: str) -> bool:
        """
        Mark a reset token as used.
        
        Args:
            token_id: Token's MongoDB ObjectId as string
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            
            result = await collection.update_one(
                {"_id": ObjectId(token_id)},
                {"$set": {"used": True, "used_at": datetime.now(timezone.utc)}}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error marking token as used: {e}")
            return False
    
    async def invalidate_user_tokens(self, user_id: str) -> bool:
        """
        Invalidate all reset tokens for a user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            
            result = await collection.update_many(
                {"user_id": user_id, "used": False},
                {"$set": {"used": True, "invalidated_at": datetime.now(timezone.utc)}}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error invalidating user tokens: {e}")
            return False
    
    async def cleanup_expired_tokens(self) -> int:
        """
        Delete expired reset tokens.
        
        Returns:
            Number of tokens deleted
        """
        try:
            collection = get_collection(self.collection_name)
            
            result = await collection.delete_many({
                "expires_at": {"$lt": datetime.now(timezone.utc)}
            })
            
            return result.deleted_count
        except Exception as e:
            print(f"Error cleaning up expired tokens: {e}")
            return 0


# Create singleton instance
reset_token_repository = ResetTokenRepository()