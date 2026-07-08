from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from app.services.challenge_generator import ChallengeGenerator
from app.services.streak_service import StreakService
import schedule
import time
import threading


class ChallengeScheduler:
    """Schedule daily challenge generation and management"""
    
    def __init__(self):
        self.challenge_generator = ChallengeGenerator()
        self.streak_service = StreakService()
        self.scheduler_thread = None
        self.is_running = False
    
    def start_scheduler(self):
        """Start the daily challenge scheduler"""
        if self.is_running:
            return
        
        self.is_running = True
        
        # Schedule daily challenge generation at midnight
        schedule.every().day.at("00:00").do(self.generate_daily_challenge)
        
        # Schedule cleanup of expired challenges every hour
        schedule.every().hour.do(self.cleanup_expired_challenges)
        
        # Run scheduler in background thread
        self.scheduler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self.scheduler_thread.start()
        
        print("✅ Daily challenge scheduler started")
    
    def stop_scheduler(self):
        """Stop the scheduler"""
        self.is_running = False
        if self.scheduler_thread:
            self.scheduler_thread = None
        print("⛔ Daily challenge scheduler stopped")
    
    def _run_scheduler(self):
        """Run scheduler loop"""
        while self.is_running:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    
    def generate_daily_challenge(self):
        """Generate and publish today's challenge"""
        try:
            print(f"🔄 Generating daily challenge for {datetime.now().strftime('%Y-%m-%d')}")
            
            challenge = self.challenge_generator.generate_daily_challenge()
            
            print(f"✅ Daily challenge generated: {challenge['challenge_id']}")
            print(f"   Category: {challenge['category']}")
            print(f"   Difficulty: {challenge['difficulty']}")
            print(f"   XP Reward: {challenge['xp_reward']}")
            
            return challenge
            
        except Exception as e:
            print(f"❌ Error generating daily challenge: {e}")
            return None
    
    def cleanup_expired_challenges(self):
        """Cleanup expired challenges (optional, for maintenance)"""
        try:
            # This can be used to archive old challenges
            # For now, we just log it
            print("🧹 Running cleanup of expired challenges...")
            # Implementation depends on storage strategy
            pass
        except Exception as e:
            print(f"Error in cleanup: {e}")
    
    def get_todays_challenge_status(self, user_id: str) -> Dict[str, Any]:
        """
        Get today's challenge status for a user
        
        Args:
            user_id: User identifier
        
        Returns:
            Challenge status dictionary
        """
        try:
            # Get today's challenge
            challenge = self.challenge_generator.get_today_challenge()
            
            if not challenge:
                return {
                    "has_challenge": False,
                    "message": "No challenge available for today"
                }
            
            # Check if challenge is expired
            is_expired = self.challenge_generator.is_challenge_expired(challenge)
            
            # Check if user completed it
            user_streak = self.streak_service.get_user_streak(user_id)
            
            # Get time remaining
            time_remaining = self.challenge_generator.get_time_remaining(challenge)
            
            return {
                "has_challenge": True,
                "challenge": challenge,
                "is_expired": is_expired,
                "time_remaining": time_remaining,
                "user_completed": False,  # Would need to check UserChallenges
                "current_streak": user_streak["current_streak"],
                "longest_streak": user_streak["longest_streak"]
            }
            
        except Exception as e:
            print(f"Error getting challenge status: {e}")
            return {
                "has_challenge": False,
                "error": str(e)
            }
    
    def force_generate_challenge(self, date: str = None) -> Dict[str, Any]:
        """
        Force generate a challenge (for testing or manual trigger)
        
        Args:
            date: Optional date string (YYYY-MM-DD)
        
        Returns:
            Generated challenge
        """
        try:
            challenge = self.challenge_generator.generate_daily_challenge(force_date=date)
            return {
                "success": True,
                "challenge": challenge
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


# Global scheduler instance
challenge_scheduler = ChallengeScheduler()


def start_challenge_scheduler():
    """Start the challenge scheduler (call on app startup)"""
    challenge_scheduler.start_scheduler()


def stop_challenge_scheduler():
    """Stop the challenge scheduler (call on app shutdown)"""
    challenge_scheduler.stop_scheduler()