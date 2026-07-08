from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from app.services.google_sheets_service import get_google_sheets_client
from app.config.settings import settings


class ChallengeHistoryService:
    """Manage challenge history and statistics"""
    
    def get_user_challenge_history(self, user_id: str, limit: int = 30) -> List[Dict[str, Any]]:
        """
        Get user's challenge history
        
        Args:
            user_id: User identifier
            limit: Maximum number of records to return
        
        Returns:
            List of challenge history records
        """
        try:
            gc = get_google_sheets_client()
            
            if not gc:
                return []
            
            sheet_id = settings.GOOGLE_SHEETS_ID
            if not sheet_id:
                return []
            
            sh = gc.open_by_key(sheet_id)
            
            # Get UserChallenges worksheet
            try:
                worksheet = sh.worksheet("UserChallenges")
            except Exception:
                return []
            
            # Get all records
            records = worksheet.get_all_records()
            user_records = [r for r in records if r.get("User") == user_id]
            
            # Sort by date (most recent first)
            user_records.sort(key=lambda x: x.get("Date", ""), reverse=True)
            
            # Limit results
            user_records = user_records[:limit]
            
            # Get challenge details from DailyChallenges
            challenge_details = {}
            try:
                challenges_ws = sh.worksheet("DailyChallenges")
                challenge_records = challenges_ws.get_all_records()
                for record in challenge_records:
                    challenge_details[record.get("Challenge ID")] = {
                        "category": record.get("Category"),
                        "difficulty": record.get("Difficulty"),
                        "title": record.get("Title"),
                        "xp_reward": record.get("XP")
                    }
            except Exception:
                pass
            
            # Format history
            history = []
            for record in user_records:
                challenge_id = record.get("Challenge ID")
                details = challenge_details.get(challenge_id, {})
                
                history.append({
                    "date": record.get("Date"),
                    "challenge_id": challenge_id,
                    "category": details.get("category", "Unknown"),
                    "difficulty": details.get("difficulty", "Unknown"),
                    "title": details.get("title", "Unknown"),
                    "completed": record.get("Completed") == "Yes",
                    "score": int(record.get("Score", 0)),
                    "xp_earned": int(record.get("XP Earned", 0)),
                    "time_taken": int(record.get("Time Taken", 0))
                })
            
            return history
            
        except Exception as e:
            print(f"Error getting challenge history: {e}")
            return []
    
    def get_challenge_calendar(self, user_id: str, year: int = None, month: int = None) -> Dict[str, Any]:
        """
        Get calendar view of user's challenge completion
        
        Args:
            user_id: User identifier
            year: Year (defaults to current year)
            month: Month (defaults to current month)
        
        Returns:
            Calendar data with completion status
        """
        try:
            # Default to current month
            if not year or not month:
                now = datetime.now()
                year = now.year
                month = now.month
            
            # Get user's history
            history = self.get_user_challenge_history(user_id, limit=365)
            
            # Create date map
            completion_map = {}
            for record in history:
                record_date = record.get("date")
                if record_date:
                    completion_map[record_date] = record.get("completed", False)
            
            # Generate calendar days
            calendar_days = []
            first_day = datetime(year, month, 1)
            last_day = (first_day + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            current_date = first_day
            while current_date <= last_day:
                date_str = current_date.strftime("%Y-%m-%d")
                calendar_days.append({
                    "date": date_str,
                    "completed": completion_map.get(date_str, False),
                    "day": current_date.day
                })
                current_date += timedelta(days=1)
            
            # Calculate statistics
            total_days = len(calendar_days)
            completed_days = sum(1 for d in calendar_days if d["completed"])
            
            return {
                "year": year,
                "month": month,
                "days": calendar_days,
                "statistics": {
                    "total_days": total_days,
                    "completed_days": completed_days,
                    "missed_days": total_days - completed_days,
                    "completion_rate": round((completed_days / total_days * 100), 2) if total_days > 0 else 0
                }
            }
            
        except Exception as e:
            print(f"Error getting challenge calendar: {e}")
            return {
                "year": year,
                "month": month,
                "days": [],
                "statistics": {
                    "total_days": 0,
                    "completed_days": 0,
                    "missed_days": 0,
                    "completion_rate": 0
                }
            }
    
    def get_category_performance(self, user_id: str) -> Dict[str, Any]:
        """
        Get performance breakdown by category
        
        Args:
            user_id: User identifier
        
        Returns:
            Category performance data
        """
        try:
            gc = get_google_sheets_client()
            
            if not gc:
                return {"categories": {}, "best_category": None, "weakest_category": None}
            
            sheet_id = settings.GOOGLE_SHEETS_ID
            if not sheet_id:
                return {"categories": {}, "best_category": None, "weakest_category": None}
            
            sh = gc.open_by_key(sheet_id)
            
            # Get challenge details
            challenge_details = {}
            try:
                challenges_ws = sh.worksheet("DailyChallenges")
                challenge_records = challenges_ws.get_all_records()
                for record in challenge_records:
                    challenge_details[record.get("Challenge ID")] = {
                        "category": record.get("Category"),
                        "difficulty": record.get("Difficulty")
                    }
            except Exception:
                pass
            
            # Get user challenges
            try:
                user_challenges_ws = sh.worksheet("UserChallenges")
                user_records = user_challenges_ws.get_all_records()
                user_records = [r for r in user_records if r.get("User") == user_id]
            except Exception:
                return {"categories": {}, "best_category": None, "weakest_category": None}
            
            # Aggregate by category
            category_stats = {}
            for record in user_records:
                challenge_id = record.get("Challenge ID")
                details = challenge_details.get(challenge_id, {})
                category = details.get("category", "Unknown")
                completed = record.get("Completed") == "Yes"
                score = int(record.get("Score", 0))
                
                if category not in category_stats:
                    category_stats[category] = {
                        "total": 0,
                        "completed": 0,
                        "total_score": 0,
                        "average_score": 0
                    }
                
                category_stats[category]["total"] += 1
                if completed:
                    category_stats[category]["completed"] += 1
                    category_stats[category]["total_score"] += score
            
            # Calculate averages
            for category, stats in category_stats.items():
                if stats["completed"] > 0:
                    stats["average_score"] = round(stats["total_score"] / stats["completed"], 2)
                stats["completion_rate"] = round((stats["completed"] / stats["total"] * 100), 2) if stats["total"] > 0 else 0
            
            # Find best and weakest categories
            best_category = None
            weakest_category = None
            best_score = 0
            worst_score = 100
            
            for category, stats in category_stats.items():
                if stats["completion_rate"] > best_score and stats["total"] >= 3:
                    best_score = stats["completion_rate"]
                    best_category = category
                
                if stats["completion_rate"] < worst_score and stats["total"] >= 3:
                    worst_score = stats["completion_rate"]
                    weakest_category = category
            
            return {
                "categories": category_stats,
                "best_category": best_category,
                "weakest_category": weakest_category
            }
            
        except Exception as e:
            print(f"Error getting category performance: {e}")
            return {"categories": {}, "best_category": None, "weakest_category": None}
    
    def get_streak_calendar_data(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get calendar data for streak visualization (GitHub-style contribution graph)
        
        Args:
            user_id: User identifier
        
        Returns:
            List of calendar entries with completion status
        """
        try:
            # Get last 90 days of history
            history = self.get_user_challenge_history(user_id, limit=90)
            
            # Create date map
            completion_map = {}
            for record in history:
                record_date = record.get("date")
                if record_date:
                    completion_map[record_date] = {
                        "completed": record.get("completed", False),
                        "score": record.get("score", 0),
                        "xp_earned": record.get("xp_earned", 0)
                    }
            
            # Generate last 90 days
            calendar_data = []
            today = datetime.now()
            
            for i in range(90):
                date = today - timedelta(days=i)
                date_str = date.strftime("%Y-%m-%d")
                
                data = completion_map.get(date_str, {"completed": False, "score": 0, "xp_earned": 0})
                
                calendar_data.append({
                    "date": date_str,
                    "completed": data["completed"],
                    "score": data["score"],
                    "xp_earned": data["xp_earned"]
                })
            
            return calendar_data
            
        except Exception as e:
            print(f"Error getting streak calendar data: {e}")
            return []
    
    def get_user_rankings(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get top users by XP (leaderboard)
        
        Args:
            limit: Maximum number of users to return
        
        Returns:
            List of top users with their stats
        """
        try:
            gc = get_google_sheets_client()
            
            if not gc:
                return []
            
            sheet_id = settings.GOOGLE_SHEETS_ID
            if not sheet_id:
                return []
            
            sh = gc.open_by_key(sheet_id)
            
            # Get UserChallenges worksheet
            try:
                worksheet = sh.worksheet("UserChallenges")
            except Exception:
                return []
            
            # Get all records
            records = worksheet.get_all_records()
            
            # Aggregate by user
            user_stats = {}
            for record in records:
                user_id = record.get("User")
                if not user_id:
                    continue
                
                if user_id not in user_stats:
                    user_stats[user_id] = {
                        "user_id": user_id,
                        "total_xp": 0,
                        "completed_challenges": 0,
                        "current_streak": 0
                    }
                
                if record.get("Completed") == "Yes":
                    user_stats[user_id]["total_xp"] += int(record.get("XP Earned", 0))
                    user_stats[user_id]["completed_challenges"] += 1
                
                # Track streak
                streak = int(record.get("Streak", 0))
                user_stats[user_id]["current_streak"] = max(
                    user_stats[user_id]["current_streak"],
                    streak
                )
            
            # Sort by total XP
            rankings = sorted(
                user_stats.values(),
                key=lambda x: x["total_xp"],
                reverse=True
            )
            
            return rankings[:limit]
            
        except Exception as e:
            print(f"Error getting user rankings: {e}")
            return []