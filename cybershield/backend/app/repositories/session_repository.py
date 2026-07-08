"""
Session repository for MongoDB operations.
"""
from datetime import datetime, timezone
from typing import Optional, List
from bson import ObjectId
from app.core.database import get_collection
from app.models.refresh_token_model import SessionInDB


class SessionRepository:
    """Repository for session database operations."""
    
    def __init__(self):
        self.collection_name = "sessions"
    
    def create_session(self, session_data: SessionInDB) -> Optional[str]:
        """
        Create a new session in database.
        
        Args:
            session_data: Session data
            
        Returns:
            Session ID if successful, None otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            
            session_dict = session_data.model_dump()
            result = collection.insert_one(session_dict)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error creating session: {e}")
            return None
    
    def get_user_sessions(self, user_id: str) -> List[dict]:
        """
        Get all active sessions for a user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            List of session documents
        """
        try:
            collection = get_collection(self.collection_name)
            
            sessions = collection.find({
                "user_id": user_id,
                "active": True
            }).sort("login_time", -1)
            
            return list(sessions)
        except Exception as e:
            print(f"Error getting user sessions: {e}")
            return []
    
    def get_session_by_id(self, session_id: str) -> Optional[dict]:
        """
        Get session by ID.
        
        Args:
            session_id: Session's MongoDB ObjectId as string
            
        Returns:
            Session document if found, None otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            
            session = collection.find_one({"_id": ObjectId(session_id)})
            return session
        except Exception as e:
            print(f"Error getting session: {e}")
            return None
    
    def close_session(self, session_id: str) -> bool:
        """
        Close a session (logout).
        
        Args:
            session_id: Session's MongoDB ObjectId as string
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            
            result = collection.update_one(
                {"_id": ObjectId(session_id)},
                {
                    "$set": {
                        "active": False,
                        "logout_time": datetime.now(timezone.utc)
                    }
                }
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error closing session: {e}")
            return False
    
    def close_all_user_sessions(self, user_id: str) -> bool:
        """
        Close all active sessions for a user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            
            result = collection.update_many(
                {"user_id": user_id, "active": True},
                {
                    "$set": {
                        "active": False,
                        "logout_time": datetime.now(timezone.utc)
                    }
                }
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error closing all user sessions: {e}")
            return False
    
    def update_session_activity(self, session_id: str) -> bool:
        """
        Update last activity timestamp for a session.
        
        Args:
            session_id: Session's MongoDB ObjectId as string
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            
            result = collection.update_one(
                {"_id": ObjectId(session_id)},
                {"$set": {"last_activity": datetime.now(timezone.utc)}}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating session activity: {e}")
            return False
    
    def cleanup_inactive_sessions(self, timeout_minutes: int = 30) -> int:
        """
        Mark sessions as inactive if last activity exceeds timeout.
        
        Args:
            timeout_minutes: Minutes of inactivity before marking inactive
            
        Returns:
            Number of sessions marked as inactive
        """
        try:
            collection = get_collection(self.collection_name)
            
            cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=timeout_minutes)
            
            result = collection.update_many(
                {
                    "active": True,
                    "last_activity": {"$lt": cutoff_time}
                },
                {
                    "$set": {
                        "active": False,
                        "logout_time": datetime.now(timezone.utc)
                    }
                }
            )
            
            return result.modified_count
        except Exception as e:
            print(f"Error cleaning up inactive sessions: {e}")
            return 0
    
    def get_session_by_token_hash(self, token_hash: str) -> Optional[dict]:
        """
        Get session associated with a refresh token hash.
        
        Args:
            token_hash: Hashed refresh token
            
        Returns:
            Session document if found, None otherwise
        """
        try:
            # Import here to avoid circular dependency
            from app.repositories.refresh_token_repository import refresh_token_repository
            
            # Get token by hash
            token = refresh_token_repository.get_token_by_hash(token_hash)
            if not token:
                return None
            
            # Get session by user_id and active status
            collection = get_collection(self.collection_name)
            session = collection.find_one({
                "user_id": token.get("user_id"),
                "active": True
            })
            
            return session
        except Exception as e:
            print(f"Error getting session by token hash: {e}")
            return None


# Create singleton instance
session_repository = SessionRepository()