"""
Security scan repository for MongoDB operations.
Contains all database operations for website security scans.
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from bson import ObjectId
from pymongo.collection import Collection

from app.core.database import get_collection
from app.services.error_log_service import fire_and_forget_log


class SecurityScanRepository:
    """Repository class for security scan database operations."""
    
    def __init__(self):
        self._collection: Optional[Collection] = None
    
    def _get_collection(self) -> Collection:
        """Get the security_scans collection."""
        if self._collection is None:
            self._collection = get_collection("security_scans")
        return self._collection
    
    async def create_scan(self, scan_data: Dict[str, Any]) -> str:
        """
        Create a new security scan record.
        
        Args:
            scan_data: Dictionary containing scan information
            
        Returns:
            str: The inserted scan's ID
        """
        collection = self._get_collection()
        
        # Add timestamp
        scan_data["created_at"] = datetime.now(timezone.utc)
        
        result = await collection.insert_one(scan_data)
        return str(result.inserted_id)
    
    async def get_scan(self, scan_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a scan by ID.
        
        Args:
            scan_id: Scan's MongoDB ObjectId as string
            
        Returns:
            Scan document or None if not found
        """
        collection = self._get_collection()
        try:
            return await collection.find_one({"_id": ObjectId(scan_id)})
        except Exception:
            fire_and_forget_log()
            return None
    
    async def get_user_scans(self, user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get all scans for a user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            limit: Maximum number of scans to return
            
        Returns:
            List of scan documents
        """
        collection = self._get_collection()
        
        scans = []
        cursor = collection.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
        async for scan in cursor:
            scan["_id"] = str(scan["_id"])
            if "user_id" in scan:
                scan["user_id"] = str(scan["user_id"])
            scans.append(scan)
        
        return scans
    
    async def delete_scan(self, scan_id: str) -> bool:
        """
        Delete a scan.
        
        Args:
            scan_id: Scan's MongoDB ObjectId as string
            
        Returns:
            bool: True if deletion was successful
        """
        collection = self._get_collection()
        
        try:
            result = await collection.delete_one({"_id": ObjectId(scan_id)})
            return result.deleted_count > 0
        except Exception:
            fire_and_forget_log()
            return False


# Create a singleton instance
security_scan_repository = SecurityScanRepository()