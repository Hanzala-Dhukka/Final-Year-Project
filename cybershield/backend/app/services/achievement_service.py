"""
Achievement Service - Badge System
Tracks and awards achievements for user actions
Uses MongoDB for data storage
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.services.mongo_service import save_achievement, get_user_achievements
from app.services.progress_service import ProgressService


class AchievementService:
    """Service for tracking and awarding achievements"""
    
    # Achievement definitions
    ACHIEVEMENTS = {
        "first_blood": {
            "name": "First Blood",
            "description": "Complete your first lab",
            "icon": "first_blood.png",
            "xp_reward": 50
        },
        "sql_hunter": {
            "name": "SQL Hunter",
            "description": "Complete all SQL injection labs",
            "icon": "sql_master.png",
            "xp_reward": 250
        },
        "xss_defender": {
            "name": "XSS Defender",
            "description": "Complete all XSS defense labs",
            "icon": "xss_master.png",
            "xp_reward": 250
        },
        "injection_master": {
            "name": "Injection Master",
            "description": "Complete all injection modules",
            "icon": "injection_master.png",
            "xp_reward": 500
        },
        "daily_warrior": {
            "name": "Daily Warrior",
            "description": "7-day streak",
            "icon": "daily_warrior.png",
            "xp_reward": 100
        },
        "cyber_explorer": {
            "name": "Cyber Explorer",
            "description": "Complete 20 labs",
            "icon": "explorer.png",
            "xp_reward": 300
        },
        "perfect_defender": {
            "name": "Perfect Defender",
            "description": "100% on 10 labs",
            "icon": "perfect.png",
            "xp_reward": 500
        },
        "ai_learner": {
            "name": "AI Learner",
            "description": "Use AI tutor 20 times",
            "icon": "ai_learner.png",
            "xp_reward": 200
        },
        "quiz_champion": {
            "name": "Quiz Champion",
            "description": "Score 100% on 10 quizzes",
            "icon": "quiz_champion.png",
            "xp_reward": 300
        },
        "security_professional": {
            "name": "Security Professional",
            "description": "Reach Expert skill level",
            "icon": "expert.png",
            "xp_reward": 1000
        },
        "streak_master": {
            "name": "Streak Master",
            "description": "30-day streak",
            "icon": "streak_master.png",
            "xp_reward": 500
        },
        "level_10": {
            "name": "Level 10 Master",
            "description": "Reach level 10",
            "icon": "level_10.png",
            "xp_reward": 500
        }
    }
    
    # In-memory storage for user achievements
    user_achievements: Dict[str, List[str]] = {}
    user_stats: Dict[str, Dict[str, Any]] = {}
    
    @classmethod
    def check_achievements(cls, user_id: str, action: str, 
                           category: Optional[str] = None,
                           score: int = 100) -> List[Dict[str, Any]]:
        """
        Check and award achievements for a user action
        
        Args:
            user_id: User identifier
            action: Action performed
            category: Optional category
            score: Score achieved
            
        Returns:
            List of newly unlocked achievements
        """
        if user_id not in cls.user_achievements:
            # Load from MongoDB
            try:
                cls.user_achievements[user_id] = get_user_achievements(user_id)
            except Exception:
                cls.user_achievements[user_id] = []
        
        if user_id not in cls.user_stats:
            cls.user_stats[user_id] = {
                "labs_completed": 0,
                "perfect_scores": 0,
                "ai_tutor_uses": 0,
                "quizzes_completed": 0,
                "streak_days": 0,
                "categories_completed": {}
            }
        
        stats = cls.user_stats[user_id]
        unlocked = []
        
        # Update stats based on action
        if action == "lab_completed":
            stats["labs_completed"] += 1
            if category:
                stats["categories_completed"][category] = stats["categories_completed"].get(category, 0) + 1
        
        if action == "perfect_score":
            stats["perfect_scores"] += 1
        
        if action == "ai_tutor_used":
            stats["ai_tutor_uses"] += 1
        
        if action == "quiz_completed":
            stats["quizzes_completed"] += 1
        
        if action == "streak_updated":
            stats["streak_days"] = score  # Using score as streak days
        
        # Check for achievements
        # First Blood
        if stats["labs_completed"] >= 1 and "first_blood" not in cls.user_achievements[user_id]:
            unlocked.append(cls._award_achievement(user_id, "first_blood"))
        
        # SQL Hunter
        sql_labs = stats["categories_completed"].get("SQL Injection", 0)
        if sql_labs >= 2 and "sql_hunter" not in cls.user_achievements[user_id]:
            unlocked.append(cls._award_achievement(user_id, "sql_hunter"))
        
        # XSS Defender
        xss_labs = stats["categories_completed"].get("XSS", 0)
        if xss_labs >= 2 and "xss_defender" not in cls.user_achievements[user_id]:
            unlocked.append(cls._award_achievement(user_id, "xss_defender"))
        
        # Injection Master (SQL + XSS + Command + CSRF + SSRF + IDOR)
        injection_categories = ["SQL Injection", "XSS", "Command Injection", "CSRF", "SSRF", "Insecure Direct Object Reference"]
        all_injection = all(stats["categories_completed"].get(cat, 0) >= 1 for cat in injection_categories)
        if all_injection and "injection_master" not in cls.user_achievements[user_id]:
            unlocked.append(cls._award_achievement(user_id, "injection_master"))
        
        # Daily Warrior (7-day streak)
        if stats["streak_days"] >= 7 and "daily_warrior" not in cls.user_achievements[user_id]:
            unlocked.append(cls._award_achievement(user_id, "daily_warrior"))
        
        # Streak Master (30-day streak)
        if stats["streak_days"] >= 30 and "streak_master" not in cls.user_achievements[user_id]:
            unlocked.append(cls._award_achievement(user_id, "streak_master"))
        
        # Cyber Explorer (20 labs)
        if stats["labs_completed"] >= 20 and "cyber_explorer" not in cls.user_achievements[user_id]:
            unlocked.append(cls._award_achievement(user_id, "cyber_explorer"))
        
        # Perfect Defender (10 perfect scores)
        if stats["perfect_scores"] >= 10 and "perfect_defender" not in cls.user_achievements[user_id]:
            unlocked.append(cls._award_achievement(user_id, "perfect_defender"))
        
        # AI Learner (20 AI tutor uses)
        if stats["ai_tutor_uses"] >= 20 and "ai_learner" not in cls.user_achievements[user_id]:
            unlocked.append(cls._award_achievement(user_id, "ai_learner"))
        
        # Quiz Champion (10 perfect quizzes)
        if stats["quizzes_completed"] >= 10 and "quiz_champion" not in cls.user_achievements[user_id]:
            unlocked.append(cls._award_achievement(user_id, "quiz_champion"))
        
        # Level 10
        progress = ProgressService.get_user_progress(user_id)
        if progress["level"] >= 10 and "level_10" not in cls.user_achievements[user_id]:
            unlocked.append(cls._award_achievement(user_id, "level_10"))
        
        # Security Professional (Expert skill level)
        if progress["average_score"] >= 90 and stats["labs_completed"] >= 40 and progress["xp"] >= 5000:
            if "security_professional" not in cls.user_achievements[user_id]:
                unlocked.append(cls._award_achievement(user_id, "security_professional"))
        
        return unlocked
    
    @classmethod
    def _award_achievement(cls, user_id: str, achievement_key: str) -> Dict[str, Any]:
        """Award an achievement to a user"""
        achievement = cls.ACHIEVEMENTS.get(achievement_key, {})
        
        # Add to user's achievements
        cls.user_achievements[user_id].append(achievement_key)
        
        # Save to MongoDB
        try:
            save_achievement(
                user_id=user_id,
                badge=achievement.get("name", achievement_key),
                date=datetime.now().isoformat()
            )
        except Exception as e:
            print(f"Error saving achievement to MongoDB: {e}")
        
        # Add XP reward
        ProgressService.add_xp(user_id, "achievement", score=100)
        
        return {
            "badge_id": achievement_key,
            "badge_name": achievement.get("name", achievement_key),
            "description": achievement.get("description", ""),
            "xp_reward": achievement.get("xp_reward", 0),
            "date": datetime.now().isoformat()
        }
    
    @classmethod
    def get_user_achievements(cls, user_id: str) -> List[str]:
        """Get all achievements for a user"""
        if user_id not in cls.user_achievements:
            try:
                cls.user_achievements[user_id] = get_user_achievements(user_id)
            except Exception:
                cls.user_achievements[user_id] = []
        return cls.user_achievements.get(user_id, [])
    
    @classmethod
    def get_all_achievements(cls) -> List[Dict[str, Any]]:
        """Get all available achievements"""
        return [
            {
                "key": key,
                "name": data["name"],
                "description": data["description"],
                "icon": data["icon"],
                "xp_reward": data["xp_reward"]
            }
            for key, data in cls.ACHIEVEMENTS.items()
        ]


# Standalone functions
def check_achievements(user_id: str, action: str, 
                     category: Optional[str] = None,
                     score: int = 100) -> List[Dict[str, Any]]:
    """Check and award achievements"""
    return AchievementService.check_achievements(user_id, action, category, score)


def get_achievements(user_id: str) -> List[str]:
    """Get user achievements"""
    return AchievementService.get_user_achievements(user_id)


def get_all_achievements() -> List[Dict[str, Any]]:
    """Get all achievements"""
    return AchievementService.get_all_achievements()