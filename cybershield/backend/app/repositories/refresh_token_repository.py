"""
Refresh token repository for MongoDB operations.
"""
from datetime import datetime, timezone
from typing import Optional, List
from bson import ObjectId
from app.core.database import get_collection
from app.models.refresh_token_model import RefreshTokenCreate, RefreshTokenInDB
import hashlib


class RefreshTokenRepository:
    """Repository for refresh token database operations."""
    
    def __init__(self):
        self.collection_name = "refresh_tokens"
    
    def _hash_token(self, token: str) -> str:
        """Hash a token for secure storage."""
        return hashlib.sha256(token.encode()).hexdigest()
    
    def create_refresh_token(self, token_data: RefreshTokenCreate) -> Optional[str]:
        """
        Create a new refresh token in database.
        
        Args:
            token_data: Refresh token data
            
        Returns:
            Token ID if successful, None otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            
            # Hash the token before storing
            token_dict = token_data.model_dump()
            token_dict["token_hash"] = self._hash_token(token_data.token_hash)
            
            result = collection.insert_one(token_dict)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error creating refresh token: {e}")
            return None
    
    def get_token_by_hash(self, token_hash: str) -> Optional[dict]:
        """
        Get refresh token by its hash.
        
        Args:
            token_hash: Hashed token string
            
        Returns:
            Token document if found, None otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            hashed_token = self._hash_token(token_hash)
            
            token_doc = collection.find_one({
                "token_hash": hashed_token,
                "is_revoked": False
            })
            
            return token_doc
        except Exception as e:
            print(f"Error getting refresh token: {e}")
            return None
    
    def revoke_token(self, token_hash: str) -> bool:
        """
        Revoke a refresh token.
        
        Args:
            token_hash: Hashed token string
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            hashed_token = self._hash_token(token_hash)
            
            result = collection.update_one(
                {"token_hash": hashed_token},
                {
                    "$set": {
                        "is_revoked": True,
                        "revoked_at": datetime.now(timezone.utc)
                    }
                }
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error revoking token: {e}")
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
            collection = get_collection(self.collection_name)
            
            result = collection.update_many(
                {"user_id": user_id, "is_revoked": False},
                {
                    "$set": {
                        "is_revoked": True,
                        "revoked_at": datetime.now(timezone.utc)
                    }
                }
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error revoking all user tokens: {e}")
            return False
    
    def update_last_used(self, token_id: str) -> bool:
        """
        Update the last_used timestamp for a token.
        
        Args:
            token_id: Token's MongoDB ObjectId as string
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            
            result = collection.update_one(
                {"_id": ObjectId(token_id)},
                {"$set": {"last_used": datetime.now(timezone.utc)}}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating last_used: {e}")
            return False
    
    def get_user_tokens(self, user_id: str) -> List[dict]:
        """
        Get all active tokens for a user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            List of token documents
        """
        try:
            collection = get_collection(self.collection_name)
            
            tokens = collection.find({
                "user_id": user_id,
                "is_revoked": False,
                "expires_at": {"$gt": datetime.now(timezone.utc)}
            }).sort("created_at", -1)
            
            return list(tokens)
        except Exception as e:
            print(f"Error getting user tokens: {e}")
            return []
    
    def cleanup_expired_tokens(self) -> int:
        """
        Delete expired tokens from database.
        
        Returns:
            Number of tokens deleted
        """
        try:
            collection = get_collection(self.collection_name)
            
            result = collection.delete_many({
                "expires_at": {"$lt": datetime.now(timezone.utc)}
            })
            
            return result.deleted_count
        except Exception as e:
            print(f"Error cleaning up expired tokens: {e}")
            return 0


# Create singleton instance
refresh_token_repository = RefreshTokenRepository()