"""
Notification service for creating and managing notifications.
"""
from typing import Optional, Dict, Any, List
from app.repositories.notification_repository import notification_repository


def create_notification(user_id: str, title: str, message: str, notification_type: str, severity: str = "INFO") -> str:
    """
    Create a new notification for a user.
    
    Args:
        user_id: User's MongoDB ObjectId as string
        title: Notification title
        message: Notification message
        notification_type: Type of notification (SCAN, SECURITY_ALERT, QUIZ, ACHIEVEMENT, CERTIFICATE, DAILY_CHALLENGE, ACCOUNT)
        severity: Severity level (INFO, SUCCESS, WARNING, CRITICAL)
        
    Returns:
        str: The inserted notification's ID
    """
    return notification_repository.create_notification(user_id, title, message, notification_type, severity)


def get_user_notifications(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Get all notifications for a user.
    
    Args:
        user_id: User's MongoDB ObjectId as string
        limit: Maximum number of notifications to return
        
    Returns:
        List of notification documents
    """
    return notification_repository.get_notifications(user_id, limit)


def get_unread_count(user_id: str) -> int:
    """
    Get count of unread notifications for a user.
    
    Args:
        user_id: User's MongoDB ObjectId as string
        
    Returns:
        int: Number of unread notifications
    """
    return notification_repository.get_unread_count(user_id)


def mark_notification_read(notification_id: str) -> bool:
    """
    Mark a notification as read.
    
    Args:
        notification_id: Notification's MongoDB ObjectId as string
        
    Returns:
        bool: True if update was successful
    """
    return notification_repository.mark_as_read(notification_id)


def mark_all_notifications_read(user_id: str) -> int:
    """
    Mark all notifications for a user as read.
    
    Args:
        user_id: User's MongoDB ObjectId as string
        
    Returns:
        int: Number of notifications marked as read
    """
    return notification_repository.mark_all_as_read(user_id)


def delete_user_notification(notification_id: str) -> bool:
    """
    Delete a notification.
    
    Args:
        notification_id: Notification's MongoDB ObjectId as string
        
    Returns:
        bool: True if deletion was successful
    """
    return notification_repository.delete_notification(notification_id)


# Helper functions for specific notification types
def notify_scan_completed(user_id: str, repo_name: str) -> str:
    """Create notification for scan completion."""
    return create_notification(
        user_id=user_id,
        title="Security Scan Completed",
        message=f"Your {repo_name} security scan has finished.",
        notification_type="SCAN",
        severity="SUCCESS"
    )


def notify_security_alert(user_id: str, alert_title: str, alert_message: str) -> str:
    """Create notification for security alert."""
    return create_notification(
        user_id=user_id,
        title=alert_title,
        message=alert_message,
        notification_type="SECURITY_ALERT",
        severity="CRITICAL"
    )


def notify_quiz_completed(user_id: str, score: int) -> str:
    """Create notification for quiz completion."""
    return create_notification(
        user_id=user_id,
        title="Quiz Completed",
        message=f"You scored {score}% on your security quiz!",
        notification_type="QUIZ",
        severity="SUCCESS"
    )


def notify_achievement_unlocked(user_id: str, achievement_name: str) -> str:
    """Create notification for achievement unlock."""
    return create_notification(
        user_id=user_id,
        title="Achievement Unlocked",
        message=f"You earned the {achievement_name} badge!",
        notification_type="ACHIEVEMENT",
        severity="SUCCESS"
    )


def notify_certificate_generated(user_id: str) -> str:
    """Create notification for certificate generation."""
    return create_notification(
        user_id=user_id,
        title="Certificate Generated",
        message="Your security certificate is ready for download.",
        notification_type="CERTIFICATE",
        severity="SUCCESS"
    )


def notify_daily_challenge(user_id: str) -> str:
    """Create notification for daily challenge."""
    return create_notification(
        user_id=user_id,
        title="Daily Challenge Available",
        message="A new daily security challenge is waiting for you!",
        notification_type="DAILY_CHALLENGE",
        severity="INFO"
    )