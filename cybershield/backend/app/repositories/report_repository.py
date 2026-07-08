"""
Report repository for MongoDB operations.
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from bson import ObjectId
from app.core.database import get_collection


class ReportRepository:
    """Repository for report database operations."""
    
    def __init__(self):
        self.collection_name = "security_reports"
    
    async def create_report(self, report_data: Dict[str, Any]) -> Optional[str]:
        """
        Create a new security report.
        
        Args:
            report_data: Report data dictionary
            
        Returns:
            Report ID if successful, None otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            
            # Add timestamps
            report_data["created_at"] = datetime.now(timezone.utc)
            
            result = await collection.insert_one(report_data)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error creating report: {e}")
            return None
    
    async def get_report_by_id(self, report_id: str) -> Optional[Dict[str, Any]]:
        """
        Get report by ID.
        
        Args:
            report_id: Report's MongoDB ObjectId as string
            
        Returns:
            Report document if found, None otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            report = await collection.find_one({"_id": ObjectId(report_id)})
            return report
        except Exception as e:
            print(f"Error getting report by ID: {e}")
            return None
    
    async def get_reports_by_user(self, user_id: str, skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get all reports for a user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            skip: Number of documents to skip
            limit: Maximum number of documents to return
            
        Returns:
            List of report documents
        """
        try:
            collection = get_collection(self.collection_name)
            reports = []
            
            cursor = collection.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit)
            async for report in cursor:
                reports.append(report)
            
            return reports
        except Exception as e:
            print(f"Error getting reports by user: {e}")
            return []
    
    async def update_report(self, report_id: str, update_data: Dict[str, Any]) -> bool:
        """
        Update report data.
        
        Args:
            report_id: Report's MongoDB ObjectId as string
            update_data: Data to update
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            
            # Add completed timestamp if status is completed
            if update_data.get("status") == "completed":
                update_data["completed_at"] = datetime.now(timezone.utc)
            
            result = await collection.update_one(
                {"_id": ObjectId(report_id)},
                {"$set": update_data}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating report: {e}")
            return False
    
    async def delete_report(self, report_id: str) -> bool:
        """
        Delete report.
        
        Args:
            report_id: Report's MongoDB ObjectId as string
            
        Returns:
            True if successful, False otherwise
        """
        try:
            collection = get_collection(self.collection_name)
            result = await collection.delete_one({"_id": ObjectId(report_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting report: {e}")
            return False
    
    async def get_recent_reports(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get recent reports across all users.
        
        Args:
            limit: Maximum number of reports to return
            
        Returns:
            List of recent report documents
        """
        try:
            collection = get_collection(self.collection_name)
            reports = []
            
            cursor = collection.find({}).sort("created_at", -1).limit(limit)
            async for report in cursor:
                reports.append(report)
            
            return reports
        except Exception as e:
            print(f"Error getting recent reports: {e}")
            return []


# Create singleton instance
report_repository = ReportRepository()