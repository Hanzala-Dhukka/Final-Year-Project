from typing import Dict, Any, List, Optional
from datetime import datetime
from app.services.explanation_builder import (
    generate_explanation,
    generate_hint,
    generate_practice_question
)
from app.services.google_sheets_service import save_attack_lab_to_sheet
from app.services.adaptive_learning import AdaptiveLearningEngine


class AILearningService:
    """Main service for AI-powered learning and explanation engine"""
    
    def __init__(self):
        self.skill_levels = ["Beginner", "Intermediate", "Advanced"]
        self.adaptive_engine = AdaptiveLearningEngine()
    
    async def explain_attempt(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate personalized explanation for user's attempt
        
        Args:
            request_data: Dictionary containing:
                - topic: str
                - payload: str
                - result: str ("correct" or "incorrect")
                - skill_level: str
                - user_id: str (optional)
                - attempt_number: int (optional)
        
        Returns:
            Dictionary with explanation and metadata
        """
        topic = request_data.get("topic", "")
        payload = request_data.get("payload", "")
        result = request_data.get("result", "incorrect")
        skill_level = request_data.get("skill_level", "Beginner")
        user_id = request_data.get("user_id", "anonymous")
        attempt_number = request_data.get("attempt_number", 1)
        
        # Generate explanation
        explanation_data = await generate_explanation(
            topic=topic,
            payload=payload,
            result=result,
            skill_level=skill_level,
            attempt_number=attempt_number,
            user_id=user_id
        )
        
        # Save progress to Google Sheets
        self._save_learning_progress(
            user_id=user_id,
            topic=topic,
            result=result,
            score=100 if result == "correct" else 0,
            attempt_number=attempt_number
        )
        
        return {
            "success": True,
            "data": explanation_data
        }
    
    async def get_hint(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate progressive hint for user
        
        Args:
            request_data: Dictionary containing:
                - topic: str
                - payload: str
                - hint_number: int (1-3)
                - skill_level: str
                - user_id: str (optional)
                - previous_attempts: List[str] (optional)
        
        Returns:
            Dictionary with hint and metadata
        """
        topic = request_data.get("topic", "")
        payload = request_data.get("payload", "")
        hint_number = request_data.get("hint_number", 1)
        skill_level = request_data.get("skill_level", "Beginner")
        user_id = request_data.get("user_id", "anonymous")
        previous_attempts = request_data.get("previous_attempts", [])
        
        # Validate hint number
        if hint_number < 1 or hint_number > 3:
            hint_number = 1
        
        # Generate hint
        hint_data = await generate_hint(
            topic=topic,
            payload=payload,
            hint_number=hint_number,
            skill_level=skill_level,
            previous_attempts=previous_attempts
        )
        
        return {
            "success": True,
            "data": hint_data
        }
    
    async def generate_practice(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate practice question for user
        
        Args:
            request_data: Dictionary containing:
                - topic: str
                - skill_level: str
                - user_id: str (optional)
                - question_type: str (optional)
        
        Returns:
            Dictionary with practice question
        """
        topic = request_data.get("topic", "")
        skill_level = request_data.get("skill_level", "Beginner")
        user_id = request_data.get("user_id", "anonymous")
        question_type = request_data.get("question_type", "multiple_choice")
        
        # Generate practice question
        question_data = await generate_practice_question(
            topic=topic,
            skill_level=skill_level,
            question_type=question_type
        )
        
        return {
            "success": True,
            "data": question_data
        }
    
    def update_progress(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update user learning progress
        
        Args:
            request_data: Dictionary containing:
                - user_id: str
                - topic: str
                - result: str
                - score: int
                - time_taken: int
                - attempts: int
                - weakness: str (optional)
        
        Returns:
            Dictionary with updated progress
        """
        user_id = request_data.get("user_id", "anonymous")
        topic = request_data.get("topic", "")
        result = request_data.get("result", "incorrect")
        score = request_data.get("score", 0)
        time_taken = request_data.get("time_taken", 0)
        attempts = request_data.get("attempts", 1)
        weakness = request_data.get("weakness")
        
        # Update progress using adaptive learning engine
        updated_progress = self.adaptive_engine.update_skill_level(
            user_id=user_id,
            accuracy=1.0 if result == "correct" else 0.0,
            average_score=float(score),
            completed_labs=1 if result == "correct" else 0
        )
        
        # Save to Google Sheets
        self._save_learning_progress(
            user_id=user_id,
            topic=topic,
            result=result,
            score=score,
            attempt_number=attempts
        )
        
        return {
            "success": True,
            "data": updated_progress
        }
    
    def get_learning_history(self, user_id: str) -> Dict[str, Any]:
        """
        Get user's learning history
        
        Args:
            user_id: User identifier
        
        Returns:
            Dictionary with learning history
        """
        # In a real implementation, this would fetch from database
        # For now, return a placeholder
        return {
            "success": True,
            "data": {
                "user_id": user_id,
                "topics": [],
                "overall_accuracy": 0.0,
                "skill_level": "Beginner",
                "completed_labs": 0,
                "average_score": 0.0,
                "weakest_area": None
            }
        }
    
    def get_follow_up_questions(self, topic: str, skill_level: str) -> Dict[str, Any]:
        """
        Generate follow-up questions for user
        
        Args:
            topic: Current topic
            skill_level: User's skill level
        
        Returns:
            Dictionary with follow-up questions
        """
        follow_up_topics = {
            "SQL Injection": {
                "Beginner": [
                    "Would you like to learn about XSS (Cross-Site Scripting)?",
                    "Interested in learning about CSRF protection?",
                    "Want to understand Input Validation basics?"
                ],
                "Intermediate": [
                    "Would you like to learn about Blind SQL Injection?",
                    "Interested in UNION-based SQL Injection?",
                    "Want to explore SQLMap tool?"
                ],
                "Advanced": [
                    "Would you like to learn about Second-Order SQL Injection?",
                    "Interested in NoSQL Injection techniques?",
                    "Want to explore Out-of-band SQL Injection?"
                ]
            },
            "XSS": {
                "Beginner": [
                    "Would you like to learn about SQL Injection?",
                    "Interested in understanding HTML Encoding?",
                    "Want to learn about CSRF?"
                ],
                "Intermediate": [
                    "Would you like to learn about DOM-based XSS?",
                    "Interested in Content Security Policy (CSP)?",
                    "Want to explore XSS filter evasion?"
                ],
                "Advanced": [
                    "Would you like to learn about Mutation XSS?",
                    "Interested in Polyglot Payloads?",
                    "Want to explore XSS in modern frameworks?"
                ]
            }
        }
        
        questions = follow_up_topics.get(topic, {}).get(skill_level, [
            f"Would you like to learn more about {topic}?",
            "Interested in related security topics?",
            "Want to practice more challenges?"
        ])
        
        related_topics = {
            "SQL Injection": ["XSS", "CSRF", "Input Validation", "Parameterized Queries"],
            "XSS": ["SQL Injection", "CSRF", "CSP", "Output Encoding"],
            "CSRF": ["XSS", "SQL Injection", "SameSite Cookies", "CSRF Tokens"]
        }
        
        return {
            "success": True,
            "data": {
                "questions": questions,
                "related_topics": related_topics.get(topic, ["Security Fundamentals", "OWASP Top 10"])
            }
        }
    
    def _save_learning_progress(self, user_id: str, topic: str, result: str, 
                                score: int, attempt_number: int):
        """Save learning progress to Google Sheets"""
        try:
            save_attack_lab_to_sheet(
                lab_id=f"learning_{topic}_{int(datetime.now().timestamp())}",
                user_id=user_id,
                category=topic,
                difficulty="Learning",
                score=score,
                completed=(result == "correct"),
                time_taken=0
            )
        except Exception as e:
            print(f"Error saving learning progress: {e}")
            # Don't fail the request if saving fails
            pass
    
    def get_skill_level_recommendations(self, user_id: str) -> Dict[str, Any]:
        """
        Get personalized recommendations based on user's skill level
        
        Args:
            user_id: User identifier
        
        Returns:
            Dictionary with recommendations
        """
        skill_level = self.adaptive_engine.calculate_skill_level(
            accuracy=0.0,
            average_score=0.0,
            completed_labs=0
        )
        
        history = self.get_learning_history(user_id)
        
        # Adjust recommendations based on skill level
        if skill_level == "Beginner":
            difficulty = "Easy"
            hints_provided = True
            extra_explanations = True
        elif skill_level == "Intermediate":
            difficulty = "Medium"
            hints_provided = True
            extra_explanations = False
        else:  # Advanced
            difficulty = "Hard"
            hints_provided = False
            extra_explanations = False
        
        return {
            "success": True,
            "data": {
                "skill_level": skill_level,
                "recommended_difficulty": difficulty,
                "hints_provided": hints_provided,
                "extra_explanations": extra_explanations,
                "learning_history": history.get("data", {}),
                "weakest_areas": self._identify_weak_areas(history.get("data", {}))
            }
        }
    
    def _identify_weak_areas(self, history: Dict[str, Any]) -> List[str]:
        """Identify user's weak areas based on learning history"""
        topics = history.get("topics", [])
        
        weak_areas = []
        for topic_data in topics:
            accuracy = topic_data.get("accuracy", 0)
            if accuracy < 0.6:  # Less than 60% accuracy
                weak_areas.append(topic_data.get("topic", "Unknown"))
        
        return weak_areas[:3]  # Return top 3 weak areas


# Standalone functions for router compatibility
_service_instance = AILearningService()

async def get_explanation(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """Standalone function to get explanation"""
    return await _service_instance.explain_attempt(request_data)


async def get_hint(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """Standalone function to get hint"""
    return await _service_instance.get_hint(request_data)


async def generate_practice_question(topic: str, skill_level: str, 
                                    user_id: str = "anonymous",
                                    question_type: str = "multiple_choice") -> Dict[str, Any]:
    """Standalone function to generate practice question"""
    return await _service_instance.generate_practice({"topic": topic, "skill_level": skill_level, 
                                                      "user_id": user_id, "question_type": question_type})


async def save_learning_progress(user_id: str, topic: str, result: str,
                                score: int, attempts: int, lab_id: str = None) -> Dict[str, Any]:
    """Standalone function to save learning progress"""
    return _service_instance.update_progress({
        "user_id": user_id,
        "topic": topic,
        "result": result,
        "score": score,
        "time_taken": 0,
        "attempts": attempts,
        "lab_id": lab_id
    })


async def get_user_progress(user_id: str) -> Dict[str, Any]:
    """Standalone function to get user progress"""
    return _service_instance.get_learning_history(user_id)


# In-memory storage for learning history
learning_history_db: Dict[str, Any] = {}
user_progress_db: Dict[str, Any] = {}