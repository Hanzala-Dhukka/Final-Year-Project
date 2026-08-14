"""
Notification repository for MongoDB operations.
Contains all database operations for notifications.
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from bson import ObjectId
from pymongo.collection import Collection

from app.core.database import get_collection


class NotificationRepository:
    """Repository class for notification database operations."""
    
    def __init__(self):
        self._collection: Optional[Collection] = None
    
    def _get_collection(self) -> Collection:
        """Get the notifications collection."""
        if self._collection is None:
            self._collection = get_collection("notifications")
        return self._collection
    
    async def create_notification(self, user_id: str, title: str, message: str, notification_type: str, severity: str = "INFO") -> str:
        """
        Create a new notification.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            title: Notification title
            message: Notification message
            notification_type: Type of notification (SCAN, SECURITY_ALERT, QUIZ, ACHIEVEMENT, CERTIFICATE, DAILY_CHALLENGE, ACCOUNT)
            severity: Severity level (INFO, SUCCESS, WARNING, CRITICAL)
            
        Returns:
            str: The inserted notification's ID
        """
        collection = self._get_collection()
        
        notification_data = {
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": notification_type,
            "severity": severity,
            "is_read": False,
            "created_at": datetime.now(timezone.utc)
        }
        
        result = await collection.insert_one(notification_data)
        return str(result.inserted_id)
    
    async def get_notifications(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get all notifications for a user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            limit: Maximum number of notifications to return
            
        Returns:
            List of notification documents
        """
        collection = self._get_collection()
        notifications = []
        cursor = collection.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(limit)
        async for notification in cursor:
            notification["_id"] = str(notification["_id"])
            notifications.append(notification)
        
        return notifications
    
    async def get_unread_count(self, user_id: str) -> int:
        """
        Get count of unread notifications for a user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            int: Number of unread notifications
        """
        collection = self._get_collection()
        return await collection.count_documents({"user_id": user_id, "is_read": False})
    
    async def mark_as_read(self, notification_id: str) -> bool:
        """
        Mark a notification as read.
        
        Args:
            notification_id: Notification's MongoDB ObjectId as string
            
        Returns:
            bool: True if update was successful
        """
        collection = self._get_collection()
        
        try:
            result = await collection.update_one(
                {"_id": ObjectId(notification_id)},
                {"$set": {"is_read": True}}
            )
            return result.modified_count > 0
        except Exception:
            return False
    
    async def mark_all_as_read(self, user_id: str) -> int:
        """
        Mark all notifications for a user as read.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            int: Number of notifications marked as read
        """
        collection = self._get_collection()
        
        result = await collection.update_many(
            {"user_id": user_id, "is_read": False},
            {"$set": {"is_read": True}}
        )
        return result.modified_count
    
    async def delete_notification(self, notification_id: str) -> bool:
        """
        Delete a notification.
        
        Args:
            notification_id: Notification's MongoDB ObjectId as string
            
        Returns:
            bool: True if deletion was successful
        """
        collection = self._get_collection()
        
        try:
            result = await collection.delete_one({"_id": ObjectId(notification_id)})
            return result.deleted_count > 0
        except Exception:
            return False


# Create a singleton instance
notification_repository = NotificationRepository()