from typing import Dict, Any, List
from datetime import datetime, timedelta
from app.database.db import database

COMPLETIONS_COLLECTION = "challenge_completions"


class StreakService:
    """Manage user streaks and daily challenge completion records (MongoDB)."""

    def __init__(self):
        self.streak_bonuses = {
            1: 50,      # Day 1
            2: 50,      # Day 2
            3: 100,     # Day 3+ bonus
            7: 150,     # Week bonus
            14: 250,    # 2 weeks bonus
            30: 500     # Month bonus
        }

    async def is_completed(self, user_id: str, date: str) -> bool:
        """Check whether a user already completed the challenge on a given date."""
        try:
            doc = await database[COMPLETIONS_COLLECTION].find_one(
                {"user_id": user_id, "date": date}
            )
            return doc is not None
        except Exception as e:
            print(f"Error checking completion: {e}")
            return False

    async def _completion_dates(self, user_id: str) -> List[str]:
        """Fetch all completion dates for a user, sorted ascending."""
        dates = []
        try:
            cursor = database[COMPLETIONS_COLLECTION].find(
                {"user_id": user_id}, {"date": 1}
            )
            async for doc in cursor:
                if doc.get("date"):
                    dates.append(str(doc["date"]).strip())
        except Exception as e:
            print(f"Error fetching completion dates: {e}")
        return sorted(set(dates))

    async def get_user_streak(self, user_id: str) -> Dict[str, Any]:
        """Get the user's current streak, longest streak and total XP."""
        try:
            dates = await self._completion_dates(user_id)
            if not dates:
                return self._get_default_streak(user_id)

            streak_info = self._calculate_streak(dates)

            total_xp = 0
            cursor = database[COMPLETIONS_COLLECTION].find(
                {"user_id": user_id},
                {"xp_earned": 1, "streak_bonus": 1},
            )
            async for doc in cursor:
                total_xp += int(doc.get("xp_earned", 0) or 0)
                total_xp += int(doc.get("streak_bonus", 0) or 0)

            return {
                "user_id": user_id,
                "current_streak": streak_info["current_streak"],
                "longest_streak": streak_info["longest_streak"],
                "total_xp": total_xp,
                "last_completed_date": dates[-1],
            }
        except Exception as e:
            print(f"Error fetching streak: {e}")
            return self._get_default_streak(user_id)

    def get_streak_bonus(self, streak: int) -> int:
        """Get streak bonus for a given streak number."""
        bonus = self.streak_bonuses.get(streak, 100)
        return max(bonus, 50)

    async def record_challenge_completion(
        self,
        user_id: str,
        challenge_id: str,
        date: str,
        score: int,
        time_taken: int,
        xp_earned: int,
        streak: int,
        challenge_name: str,
        category: str = "",
        difficulty: str = "",
        answered_payload: str = "",
    ) -> Dict[str, Any]:
        """Record a completed challenge and return updated streak info."""
        try:
            streak_bonus = self.get_streak_bonus(streak)

            doc = {
                "user_id": user_id,
                "challenge_id": challenge_id,
                "date": date,
                "score": score,
                "time_taken": time_taken,
                "xp_earned": xp_earned,
                "streak_bonus": streak_bonus,
                "streak": streak,
                "challenge_name": challenge_name,
                "category": category,
                "difficulty": difficulty,
                "answered_payload": answered_payload,
                "created_at": datetime.now().isoformat(),
            }

            # Idempotent per user+date: a single completion record per day.
            await database[COMPLETIONS_COLLECTION].update_one(
                {"user_id": user_id, "date": date},
                {"$set": doc},
                upsert=True,
            )
        except Exception as e:
            print(f"Error recording challenge: {e}")

        return await self.get_user_streak(user_id)

    def _get_default_streak(self, user_id: str) -> Dict[str, Any]:
        return {
            "user_id": user_id,
            "current_streak": 0,
            "longest_streak": 0,
            "total_xp": 0,
            "last_completed_date": None,
        }

    def _calculate_streak(self, dates: List[str]) -> Dict[str, Any]:
        """Calculate current and longest streak from sorted date strings."""
        if not dates:
            return {"current_streak": 0, "longest_streak": 0}

        date_set = set(dates)
        longest = 0

        # The records are already unique & sorted; consecutive runs.
        run = 1
        for i in range(1, len(dates) + 1):
            if i < len(dates) and self._is_consecutive(dates[i - 1], dates[i]):
                run += 1
            else:
                longest = max(longest, run)
                run = 1

        # Current streak: running through today or yesterday.
        today = datetime.now().date()
        current = 0
        today_str = today.isoformat()
        yesterday_str = (today - timedelta(days=1)).isoformat()

        if today_str in date_set:
            current = 1
            check = today - timedelta(days=1)
        elif yesterday_str in date_set:
            current = 1
            check = today - timedelta(days=2)
        else:
            check = None

        while check is not None and check.isoformat() in date_set:
            current += 1
            check -= timedelta(days=1)

        return {"current_streak": current, "longest_streak": max(longest, current)}

    @staticmethod
    def _is_consecutive(a: str, b: str) -> bool:
        try:
            da = datetime.strptime(a, "%Y-%m-%d").date()
            db = datetime.strptime(b, "%Y-%m-%d").date()
            return (db - da).days == 1
        except Exception:
            return False