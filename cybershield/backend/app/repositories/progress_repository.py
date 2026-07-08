"""
Progress repository for MongoDB operations.
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from bson import ObjectId
from app.core.database import get_collection


class ProgressRepository:
    """Repository for progress database operations."""
    
    def __init__(self):
        self.collection_name = "progress"
    
    async def create_progress(self, progress_data: Dict[str, Any]) -> Optional[str]:
        """
        Create a new progress record.
        
        Args:
            progress_data: Progress data dictionary
            
        Returns:
            Progress ID if successful, None otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            
            # Add timestamps
            progress_data["created_at"] = datetime.now(timezone.utc)
            progress_data["updated_at"] = datetime.now(timezone.utc)
            
            result = await collection.insert_one(progress_data)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error creating progress: {e}")
            return None
    
    async def get_progress_by_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get progress by user ID.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            Progress document if found, None otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            progress = await collection.find_one({"user_id": user_id})
            return progress
        except Exception as e:
            print(f"Error getting progress by user: {e}")
            return None
    
    async def update_progress(self, user_id: str, update_data: Dict[str, Any]) -> bool:
        """
        Update progress data.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            update_data: Data to update
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            
            # Add updated timestamp
            update_data["updated_at"] = datetime.now(timezone.utc)
            
            result = await collection.update_one(
                {"user_id": user_id},
                {"$set": update_data}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating progress: {e}")
            return False
    
    async def add_xp(self, user_id: str, xp_amount: int) -> bool:
        """
        Add XP to user's progress.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            xp_amount: Amount of XP to add
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            
            result = await collection.update_one(
                {"user_id": user_id},
                {
                    "$inc": {"xp": xp_amount},
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                }
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error adding XP: {e}")
            return False
    
    async def create_quiz_attempt(self, attempt_data: Dict[str, Any]) -> Optional[str]:
        """
        Create a quiz attempt record.
        
        Args:
            attempt_data: Quiz attempt data
            
        Returns:
            Attempt ID if successful, None otherwise
        """
        try:
            collection = get_collection("quiz_attempts")
            
            # Add timestamp
            attempt_data["completed_at"] = datetime.now(timezone.utc)
            
            result = await collection.insert_one(attempt_data)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error creating quiz attempt: {e}")
            return None
    
    async def get_quiz_attempts_by_user(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get quiz attempts by user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            limit: Maximum number of attempts to return
            
        Returns:
            List of quiz attempt documents
        """
        try:
            collection = get_collection("quiz_attempts")
            attempts = []
            
            cursor = collection.find({"user_id": user_id}).sort("completed_at", -1).limit(limit)
            async for attempt in cursor:
                attempts.append(attempt)
            
            return attempts
        except Exception as e:
            print(f"Error getting quiz attempts: {e}")
            return []
    
    async def create_lab_attempt(self, attempt_data: Dict[str, Any]) -> Optional[str]:
        """
        Create a lab attempt record.
        
        Args:
            attempt_data: Lab attempt data
            
        Returns:
            Attempt ID if successful, None otherwise
        """
        try:
            collection = get_collection("lab_attempts")
            
            # Add timestamp
            attempt_data["started_at"] = datetime.now(timezone.utc)
            
            result = await collection.insert_one(attempt_data)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error creating lab attempt: {e}")
            return None
    
    async def update_lab_attempt(self, attempt_id: str, update_data: Dict[str, Any]) -> bool:
        """
        Update lab attempt.
        
        Args:
            attempt_id: Lab attempt's MongoDB ObjectId as string
            update_data: Data to update
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = get_collection("lab_attempts")
            
            result = await collection.update_one(
                {"_id": ObjectId(attempt_id)},
                {"$set": update_data}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating lab attempt: {e}")
            return False
    
    async def get_lab_attempts_by_user(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get lab attempts by user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            limit: Maximum number of attempts to return
            
        Returns:
            List of lab attempt documents
        """
        try:
            collection = get_collection("lab_attempts")
            attempts = []
            
            cursor = collection.find({"user_id": user_id}).sort("started_at", -1).limit(limit)
            async for attempt in cursor:
                attempts.append(attempt)
            
            return attempts
        except Exception as e:
            print(f"Error getting lab attempts: {e}")
            return []


# Create singleton instance
progress_repository = ProgressRepository()