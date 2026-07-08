import json
from typing import Dict, Any, List, Optional


async def generate_learning_recommendations(
    topic: str,
    skill_level: str,
    performance_data: Dict[str, Any],
    user_id: str = "anonymous"
) -> Dict[str, Any]:
    """
    Generate personalized learning recommendations using Gemini AI
    
    Args:
        topic: Current topic
        skill_level: User's skill level
        performance_data: Dictionary with performance metrics
        user_id: User identifier
    
    Returns:
        Dictionary with recommendations
    """
    try:
        # Build the prompt
        from app.services.prompt_builder import build_recommendation_prompt
        prompt = build_recommendation_prompt(
            topic=topic,
            skill_level=skill_level,
            performance_data=performance_data
        )
        
        # Generate AI response
        project_context = {
            "project_id": user_id,
            "topic": topic,
            "skill_level": skill_level
        }
        
        from app.services.gemini_service import generate_ai_response
        ai_response = await generate_ai_response(prompt, project_context)
        
        # Extract the answer
        answer = ai_response.get("answer", {})
        
        # If answer is a string (fallback), parse it
        if isinstance(answer, str):
            return _get_fallback_recommendations(topic, skill_level, performance_data)
        
        # Parse the JSON response from Gemini
        recommended_topics = answer.get("recommended_topics", [])
        focus_areas = answer.get("focus_areas", [])
        practice_recommendations = answer.get("practice_recommendations", [])
        reasoning = answer.get("reasoning", "")
        
        return {
            "recommended_topics": recommended_topics[:3],  # Top 3
            "focus_areas": focus_areas[:2],  # Top 2
            "practice_recommendations": practice_recommendations[:2],  # Top 2
            "reasoning": reasoning,
            "provider": ai_response.get("provider", "Unknown"),
            "model": ai_response.get("model", "Unknown")
        }
    
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        return _get_fallback_recommendations(topic, skill_level, performance_data)


def _get_fallback_recommendations(
    topic: str,
    skill_level: str,
    performance_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Provide fallback recommendations when AI is unavailable"""
    
    recommendations_db = {
        "SQL Injection": {
            "Beginner": {
                "recommended_topics": ["XSS Basics", "CSRF Fundamentals", "Input Validation"],
                "focus_areas": ["SQL basics", "Authentication mechanisms"],
                "practice_recommendations": ["Practice basic SQL queries", "Try simple injection payloads"]
            },
            "Intermediate": {
                "recommended_topics": ["Blind SQL Injection", "UNION Injection", "Database Security"],
                "focus_areas": ["Parameterized queries", "Prepared statements"],
                "practice_recommendations": ["Implement parameterized queries", "Practice UNION-based injections"]
            },
            "Advanced": {
                "recommended_topics": ["NoSQL Injection", "ORM Vulnerabilities", "Advanced Database Security"],
                "focus_areas": ["Time-based injections", "Second-order SQL injection"],
                "practice_recommendations": ["Explore blind injection techniques", "Study advanced bypass methods"]
            }
        },
        "XSS": {
            "Beginner": {
                "recommended_topics": ["HTML Basics", "JavaScript Fundamentals", "DOM Structure"],
                "focus_areas": ["HTML structure", "JavaScript basics"],
                "practice_recommendations": ["Learn HTML tags", "Practice basic JavaScript"]
            },
            "Intermediate": {
                "recommended_topics": ["DOM-based XSS", "CSP", "Stored XSS"],
                "focus_areas": ["Content Security Policy", "Input sanitization"],
                "practice_recommendations": ["Implement CSP headers", "Practice DOM-based XSS"]
            },
            "Advanced": {
                "recommended_topics": ["Mutation XSS", "Polyglot Payloads", "Browser Security"],
                "focus_areas": ["XSS filter bypass", "Advanced payloads"],
                "practice_recommendations": ["Create polyglot payloads", "Study mXSS techniques"]
            }
        },
        "CSRF": {
            "Beginner": {
                "recommended_topics": ["HTTP Methods", "Cookies & Sessions", "Authentication"],
                "focus_areas": ["HTTP basics", "Session management"],
                "practice_recommendations": ["Understand GET vs POST", "Learn about cookies"]
            },
            "Intermediate": {
                "recommended_topics": ["CSRF Tokens", "SameSite Cookies", "CORS"],
                "focus_areas": ["CSRF prevention", "Token implementation"],
                "practice_recommendations": ["Implement CSRF tokens", "Configure SameSite cookies"]
            },
            "Advanced": {
                "recommended_topics": ["CSRF in APIs", "Advanced Bypass", "Framework Security"],
                "focus_areas": ["API security", "Advanced bypass techniques"],
                "practice_recommendations": ["Secure REST APIs", "Study framework-specific CSRF"]
            }
        }
    }
    
    topic_recs = recommendations_db.get(topic, {}).get(skill_level, {
        "recommended_topics": ["Web Security Fundamentals", "OWASP Top 10", "Secure Coding"],
        "focus_areas": ["General security concepts", "Best practices"],
        "practice_recommendations": ["Practice secure coding", "Study common vulnerabilities"]
    })
    
    return {
        "recommended_topics": topic_recs["recommended_topics"],
        "focus_areas": topic_recs["focus_areas"],
        "practice_recommendations": topic_recs["practice_recommendations"],
        "reasoning": f"Based on your {skill_level} level performance in {topic}, these recommendations will help you progress systematically.",
        "provider": "Fallback",
        "model": "rule-based"
    }


async def generate_follow_up_questions(
    topic: str,
    skill_level: str,
    explanation: str,
    user_id: str = "anonymous"
) -> List[str]:
    """
    Generate follow-up learning questions using Gemini AI
    
    Args:
        topic: Current topic
        skill_level: User's skill level
        explanation: The explanation just provided
        user_id: User identifier
    
    Returns:
        List of follow-up questions
    """
    try:
        from app.services.prompt_builder import build_follow_up_questions_prompt
        
        prompt = build_follow_up_questions_prompt(
            topic=topic,
            skill_level=skill_level,
            explanation=explanation
        )
        
        project_context = {
            "project_id": user_id,
            "topic": topic,
            "skill_level": skill_level
        }
        
        from app.services.gemini_service import generate_ai_response
        ai_response = await generate_ai_response(prompt, project_context)
        answer = ai_response.get("answer", {})
        
        if isinstance(answer, dict):
            follow_ups = answer.get("follow_up_questions", [])
            if follow_ups:
                return follow_ups
        
        # Fallback
        return _get_fallback_follow_up_questions(topic, skill_level)
    
    except Exception as e:
        print(f"Error generating follow-up questions: {e}")
        return _get_fallback_follow_up_questions(topic, skill_level)


def _get_fallback_follow_up_questions(topic: str, skill_level: str) -> List[str]:
    """Provide fallback follow-up questions"""
    
    follow_ups_db = {
        "SQL Injection": {
            "Beginner": [
                "Would you like to learn about XSS (Cross-Site Scripting)?",
                "Would you like to learn about CSRF (Cross-Site Request Forgery)?",
                "Would you like to learn about Input Validation?",
                "Would you like to learn about Authentication mechanisms?"
            ],
            "Intermediate": [
                "Would you like to learn about Blind SQL Injection?",
                "Would you like to learn about UNION-based SQL Injection?",
                "Would you like to learn about Database Security best practices?",
                "Would you like to learn about Parameterized Queries?"
            ],
            "Advanced": [
                "Would you like to learn about NoSQL Injection?",
                "Would you like to learn about ORM Vulnerabilities?",
                "Would you like to learn about Time-based Blind Injection?",
                "Would you like to learn about Second-order SQL Injection?"
            ]
        },
        "XSS": {
            "Beginner": [
                "Would you like to learn about SQL Injection?",
                "Would you like to learn about CSRF?",
                "Would you like to learn about HTML sanitization?",
                "Would you like to learn about JavaScript security?"
            ],
            "Intermediate": [
                "Would you like to learn about DOM-based XSS?",
                "Would you like to learn about Content Security Policy (CSP)?",
                "Would you like to learn about Stored XSS?",
                "Would you like to learn about XSS prevention techniques?"
            ],
            "Advanced": [
                "Would you like to learn about Mutation XSS (mXSS)?",
                "Would you like to learn about Polyglot Payloads?",
                "Would you like to learn about Browser security models?",
                "Would you like to learn about XSS filter bypass techniques?"
            ]
        }
    }
    
    topic_follow_ups = follow_ups_db.get(topic, {})
    return topic_follow_ups.get(skill_level, [
        "Would you like to learn about Web Security Fundamentals?",
        "Would you like to learn about OWASP Top 10?",
        "Would you like to learn about Secure Coding practices?",
        "Would you like to learn about common vulnerability patterns?"
    ])


def get_learning_path(user_id: str, current_topic: str, skill_level: str) -> List[str]:
    """
    Generate a learning path for a user
    
    Args:
        user_id: User identifier
        current_topic: Current topic being learned
        skill_level: User's skill level
    
    Returns:
        List of topics in learning path order
    """
    
    learning_paths = {
        "Beginner": [
            "Web Security Fundamentals",
            "HTTP Basics",
            "SQL Injection Basics",
            "XSS Basics",
            "CSRF Fundamentals",
            "Input Validation",
            "Authentication & Session Management",
            "Secure Coding Practices"
        ],
        "Intermediate": [
            "Advanced SQL Injection",
            "Blind SQL Injection",
            "DOM-based XSS",
            "Stored XSS",
            "CSRF Tokens",
            "CORS Configuration",
            "Security Headers",
            "OWASP Top 10 Deep Dive"
        ],
        "Advanced": [
            "NoSQL Injection",
            "ORM Vulnerabilities",
            "Mutation XSS",
            "Polyglot Payloads",
            "Advanced CSRF Bypass",
            "API Security",
            "Business Logic Flaws",
            "Advanced Penetration Testing"
        ]
    }
    
    path = learning_paths.get(skill_level, learning_paths["Beginner"])
    
    # Ensure current topic is in the path
    if current_topic not in path:
        path.insert(0, current_topic)
    
    return path