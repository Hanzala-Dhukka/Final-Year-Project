"""
Challenge History Service
Stores and retrieves daily challenge completion history (MongoDB-backed).
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from app.database.db import database

COMPLETIONS_COLLECTION = "challenge_completions"


class ChallengeHistoryService:
    """Manage challenge completion history."""

    def __init__(self):
        self.collection = database[COMPLETIONS_COLLECTION]

    async def get_history(self, user_id: str, limit: int = 30) -> List[Dict[str, Any]]:
        """Get challenge history for a user (newest first)."""
        try:
            cursor = (
                self.collection.find({"user_id": user_id})
                .sort("date", -1)
                .limit(limit)
            )
            history = []
            async for doc in cursor:
                history.append({
                    "date": doc.get("date", ""),
                    "challenge_id": doc.get("challenge_id", ""),
                    "challenge_name": doc.get("challenge_name", ""),
                    "category": doc.get("category", ""),
                    "difficulty": doc.get("difficulty", ""),
                    "score": int(doc.get("score", 0) or 0),
                    "time_taken": int(doc.get("time_taken", 0) or 0),
                    "xp_earned": int(doc.get("xp_earned", 0) or 0),
                    "streak": int(doc.get("streak", 0) or 0),
                    "streak_bonus": int(doc.get("streak_bonus", 0) or 0),
                    "answered_payload": doc.get("answered_payload", ""),
                })
            return history
        except Exception as e:
            print(f"Error fetching challenge history: {e}")
            return []

    async def get_statistics(self, user_id: str) -> Dict[str, Any]:
        """Get challenge statistics for a user."""
        try:
            records = []
            cursor = self.collection.find({"user_id": user_id})
            async for doc in cursor:
                records.append(doc)
            return self._compute_statistics(user_id, records)
        except Exception as e:
            print(f"Error fetching statistics: {e}")
            return self._get_empty_statistics(user_id)

    async def get_calendar(self, user_id: str, year: int = None, month: int = None) -> Dict[str, Any]:
        """Get completed challenge history for calendar display."""
        try:
            days = []
            cursor = self.collection.find({"user_id": user_id}, {"date": 1, "xp_earned": 1, "streak_bonus": 1})
            async for doc in cursor:
                date_str = doc.get("date", "")
                if year and not date_str.startswith(f"{year}-"):
                    continue
                days.append({
                    "date": date_str,
                    "completed": True,
                    "xp": int(doc.get("xp_earned", 0) or 0) + int(doc.get("streak_bonus", 0) or 0),
                })
            return {"days": days, "year": year, "month": month}
        except Exception as e:
            print(f"Error fetching calendar: {e}")
            return {"days": [], "year": year, "month": month}

    async def get_leaderboard(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get leaderboard sorted by total XP using a MongoDB aggregation."""
        try:
            pipeline = [
                {"$group": {
                    "_id": "$user_id",
                    "total_xp": {
                        "$sum": {"$add": [
                            {"$ifNull": ["$xp_earned", 0]},
                            {"$ifNull": ["$streak_bonus", 0]},
                        ]}
                    },
                    "challenges_completed": {"$sum": 1},
                    "last_date": {"$max": "$date"},
                }},
                {"$sort": {"total_xp": -1}},
                {"$limit": limit},
            ]

            leaderboard = []
            async for doc in self.collection.aggregate(pipeline):
                user_id = str(doc["_id"])
                leaderboard.append({
                    "user_id": user_id,
                    "total_xp": doc.get("total_xp", 0),
                    "challenges_completed": doc.get("challenges_completed", 0),
                    "current_streak": 0,
                    "display_name": await self._resolve_display_name(user_id),
                })
            return leaderboard
        except Exception as e:
            print(f"Error fetching leaderboard: {e}")
            return []

    async def _resolve_display_name(self, user_id: str) -> str:
        """Resolve a readable display name for a user id when possible."""
        try:
            oid = ObjectId(user_id)
            user = await database.users.find_one({"_id": oid})
            if user:
                return (
                    user.get("name")
                    or user.get("full_name")
                    or user.get("username")
                    or user_id
                )
        except Exception:
            pass
        return user_id

    def _compute_statistics(self, user_id: str, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not records:
            return self._get_empty_statistics(user_id)

        categories = {}
        for r in records:
            category = r.get("category", "Unknown")
            cats = categories.setdefault(category, {"total": 0, "completed": 0, "xp": 0})
            cats["total"] += 1
            cats["completed"] += 1
            cats["xp"] += int(r.get("xp_earned", 0) or 0) + int(r.get("streak_bonus", 0) or 0)

        best_category = max(categories, key=lambda c: categories[c]["xp"], default=None)
        weakest_category = min(categories, key=lambda c: categories[c]["xp"], default=None)

        return {
            "user_id": user_id,
            "total_challenges": len(records),
            "completed_challenges": len(records),
            "missed_challenges": 0,
            "average_score": round(
                sum(int(r.get("score", 0) or 0) for r in records) / len(records), 2
            ) if records else 0,
            "total_xp": sum(
                int(r.get("xp_earned", 0) or 0) + int(r.get("streak_bonus", 0) or 0)
                for r in records
            ),
            "best_category": best_category,
            "weakest_category": weakest_category,
            "category_stats": categories,
        }

    def _get_empty_statistics(self, user_id: str) -> Dict[str, Any]:
        return {
            "user_id": user_id,
            "total_challenges": 0,
            "completed_challenges": 0,
            "missed_challenges": 0,
            "average_score": 0,
            "total_xp": 0,
            "best_category": None,
            "weakest_category": None,
            "category_stats": {},
        }