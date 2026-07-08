"""
Monitoring repository for MongoDB operations.
Contains all database operations for monitoring targets and alerts.
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from bson import ObjectId
from pymongo.collection import Collection

from app.core.database import get_collection


class MonitoringTargetRepository:
    """Repository class for monitoring target database operations."""
    
    def __init__(self):
        self._collection: Optional[Collection] = None
    
    def _get_collection(self) -> Collection:
        """Get the monitoring_targets collection."""
        if self._collection is None:
            self._collection = get_collection("monitoring_targets")
        return self._collection
    
    def create_target(self, target_data: Dict[str, Any]) -> str:
        """Create a new monitoring target."""
        collection = self._get_collection()
        target_data["created_at"] = datetime.now(timezone.utc)
        target_data["last_check"] = None
        result = collection.insert_one(target_data)
        return str(result.inserted_id)
    
    def get_target(self, target_id: str) -> Optional[Dict[str, Any]]:
        """Get a target by ID."""
        collection = self._get_collection()
        try:
            return collection.find_one({"_id": ObjectId(target_id)})
        except Exception:
            return None
    
    def get_user_targets(self, user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all targets for a user."""
        collection = self._get_collection()
        targets = list(collection.find({"user_id": user_id}).sort("created_at", -1).limit(limit))
        for target in targets:
            target["_id"] = str(target["_id"])
        return targets
    
    def update_target(self, target_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a target."""
        collection = self._get_collection()
        update_data["updated_at"] = datetime.now(timezone.utc)
        try:
            result = collection.update_one(
                {"_id": ObjectId(target_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception:
            return False
    
    def delete_target(self, target_id: str) -> bool:
        """Delete a target."""
        collection = self._get_collection()
        try:
            result = collection.delete_one({"_id": ObjectId(target_id)})
            return result.deleted_count > 0
        except Exception:
            return False


class SecurityAlertRepository:
    """Repository class for security alert database operations."""
    
    def __init__(self):
        self._collection: Optional[Collection] = None
    
    def _get_collection(self) -> Collection:
        """Get the security_alerts collection."""
        if self._collection is None:
            self._collection = get_collection("security_alerts")
        return self._collection
    
    def create_alert(self, alert_data: Dict[str, Any]) -> str:
        """Create a new security alert."""
        collection = self._get_collection()
        alert_data["created_at"] = datetime.now(timezone.utc)
        result = collection.insert_one(alert_data)
        return str(result.inserted_id)
    
    def get_user_alerts(self, user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all alerts for a user."""
        collection = self._get_collection()
        alerts = list(collection.find({"user_id": user_id}).sort("created_at", -1).limit(limit))
        for alert in alerts:
            alert["_id"] = str(alert["_id"])
        return alerts


# Create singleton instances
monitoring_target_repository = MonitoringTargetRepository()
security_alert_repository = SecurityAlertRepository()