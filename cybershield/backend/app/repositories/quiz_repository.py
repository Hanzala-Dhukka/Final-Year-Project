"""
Quiz repository for MongoDB operations.
Contains all database operations for quiz sessions and results.
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from bson import ObjectId
from pymongo.collection import Collection

from app.core.database import get_collection


class QuizRepository:
    """Repository for quiz attempt database operations."""

    def __init__(self):
        self.collection_name = "quiz_attempts"

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
            collection = get_collection(self.collection_name)
            attempts = []
            cursor = collection.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
            async for attempt in cursor:
                attempt["_id"] = str(attempt["_id"])
                attempts.append(attempt)
            return attempts
        except Exception as e:
            print(f"Error getting quiz attempts: {e}")
            return []


class QuizSessionRepository:
    """Repository class for quiz session database operations."""
    
    def __init__(self):
        self._collection: Optional[Collection] = None
    
    def _get_collection(self) -> Collection:
        """Get the quiz_sessions collection."""
        if self._collection is None:
            self._collection = get_collection("quiz_sessions")
        return self._collection
    
    def create_session(self, session_data: Dict[str, Any]) -> str:
        """Create a new quiz session."""
        collection = self._get_collection()
        session_data["created_at"] = datetime.now(timezone.utc)
        result = collection.insert_one(session_data)
        return str(result.inserted_id)
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get a session by ID."""
        collection = self._get_collection()
        try:
            return collection.find_one({"_id": ObjectId(session_id)})
        except Exception:
            return None
    
    def get_user_sessions(self, user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all sessions for a user."""
        collection = self._get_collection()
        sessions = list(collection.find({"user_id": user_id}).sort("created_at", -1).limit(limit))
        for session in sessions:
            session["_id"] = str(session["_id"])
        return sessions
    
    def update_session(self, session_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a session."""
        collection = self._get_collection()
        update_data["updated_at"] = datetime.now(timezone.utc)
        try:
            result = collection.update_one(
                {"_id": ObjectId(session_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception:
            return False


class QuizResultRepository:
    """Repository class for quiz result database operations."""
    
    def __init__(self):
        self._collection: Optional[Collection] = None
    
    def _get_collection(self) -> Collection:
        """Get the quiz_attempts collection."""
        if self._collection is None:
            self._collection = get_collection("quiz_attempts")
        return self._collection
    
    def create_result(self, result_data: Dict[str, Any]) -> str:
        """Create a new quiz result."""
        collection = self._get_collection()
        result_data["created_at"] = datetime.now(timezone.utc)
        result = collection.insert_one(result_data)
        return str(result.inserted_id)
    
    def get_user_results(self, user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all results for a user."""
        collection = self._get_collection()
        results = list(collection.find({"user_id": user_id}).sort("created_at", -1).limit(limit))
        for result in results:
            result["_id"] = str(result["_id"])
        return results


# Create singleton instances
quiz_session_repository = QuizSessionRepository()
quiz_result_repository = QuizResultRepository()
quiz_repository = QuizRepository()
