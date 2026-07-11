"""
Progress Service - XP & Level System
Tracks user XP, levels, and progress
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.services.mongo_service import (
    save_user_progress,
    get_user_progress,
    get_all_users_progress
)
from app.services.google_sheets_service import get_user_progress_from_sheet


class ProgressService:
    """Main service for tracking user progress, XP, and levels"""
    
    # XP values for different actions
    XP_VALUES = {
        "daily_challenge": 100,
        "attack_lab": 75,
        "defense_lab": 75,
        "quiz": 25,
        "ai_practice": 20,
        "perfect_score_bonus": 25,
        "streak_7_day": 100,
        "streak_30_day": 500
    }
    
    # Level thresholds (XP required for each level)
    LEVEL_THRESHOLDS = {
        1: 0,
        2: 250,
        3: 600,
        4: 1000,
        5: 1500,
        6: 2100,
        7: 2800,
        8: 3600,
        9: 4500,
        10: 5500,
        11: 6600,
        12: 7800,
        13: 9100,
        14: 10500,
        15: 12000,
        16: 13600,
        17: 15300,
        18: 17100,
        19: 19000,
        20: 21000
    }
    
    # In-memory storage for user progress
    user_progress: Dict[str, Dict[str, Any]] = {}
    
    @classmethod
    def calculate_level(cls, total_xp: int) -> int:
        """
        Calculate user level based on total XP
        
        Args:
            total_xp: Total XP earned by user
            
        Returns:
            Current level (1-20)
        """
        level = 1
        for lvl, threshold in sorted(cls.LEVEL_THRESHOLDS.items()):
            if total_xp >= threshold:
                level = lvl
            else:
                break
        return level
    
    @classmethod
    def get_xp_to_next_level(cls, total_xp: int) -> int:
        """Get XP needed to reach next level"""
        current_level = cls.calculate_level(total_xp)
        if current_level >= 20:
            return 0
        next_threshold = cls.LEVEL_THRESHOLDS.get(current_level + 1, 0)
        return next_threshold - total_xp
    
    @classmethod
    def get_level_progress(cls, total_xp: int) -> float:
        """Get progress percentage to next level"""
        current_level = cls.calculate_level(total_xp)
        if current_level >= 20:
            return 100.0
        
        current_threshold = cls.LEVEL_THRESHOLDS.get(current_level, 0)
        next_threshold = cls.LEVEL_THRESHOLDS.get(current_level + 1, 0)
        
        if next_threshold == current_threshold:
            return 100.0
        
        progress = ((total_xp - current_threshold) / (next_threshold - current_threshold)) * 100
        return min(100.0, max(0.0, progress))
    
    @classmethod
    def add_xp(cls, user_id: str, action: str, score: int = 100, 
               perfect_score: bool = False, streak_days: int = 0) -> Dict[str, Any]:
        """
        Add XP for a user action
        
        Args:
            user_id: User identifier
            action: Action type (daily_challenge, attack_lab, etc.)
            score: Score achieved (0-100)
            perfect_score: Whether the user got a perfect score
            streak_days: Current streak days
            
        Returns:
            XP update result
        """
        # Get base XP for action
        base_xp = cls.XP_VALUES.get(action, 0)
        
        # Calculate XP based on score (partial credit)
        xp_earned = int(base_xp * (score / 100))
        
        # Add perfect score bonus
        bonus_xp = 0
        if perfect_score:
            bonus_xp += cls.XP_VALUES.get("perfect_score_bonus", 25)
        
        # Add streak bonus
        if streak_days >= 30:
            bonus_xp += cls.XP_VALUES.get("streak_30_day", 500)
        elif streak_days >= 7:
            bonus_xp += cls.XP_VALUES.get("streak_7_day", 100)
        
        total_xp_earned = xp_earned + bonus_xp
        
        # Get or create user progress
        if user_id not in cls.user_progress:
            cls.user_progress[user_id] = {
                "total_xp": 0,
                "level": 1,
                "completed_labs": 0,
                "average_score": 0.0,
                "scores": [],
                "last_login": datetime.now().isoformat()
            }
        
        user_data = cls.user_progress[user_id]
        old_level = user_data["level"]
        
        # Update XP
        user_data["total_xp"] += total_xp_earned
        user_data["level"] = cls.calculate_level(user_data["total_xp"])
        user_data["last_login"] = datetime.now().isoformat()
        
        # Update scores for average calculation
        if action in ["attack_lab", "defense_lab", "quiz"]:
            user_data["scores"].append(score)
            user_data["average_score"] = sum(user_data["scores"]) / len(user_data["scores"])
        
        # Save to MongoDB
        try:
            skill = _get_skill_from_xp(user_data["total_xp"], user_data["average_score"], user_data["completed_labs"])
            save_user_progress(
                user_id=user_id,
                xp=user_data["total_xp"],
                level=user_data["level"],
                labs=user_data["completed_labs"],
                avg_score=user_data["average_score"],
                skill=skill,
                last_login=user_data["last_login"]
            )
        except Exception as e:
            print(f"Error saving progress to MongoDB: {e}")
        
        return {
            "success": True,
            "xp_earned": total_xp_earned,
            "base_xp": xp_earned,
            "bonus_xp": bonus_xp,
            "total_xp": user_data["total_xp"],
            "level_up": user_data["level"] > old_level,
            "new_level": user_data["level"] if user_data["level"] > old_level else None
        }
    
    @classmethod
    def get_user_progress(cls, user_id: str) -> Dict[str, Any]:
        """
        Get user progress data
        
        Args:
            user_id: User identifier
            
        Returns:
            User progress data
        """
        if user_id not in cls.user_progress:
            # Try to load from Google Sheets
            try:
                sheet_data = get_user_progress_from_sheet(user_id)
                if sheet_data:
                    cls.user_progress[user_id] = sheet_data
                else:
                    cls.user_progress[user_id] = {
                        "total_xp": 0,
                        "level": 1,
                        "completed_labs": 0,
                        "average_score": 0.0,
                        "scores": [],
                        "last_login": datetime.now().isoformat()
                    }
            except Exception as e:
                print(f"Error loading progress from sheet: {e}")
                cls.user_progress[user_id] = {
                    "total_xp": 0,
                    "level": 1,
                    "completed_labs": 0,
                    "average_score": 0.0,
                    "scores": [],
                    "last_login": datetime.now().isoformat()
                }
        
        user_data = cls.user_progress[user_id]
        
        return {
            "user_id": user_id,
            "xp": user_data["total_xp"],
            "level": user_data["level"],
            "xp_to_next": cls.get_xp_to_next_level(user_data["total_xp"]),
            "level_progress": cls.get_level_progress(user_data["total_xp"]),
            "completed_labs": user_data["completed_labs"],
            "average_score": user_data["average_score"]
        }
    
    @classmethod
    def increment_lab_count(cls, user_id: str) -> None:
        """Increment completed labs count for a user"""
        if user_id not in cls.user_progress:
            cls.get_user_progress(user_id)
        
        cls.user_progress[user_id]["completed_labs"] += 1
    
    @classmethod
    def get_leaderboard(cls, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get top users by XP
        
        Args:
            limit: Maximum number of users to return
            
        Returns:
            List of top users
        """
        sorted_users = sorted(
            cls.user_progress.items(),
            key=lambda x: x[1]["total_xp"],
            reverse=True
        )
        
        return [
            {
                "user_id": user_id,
                "xp": data["total_xp"],
                "level": data["level"],
                "completed_labs": data["completed_labs"]
            }
            for user_id, data in sorted_users[:limit]
        ]


def _get_skill_from_xp(xp: int, avg_score: float, labs: int) -> str:
    """Determine skill level from XP and stats"""
    if avg_score >= 90 and labs >= 40 and xp >= 5000:
        return "Security Professional"
    elif avg_score >= 80 and labs >= 20:
        return "Expert"
    elif avg_score >= 60 and labs >= 10:
        return "Advanced"
    elif avg_score >= 40 and labs >= 5:
        return "Intermediate"
    else:
        return "Beginner"


# Standalone functions for router compatibility
def add_xp(user_id: str, action: str, score: int = 100, 
           perfect_score: bool = False, streak_days: int = 0) -> Dict[str, Any]:
    """Add XP for a user action"""
    return ProgressService.add_xp(user_id, action, score, perfect_score, streak_days)


def get_progress(user_id: str) -> Dict[str, Any]:
    """Get user progress"""
    return ProgressService.get_user_progress(user_id)


def get_leaderboard(limit: int = 10) -> List[Dict[str, Any]]:
    """Get leaderboard"""
    return ProgressService.get_leaderboard(limit)
