from typing import Dict, Any, List, Optional
from datetime import datetime


class AdaptiveLearningEngine:
    """
    Adaptive Learning Engine that adjusts difficulty and content based on user performance
    """
    
    def __init__(self):
        self.skill_thresholds = {
            "Beginner": {"accuracy": 0.0, "avg_score": 0.0, "labs_completed": 0},
            "Intermediate": {"accuracy": 0.70, "avg_score": 70.0, "labs_completed": 5},
            "Advanced": {"accuracy": 0.90, "avg_score": 85.0, "labs_completed": 10}
        }
    
    def calculate_skill_level(
        self,
        accuracy: float,
        average_score: float,
        completed_labs: int
    ) -> str:
        """
        Calculate user's skill level based on performance metrics
        
        Args:
            accuracy: Success rate (0.0 to 1.0)
            average_score: Average score (0 to 100)
            completed_labs: Number of completed labs
        
        Returns:
            Skill level: "Beginner", "Intermediate", or "Advanced"
        """
        # Check for Advanced
        if (accuracy >= self.skill_thresholds["Advanced"]["accuracy"] and
            average_score >= self.skill_thresholds["Advanced"]["avg_score"] and
            completed_labs >= self.skill_thresholds["Advanced"]["labs_completed"]):
            return "Advanced"
        
        # Check for Intermediate
        if (accuracy >= self.skill_thresholds["Intermediate"]["accuracy"] and
            average_score >= self.skill_thresholds["Intermediate"]["avg_score"] and
            completed_labs >= self.skill_thresholds["Intermediate"]["labs_completed"]):
            return "Intermediate"
        
        # Default to Beginner
        return "Beginner"
    
    def get_adaptive_difficulty(
        self,
        user_id: str,
        topic: str,
        current_difficulty: str,
        performance_history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Determine adaptive difficulty based on user performance
        
        Args:
            user_id: User identifier
            topic: Current topic
            current_difficulty: Current difficulty level
            performance_history: List of past performance records
        
        Returns:
            Dictionary with recommended difficulty and reasoning
        """
        if not performance_history:
            return {
                "recommended_difficulty": "Easy",
                "reason": "No performance history yet. Starting with easy difficulty.",
                "suggested_labs": [f"{topic} - Easy Lab 1"],
                "hint_level": "detailed"
            }
        
        # Calculate recent performance (last 5 attempts)
        recent_attempts = performance_history[-5:]
        recent_accuracy = sum(1 for a in recent_attempts if a.get("result") == "correct") / len(recent_attempts)
        recent_scores = [a.get("score", 0) for a in recent_attempts]
        recent_avg_score = sum(recent_scores) / len(recent_scores) if recent_scores else 0
        
        # Determine difficulty adjustment
        if recent_accuracy >= 0.9 and recent_avg_score >= 90:
            # User is excelling - increase difficulty
            if current_difficulty == "Easy":
                return {
                    "recommended_difficulty": "Medium",
                    "reason": "Great performance! Ready for medium difficulty.",
                    "suggested_labs": [f"{topic} - Medium Lab 1", f"{topic} - Medium Lab 2"],
                    "hint_level": "moderate"
                }
            elif current_difficulty == "Medium":
                return {
                    "recommended_difficulty": "Hard",
                    "reason": "Excellent work! You're ready for hard challenges.",
                    "suggested_labs": [f"{topic} - Hard Lab 1", f"{topic} - Expert Challenge"],
                    "hint_level": "minimal"
                }
            else:
                return {
                    "recommended_difficulty": "Hard",
                    "reason": "You're mastering this topic at expert level.",
                    "suggested_labs": [f"{topic} - Expert Challenge", f"{topic} - Advanced Scenario"],
                    "hint_level": "minimal"
                }
        
        elif recent_accuracy <= 0.3 or recent_avg_score <= 40:
            # User is struggling - decrease difficulty
            if current_difficulty == "Hard":
                return {
                    "recommended_difficulty": "Medium",
                    "reason": "Let's practice with medium difficulty to build confidence.",
                    "suggested_labs": [f"{topic} - Medium Lab 1"],
                    "hint_level": "detailed"
                }
            elif current_difficulty == "Medium":
                return {
                    "recommended_difficulty": "Easy",
                    "reason": "Starting with easy labs to strengthen fundamentals.",
                    "suggested_labs": [f"{topic} - Easy Lab 1", f"{topic} - Easy Lab 2"],
                    "hint_level": "detailed"
                }
            else:
                return {
                    "recommended_difficulty": "Easy",
                    "reason": "Let's review the basics with easy labs.",
                    "suggested_labs": [f"{topic} - Easy Lab 1"],
                    "hint_level": "detailed"
                }
        
        else:
            # User is performing adequately - maintain current difficulty
            return {
                "recommended_difficulty": current_difficulty,
                "reason": f"Good progress! Continue at {current_difficulty} difficulty.",
                "suggested_labs": [f"{topic} - {current_difficulty} Lab"],
                "hint_level": "moderate"
            }
    
    def get_hint_level(self, skill_level: str, performance: Dict[str, Any]) -> str:
        """
        Determine hint level based on skill level and performance
        
        Args:
            skill_level: User's skill level
            performance: Performance metrics
        
        Returns:
            Hint level: "minimal", "moderate", or "detailed"
        """
        accuracy = performance.get("accuracy", 0.0)
        avg_score = performance.get("average_score", 0.0)
        
        # Advanced users get minimal hints
        if skill_level == "Advanced":
            return "minimal"
        
        # Intermediate users get moderate hints
        if skill_level == "Intermediate":
            if accuracy >= 0.8:
                return "minimal"
            else:
                return "moderate"
        
        # Beginners get detailed hints
        if skill_level == "Beginner":
            if accuracy >= 0.7 and avg_score >= 75:
                return "moderate"
            else:
                return "detailed"
        
        return "detailed"
    
    def get_lab_recommendations(
        self,
        user_id: str,
        skill_level: str,
        topic: str,
        weakness: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get personalized lab recommendations
        
        Args:
            user_id: User identifier
            skill_level: User's skill level
            topic: Topic area
            weakness: Optional weakness area
        
        Returns:
            List of recommended labs
        """
        recommendations = []
        
        # Base recommendations by skill level
        if skill_level == "Beginner":
            recommendations = [
                {
                    "lab_id": f"{topic.lower()}_easy_1",
                    "title": f"{topic} - Easy Lab 1",
                    "difficulty": "Easy",
                    "description": f"Learn the basics of {topic} with guided instructions",
                    "hints_available": 3,
                    "xp_reward": 50
                },
                {
                    "lab_id": f"{topic.lower()}_easy_2",
                    "title": f"{topic} - Easy Lab 2",
                    "difficulty": "Easy",
                    "description": f"Practice {topic} with slightly more complex scenarios",
                    "hints_available": 3,
                    "xp_reward": 75
                }
            ]
        
        elif skill_level == "Intermediate":
            recommendations = [
                {
                    "lab_id": f"{topic.lower()}_medium_1",
                    "title": f"{topic} - Medium Lab 1",
                    "difficulty": "Medium",
                    "description": f"Apply {topic} techniques in realistic scenarios",
                    "hints_available": 2,
                    "xp_reward": 100
                },
                {
                    "lab_id": f"{topic.lower()}_medium_2",
                    "title": f"{topic} - Medium Lab 2",
                    "difficulty": "Medium",
                    "description": f"Advanced {topic} exploitation techniques",
                    "hints_available": 2,
                    "xp_reward": 125
                }
            ]
        
        else:  # Advanced
            recommendations = [
                {
                    "lab_id": f"{topic.lower()}_hard_1",
                    "title": f"{topic} - Hard Lab 1",
                    "difficulty": "Hard",
                    "description": f"Expert-level {topic} challenges with minimal guidance",
                    "hints_available": 1,
                    "xp_reward": 150
                },
                {
                    "lab_id": f"{topic.lower()}_expert",
                    "title": f"{topic} - Expert Challenge",
                    "difficulty": "Hard",
                    "description": f"Complex {topic} scenarios requiring deep understanding",
                    "hints_available": 1,
                    "xp_reward": 200
                }
            ]
        
        # Add weakness-specific lab if provided
        if weakness:
            recommendations.append({
                "lab_id": f"{topic.lower()}_weakness_{weakness.lower()}",
                "title": f"{topic} - {weakness} Focus",
                "difficulty": skill_level,
                "description": f"Targeted practice for {weakness} in {topic}",
                "hints_available": 3 if skill_level == "Beginner" else 2,
                "xp_reward": 100
            })
        
        return recommendations
    
    def analyze_learning_pattern(
        self,
        user_id: str,
        topic: str,
        attempts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze user's learning pattern for a topic
        
        Args:
            user_id: User identifier
            topic: Topic being analyzed
            attempts: List of attempt records
        
        Returns:
            Dictionary with learning pattern analysis
        """
        if not attempts:
            return {
                "pattern": "new_learner",
                "strengths": [],
                "weaknesses": [],
                "recommendations": ["Start with basic concepts", "Practice regularly"]
            }
        
        # Analyze patterns
        total_attempts = len(attempts)
        correct_attempts = sum(1 for a in attempts if a.get("result") == "correct")
        accuracy = correct_attempts / total_attempts if total_attempts > 0 else 0.0
        
        # Identify patterns
        if accuracy >= 0.9:
            pattern = "fast_learner"
            strengths = ["Quick understanding", "High accuracy", "Efficient problem-solving"]
            weaknesses = []
        elif accuracy >= 0.7:
            pattern = "steady_learner"
            strengths = ["Consistent progress", "Good retention"]
            weaknesses = ["Occasional mistakes"]
        elif accuracy >= 0.5:
            pattern = "developing"
            strengths = ["Persistent", "Learning from mistakes"]
            weaknesses = ["Needs more practice", "Conceptual gaps possible"]
        else:
            pattern = "needs_support"
            strengths = ["Dedicated effort"]
            weaknesses = ["Fundamental concepts need review", "Requires more guided practice"]
        
        recommendations = []
        if pattern == "fast_learner":
            recommendations = ["Ready for advanced topics", "Try challenging scenarios", "Help others learn"]
        elif pattern == "steady_learner":
            recommendations = ["Continue current pace", "Focus on weak areas", "Practice consistently"]
        elif pattern == "developing":
            recommendations = ["Review fundamentals", "Use hints when stuck", "Practice more scenarios"]
        else:
            recommendations = ["Start with easy labs", "Use detailed hints", "Review basic concepts", "Take time to understand"]
        
        return {
            "pattern": pattern,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "recommendations": recommendations,
            "metrics": {
                "total_attempts": total_attempts,
                "correct_attempts": correct_attempts,
                "accuracy": round(accuracy, 2)
            }
        }
    
    def update_skill_level(
        self,
        user_id: str,
        accuracy: float,
        average_score: float,
        completed_labs: int
    ) -> Dict[str, Any]:
        """
        Update user's skill level based on performance
        
        Args:
            user_id: User identifier
            accuracy: Success rate
            average_score: Average score
            completed_labs: Number of completed labs
        
        Returns:
            Dictionary with updated skill level and change info
        """
        new_level = self.calculate_skill_level(accuracy, average_score, completed_labs)
        
        return {
            "user_id": user_id,
            "new_skill_level": new_level,
            "accuracy": accuracy,
            "average_score": average_score,
            "completed_labs": completed_labs,
            "timestamp": datetime.now().isoformat()
        }