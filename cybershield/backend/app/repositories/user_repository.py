"""
User repository for MongoDB operations.
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from bson import ObjectId
from app.core.database import get_collection
from app.models.user_model import UserCreate, UserUpdate


class UserRepository:
    """Repository for user database operations."""
    
    def __init__(self):
        self.collection_name = "users"
    
    async def create_user(self, user_data: Dict[str, Any]) -> Optional[str]:
        """
        Create a new user.
        
        Args:
            user_data: User data dictionary
            
        Returns:
            User ID if successful, None otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            
            # Add timestamps
            user_data["created_at"] = datetime.now(timezone.utc)
            user_data["updated_at"] = datetime.now(timezone.utc)
            
            result = await collection.insert_one(user_data)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error creating user: {e}")
            return None
    
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Get user by email.
        
        Args:
            email: User email
            
        Returns:
            User document if found, None otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            user = await collection.find_one({"email": email})
            return user
        except Exception as e:
            print(f"Error getting user by email: {e}")
            return None
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user by ID.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            User document if found, None otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            user = await collection.find_one({"_id": ObjectId(user_id)})
            return user
        except Exception as e:
            print(f"Error getting user by ID: {e}")
            return None
    
    async def update_user(self, user_id: str, update_data: Dict[str, Any]) -> bool:
        """
        Update user data.
        
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
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating user: {e}")
            return False
    
    async def delete_user(self, user_id: str) -> bool:
        """
        Delete user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            result = await collection.delete_one({"_id": ObjectId(user_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting user: {e}")
            return False
    
    async def get_all_users(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get all users with pagination.
        
        Args:
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            
        Returns:
            List of user documents
        """
        try:
            collection = get_collection(self.collection_name)
            users = []
            
            cursor = collection.find({}).skip(skip).limit(limit)
            async for user in cursor:
                users.append(user)
            
            return users
        except Exception as e:
            print(f"Error getting all users: {e}")
            return []
    
    async def count_users(self) -> int:
        """
        Count total users.
        
        Returns:
            Total number of users
        """
        try:
            collection = get_collection(self.collection_name)
            count = await collection.count_documents({})
            return count
        except Exception as e:
            print(f"Error counting users: {e}")
            return 0


# Create singleton instance
user_repository = UserRepository()