from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from app.data.daily_templates import get_random_challenge, get_all_categories
from app.services.google_sheets_service import save_daily_challenge_to_sheet
import uuid


class ChallengeGenerator:
    """Generate daily security challenges"""
    
    def __init__(self):
        self.categories = get_all_categories()
    
    def generate_daily_challenge(self, force_date: str = None) -> Dict[str, Any]:
        """
        Generate today's daily challenge
        
        Args:
            force_date: Optional date string (YYYY-MM-DD) for testing
        
        Returns:
            Daily challenge dictionary
        """
        # Get today's date
        if force_date:
            challenge_date = force_date
        else:
            challenge_date = datetime.now().strftime("%Y-%m-%d")
        
        # Generate challenge ID
        challenge_id = f"DAY-{challenge_date}"
        
        # Get random category and challenge
        import random
        category = random.choice(self.categories)
        challenge_template = get_random_challenge(category)
        
        if not challenge_template:
            raise Exception(f"No challenges found for category: {category}")
        
        # Calculate expiration (24 hours from now)
        created_at = datetime.now()
        expires_at = created_at + timedelta(hours=24)
        
        # Calculate streak bonus
        streak_bonus = self._calculate_streak_bonus(1)  # Will be updated based on user streak
        
        # Create daily challenge
        challenge = {
            "challenge_id": challenge_id,
            "date": challenge_date,
            "category": category,
            "difficulty": challenge_template["difficulty"],
            "title": challenge_template["title"],
            "description": challenge_template["description"],
            "question": challenge_template["question"],
            "answer": challenge_template["answer"],
            "hint": challenge_template.get("hint", ""),
            "xp_reward": challenge_template["xp_reward"],
            "streak_bonus": streak_bonus,
            "expires_at": expires_at.isoformat(),
            "created_at": created_at.isoformat()
        }
        
        # Save to Google Sheets
        self._save_challenge_to_sheet(challenge)
        
        return challenge
    
    def get_today_challenge(self) -> Optional[Dict[str, Any]]:
        """
        Get today's challenge from storage
        
        Returns:
            Today's challenge or None if not found
        """
        try:
            from app.services.google_sheets_service import get_google_sheets_client
            gc = get_google_sheets_client()
            
            if not gc:
                return None
            
            from app.config.settings import settings
            sheet_id = settings.GOOGLE_SHEETS_ID
            if not sheet_id:
                return None
            
            sh = gc.open_by_key(sheet_id)
            
            # Get DailyChallenges worksheet
            try:
                worksheet = sh.worksheet("DailyChallenges")
            except Exception:
                return None
            
            # Get today's date
            today = datetime.now().strftime("%Y-%m-%d")
            
            # Find today's challenge
            records = worksheet.get_all_records()
            for record in records:
                if record.get("Date") == today:
                    return {
                        "challenge_id": record.get("Challenge ID"),
                        "date": record.get("Date"),
                        "category": record.get("Category"),
                        "difficulty": record.get("Difficulty"),
                        "title": record.get("Title"),
                        "description": record.get("Description"),
                        "question": record.get("Question"),
                        "answer": record.get("Answer"),
                        "hint": record.get("Hint", ""),
                        "xp_reward": int(record.get("XP", 100)),
                        "streak_bonus": int(record.get("Streak Bonus", 0)),
                        "expires_at": record.get("Expires At"),
                        "created_at": record.get("Created At")
                    }
            
            return None
        except Exception as e:
            print(f"Error getting today's challenge: {e}")
            return None
    
    def _calculate_streak_bonus(self, streak_days: int) -> int:
        """
        Calculate XP bonus based on streak
        
        Args:
            streak_days: Number of consecutive days
        
        Returns:
            Bonus XP amount
        """
        if streak_days >= 30:
            return 500
        elif streak_days >= 14:
            return 250
        elif streak_days >= 7:
            return 150
        elif streak_days >= 3:
            return 100
        else:
            return 50
    
    def _save_challenge_to_sheet(self, challenge: Dict[str, Any]):
        """Save challenge to Google Sheets"""
        try:
            save_daily_challenge_to_sheet(
                challenge_id=challenge["challenge_id"],
                date=challenge["date"],
                category=challenge["category"],
                difficulty=challenge["difficulty"],
                title=challenge["title"],
                description=challenge["description"],
                question=challenge["question"],
                answer=challenge["answer"],
                xp_reward=challenge["xp_reward"],
                streak_bonus=challenge["streak_bonus"],
                hint=challenge.get("hint", "")
            )
        except Exception as e:
            print(f"Error saving challenge to sheet: {e}")
            # Don't fail if Google Sheets is unavailable
    
    def is_challenge_expired(self, challenge: Dict[str, Any]) -> bool:
        """
        Check if challenge has expired
        
        Args:
            challenge: Challenge dictionary
        
        Returns:
            True if expired, False otherwise
        """
        if not challenge.get("expires_at"):
            return False
        
        expires_at = datetime.fromisoformat(challenge["expires_at"])
        return datetime.now() > expires_at
    
    def get_time_remaining(self, challenge: Dict[str, Any]) -> str:
        """
        Get time remaining for challenge
        
        Args:
            challenge: Challenge dictionary
        
        Returns:
            Time remaining string (e.g., "18h 42m 12s")
        """
        if not challenge.get("expires_at"):
            return "Unknown"
        
        expires_at = datetime.fromisoformat(challenge["expires_at"])
        remaining = expires_at - datetime.now()
        
        if remaining.total_seconds() <= 0:
            return "Expired"
        
        hours = int(remaining.total_seconds() // 3600)
        minutes = int((remaining.total_seconds() % 3600) // 60)
        seconds = int(remaining.total_seconds() % 60)
        
        if hours > 0:
            return f"{hours}h {minutes}m {seconds}s"
        elif minutes > 0:
            return f"{minutes}m {seconds}s"
        else:
            return f"{seconds}s"
    
    def validate_challenge_answer(self, challenge: Dict[str, Any], user_answer: str) -> Dict[str, Any]:
        """
        Validate user's answer to challenge
        
        Args:
            challenge: Challenge dictionary
            user_answer: User's submitted answer
        
        Returns:
            Validation result
        """
        correct_answer = challenge.get("answer", "").lower().strip()
        user_answer_clean = user_answer.lower().strip()
        
        # Simple string matching (can be enhanced with fuzzy matching)
        is_correct = correct_answer in user_answer_clean or user_answer_clean in correct_answer
        
        return {
            "is_correct": is_correct,
            "correct_answer": challenge.get("answer"),
            "user_answer": user_answer
        }