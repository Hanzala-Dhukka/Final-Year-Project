"""
Profile service for user profile management.
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from app.repositories.profile_repository import profile_repository
from app.repositories.user_repository import user_repository
from app.repositories.progress_repository import progress_repository
from app.repositories.lab_repository import lab_repository
from app.repositories.quiz_repository import quiz_repository
from app.services.password_service import password_service
from app.services.session_service import session_service
from app.services.refresh_service import refresh_service


class ProfileService:
    """Service for profile operations."""
    
    @staticmethod
    async def get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get complete user profile with statistics.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            Profile data with statistics
        """
        try:
            # Get user data
            user = await user_repository.get_user_by_id(user_id)
            if not user:
                return None
            
            # Get profile
            profile = await profile_repository.get_profile(user_id)
            
            # Get settings
            settings = await profile_repository.get_settings(user_id)
            
            # Get statistics
            statistics = await ProfileService._get_user_statistics(user_id)
            
            return {
                "user_id": user_id,
                "username": user.get("name", ""),
                "email": user["email"],
                "role": user.get("role", "student"),
                "profile": profile,
                "settings": settings,
                "statistics": statistics
            }
        except Exception as e:
            print(f"Error getting user profile: {e}")
            return None
    
    @staticmethod
    async def _get_user_statistics(user_id: str) -> Dict[str, Any]:
        """
        Get user learning statistics.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            Statistics dictionary
        """
        try:
            # Get progress
            progress = await progress_repository.get_progress_by_user(user_id)
            
            # Get lab attempts
            lab_attempts = await lab_repository.get_lab_attempts_by_user(user_id, limit=1000)
            completed_labs = len([a for a in lab_attempts if a.get("status") == "completed"])
            
            # Get quiz attempts
            quiz_attempts = await quiz_repository.get_quiz_attempts_by_user(user_id, limit=1000)
            
            # Calculate average quiz score
            avg_score = 0
            if quiz_attempts:
                total_score = sum(q.get("score", 0) for q in quiz_attempts)
                avg_score = total_score / len(quiz_attempts)
            
            return {
                "xp": progress.get("xp", 0) if progress else 0,
                "level": progress.get("level", 1) if progress else 1,
                "labs_completed": completed_labs,
                "quizzes_completed": len(quiz_attempts),
                "average_quiz_score": round(avg_score, 2),
                "achievements": len(progress.get("achievements", [])) if progress else 0,
                "streak_days": progress.get("streak_days", 0) if progress else 0
            }
        except Exception as e:
            print(f"Error getting statistics: {e}")
            return {}
    
    @staticmethod
    async def update_profile(user_id: str, profile_data: Dict[str, Any]) -> bool:
        """
        Update user profile.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            profile_data: Profile data to update
            
        Returns:
            True if successful, False otherwise
        """
        try:
            return await profile_repository.create_or_update_profile(user_id, profile_data)
        except Exception as e:
            print(f"Error updating profile: {e}")
            return False
    
    @staticmethod
    async def get_user_settings(user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user settings.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            Settings dictionary
        """
        try:
            settings = await profile_repository.get_settings(user_id)
            if not settings:
                # Create default settings
                default_settings = {
                    "user_id": user_id,
                    "theme": "light",
                    "language": "English",
                    "email_notifications": True,
                    "security_alerts": True,
                    "lab_notifications": True,
                    "achievement_notifications": True
                }
                await profile_repository.create_or_update_settings(user_id, default_settings)
                return default_settings
            return settings
        except Exception as e:
            print(f"Error getting settings: {e}")
            return None
    
    @staticmethod
    async def update_user_settings(user_id: str, settings_data: Dict[str, Any]) -> bool:
        """
        Update user settings.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            settings_data: Settings data to update
            
        Returns:
            True if successful, False otherwise
        """
        try:
            return await profile_repository.create_or_update_settings(user_id, settings_data)
        except Exception as e:
            print(f"Error updating settings: {e}")
            return False
    
    @staticmethod
    async def change_password(user_id: str, old_password: str, new_password: str) -> tuple[bool, str]:
        """
        Change user password.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            old_password: Current password
            new_password: New password
            
        Returns:
            Tuple of (success, message)
        """
        try:
            # Get user
            user = await user_repository.get_user_by_id(user_id)
            if not user:
                return False, "User not found"
            
            # Verify old password
            if not password_service.verify_password(old_password, user["password_hash"]):
                return False, "Invalid old password"
            
            # Validate new password
            is_valid, error_message = password_service.validate_password_strength(new_password)
            if not is_valid:
                return False, error_message
            
            # Check if new password is common
            if password_service.is_password_common(new_password):
                return False, "Password is too common"
            
            # Hash new password
            new_password_hash = password_service.hash_password(new_password)
            
            # Update password
            success = await user_repository.update_user(user_id, {
                "password_hash": new_password_hash
            })
            
            if not success:
                return False, "Failed to update password"
            
            # Invalidate all sessions for security
            await session_service.close_all_user_sessions(user_id)
            await refresh_service.revoke_all_user_tokens(user_id)
            
            return True, "Password changed successfully"
        except Exception as e:
            print(f"Error changing password: {e}")
            return False, "Failed to change password"
    
    @staticmethod
    async def record_login_activity(user_id: str, ip_address: str, device: str, 
                                     status: str = "success", user_agent: str = None) -> bool:
        """
        Record login activity.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            ip_address: IP address
            device: Device name
            status: Login status (success, failed, suspicious)
            user_agent: User agent string
            
        Returns:
            True if successful, False otherwise
        """
        try:
            history_data = {
                "user_id": user_id,
                "ip_address": ip_address,
                "device": device,
                "status": status,
                "user_agent": user_agent
            }
            return await profile_repository.add_login_history(history_data) is not None
        except Exception as e:
            print(f"Error recording login activity: {e}")
            return False
    
    @staticmethod
    async def get_login_history(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get user login history.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            limit: Maximum number of entries
            
        Returns:
            List of login history entries
        """
        try:
            return await profile_repository.get_login_history(user_id, limit)
        except Exception as e:
            print(f"Error getting login history: {e}")
            return []


# Create singleton instance
profile_service = ProfileService()