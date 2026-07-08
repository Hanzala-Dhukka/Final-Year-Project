"""
Test suite for AI Learning & Explanation Engine
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestAIExplanation:
    """Test AI explanation endpoints"""
    
    def test_explain_correct_attempt(self):
        """Test explanation for correct payload"""
        response = client.post("/api/v1/ai-learning/explain", json={
            "topic": "SQL Injection",
            "payload": "' OR '1'='1' --",
            "result": "correct",
            "skill_level": "Beginner",
            "user_id": "test_user_1",
            "attempt_number": 1
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        assert "explanation" in data["data"]
        assert "recommendations" in data["data"]
        assert "next_topics" in data["data"]
    
    def test_explain_incorrect_attempt(self):
        """Test explanation for incorrect payload"""
        response = client.post("/api/v1/ai-learning/explain", json={
            "topic": "XSS",
            "payload": "<script>alert('test')</script>",
            "result": "incorrect",
            "skill_level": "Intermediate",
            "user_id": "test_user_2",
            "attempt_number": 2
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "personalized_feedback" in data["data"]
    
    def test_explain_with_previous_hints(self):
        """Test explanation with previous hints context"""
        response = client.post("/api/v1/ai-learning/explain", json={
            "topic": "CSRF",
            "payload": "malicious_payload",
            "result": "incorrect",
            "skill_level": "Advanced",
            "user_id": "test_user_3",
            "attempt_number": 3,
            "previous_hints": ["Hint 1", "Hint 2"]
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


class TestHintEngine:
    """Test hint generation endpoints"""
    
    def test_get_first_hint(self):
        """Test getting first hint (subtle)"""
        response = client.post("/api/v1/ai-learning/hint", json={
            "topic": "SQL Injection",
            "payload": "' OR '1'='1' --",
            "hint_number": 1,
            "skill_level": "Beginner",
            "user_id": "test_user_1"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "hint" in data["data"]
        assert data["data"]["hint_level"] == 1
        assert data["data"]["next_hint_available"] is True
    
    def test_get_progressive_hints(self):
        """Test getting progressive hints"""
        hints = []
        for i in range(1, 4):
            response = client.post("/api/v1/ai-learning/hint", json={
                "topic": "XSS",
                "payload": "<script>alert('xss')</script>",
                "hint_number": i,
                "skill_level": "Intermediate",
                "user_id": "test_user_2",
                "previous_hints": hints
            })
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data"]["hint_level"] == i
            hints.append(data["data"]["hint"])
        
        # After 3 hints, no more should be available
        assert len(hints) == 3


class TestPracticeQuestions:
    """Test practice question generation"""
    
    def test_generate_multiple_choice_question(self):
        """Test generating multiple choice question"""
        response = client.post("/api/v1/ai-learning/practice", json={
            "topic": "SQL Injection",
            "skill_level": "Beginner",
            "user_id": "test_user_1",
            "question_type": "multiple_choice"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "question" in data["data"]
        assert "options" in data["data"]
        assert "correct_answer" in data["data"]
        assert "explanation" in data["data"]
    
    def test_generate_advanced_question(self):
        """Test generating advanced level question"""
        response = client.post("/api/v1/ai-learning/practice", json={
            "topic": "CSRF",
            "skill_level": "Advanced",
            "user_id": "test_user_3"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["difficulty"] == "Advanced"


class TestProgressTracking:
    """Test progress tracking endpoints"""
    
    def test_update_progress(self):
        """Test updating user progress"""
        response = client.post("/api/v1/ai-learning/progress", json={
            "user_id": "test_user_1",
            "topic": "SQL Injection",
            "result": "correct",
            "score": 85.0,
            "attempts": 1,
            "lab_id": "lab_001"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "progress" in data["data"]
    
    def test_get_user_progress(self):
        """Test retrieving user progress"""
        # First, update progress
        client.post("/api/v1/ai-learning/progress", json={
            "user_id": "test_user_4",
            "topic": "XSS",
            "result": "correct",
            "score": 90.0,
            "attempts": 1
        })
        
        # Then retrieve it
        response = client.get("/api/v1/ai-learning/progress/test_user_4")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "skill_level" in data["data"]
        assert "average_score" in data["data"]
        assert "total_attempts" in data["data"]


class TestLearningHistory:
    """Test learning history endpoints"""
    
    def test_get_learning_history(self):
        """Test retrieving learning history"""
        response = client.get("/api/v1/ai-learning/history/test_user_1")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "history" in data["data"]
    
    def test_get_learning_history_with_topic_filter(self):
        """Test retrieving learning history with topic filter"""
        response = client.get("/api/v1/ai-learning/history/test_user_1?topic=SQL Injection")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        if "history" in data["data"] and data["data"]["history"]:
            for record in data["data"]["history"]:
                assert record.get("topic") == "SQL Injection"


class TestAdaptiveLearning:
    """Test adaptive learning endpoints"""
    
    def test_get_adaptive_difficulty(self):
        """Test adaptive difficulty recommendation"""
        response = client.post("/api/v1/ai-learning/adaptive-difficulty", json={
            "user_id": "test_user_1",
            "topic": "SQL Injection",
            "current_difficulty": "Easy"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "recommended_difficulty" in data["data"]
        assert "reason" in data["data"]
        assert "hint_level" in data["data"]
    
    def test_get_learning_path(self):
        """Test getting personalized learning path"""
        response = client.get("/api/v1/ai-learning/learning-path/test_user_1")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "learning_path" in data["data"]
        assert "skill_level" in data["data"]
    
    def test_get_weak_areas(self):
        """Test identifying weak areas"""
        response = client.get("/api/v1/ai-learning/weak-areas/test_user_1")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "weakest_area" in data["data"]
    
    def test_get_skill_level(self):
        """Test getting user skill level"""
        response = client.get("/api/v1/ai-learning/skill-level/test_user_1")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "skill_level" in data["data"]
        assert "next_level_requirements" in data["data"]


class TestSkillLevelProgression:
    """Test skill level progression logic"""
    
    def test_beginner_to_intermediate(self):
        """Test progression from Beginner to Intermediate"""
        from app.services.adaptive_learning import AdaptiveLearningEngine
        
        engine = AdaptiveLearningEngine()
        
        # Should be Intermediate with good performance
        level = engine.calculate_skill_level(
            accuracy=0.75,
            average_score=75.0,
            completed_labs=5
        )
        assert level == "Intermediate"
    
    def test_intermediate_to_advanced(self):
        """Test progression from Intermediate to Advanced"""
        from app.services.adaptive_learning import AdaptiveLearningEngine
        
        engine = AdaptiveLearningEngine()
        
        # Should be Advanced with excellent performance
        level = engine.calculate_skill_level(
            accuracy=0.95,
            average_score=90.0,
            completed_labs=12
        )
        assert level == "Advanced"
    
    def test_remains_beginner(self):
        """Test that low performance keeps user as Beginner"""
        from app.services.adaptive_learning import AdaptiveLearningEngine
        
        engine = AdaptiveLearningEngine()
        
        # Should remain Beginner with low performance
        level = engine.calculate_skill_level(
            accuracy=0.5,
            average_score=60.0,
            completed_labs=2
        )
        assert level == "Beginner"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])