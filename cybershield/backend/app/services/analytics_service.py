"""
Analytics Service - Learning Analytics Engine
Calculates user analytics, category mastery, and learning patterns
Uses MongoDB for data storage
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.services.progress_service import ProgressService
from app.services.mongo_service import save_lab_attempt, get_user_lab_attempts
from app.data.attack_labs import get_all_categories


class AnalyticsService:
    """Service for calculating learning analytics"""
    
    # In-memory storage for lab attempts (fallback)
    lab_attempts: Dict[str, List[Dict[str, Any]]] = {}
    
    @classmethod
    def record_lab_attempt(cls, user_id: str, lab_id: str, category: str, 
                          score: int, attempts: int, success: bool) -> None:
        """Record a lab attempt for analytics"""
        # Store in memory
        if user_id not in cls.lab_attempts:
            cls.lab_attempts[user_id] = []
        
        cls.lab_attempts[user_id].append({
            "lab_id": lab_id,
            "category": category,
            "score": score,
            "attempts": attempts,
            "success": success,
            "timestamp": datetime.now().isoformat()
        })
        
        # Save to MongoDB
        try:
            save_lab_attempt(user_id, lab_id, category, score, attempts, success)
        except Exception as e:
            print(f"Error saving lab attempt to MongoDB: {e}")
    
    @classmethod
    def get_learning_analytics(cls, user_id: str) -> Dict[str, Any]:
        """
        Get comprehensive learning analytics for a user
        
        Args:
            user_id: User identifier
            
        Returns:
            Analytics data
        """
        # Get user progress
        progress = ProgressService.get_user_progress(user_id)
        
        # Get lab attempts from MongoDB
        attempts = get_user_lab_attempts(user_id)
        
        # If no MongoDB data, use in-memory
        if not attempts:
            attempts = cls.lab_attempts.get(user_id, [])
        
        # Calculate metrics
        total_attempts = len(attempts)
        successful_attempts = sum(1 for a in attempts if a.get("success", False))
        average_score = sum(a.get("score", 0) for a in attempts) / total_attempts if total_attempts > 0 else 0
        average_attempts = sum(a.get("attempts", 0) for a in attempts) / total_attempts if total_attempts > 0 else 0
        
        # Get category performance
        category_stats = {}
        for attempt in attempts:
            cat = attempt.get("category", "Unknown")
            if cat not in category_stats:
                category_stats[cat] = {"scores": [], "completed": 0, "total": 0}
            category_stats[cat]["scores"].append(attempt.get("score", 0))
            category_stats[cat]["total"] += 1
            if attempt.get("success", False):
                category_stats[cat]["completed"] += 1
        
        # Find weakest and strongest categories
        weakest_category = None
        strongest_category = None
        lowest_avg = 100
        highest_avg = 0
        
        for cat, stats in category_stats.items():
            avg = sum(stats["scores"]) / len(stats["scores"]) if stats["scores"] else 0
            if avg < lowest_avg:
                lowest_avg = avg
                weakest_category = cat
            if avg > highest_avg:
                highest_avg = avg
                strongest_category = cat
        
        # Get streak info
        streak_info = cls._get_streak_info(user_id)
        
        return {
            "user_id": user_id,
            "average_score": round(average_score, 2),
            "completed_labs": progress["completed_labs"],
            "total_labs": len(get_all_categories()) * 2,  # Assuming 2 labs per category
            "weakest_category": weakest_category,
            "strongest_category": strongest_category,
            "average_attempts": round(average_attempts, 2),
            "total_xp": progress["xp"],
            "current_streak": streak_info["current"],
            "longest_streak": streak_info["longest"],
            "completed_challenges": successful_attempts
        }
    
    @classmethod
    def get_category_mastery(cls, user_id: str) -> List[Dict[str, Any]]:
        """
        Get category mastery percentages
        
        Args:
            user_id: User identifier
            
        Returns:
            List of category mastery data
        """
        # Get lab attempts from MongoDB
        attempts = get_user_lab_attempts(user_id)
        
        # If no MongoDB data, use in-memory
        if not attempts:
            attempts = cls.lab_attempts.get(user_id, [])
        
        # Get all categories
        all_categories = get_all_categories()
        
        # Calculate mastery for each category
        category_mastery = []
        for category in all_categories:
            cat_attempts = [a for a in attempts if a.get("category") == category]
            completed = sum(1 for a in cat_attempts if a.get("success", False))
            total = len(cat_attempts)
            
            if total > 0:
                avg_score = sum(a.get("score", 0) for a in cat_attempts) / total
                mastery = avg_score
            else:
                mastery = 0
            
            # Color based on mastery
            if mastery >= 80:
                color = "green"
            elif mastery >= 60:
                color = "yellow"
            elif mastery >= 40:
                color = "orange"
            else:
                color = "red"
            
            category_mastery.append({
                "category": category,
                "mastery_percentage": round(mastery, 1),
                "completed": completed,
                "total": total,
                "color": color
            })
        
        return category_mastery
    
    @classmethod
    def _get_streak_info(cls, user_id: str) -> Dict[str, int]:
        """Get streak information for a user"""
        # This would integrate with the streak service
        # For now, return placeholder data
        return {
            "current": 0,
            "longest": 0
        }
    
    @classmethod
    def get_xp_growth(cls, user_id: str, weeks: int = 4) -> List[Dict[str, Any]]:
        """
        Get XP growth over time
        
        Args:
            user_id: User identifier
            weeks: Number of weeks to analyze
            
        Returns:
            XP growth data
        """
        attempts = get_user_lab_attempts(user_id)
        
        # If no MongoDB data, use in-memory
        if not attempts:
            attempts = cls.lab_attempts.get(user_id, [])
        
        # Group by week
        weekly_xp = {}
        for attempt in attempts:
            timestamp = datetime.fromisoformat(attempt.get("timestamp", datetime.now().isoformat()))
            week_num = (timestamp.day // 7) + 1
            week_key = f"Week {week_num}"
            
            if week_key not in weekly_xp:
                weekly_xp[week_key] = 0
            weekly_xp[week_key] += attempt.get("score", 0)
        
        return [
            {"week": week, "xp": xp}
            for week, xp in sorted(weekly_xp.items())
        ]


# Standalone functions
def get_analytics(user_id: str) -> Dict[str, Any]:
    """Get user analytics"""
    return AnalyticsService.get_learning_analytics(user_id)


def get_category_mastery(user_id: str) -> List[Dict[str, Any]]:
    """Get category mastery"""
    return AnalyticsService.get_category_mastery(user_id)


def record_attempt(user_id: str, lab_id: str, category: str, 
                   score: int, attempts: int, success: bool) -> None:
    """Record lab attempt"""
    AnalyticsService.record_lab_attempt(user_id, lab_id, category, score, attempts, success)