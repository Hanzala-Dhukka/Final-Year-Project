"""
Audit repository for MongoDB operations.
Contains all database operations for audit logging.
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from pymongo.collection import Collection

from app.core.database import get_collection


class AuditRepository:
    """Repository class for audit log database operations."""
    
    def __init__(self):
        self._collection: Optional[Collection] = None
    
    def _get_collection(self) -> Collection:
        """Get the audit_logs collection."""
        if self._collection is None:
            self._collection = get_collection("audit_logs")
        return self._collection
    
    def create_log(self, log_data: Dict[str, Any]) -> str:
        """
        Create a new audit log entry.
        
        Args:
            log_data: Dictionary containing log information
            
        Returns:
            str: The inserted log's ID
        """
        collection = self._get_collection()
        
        # Add timestamp
        log_data["created_at"] = datetime.now(timezone.utc)
        
        result = collection.insert_one(log_data)
        return str(result.inserted_id)
    
    def get_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get all audit logs (admin only).
        
        Args:
            limit: Maximum number of logs to return
            
        Returns:
            List of log documents
        """
        collection = self._get_collection()
        logs = list(collection.find({}).sort("created_at", -1).limit(limit))
        
        for log in logs:
            log["_id"] = str(log["_id"])
        
        return logs
    
    def get_user_logs(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get audit logs for a specific user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            limit: Maximum number of logs to return
            
        Returns:
            List of log documents
        """
        collection = self._get_collection()
        logs = list(collection.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(limit))
        
        for log in logs:
            log["_id"] = str(log["_id"])
        
        return logs
    
    def get_logs_by_module(self, module: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get audit logs for a specific module.
        
        Args:
            module: Module name (AUTH, GITHUB_SCAN, etc.)
            limit: Maximum number of logs to return
            
        Returns:
            List of log documents
        """
        collection = self._get_collection()
        logs = list(collection.find(
            {"module": module}
        ).sort("created_at", -1).limit(limit))
        
        for log in logs:
            log["_id"] = str(log["_id"])
        
        return logs
    
    def delete_old_logs(self, days: int = 180) -> int:
        """
        Delete logs older than specified days.
        
        Args:
            days: Number of days to keep logs
            
        Returns:
            int: Number of logs deleted
        """
        collection = self._get_collection()
        
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        result = collection.delete_many({
            "created_at": {"$lt": cutoff_date}
        })
        return result.deleted_count


# Create a singleton instance
audit_repository = AuditRepository()