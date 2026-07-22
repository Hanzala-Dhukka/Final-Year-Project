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
    
    async def get_user_by_verification_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Get user by email verification token.
        
        Args:
            token: Verification token stored on the user document
            
        Returns:
            User document if found, None otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            user = await collection.find_one({"verification_token": token})
            return user
        except Exception as e:
            print(f"Error getting user by verification token: {e}")
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
            object_id = ObjectId(user_id)
        except Exception:
            print("Invalid ObjectId:", user_id)
            return None

        try:
            collection = get_collection(self.collection_name)
            user = await collection.find_one({"_id": object_id})
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
    
    async def count_active_users(self) -> int:
        """
        Count active users.
        
        Returns:
            Number of active users
        """
        try:
            collection = get_collection(self.collection_name)
            count = await collection.count_documents({"account_status": "active"})
            return count
        except Exception as e:
            print(f"Error counting active users: {e}")
            return 0
    
    async def search_users(self, query: str) -> List[Dict[str, Any]]:
        """
        Search users by name, email, or role.
        
        Args:
            query: Search query string
            
        Returns:
            List of matching user documents
        """
        try:
            collection = get_collection(self.collection_name)
            users = []
            
            # Search in name, email, and role fields
            search_filter = {
                "$or": [
                    {"name": {"$regex": query, "$options": "i"}},
                    {"email": {"$regex": query, "$options": "i"}},
                    {"role": {"$regex": query, "$options": "i"}}
                ]
            }
            
            cursor = collection.find(search_filter)
            async for user in cursor:
                users.append(user)
            
            return users
        except Exception as e:
            print(f"Error searching users: {e}")
            return []
    
    async def update_user_role(self, user_id: str, new_role: str) -> bool:
        """
        Update user role.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            new_role: New role to assign
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            
            result = await collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"role": new_role, "updated_at": datetime.now(timezone.utc)}}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating user role: {e}")
            return False
    
    async def update_user_status(self, user_id: str, new_status: str) -> bool:
        """
        Update user account status.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            new_status: New status to assign
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            
            result = await collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"account_status": new_status, "updated_at": datetime.now(timezone.utc)}}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating user status: {e}")
            return False
    
    async def get_user_activity(self, user_id: str) -> Dict[str, Any]:
        """
        Get user activity summary.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            Dictionary with activity counts
        """
        try:
            # Get GitHub scans count
            github_collection = get_collection("github_scans")
            github_scans = await github_collection.count_documents({"user_id": user_id})
            
            # Get security scans count
            security_collection = get_collection("security_scans")
            security_scans = await security_collection.count_documents({"user_id": user_id})
            
            # Get quiz attempts count
            quiz_collection = get_collection("quiz_attempts")
            quiz_attempts = await quiz_collection.count_documents({"user_id": user_id})
            
            # Get OWASP attempts count
            owasp_collection = get_collection("owasp_simulations")
            owasp_attempts = await owasp_collection.count_documents({"user_id": user_id})
            
            return {
                "github_scans": github_scans,
                "security_scans": security_scans,
                "quiz_attempts": quiz_attempts,
                "owasp_attempts": owasp_attempts,
                "total_activities": github_scans + security_scans + quiz_attempts + owasp_attempts
            }
        except Exception as e:
            print(f"Error getting user activity: {e}")
            return {
                "github_scans": 0,
                "security_scans": 0,
                "quiz_attempts": 0,
                "owasp_attempts": 0,
                "total_activities": 0
            }


# Create singleton instance
user_repository = UserRepository()