"""
Security report repository for MongoDB operations.
Contains all database operations for security reports.
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from bson import ObjectId
from pymongo.collection import Collection

from app.core.database import get_collection


class SecurityReportRepository:
    """Repository class for security report database operations."""
    
    def __init__(self):
        self._collection: Optional[Collection] = None
    
    def _get_collection(self) -> Collection:
        """Get the security_reports collection."""
        if self._collection is None:
            self._collection = get_collection("security_reports")
        return self._collection
    
    async def create_report(self, report_data: Dict[str, Any]) -> str:
        """
        Create a new security report.
        
        Args:
            report_data: Dictionary containing report information
            
        Returns:
            str: The inserted report's ID
        """
        collection = self._get_collection()
        
        # Add timestamp
        report_data["created_at"] = datetime.now(timezone.utc)
        
        result = await collection.insert_one(report_data)
        return str(result.inserted_id)
    
    async def get_report(self, report_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a report by ID.
        
        Args:
            report_id: Report's MongoDB ObjectId as string
            
        Returns:
            Report document or None if not found
        """
        collection = self._get_collection()
        try:
            return await collection.find_one({"_id": ObjectId(report_id)})
        except Exception:
            return None
    
    async def get_user_reports(self, user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get all reports for a user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            limit: Maximum number of reports to return
            
        Returns:
            List of report documents
        """
        collection = self._get_collection()
        
        cursor = collection.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
        reports = await cursor.to_list(length=limit)
        
        for report in reports:
            report["_id"] = str(report["_id"])
            if "user_id" in report:
                report["user_id"] = str(report["user_id"])
        
        return reports
    
    async def get_all_reports(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get all reports (admin only).
        
        Args:
            limit: Maximum number of reports to return
            
        Returns:
            List of report documents
        """
        collection = self._get_collection()
        
        cursor = collection.find({}).sort("created_at", -1).limit(limit)
        reports = await cursor.to_list(length=limit)
        
        for report in reports:
            report["_id"] = str(report["_id"])
            if "user_id" in report:
                report["user_id"] = str(report["user_id"])
        
        return reports
    
    async def delete_report(self, report_id: str) -> bool:
        """
        Delete a report.
        
        Args:
            report_id: Report's MongoDB ObjectId as string
            
        Returns:
            bool: True if deletion was successful
        """
        collection = self._get_collection()
        
        try:
            result = await collection.delete_one({"_id": ObjectId(report_id)})
            return result.deleted_count > 0
        except Exception:
            return False

    async def get_reports_by_user(self, user_id: str, limit: int = 100):
        """Async alias for get_user_reports, used by dashboard routes."""
        return await self.get_user_reports(user_id, limit)


# Create a singleton instance
security_report_repository = SecurityReportRepository()