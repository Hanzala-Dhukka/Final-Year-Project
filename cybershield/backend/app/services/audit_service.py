"""
Audit service for logging user activities.
"""
from typing import Optional, Dict, Any
from app.repositories.audit_repository import audit_repository


def log_action(user_id: str, username: str, action: str, module: str, description: str, ip_address: Optional[str] = None, device: Optional[str] = None, status: str = "SUCCESS") -> str:
    """
    Log a user action.
    
    Args:
        user_id: User's MongoDB ObjectId as string
        username: User's username
        action: Action type (LOGIN, LOGOUT, REPOSITORY_SCAN, etc.)
        module: Module name (AUTH, GITHUB_SCAN, QUIZ, etc.)
        description: Description of the action
        ip_address: User's IP address
        device: User's device information
        status: Status (SUCCESS, FAILED)
        
    Returns:
        str: The inserted log's ID
    """
    log_data = {
        "user_id": user_id,
        "username": username,
        "action": action,
        "module": module,
        "description": description,
        "ip_address": ip_address,
        "device": device,
        "status": status
    }
    
    return audit_repository.create_log(log_data)


def get_user_audit_history(user_id: str, limit: int = 50) -> list:
    """
    Get audit history for a user.
    
    Args:
        user_id: User's MongoDB ObjectId as string
        limit: Maximum number of logs to return
        
    Returns:
        List of log documents
    """
    return audit_repository.get_user_logs(user_id, limit)


def get_all_audit_logs(limit: int = 100) -> list:
    """
    Get all audit logs (admin only).
    
    Args:
        limit: Maximum number of logs to return
        
    Returns:
        List of log documents
    """
    return audit_repository.get_logs(limit)


def cleanup_old_logs(days: int = 180) -> int:
    """
    Delete logs older than specified days.
    
    Args:
        days: Number of days to keep logs
        
    Returns:
        int: Number of logs deleted
    """
    return audit_repository.delete_old_logs(days)


# Helper functions for specific actions
def log_login(user_id: str, username: str, ip_address: Optional[str] = None, device: Optional[str] = None) -> str:
    """Log successful login."""
    return log_action(
        user_id=user_id,
        username=username,
        action="LOGIN",
        module="AUTH",
        description="User logged in successfully",
        ip_address=ip_address,
        device=device,
        status="SUCCESS"
    )


def log_login_failed(user_id: str, username: str, ip_address: Optional[str] = None, device: Optional[str] = None) -> str:
    """Log failed login attempt."""
    return log_action(
        user_id=user_id,
        username=username,
        action="LOGIN_FAILED",
        module="AUTH",
        description="Failed login attempt",
        ip_address=ip_address,
        device=device,
        status="FAILED"
    )


def log_logout(user_id: str, username: str, ip_address: Optional[str] = None) -> str:
    """Log logout."""
    return log_action(
        user_id=user_id,
        username=username,
        action="LOGOUT",
        module="AUTH",
        description="User logged out",
        ip_address=ip_address,
        status="SUCCESS"
    )


def log_password_change(user_id: str, username: str, ip_address: Optional[str] = None) -> str:
    """Log password change."""
    return log_action(
        user_id=user_id,
        username=username,
        action="PASSWORD_CHANGE",
        module="AUTH",
        description="Password changed successfully",
        ip_address=ip_address,
        status="SUCCESS"
    )


def log_repository_scan(user_id: str, username: str, repo_name: str, ip_address: Optional[str] = None) -> str:
    """Log repository scan."""
    return log_action(
        user_id=user_id,
        username=username,
        action="REPOSITORY_SCAN",
        module="GITHUB_SCAN",
        description=f"Scanned {repo_name} repository",
        ip_address=ip_address,
        status="SUCCESS"
    )


def log_security_scan(user_id: str, username: str, target: str, ip_address: Optional[str] = None) -> str:
    """Log security scan."""
    return log_action(
        user_id=user_id,
        username=username,
        action="SECURITY_SCAN",
        module="SECURITY_SCAN",
        description=f"Scanned {target}",
        ip_address=ip_address,
        status="SUCCESS"
    )


def log_quiz_completed(user_id: str, username: str, score: int, ip_address: Optional[str] = None) -> str:
    """Log quiz completion."""
    return log_action(
        user_id=user_id,
        username=username,
        action="QUIZ_COMPLETED",
        module="QUIZ",
        description=f"Quiz completed with score {score}%",
        ip_address=ip_address,
        status="SUCCESS"
    )


def log_owasp_attempt(user_id: str, username: str, attack_type: str, ip_address: Optional[str] = None) -> str:
    """Log OWASP simulation attempt."""
    return log_action(
        user_id=user_id,
        username=username,
        action="OWASP_ATTACK_ATTEMPT",
        module="OWASP_SIMULATOR",
        description=f"Attempted {attack_type} attack",
        ip_address=ip_address,
        status="SUCCESS"
    )


def log_report_download(user_id: str, username: str, report_type: str, ip_address: Optional[str] = None) -> str:
    """Log report download."""
    return log_action(
        user_id=user_id,
        username=username,
        action="REPORT_DOWNLOADED",
        module="REPORTS",
        description=f"Downloaded {report_type} report",
        ip_address=ip_address,
        status="SUCCESS"
    )


def log_profile_update(user_id: str, username: str, field: str, ip_address: Optional[str] = None) -> str:
    """Log profile update."""
    return log_action(
        user_id=user_id,
        username=username,
        action="PROFILE_UPDATE",
        module="PROFILE",
        description=f"Updated {field}",
        ip_address=ip_address,
        status="SUCCESS"
    )


def log_role_change(user_id: str, username: str, old_role: str, new_role: str, performed_by: str, ip_address: Optional[str] = None) -> str:
    """Log role change by admin."""
    return log_action(
        user_id=user_id,
        username=username,
        action="ROLE_CHANGED",
        module="ADMIN",
        description=f"Role changed from {old_role} to {new_role} by {performed_by}",
        ip_address=ip_address,
        status="SUCCESS"
    )


def log_account_status_change(user_id: str, username: str, old_status: str, new_status: str, performed_by: str, ip_address: Optional[str] = None) -> str:
    """Log account status change by admin."""
    return log_action(
        user_id=user_id,
        username=username,
        action="ACCOUNT_STATUS_CHANGED",
        module="ADMIN",
        description=f"Account status changed from {old_status} to {new_status} by {performed_by}",
        ip_address=ip_address,
        status="SUCCESS"
    )
