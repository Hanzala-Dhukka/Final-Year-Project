"""
Tests for Progress Tracking, Achievements & Certificates Module
"""
import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.progress_service import ProgressService
from app.services.achievement_service import AchievementService
from app.services.analytics_service import AnalyticsService
from app.services.certificate_service import CertificateService
from app.services.roadmap_service import RoadmapService


class TestProgressService:
    """Tests for XP and Level system"""
    
    def test_calculate_level(self):
        """Test level calculation based on XP"""
        assert ProgressService.calculate_level(0) == 1
        assert ProgressService.calculate_level(250) == 2
        assert ProgressService.calculate_level(600) == 3
        assert ProgressService.calculate_level(1000) == 4
        assert ProgressService.calculate_level(1500) == 5
    
    def test_xp_to_next_level(self):
        """Test XP needed to reach next level"""
        assert ProgressService.get_xp_to_next_level(0) == 250
        assert ProgressService.get_xp_to_next_level(100) == 150
        assert ProgressService.get_xp_to_next_level(2100) == 700
    
    def test_level_progress(self):
        """Test level progress percentage"""
        assert ProgressService.get_level_progress(0) == 0.0
        assert ProgressService.get_level_progress(125) == 50.0
        assert ProgressService.get_level_progress(250) == 100.0
    
    def test_add_xp(self):
        """Test adding XP for user actions"""
        result = ProgressService.add_xp("test_user", "daily_challenge", score=100)
        assert result["success"] == True
        assert result["xp_earned"] == 100
        assert result["total_xp"] == 100
    
    def test_add_xp_with_perfect_score_bonus(self):
        """Test XP with perfect score bonus"""
        result = ProgressService.add_xp("test_user2", "attack_lab", score=100, perfect_score=True)
        assert result["xp_earned"] == 100  # 75 base + 25 bonus
    
    def test_add_xp_with_streak_bonus(self):
        """Test XP with streak bonus"""
        result = ProgressService.add_xp("test_user3", "daily_challenge", score=100, streak_days=7)
        assert result["xp_earned"] == 200  # 100 base + 100 streak bonus


class TestAchievementService:
    """Tests for Achievement system"""
    
    def test_get_all_achievements(self):
        """Test getting all available achievements"""
        achievements = AchievementService.get_all_achievements()
        assert len(achievements) > 0
        assert any(a["key"] == "first_blood" for a in achievements)
        assert any(a["key"] == "sql_hunter" for a in achievements)
    
    def test_check_achievements_first_blood(self):
        """Test first blood achievement"""
        unlocked = AchievementService.check_achievements("test_user", "lab_completed", "SQL Injection", 100)
        assert any(a["badge_name"] == "First Blood" for a in unlocked)
    
    def test_get_user_achievements(self):
        """Test getting user achievements"""
        # First add an achievement
        AchievementService.check_achievements("test_user4", "lab_completed", "SQL Injection", 100)
        badges = AchievementService.get_user_achievements("test_user4")
        assert "first_blood" in badges


class TestAnalyticsService:
    """Tests for Analytics system"""
    
    def test_record_lab_attempt(self):
        """Test recording lab attempts"""
        AnalyticsService.record_lab_attempt(
            "test_user", "LAB001", "SQL Injection", 100, 1, True
        )
        # Should not raise any errors
    
    def test_get_category_mastery(self):
        """Test getting category mastery"""
        # Add some test data
        AnalyticsService.record_lab_attempt(
            "test_user5", "LAB001", "SQL Injection", 100, 1, True
        )
        AnalyticsService.record_lab_attempt(
            "test_user5", "LAB002", "SQL Injection", 80, 2, True
        )
        
        mastery = AnalyticsService.get_category_mastery("test_user5")
        assert len(mastery) > 0
        sql_mastery = next((m for m in mastery if m["category"] == "SQL Injection"), None)
        assert sql_mastery is not None
        assert sql_mastery["completed"] == 2


class TestCertificateService:
    """Tests for Certificate system"""
    
    def test_check_eligibility_not_eligible(self):
        """Test certificate eligibility check - not eligible"""
        eligibility = CertificateService.check_eligibility("new_user")
        assert eligibility["eligible"] == False
    
    def test_certificate_requirements(self):
        """Test certificate requirements"""
        assert CertificateService.REQUIRED_COMPLETION == 80.0
        assert CertificateService.REQUIRED_AVERAGE == 75.0


class TestRoadmapService:
    """Tests for Roadmap system"""
    
    def test_fallback_recommendations(self):
        """Test fallback recommendations without AI"""
        recommendations = RoadmapService._get_fallback_recommendations(
            ["SQL Injection"], ["CSRF", "SSRF"]
        )
        assert "CSRF" in recommendations
        assert "SSRF" in recommendations
    
    def test_estimate_completion(self):
        """Test completion time estimation"""
        assert RoadmapService._estimate_completion(0) == "Completed!"
        assert RoadmapService._estimate_completion(3) == "6 weeks"
        assert RoadmapService._estimate_completion(10) == "2 months"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])