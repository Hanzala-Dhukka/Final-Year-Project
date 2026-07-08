"""
Security score service for calculating user security health.
"""
from datetime import datetime, timezone
from typing import Dict, List, Any
from app.repositories.profile_repository import profile_repository
from app.repositories.user_repository import user_repository
from app.repositories.progress_repository import progress_repository
from app.repositories.lab_repository import lab_repository
from app.repositories.quiz_repository import quiz_repository
from app.services.password_service import password_service


class SecurityScoreService:
    """Service for security score calculations."""
    
    @staticmethod
    async def calculate_security_score(user_id: str) -> Dict[str, Any]:
        """
        Calculate comprehensive security score for user.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            Security score data
        """
        try:
            # Get user data
            user = await user_repository.get_user_by_id(user_id)
            if not user:
                return None
            
            factors = {}
            recommendations = []
            
            # 1. Password Security (0-20 points)
            password_score, password_recs = SecurityScoreService._calculate_password_score(user)
            factors["password_strength"] = password_score
            recommendations.extend(password_recs)
            
            # 2. Labs Completed (0-30 points)
            lab_score, lab_recs = await SecurityScoreService._calculate_lab_score(user_id)
            factors["labs_completed"] = lab_score
            recommendations.extend(lab_recs)
            
            # 3. Security Learning (0-25 points)
            learning_score, learning_recs = await SecurityScoreService._calculate_learning_score(user_id)
            factors["security_learning"] = learning_score
            recommendations.extend(learning_recs)
            
            # 4. Account Security (0-25 points)
            account_score, account_recs = SecurityScoreService._calculate_account_security_score(user)
            factors["account_security"] = account_score
            recommendations.extend(account_recs)
            
            # Calculate total score
            total_score = sum(factors.values())
            
            # Determine level
            if total_score >= 80:
                level = "Expert"
            elif total_score >= 60:
                level = "Advanced"
            elif total_score >= 40:
                level = "Intermediate"
            else:
                level = "Beginner"
            
            # Save score to database
            score_data = {
                "user_id": user_id,
                "score": total_score,
                "level": level,
                "factors": factors,
                "recommendations": recommendations[:5]  # Top 5 recommendations
            }
            await profile_repository.create_or_update_security_score(user_id, score_data)
            
            return {
                "score": total_score,
                "level": level,
                "factors": factors,
                "recommendations": recommendations[:5],
                "calculated_at": datetime.now(timezone.utc)
            }
        except Exception as e:
            print(f"Error calculating security score: {e}")
            return None
    
    @staticmethod
    def _calculate_password_score(user: Dict[str, Any]) -> tuple[int, List[str]]:
        """Calculate password security score."""
        score = 0
        recommendations = []
        
        # This is a simplified check - in production, you'd need the actual password
        # For now, we'll check if password_hash exists and assume it's hashed
        if user.get("password_hash"):
            score = 15
            recommendations.append("Use a strong, unique password")
        
        # Check if password was recently changed (would need login history)
        # For now, give partial points
        if user.get("password_hash"):
            score += 5
        
        if score < 20:
            recommendations.append("Update your password to a stronger one")
        
        return score, recommendations
    
    @staticmethod
    async def _calculate_lab_score(user_id: str) -> tuple[int, List[str]]:
        """Calculate lab completion score."""
        score = 0
        recommendations = []
        
        try:
            # Get lab attempts
            lab_attempts = await lab_repository.get_lab_attempts_by_user(user_id, limit=1000)
            completed_labs = len([a for a in lab_attempts if a.get("status") == "completed"])
            
            # Score: 2 points per lab, max 30
            score = min(completed_labs * 2, 30)
            
            if completed_labs < 5:
                recommendations.append("Complete more security labs to improve your score")
            if completed_labs < 10:
                recommendations.append("Try advanced labs like CSRF and SQL Injection")
        except Exception as e:
            print(f"Error calculating lab score: {e}")
        
        return score, recommendations
    
    @staticmethod
    async def _calculate_learning_score(user_id: str) -> tuple[int, List[str]]:
        """Calculate security learning score."""
        score = 0
        recommendations = []
        
        try:
            # Get quiz attempts
            quiz_attempts = await quiz_repository.get_quiz_attempts_by_user(user_id, limit=1000)
            
            if quiz_attempts:
                # Calculate average score
                avg_score = sum(q.get("score", 0) for q in quiz_attempts) / len(quiz_attempts)
                
                # Score based on average quiz performance
                if avg_score >= 80:
                    score = 25
                elif avg_score >= 60:
                    score = 20
                elif avg_score >= 40:
                    score = 15
                else:
                    score = 10
                    recommendations.append("Review security concepts and retake quizzes")
            else:
                recommendations.append("Complete security quizzes to test your knowledge")
            
            # Bonus for completing many quizzes
            if len(quiz_attempts) >= 10:
                score = min(score + 5, 25)
        except Exception as e:
            print(f"Error calculating learning score: {e}")
        
        return score, recommendations
    
    @staticmethod
    def _calculate_account_security_score(user: Dict[str, Any]) -> tuple[int, List[str]]:
        """Calculate account security score."""
        score = 0
        recommendations = []
        
        # Account age (5 points)
        created_at = user.get("created_at")
        if created_at:
            account_age_days = (datetime.now(timezone.utc) - created_at).days
            if account_age_days >= 30:
                score += 5
            elif account_age_days >= 7:
                score += 3
                recommendations.append("Maintain your account for better security score")
        
        # Account verification (10 points)
        if user.get("is_verified"):
            score += 10
        else:
            recommendations.append("Verify your email address")
        
        # Active status (10 points)
        if user.get("account_status") == "active":
            score += 10
        
        if score < 25:
            recommendations.append("Complete your profile and verify your account")
        
        return score, recommendations
    
    @staticmethod
    async def get_security_score(user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user security score.
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            Security score data
        """
        try:
            score = await profile_repository.get_security_score(user_id)
            if not score:
                # Calculate if doesn't exist
                return await SecurityScoreService.calculate_security_score(user_id)
            return score
        except Exception as e:
            print(f"Error getting security score: {e}")
            return None


# Create singleton instance
security_score_service = SecurityScoreService()