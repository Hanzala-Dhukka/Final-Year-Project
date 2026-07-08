"""
Roadmap Service - Personalized Learning Path
Generates personalized learning roadmap using Gemini AI
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.services.analytics_service import AnalyticsService
from app.services.gemini_service import get_model


class RoadmapService:
    """Service for generating personalized learning roadmaps"""
    
    # All available topics in order
    ALL_TOPICS = [
        "SQL Injection",
        "XSS",
        "CSRF",
        "SSRF",
        "Command Injection",
        "Path Traversal",
        "Insecure Direct Object Reference",
        "Authentication",
        "OAuth",
        "JWT Security",
        "Cloud Security",
        "API Security"
    ]
    
    # In-memory storage
    user_roadmaps: Dict[str, Dict[str, Any]] = {}
    
    @classmethod
    async def generate_roadmap(cls, user_id: str) -> Dict[str, Any]:
        """
        Generate personalized learning roadmap for a user
        
        Args:
            user_id: User identifier
            
        Returns:
            Learning roadmap
        """
        # Get user analytics
        analytics = AnalyticsService.get_learning_analytics(user_id)
        category_mastery = AnalyticsService.get_category_mastery(user_id)
        
        # Determine completed and weak topics
        completed_topics = [
            cm["category"] for cm in category_mastery 
            if cm["mastery_percentage"] >= 70
        ]
        
        weak_topics = [
            cm["category"] for cm in category_mastery 
            if cm["mastery_percentage"] < 50 and cm["total"] > 0
        ]
        
        # Get recommended path
        recommended_path = await cls._get_ai_recommendations(
            completed_topics, weak_topics, analytics
        )
        
        # If no AI recommendations, use fallback
        if not recommended_path:
            recommended_path = cls._get_fallback_recommendations(completed_topics, weak_topics)
        
        # Determine next topic
        next_topic = recommended_path[0] if recommended_path else "SQL Injection"
        
        roadmap = {
            "user_id": user_id,
            "completed_topics": completed_topics,
            "weak_topics": weak_topics,
            "recommended_path": recommended_path,
            "next_topic": next_topic,
            "estimated_completion": cls._estimate_completion(len(recommended_path))
        }
        
        cls.user_roadmaps[user_id] = roadmap
        
        return roadmap
    
    @classmethod
    async def _get_ai_recommendations(cls, completed: List[str], 
                                       weak: List[str],
                                       analytics: Dict[str, Any]) -> List[str]:
        """Get AI-powered recommendations using Gemini"""
        try:
            model = get_model()
            if not model:
                return []
            
            prompt = f"""You are a cybersecurity learning advisor. Create a personalized learning path.

Completed Topics: {', '.join(completed) if completed else 'None'}
Weak Topics: {', '.join(weak) if weak else 'None'}
Average Score: {analytics.get('average_score', 0)}%
Total XP: {analytics.get('total_xp', 0)}

Available Topics (in learning order):
{', '.join(cls.ALL_TOPICS)}

Create a learning path that:
1. Prioritizes weak topics that need improvement
2. Follows a logical progression
3. Builds on completed topics

Return only a JSON array of topic names in recommended order:
["topic1", "topic2", "topic3"]"""
            
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Parse JSON response
            import json
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            
            recommendations = json.loads(response_text)
            return recommendations if isinstance(recommendations, list) else []
            
        except Exception as e:
            print(f"Error getting AI recommendations: {e}")
            return []
    
    @classmethod
    def _get_fallback_recommendations(cls, completed: List[str], 
                                       weak: List[str]) -> List[str]:
        """Get fallback recommendations without AI"""
        # Prioritize weak topics
        path = []
        
        # Add weak topics first
        for topic in weak:
            if topic in cls.ALL_TOPICS and topic not in path:
                path.append(topic)
        
        # Add remaining topics in order
        for topic in cls.ALL_TOPICS:
            if topic not in completed and topic not in path:
                path.append(topic)
        
        return path[:5]  # Return top 5 recommendations
    
    @classmethod
    def _estimate_completion(cls, remaining_topics: int) -> str:
        """Estimate completion time"""
        if remaining_topics == 0:
            return "Completed!"
        
        weeks = remaining_topics * 2  # 2 weeks per topic
        if weeks < 4:
            return f"{weeks} weeks"
        else:
            months = weeks // 4
            return f"{months} month{'s' if months > 1 else ''}"
    
    @classmethod
    def get_user_roadmap(cls, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user's roadmap if exists"""
        return cls.user_roadmaps.get(user_id)


# Standalone functions
async def get_learning_roadmap(user_id: str) -> Dict[str, Any]:
    """Get learning roadmap"""
    return await RoadmapService.generate_roadmap(user_id)


def get_roadmap(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user roadmap"""
    return RoadmapService.get_user_roadmap(user_id)