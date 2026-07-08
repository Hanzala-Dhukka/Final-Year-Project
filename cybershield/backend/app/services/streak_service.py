from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from app.services.google_sheets_service import get_google_sheets_client
from app.config.settings import settings


class StreakService:
    """Manage user streaks and daily challenge completion"""
    
    def __init__(self):
        self.streak_bonuses = {
            1: 50,      # Day 1
            2: 50,      # Day 2
            3: 100,     # Day 3+ bonus
            7: 150,     # Week bonus
            14: 250,    # 2 weeks bonus
            30: 500     # Month bonus
        }
    
    def get_user_streak(self, user_id: str) -> Dict[str, Any]:
        """
        Get user's current streak information
        
        Args:
            user_id: User identifier
        
        Returns:
            Streak information dictionary
        """
        try:
            gc = get_google_sheets_client()
            
            if not gc:
                return self._get_default_streak(user_id)
            
            sheet_id = settings.GOOGLE_SHEETS_ID
            if not sheet_id:
                return self._get_default_streak(user_id)
            
            sh = gc.open_by_key(sheet_id)
            
            # Get UserChallenges worksheet
            try:
                worksheet = sh.worksheet("UserChallenges")
            except Exception:
                return self._get_default_streak(user_id)
            
            # Get all records for this user
            records = worksheet.get_all_records()
            user_records = [r for r in records if r.get("User") == user_id]
            
            if not user_records:
                return self._get_default_streak(user_id)
            
            # Sort by date
            user_records.sort(key=lambda x: x.get("Date", ""), reverse=True)
            
            # Calculate current streak
            current_streak = 0
            longest_streak = 0
            temp_streak = 0
            total_xp = 0
            
            today = datetime.now().date()
            
            for record in user_records:
                record_date_str = record.get("Date", "")
                try:
                    record_date = datetime.strptime(record_date_str, "%Y-%m-%d").date()
                except:
                    continue
                
                completed = record.get("Completed", "No") == "Yes"
                xp = int(record.get("Score", 0))
                
                if completed:
                    total_xp += xp
                    temp_streak += 1
                    
                    # Check if this is consecutive
                    if (today - record_date).days == current_streak:
                        current_streak += 1
                    elif current_streak == 0:
                        current_streak = 1
                    
                    longest_streak = max(longest_streak, temp_streak)
                else:
                    temp_streak = 0
                    if current_streak > 0:
                        break
            
            return {
                "user_id": user_id,
                "current_streak": current_streak,
                "longest_streak": longest_streak,
                "total_xp": total_xp,
                "last_completed_date": user_records[0].get("Date") if user_records else None
            }
            
        except Exception as e:
            print(f"Error getting user streak: {e}")
            return self._get_default_streak(user_id)
    
    def record_challenge_completion(self, user_id: str, challenge_id: str, 
                                    score: int, time_taken: int) -> Dict[str, Any]:
        """
        Record user's challenge completion
        
        Args:
            user_id: User identifier
            challenge_id: Challenge ID
            score: Score achieved (0-100)
            time_taken: Time taken in seconds
        
        Returns:
            Completion result with streak info
        """
        try:
            # Get current streak before completion
            streak_info = self.get_user_streak(user_id)
            current_streak = streak_info["current_streak"]
            
            # Increment streak
            new_streak = current_streak + 1
            
            # Calculate XP with streak bonus
            base_xp = 100
            streak_bonus = self._get_streak_bonus(new_streak)
            total_xp = base_xp + streak_bonus
            
            # Save to Google Sheets
            self._save_completion_to_sheet(
                user_id=user_id,
                challenge_id=challenge_id,
                completed=True,
                score=score,
                time_taken=time_taken,
                xp_earned=total_xp
            )
            
            return {
                "success": True,
                "streak": new_streak,
                "streak_bonus": streak_bonus,
                "xp_earned": total_xp,
                "total_xp": streak_info["total_xp"] + total_xp,
                "is_new_streak_record": new_streak > streak_info["longest_streak"]
            }
            
        except Exception as e:
            print(f"Error recording completion: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def record_challenge_miss(self, user_id: str, challenge_id: str) -> Dict[str, Any]:
        """
        Record that user missed a challenge
        
        Args:
            user_id: User identifier
            challenge_id: Challenge ID
        
        Returns:
            Result dictionary
        """
        try:
            # Save to Google Sheets
            self._save_completion_to_sheet(
                user_id=user_id,
                challenge_id=challenge_id,
                completed=False,
                score=0,
                time_taken=0,
                xp_earned=0
            )
            
            return {
                "success": True,
                "message": "Challenge marked as missed"
            }
            
        except Exception as e:
            print(f"Error recording miss: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_streak_statistics(self, user_id: str) -> Dict[str, Any]:
        """
        Get detailed streak statistics
        
        Args:
            user_id: User identifier
        
        Returns:
            Statistics dictionary
        """
        streak_info = self.get_user_streak(user_id)
        
        # Get completion history
        history = self._get_completion_history(user_id)
        
        # Calculate statistics
        total_days = len(history)
        completed_days = sum(1 for h in history if h["completed"])
        missed_days = total_days - completed_days
        
        completion_rate = (completed_days / total_days * 100) if total_days > 0 else 0
        
        # Find best category
        category_stats = self._get_category_statistics(user_id)
        best_category = max(category_stats.items(), key=lambda x: x[1]["completed"])[0] if category_stats else None
        weakest_category = min(category_stats.items(), key=lambda x: x[1]["completed"])[0] if category_stats else None
        
        return {
            "user_id": user_id,
            "total_days": total_days,
            "completed_days": completed_days,
            "missed_days": missed_days,
            "completion_rate": round(completion_rate, 2),
            "current_streak": streak_info["current_streak"],
            "longest_streak": streak_info["longest_streak"],
            "total_xp": streak_info["total_xp"],
            "best_category": best_category,
            "weakest_category": weakest_category,
            "category_stats": category_stats
        }
    
    def _get_streak_bonus(self, streak_days: int) -> int:
        """Get XP bonus for current streak"""
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
    
    def _get_default_streak(self, user_id: str) -> Dict[str, Any]:
        """Get default streak for new user"""
        return {
            "user_id": user_id,
            "current_streak": 0,
            "longest_streak": 0,
            "total_xp": 0,
            "last_completed_date": None
        }
    
    def _save_completion_to_sheet(self, user_id: str, challenge_id: str,
                                  completed: bool, score: int, time_taken: int, xp_earned: int):
        """Save completion to Google Sheets"""
        try:
            gc = get_google_sheets_client()
            
            if not gc:
                return
            
            sheet_id = settings.GOOGLE_SHEETS_ID
            if not sheet_id:
                return
            
            sh = gc.open_by_key(sheet_id)
            
            # Get UserChallenges worksheet
            try:
                worksheet = sh.worksheet("UserChallenges")
            except Exception:
                # Create worksheet if not exists
                worksheet = sh.add_worksheet(title="UserChallenges", rows=1000, cols=8)
                worksheet.append_row([
                    "User", "Date", "Challenge ID", "Completed", 
                    "Score", "Streak", "XP Earned", "Time Taken"
                ])
            
            # Get current streak
            streak_info = self.get_user_streak(user_id)
            current_streak = streak_info["current_streak"]
            
            if completed:
                current_streak += 1
            else:
                current_streak = 0
            
            # Append record
            worksheet.append_row([
                user_id,
                datetime.now().strftime("%Y-%m-%d"),
                challenge_id,
                "Yes" if completed else "No",
                score,
                current_streak,
                xp_earned,
                time_taken
            ])
            
        except Exception as e:
            print(f"Error saving completion to sheet: {e}")
    
    def _get_completion_history(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's completion history"""
        try:
            gc = get_google_sheets_client()
            
            if not gc:
                return []
            
            sheet_id = settings.GOOGLE_SHEETS_ID
            if not sheet_id:
                return []
            
            sh = gc.open_by_key(sheet_id)
            
            try:
                worksheet = sh.worksheet("UserChallenges")
            except Exception:
                return []
            
            records = worksheet.get_all_records()
            user_records = [r for r in records if r.get("User") == user_id]
            
            return [
                {
                    "date": r.get("Date"),
                    "challenge_id": r.get("Challenge ID"),
                    "completed": r.get("Completed") == "Yes",
                    "score": int(r.get("Score", 0)),
                    "xp_earned": int(r.get("XP Earned", 0))
                }
                for r in user_records
            ]
            
        except Exception as e:
            print(f"Error getting completion history: {e}")
            return []
    
    def _get_category_statistics(self, user_id: str) -> Dict[str, Dict[str, Any]]:
        """Get statistics by category"""
        try:
            gc = get_google_sheets_client()
            
            if not gc:
                return {}
            
            sheet_id = settings.GOOGLE_SHEETS_ID
            if not sheet_id:
                return {}
            
            sh = gc.open_by_key(sheet_id)
            
            # Get DailyChallenges to map challenge_id to category
            challenge_categories = {}
            try:
                challenges_ws = sh.worksheet("DailyChallenges")
                challenge_records = challenges_ws.get_all_records()
                for record in challenge_records:
                    challenge_categories[record.get("Challenge ID")] = record.get("Category")
            except Exception:
                pass
            
            # Get user challenges
            try:
                user_challenges_ws = sh.worksheet("UserChallenges")
                user_records = user_challenges_ws.get_all_records()
                user_records = [r for r in user_records if r.get("User") == user_id]
            except Exception:
                return {}
            
            # Aggregate by category
            category_stats = {}
            for record in user_records:
                challenge_id = record.get("Challenge ID")
                category = challenge_categories.get(challenge_id, "Unknown")
                completed = record.get("Completed") == "Yes"
                
                if category not in category_stats:
                    category_stats[category] = {
                        "total": 0,
                        "completed": 0,
                        "total_score": 0
                    }
                
                category_stats[category]["total"] += 1
                if completed:
                    category_stats[category]["completed"] += 1
                    category_stats[category]["total_score"] += int(record.get("Score", 0))
            
            return category_stats
            
        except Exception as e:
            print(f"Error getting category statistics: {e}")
            return {}