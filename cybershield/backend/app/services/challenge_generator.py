from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from app.data.daily_templates import get_random_challenge, get_all_categories
from app.database.db import database
from app.services.error_log_service import fire_and_forget_log

CHALLENGE_COLLECTION = "security_challenges"


class ChallengeGenerator:
    """Generate and serve daily security challenges."""

    def __init__(self):
        self.categories = get_all_categories()

    def generate_daily_challenge(self, force_date: str = None) -> Dict[str, Any]:
        """Generate today's daily challenge dict (not persisted)."""
        import random

        challenge_date = force_date or datetime.now().strftime("%Y-%m-%d")
        challenge_id = f"DAY-{challenge_date}"

        category = random.choice(self.categories)
        challenge_template = get_random_challenge(category)

        if not challenge_template:
            raise Exception(f"No challenges found for category: {category}")

        created_at = datetime.now()
        expires_at = created_at + timedelta(hours=24)

        return {
            "challenge_id": challenge_id,
            "date": challenge_date,
            "category": category,
            "difficulty": challenge_template.get("difficulty", "Medium"),
            "title": challenge_template.get("title", "Daily Security Challenge"),
            "description": challenge_template.get("description", ""),
            "question": challenge_template.get("question", ""),
            "answer": challenge_template.get("answer", ""),
            "hint": challenge_template.get("hint", ""),
            "xp_reward": challenge_template.get("xp_reward", 100),
            "streak_bonus": self._calculate_streak_bonus(1),
            "expires_at": expires_at.isoformat(),
            "created_at": created_at.isoformat(),
        }

    async def get_or_create_today(self) -> Optional[Dict[str, Any]]:
        """Return today's persisted challenge, generating + persisting if missing."""
        today = datetime.now().strftime("%Y-%m-%d")

        try:
            doc = await database[CHALLENGE_COLLECTION].find_one({"date": today})
            if doc:
                doc.pop("_id", None)
                return doc
        except Exception as e:
            fire_and_forget_log()
            print(f"Error loading today's challenge from Mongo: {e}")

        challenge = self.generate_daily_challenge()
        try:
            await database[CHALLENGE_COLLECTION].update_one(
                {"date": challenge["date"]}, {"$set": challenge}, upsert=True
            )
        except Exception as e:
            fire_and_forget_log()
            print(f"Error saving today's challenge to Mongo: {e}")

        return challenge

    def get_time_remaining(self, challenge: Dict[str, Any]) -> int:
        """Get time remaining in seconds until the challenge expires."""
        expires_at = challenge.get("expires_at")
        if not expires_at:
            return 0

        try:
            expiry = datetime.fromisoformat(expires_at)
            return max(0, int((expiry - datetime.now()).total_seconds()))
        except Exception:
            fire_and_forget_log()
            return 0

    def _calculate_streak_bonus(self, streak: int) -> int:
        """Calculate streak bonus based on the user's current streak."""
        if streak <= 1:
            return 50
        elif streak == 2:
            return 50
        elif streak == 3:
            return 100
        elif streak == 7:
            return 150
        elif streak == 14:
            return 250
        elif streak >= 30:
            return 500
        else:
            return 100