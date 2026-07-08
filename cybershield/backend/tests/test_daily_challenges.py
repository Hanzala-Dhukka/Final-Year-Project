"""
Test suite for Daily Security Challenges & Streak System
"""
import pytest
from datetime import datetime, timedelta
from app.services.challenge_generator import ChallengeGenerator
from app.services.streak_service import StreakService
from app.services.challenge_history import ChallengeHistoryService
from app.data.daily_templates import get_random_challenge, get_all_categories, get_challenge_count


class TestChallengeGenerator:
    """Test the ChallengeGenerator service"""
    
    def test_get_all_categories(self):
        """Test that all categories are available"""
        categories = get_all_categories()
        assert 'SQL Injection' in categories
        assert 'XSS' in categories
        assert 'CSRF' in categories
        assert 'Path Traversal' in categories
        assert 'Command Injection' in categories
        assert 'Broken Authentication' in categories
        assert 'SSRF' in categories
        assert 'IDOR' in categories
    
    def test_get_random_challenge(self):
        """Test random challenge generation"""
        challenge = get_random_challenge()
        assert challenge is not None
        assert 'title' in challenge
        assert 'difficulty' in challenge
        assert 'question' in challenge
        assert 'answer' in challenge
        assert 'xp_reward' in challenge
    
    def test_get_random_challenge_by_category(self):
        """Test random challenge with specific category"""
        challenge = get_random_challenge('SQL Injection')
        assert challenge is not None
        # All SQL injection challenges should have SQL-related content
        assert 'SQL' in challenge['title'] or 'sql' in challenge['question'].lower()
    
    def test_challenge_count(self):
        """Test that we have enough challenges per category"""
        for category in get_all_categories():
            count = get_challenge_count(category)
            assert count >= 15, f"Category {category} has only {count} challenges (minimum 15 required)"
    
    def test_generate_daily_challenge(self):
        """Test daily challenge generation"""
        generator = ChallengeGenerator()
        challenge = generator.generate_daily_challenge(force_date="2026-07-07")
        
        assert challenge is not None
        assert challenge['challenge_id'] == 'DAY-2026-07-07'
        assert 'category' in challenge
        assert 'difficulty' in challenge
        assert 'title' in challenge
        assert 'expires_at' in challenge
    
    def test_time_remaining(self):
        """Test time remaining calculation"""
        generator = ChallengeGenerator()
        challenge = {
            'expires_at': (datetime.now() + timedelta(hours=2)).isoformat()
        }
        time_remaining = generator.get_time_remaining(challenge)
        assert 'h' in time_remaining
    
    def test_is_challenge_expired(self):
        """Test challenge expiration check"""
        generator = ChallengeGenerator()
        
        # Not expired
        challenge = {
            'expires_at': (datetime.now() + timedelta(hours=1)).isoformat()
        }
        assert generator.is_challenge_expired(challenge) == False
        
        # Expired
        challenge = {
            'expires_at': (datetime.now() - timedelta(hours=1)).isoformat()
        }
        assert generator.is_challenge_expired(challenge) == True
    
    def test_validate_challenge_answer(self):
        """Test answer validation"""
        generator = ChallengeGenerator()
        challenge = {
            'answer': "' OR 1=1 --"
        }
        
        # Correct answer
        result = generator.validate_challenge_answer(challenge, "' OR 1=1 --")
        assert result['is_correct'] == True
        
        # Incorrect answer
        result = generator.validate_challenge_answer(challenge, "wrong answer")
        assert result['is_correct'] == False


class TestStreakService:
    """Test the StreakService"""
    
    def test_streak_bonus_calculation(self):
        """Test streak bonus XP calculation"""
        service = StreakService()
        
        assert service._get_streak_bonus(1) == 50
        assert service._get_streak_bonus(2) == 50
        assert service._get_streak_bonus(3) == 100
        assert service._get_streak_bonus(7) == 150
        assert service._get_streak_bonus(14) == 250
        assert service._get_streak_bonus(30) == 500
    
    def test_default_streak(self):
        """Test default streak for new user"""
        service = StreakService()
        streak = service._get_default_streak("test_user")
        
        assert streak['user_id'] == "test_user"
        assert streak['current_streak'] == 0
        assert streak['longest_streak'] == 0
        assert streak['total_xp'] == 0


class TestChallengeHistoryService:
    """Test the ChallengeHistoryService"""
    
    def test_get_user_rankings(self):
        """Test leaderboard generation"""
        service = ChallengeHistoryService()
        # This will return empty list if no Google Sheets connection
        rankings = service.get_user_rankings(10)
        assert isinstance(rankings, list)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])