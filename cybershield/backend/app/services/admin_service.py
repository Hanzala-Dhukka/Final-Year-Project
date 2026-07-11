"""
Admin service layer for administrative operations.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from bson import ObjectId

from app.repositories.user_repository import user_repository
from app.services.audit_service import log_action, log_role_change, log_account_status_change
from app.core.database import get_collection


class AdminService:
    """Service class for admin operations."""
    
    async def get_all_users(self, skip: int = 0, limit: int = 100) -> Dict[str, Any]:
        """
        Get all users with pagination.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            Dictionary with total count and users list
        """
        users = await user_repository.get_all_users(skip, limit)
        total = await user_repository.count_users()
        
        # Sanitize users for response
        sanitized_users = []
        for user in users:
            sanitized_user = {
                "id": str(user.get("_id", "")),
                "name": user.get("name", ""),
                "email": user.get("email", ""),
                "role": user.get("role", "student"),
                "status": user.get("account_status", "active"),
                "created_at": user.get("created_at"),
                "last_login": user.get("last_login"),
                "is_email_verified": user.get("is_email_verified", False)
            }
            sanitized_users.append(sanitized_user)
        
        return {
            "total": total,
            "users": sanitized_users
        }
    
    async def search_users(self, query: str) -> List[Dict[str, Any]]:
        """
        Search users by name, email, or role.
        
        Args:
            query: Search query string
            
        Returns:
            List of matching users
        """
        users = await user_repository.search_users(query)
        
        # Sanitize users for response
        sanitized_users = []
        for user in users:
            sanitized_user = {
                "id": str(user.get("_id", "")),
                "name": user.get("name", ""),
                "email": user.get("email", ""),
                "role": user.get("role", "student"),
                "status": user.get("account_status", "active"),
                "created_at": user.get("created_at"),
                "last_login": user.get("last_login")
            }
            sanitized_users.append(sanitized_user)
        
        return sanitized_users
    
    async def change_user_role(self, user_id: str, new_role: str, admin_id: str, admin_username: str) -> Dict[str, Any]:
        """
        Change a user's role.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            new_role: New role to assign
            admin_id: Admin's user ID
            admin_username: Admin's username
            
        Returns:
            Dictionary with success status and message
        """
        # Validate role
        valid_roles = ["admin", "instructor", "student"]
        if new_role not in valid_roles:
            return {
                "success": False,
                "message": f"Invalid role. Must be one of: {', '.join(valid_roles)}"
            }
        
        # Get user before update
        user = await user_repository.get_user_by_id(user_id)
        if not user:
            return {
                "success": False,
                "message": "User not found"
            }
        
        old_role = user.get("role", "student")
        
        # Update role
        success = await user_repository.update_user_role(user_id, new_role)
        
        if success:
            # Log the action
            log_role_change(
                user_id=user_id,
                username=user.get("name", ""),
                old_role=old_role,
                new_role=new_role,
                performed_by=admin_username
            )
            
            return {
                "success": True,
                "message": "Role updated successfully"
            }
        else:
            return {
                "success": False,
                "message": "Failed to update role"
            }
    
    async def change_user_status(self, user_id: str, new_status: str, admin_id: str, admin_username: str) -> Dict[str, Any]:
        """
        Change a user's account status.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            new_status: New status (active, blocked, suspended)
            admin_id: Admin's user ID
            admin_username: Admin's username
            
        Returns:
            Dictionary with success status and message
        """
        # Validate status
        valid_statuses = ["active", "blocked", "suspended"]
        if new_status not in valid_statuses:
            return {
                "success": False,
                "message": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            }
        
        # Get user before update
        user = await user_repository.get_user_by_id(user_id)
        if not user:
            return {
                "success": False,
                "message": "User not found"
            }
        
        old_status = user.get("account_status", "active")
        
        # Update status
        success = await user_repository.update_user_status(user_id, new_status)
        
        if success:
            # Log the action
            log_account_status_change(
                user_id=user_id,
                username=user.get("name", ""),
                old_status=old_status,
                new_status=new_status,
                performed_by=admin_username
            )
            
            return {
                "success": True,
                "message": f"Account {new_status} successfully"
            }
        else:
            return {
                "success": False,
                "message": "Failed to update account status"
            }
    
    async def delete_user(self, user_id: str, admin_id: str, admin_username: str) -> Dict[str, Any]:
        """
        Delete a user and create audit log.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            admin_id: Admin's user ID
            admin_username: Admin's username
            
        Returns:
            Dictionary with success status and message
        """
        # Get user before deletion
        user = await user_repository.get_user_by_id(user_id)
        if not user:
            return {
                "success": False,
                "message": "User not found"
            }
        
        # Create audit log before deletion
        log_action(
            user_id=user_id,
            username=user.get("name", ""),
            action="USER_DELETED",
            module="ADMIN",
            description=f"User account deleted by admin {admin_username}",
            status="SUCCESS"
        )
        
        # Delete user
        success = await user_repository.delete_user(user_id)
        
        if success:
            return {
                "success": True,
                "message": "User deleted successfully"
            }
        else:
            return {
                "success": False,
                "message": "Failed to delete user"
            }
    
    async def get_user_activity(self, user_id: str) -> Dict[str, Any]:
        """
        Get user activity summary.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            Dictionary with activity counts
        """
        # Get user info
        user = await user_repository.get_user_by_id(user_id)
        if not user:
            return {}
        
        # Get activity counts
        activity = await user_repository.get_user_activity(user_id)
        
        return {
            "user_id": user_id,
            "username": user.get("name", ""),
            "full_name": user.get("name", ""),
            "github_scans": activity.get("github_scans", 0),
            "security_scans": activity.get("security_scans", 0),
            "quiz_attempts": activity.get("quiz_attempts", 0),
            "owasp_attempts": activity.get("owasp_attempts", 0),
            "total_activities": activity.get("total_activities", 0),
            "last_login": user.get("last_login")
        }
    
    async def get_platform_statistics(self) -> Dict[str, Any]:
        """
        Get platform-wide statistics.
        
        Returns:
            Dictionary with platform statistics
        """
        # User statistics
        total_users = await user_repository.count_users()
        active_users = await user_repository.count_active_users()
        
        # Count scans
        github_collection = get_collection("github_scans")
        total_scans = await github_collection.count_documents({})
        
        security_collection = get_collection("security_scans")
        total_security_scans = await security_collection.count_documents({})
        
        # Count quiz attempts
        quiz_collection = get_collection("quiz_attempts")
        total_quiz_attempts = await quiz_collection.count_documents({})
        
        # Count OWASP attempts
        owasp_collection = get_collection("owasp_simulations")
        total_owasp_attempts = await owasp_collection.count_documents({})
        
        # Count critical issues
        critical_issues = 0
        high_issues = 0
        
        # Count from github scans
        async for scan in github_collection.find({}, {"vulnerabilities": 1}):
            vulns = scan.get("vulnerabilities", [])
            for vuln in vulns:
                severity = vuln.get("severity", "").lower()
                if severity == "critical":
                    critical_issues += 1
                elif severity == "high":
                    high_issues += 1
        
        # Count from security scans
        async for scan in security_collection.find({}, {"threats": 1}):
            threats = scan.get("threats", [])
            for threat in threats:
                severity = threat.get("severity", "").lower()
                if severity == "critical":
                    critical_issues += 1
                elif severity == "high":
                    high_issues += 1
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": total_users - active_users,
            "total_scans": total_scans + total_security_scans,
            "github_scans": total_scans,
            "security_scans": total_security_scans,
            "quiz_attempts": total_quiz_attempts,
            "owasp_attempts": total_owasp_attempts,
            "total_activities": total_scans + total_security_scans + total_quiz_attempts + total_owasp_attempts,
            "critical_issues": critical_issues,
            "high_issues": high_issues
        }
    
    async def get_security_monitoring(self) -> Dict[str, Any]:
        """
        Get security monitoring data.
        
        Returns:
            Dictionary with security monitoring data
        """
        # GitHub Scanner stats
        github_collection = get_collection("github_scans")
        total_github_scans = await github_collection.count_documents({})
        
        github_critical = 0
        github_high = 0
        async for scan in github_collection.find({}, {"vulnerabilities": 1}):
            vulns = scan.get("vulnerabilities", [])
            for vuln in vulns:
                severity = vuln.get("severity", "").lower()
                if severity == "critical":
                    github_critical += 1
                elif severity == "high":
                    github_high += 1
        
        # Security Scanner stats
        security_collection = get_collection("security_scans")
        total_security_scans = await security_collection.count_documents({})
        
        security_critical = 0
        async for scan in security_collection.find({}, {"threats": 1}):
            threats = scan.get("threats", [])
            for threat in threats:
                severity = threat.get("severity", "").lower()
                if severity == "critical":
                    security_critical += 1
        
        # OWASP Simulator stats
        owasp_collection = get_collection("owasp_simulations")
        total_owasp = await owasp_collection.count_documents({})
        
        sql_injection_attempts = 0
        xss_attempts = 0
        async for sim in owasp_collection.find({}, {"attack_type": 1}):
            attack_type = sim.get("attack_type", "").lower()
            if "sql" in attack_type or "injection" in attack_type:
                sql_injection_attempts += 1
            elif "xss" in attack_type or "cross" in attack_type:
                xss_attempts += 1
        
        return {
            "github_scanner": {
                "total_scans": total_github_scans,
                "critical_issues": github_critical,
                "high_issues": github_high
            },
            "security_scanner": {
                "websites_checked": total_security_scans,
                "critical_alerts": security_critical
            },
            "owasp_simulator": {
                "total_attempts": total_owasp,
                "sql_injection_attempts": sql_injection_attempts,
                "xss_attempts": xss_attempts
            }
        }
    
    async def get_recent_activities(self, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Get recent platform activities.
        
        Args:
            limit: Maximum number of activities to return
            
        Returns:
            List of recent activities
        """
        audit_collection = get_collection("audit_logs")
        
        # Get recent logs
        logs = []
        async for log in audit_collection.find().sort("timestamp", -1).limit(limit):
            logs.append(log)
        
        activities = []
        for log in logs:
            activity = {
                "id": str(log.get("_id", "")),
                "user_id": log.get("user_id", ""),
                "username": log.get("username", ""),
                "action": log.get("action", ""),
                "module": log.get("module", ""),
                "description": log.get("description", ""),
                "timestamp": log.get("timestamp") or log.get("created_at"),
                "status": log.get("status", "SUCCESS")
            }
            activities.append(activity)
        
        return activities


# Create a singleton instance
admin_service = AdminService()