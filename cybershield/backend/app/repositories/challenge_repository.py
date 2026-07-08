"""
Challenge repository for MongoDB operations.
Contains all database operations for daily challenges and user challenges.
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from bson import ObjectId
from pymongo.collection import Collection

from app.core.database import get_collection


class DailyChallengeRepository:
    """Repository class for daily challenge database operations."""
    
    def __init__(self):
        self._collection: Optional[Collection] = None
    
    def _get_collection(self) -> Collection:
        """Get the daily_challenges collection."""
        if self._collection is None:
            self._collection = get_collection("daily_challenges")
        return self._collection
    
    def create_challenge(self, challenge_data: Dict[str, Any]) -> str:
        """Create a new daily challenge."""
        collection = self._get_collection()
        challenge_data["created_at"] = datetime.now(timezone.utc)
        result = collection.insert_one(challenge_data)
        return str(result.inserted_id)
    
    def get_challenge(self, challenge_id: str) -> Optional[Dict[str, Any]]:
        """Get a challenge by ID."""
        collection = self._get_collection()
        try:
            return collection.find_one({"_id": ObjectId(challenge_id)})
        except Exception:
            return None
    
    def get_all_challenges(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all challenges."""
        collection = self._get_collection()
        challenges = list(collection.find({}).sort("created_at", -1).limit(limit))
        for challenge in challenges:
            challenge["_id"] = str(challenge["_id"])
        return challenges
    
    def get_challenge_by_date(self, date: str) -> Optional[Dict[str, Any]]:
        """Get a challenge by date."""
        collection = self._get_collection()
        return collection.find_one({"date": date})


class UserChallengeRepository:
    """Repository class for user challenge database operations."""
    
    def __init__(self):
        self._collection: Optional[Collection] = None
    
    def _get_collection(self) -> Collection:
        """Get the user_challenges collection."""
        if self._collection is None:
            self._collection = get_collection("user_challenges")
        return self._collection
    
    def create_user_challenge(self, user_challenge_data: Dict[str, Any]) -> str:
        """Create a new user challenge record."""
        collection = self._get_collection()
        user_challenge_data["created_at"] = datetime.now(timezone.utc)
        result = collection.insert_one(user_challenge_data)
        return str(result.inserted_id)
    
    def get_user_challenges(self, user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all challenges for a user."""
        collection = self._get_collection()
        challenges = list(collection.find({"user_id": user_id}).sort("created_at", -1).limit(limit))
        for challenge in challenges:
            challenge["_id"] = str(challenge["_id"])
        return challenges
    
    def get_user_challenge_by_date(self, user_id: str, date: str) -> Optional[Dict[str, Any]]:
        """Get a user's challenge for a specific date."""
        collection = self._get_collection()
        return collection.find_one({"user_id": user_id, "date": date})
    
    def update_user_challenge(self, user_challenge_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a user challenge."""
        collection = self._get_collection()
        update_data["updated_at"] = datetime.now(timezone.utc)
        try:
            result = collection.update_one(
                {"_id": ObjectId(user_challenge_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception:
            return False


# Create singleton instances
daily_challenge_repository = DailyChallengeRepository()
user_challenge_repository = UserChallengeRepository()