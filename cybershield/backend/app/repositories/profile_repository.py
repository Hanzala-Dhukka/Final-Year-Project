"""
Profile repository for MongoDB operations.
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from bson import ObjectId
from app.core.database import get_collection
from app.models.profile_model import UserProfile, UserSettings, LoginHistory, SecurityScore


class ProfileRepository:
    """Repository for user profile database operations."""
    
    def __init__(self):
        self.profile_collection = "user_profiles"
        self.settings_collection = "user_settings"
        self.login_history_collection = "login_history"
        self.security_score_collection = "security_score"
    
    # Profile operations
    async def get_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile."""
        try:
            collection = get_collection(self.profile_collection)
            profile = await collection.find_one({"user_id": user_id})
            return profile
        except Exception as e:
            print(f"Error getting profile: {e}")
            return None
    
    async def create_profile(self, profile_data: Dict[str, Any]) -> Optional[str]:
        """Create user profile."""
        try:
            collection = get_collection(self.profile_collection)
            profile_data["created_at"] = datetime.now(timezone.utc)
            profile_data["updated_at"] = datetime.now(timezone.utc)
            result = await collection.insert_one(profile_data)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error creating profile: {e}")
            return None
    
    async def update_profile(self, user_id: str, update_data: Dict[str, Any]) -> bool:
        """Update user profile."""
        try:
            collection = get_collection(self.profile_collection)
            update_data["updated_at"] = datetime.now(timezone.utc)
            result = await collection.update_one(
                {"user_id": user_id},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating profile: {e}")
            return False
    
    async def create_or_update_profile(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        """Create or update user profile."""
        existing = await self.get_profile(user_id)
        if existing:
            return await self.update_profile(user_id, profile_data)
        else:
            profile_data["user_id"] = user_id
            result = await self.create_profile(profile_data)
            return result is not None
    
    # Settings operations
    async def get_settings(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user settings."""
        try:
            collection = get_collection(self.settings_collection)
            settings = await collection.find_one({"user_id": user_id})
            return settings
        except Exception as e:
            print(f"Error getting settings: {e}")
            return None
    
    async def create_settings(self, settings_data: Dict[str, Any]) -> Optional[str]:
        """Create user settings."""
        try:
            collection = get_collection(self.settings_collection)
            settings_data["created_at"] = datetime.now(timezone.utc)
            settings_data["updated_at"] = datetime.now(timezone.utc)
            result = await collection.insert_one(settings_data)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error creating settings: {e}")
            return None
    
    async def update_settings(self, user_id: str, update_data: Dict[str, Any]) -> bool:
        """Update user settings."""
        try:
            collection = get_collection(self.settings_collection)
            update_data["updated_at"] = datetime.now(timezone.utc)
            result = await collection.update_one(
                {"user_id": user_id},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating settings: {e}")
            return False
    
    async def create_or_update_settings(self, user_id: str, settings_data: Dict[str, Any]) -> bool:
        """Create or update user settings."""
        existing = await self.get_settings(user_id)
        if existing:
            return await self.update_settings(user_id, settings_data)
        else:
            settings_data["user_id"] = user_id
            result = await self.create_settings(settings_data)
            return result is not None
    
    # Login history operations
    async def add_login_history(self, history_data: Dict[str, Any]) -> Optional[str]:
        """Add login history entry."""
        try:
            collection = get_collection(self.login_history_collection)
            history_data["login_time"] = datetime.now(timezone.utc)
            result = await collection.insert_one(history_data)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error adding login history: {e}")
            return None
    
    async def get_login_history(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get user login history."""
        try:
            collection = get_collection(self.login_history_collection)
            history = []
            cursor = collection.find({"user_id": user_id}).sort("login_time", -1).limit(limit)
            async for entry in cursor:
                history.append(entry)
            return history
        except Exception as e:
            print(f"Error getting login history: {e}")
            return []
    
    # Security score operations
    async def get_security_score(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user security score."""
        try:
            collection = get_collection(self.security_score_collection)
            score = await collection.find_one({"user_id": user_id})
            return score
        except Exception as e:
            print(f"Error getting security score: {e}")
            return None
    
    async def create_or_update_security_score(self, user_id: str, score_data: Dict[str, Any]) -> bool:
        """Create or update security score."""
        try:
            collection = get_collection(self.security_score_collection)
            score_data["updated_at"] = datetime.now(timezone.utc)
            
            # Try to update existing
            result = await collection.update_one(
                {"user_id": user_id},
                {"$set": score_data}
            )
            
            if result.modified_count == 0:
                # Create new if doesn't exist
                score_data["user_id"] = user_id
                score_data["calculated_at"] = datetime.now(timezone.utc)
                await collection.insert_one(score_data)
            
            return True
        except Exception as e:
            print(f"Error updating security score: {e}")
            return False


# Create singleton instance
profile_repository = ProfileRepository()