"""
Dashboard service for aggregating user data from multiple collections.
"""
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from bson import ObjectId
from app.core.database import get_collection
from app.repositories.user_repository import user_repository
from app.repositories.github_repository import github_repository
from app.repositories.security_report_repository import security_report_repository
from app.repositories.owasp_repository import owasp_repository
from app.repositories.quiz_repository import quiz_repository
from app.repositories.chat_repository import chat_repository
from app.repositories.progress_repository import progress_repository
from app.repositories.challenge_repository import challenge_repository


class DashboardService:
    """Service for dashboard data aggregation."""
    
    def __init__(self):
        self.users_collection = get_collection("users")
        self.scans_collection = get_collection("scans")
        self.threat_reports_collection = get_collection("threat_reports")
        self.owasp_sessions_collection = get_collection("owasp_sessions")
        self.quiz_attempts_collection = get_collection("quiz_attempts")
        self.conversations_collection = get_collection("conversations")
        self.achievements_collection = get_collection("achievements")
        self.certificates_collection = get_collection("certificates")
        self.daily_challenges_collection = get_collection("daily_challenges")
        self.user_progress_collection = get_collection("user_progress")
    
    async def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """
        Get user profile information.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            User profile data
        """
        try:
            user = await user_repository.get_user_by_id(user_id)
            if not user:
                return {}
            
            # Get progress data
            progress = await progress_repository.get_progress_by_user(user_id)
            
            return {
                "user_id": user_id,
                "name": user.get("name"),
                "email": user.get("email"),
                "role": user.get("role", "student"),
                "level": progress.get("level", 1) if progress else 1,
                "xp": progress.get("xp", 0) if progress else 0,
                "skill": self._calculate_skill_level(progress.get("level", 1) if progress else 1),
                "created_at": user.get("created_at"),
                "last_login": user.get("last_login")
            }
        except Exception as e:
            print(f"Error getting user profile: {e}")
            return {}
    
    async def get_security_summary(self, user_id: str) -> Dict[str, Any]:
        """
        Get security scan summary for user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            Security summary data
        """
        try:
            # Get total scans
            total_scans = await self.scans_collection.count_documents({"user_id": user_id})
            
            # Get critical vulnerabilities found
            critical_count = 0
            async for scan in self.scans_collection.find({"user_id": user_id}):
                vulnerabilities = scan.get("vulnerabilities", [])
                critical_count += sum(1 for v in vulnerabilities if v.get("severity") == "critical")
            
            # Get recent scans
            recent_scans = []
            async for scan in self.scans_collection.find(
                {"user_id": user_id}
            ).sort("created_at", -1).limit(5):
                recent_scans.append({
                    "id": str(scan["_id"]),
                    "repository": scan.get("repository_name", "Unknown"),
                    "vulnerabilities": len(scan.get("vulnerabilities", [])),
                    "date": scan.get("created_at")
                })
            
            # Calculate risk score (0-100)
            risk_score = self._calculate_risk_score(total_scans, critical_count)
            
            return {
                "total_scans": total_scans,
                "critical_found": critical_count,
                "risk_score": risk_score,
                "recent_scans": recent_scans
            }
        except Exception as e:
            print(f"Error getting security summary: {e}")
            return {
                "total_scans": 0,
                "critical_found": 0,
                "risk_score": 0,
                "recent_scans": []
            }
    
    async def get_learning_progress(self, user_id: str) -> Dict[str, Any]:
        """
        Get learning progress for user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            Learning progress data
        """
        try:
            # Get completed labs
            labs_completed = await self.owasp_sessions_collection.count_documents({
                "user_id": user_id,
                "status": "completed"
            })
            
            # Get total labs attempted
            total_labs = await self.owasp_sessions_collection.count_documents({
                "user_id": user_id
            })
            
            # Get quiz statistics
            quiz_attempts = []
            async for quiz in self.quiz_attempts_collection.find(
                {"user_id": user_id}
            ).sort("completed_at", -1):
                quiz_attempts.append(quiz.get("score", 0))
            
            average_score = sum(quiz_attempts) / len(quiz_attempts) if quiz_attempts else 0
            best_score = max(quiz_attempts) if quiz_attempts else 0
            
            return {
                "labs_completed": labs_completed,
                "total_labs": total_labs,
                "quiz_score": round(average_score, 2),
                "best_quiz_score": best_score,
                "quizzes_attempted": len(quiz_attempts)
            }
        except Exception as e:
            print(f"Error getting learning progress: {e}")
            return {
                "labs_completed": 0,
                "total_labs": 0,
                "quiz_score": 0,
                "best_quiz_score": 0,
                "quizzes_attempted": 0
            }
    
    async def get_recent_activity(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get recent activity for user from multiple sources.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            limit: Maximum number of activities to return
            
        Returns:
            List of recent activities
        """
        try:
            activities = []
            
            # Get recent scans
            async for scan in self.scans_collection.find(
                {"user_id": user_id}
            ).sort("created_at", -1).limit(5):
                activities.append({
                    "type": "Security Scan",
                    "description": f"Scanned {scan.get('repository_name', 'Unknown')}",
                    "date": scan.get("created_at"),
                    "icon": "🔍"
                })
            
            # Get recent lab completions
            async for lab in self.owasp_sessions_collection.find(
                {"user_id": user_id, "status": "completed"}
            ).sort("completed_at", -1).limit(5):
                activities.append({
                    "type": "OWASP Lab",
                    "description": f"Completed {lab.get('lab_name', 'Unknown Lab')}",
                    "date": lab.get("completed_at"),
                    "icon": "🔬"
                })
            
            # Get recent quiz attempts
            async for quiz in self.quiz_attempts_collection.find(
                {"user_id": user_id}
            ).sort("completed_at", -1).limit(5):
                activities.append({
                    "type": "Quiz",
                    "description": f"Scored {quiz.get('score', 0)}% on {quiz.get('quiz_name', 'Quiz')}",
                    "date": quiz.get("completed_at"),
                    "icon": "📝"
                })
            
            # Sort by date and limit
            activities.sort(key=lambda x: x.get("date", datetime.min), reverse=True)
            return activities[:limit]
            
        except Exception as e:
            print(f"Error getting recent activity: {e}")
            return []
    
    async def get_achievements(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get user achievements.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            limit: Maximum number of achievements to return
            
        Returns:
            List of achievements
        """
        try:
            achievements = []
            async for achievement in self.achievements_collection.find(
                {"user_id": user_id}
            ).sort("earned_at", -1).limit(limit):
                achievements.append({
                    "id": str(achievement["_id"]),
                    "name": achievement.get("name"),
                    "description": achievement.get("description"),
                    "icon": achievement.get("icon", "🏆"),
                    "earned_at": achievement.get("earned_at")
                })
            return achievements
        except Exception as e:
            print(f"Error getting achievements: {e}")
            return []
    
    async def get_certificates(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get user certificates.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            limit: Maximum number of certificates to return
            
        Returns:
            List of certificates
        """
        try:
            certificates = []
            async for cert in self.certificates_collection.find(
                {"user_id": user_id}
            ).sort("issued_at", -1).limit(limit):
                certificates.append({
                    "id": str(cert["_id"]),
                    "name": cert.get("name"),
                    "description": cert.get("description"),
                    "issued_at": cert.get("issued_at"),
                    "expires_at": cert.get("expires_at")
                })
            return certificates
        except Exception as e:
            print(f"Error getting certificates: {e}")
            return []
    
    async def get_daily_challenge(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get today's challenge for user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            Daily challenge data or None
        """
        try:
            today = datetime.now(timezone.utc).date()
            
            challenge = await self.daily_challenges_collection.find_one({
                "user_id": user_id,
                "date": today.isoformat()
            })
            
            if not challenge:
                # Get a random challenge for today
                challenge = await challenge_repository.get_today_challenge(user_id)
            
            return challenge
        except Exception as e:
            print(f"Error getting daily challenge: {e}")
            return None
    
    async def get_dashboard_data(self, user_id: str) -> Dict[str, Any]:
        """
        Get complete dashboard data for user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            Complete dashboard data
        """
        try:
            # Fetch all data in parallel
            profile = await self.get_user_profile(user_id)
            security = await self.get_security_summary(user_id)
            learning = await self.get_learning_progress(user_id)
            activities = await self.get_recent_activity(user_id, limit=10)
            achievements = await self.get_achievements(user_id, limit=5)
            certificates = await self.get_certificates(user_id, limit=5)
            daily_challenge = await self.get_daily_challenge(user_id)
            
            return {
                "user": profile.get("name", "User"),
                "profile": {
                    "level": profile.get("level", 1),
                    "xp": profile.get("xp", 0),
                    "skill": profile.get("skill", "Beginner"),
                    "name": profile.get("name"),
                    "email": profile.get("email"),
                    "role": profile.get("role", "student")
                },
                "security": {
                    "total_scans": security.get("total_scans", 0),
                    "critical_found": security.get("critical_found", 0),
                    "risk_score": security.get("risk_score", 0),
                    "recent_scans": security.get("recent_scans", [])
                },
                "learning": {
                    "labs_completed": learning.get("labs_completed", 0),
                    "total_labs": learning.get("total_labs", 0),
                    "quiz_score": learning.get("quiz_score", 0),
                    "best_quiz_score": learning.get("best_quiz_score", 0),
                    "quizzes_attempted": learning.get("quizzes_attempted", 0)
                },
                "recent_activity": activities,
                "achievements": achievements,
                "certificates": certificates,
                "daily_challenge": daily_challenge
            }
            
        except Exception as e:
            print(f"Error getting dashboard data: {e}")
            import traceback
            traceback.print_exc()
            return {}
    
    def _calculate_skill_level(self, level: int) -> str:
        """Calculate skill level based on user level."""
        if level >= 10:
            return "Expert"
        elif level >= 7:
            return "Advanced"
        elif level >= 4:
            return "Intermediate"
        else:
            return "Beginner"
    
    def _calculate_risk_score(self, total_scans: int, critical_count: int) -> int:
        """
        Calculate risk score based on scans and vulnerabilities.
        
        Args:
            total_scans: Total number of scans
            critical_count: Number of critical vulnerabilities
            
        Returns:
            Risk score (0-100)
        """
        if total_scans == 0:
            return 0
        
        # Base score starts at 100 (good)
        score = 100
        
        # Deduct points for critical vulnerabilities
        score -= critical_count * 5
        
        # Ensure score is between 0 and 100
        return max(0, min(100, score))


# Create singleton instance
dashboard_service = DashboardService()