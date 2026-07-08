import json
import re
from typing import Dict, Any, List, Optional
from app.services.gemini_service import generate_ai_response
from app.services.prompt_builder import build_hint_prompt


async def generate_hint(
    topic: str,
    payload: str,
    hint_number: int,
    skill_level: str,
    previous_hints: List[str] = None,
    user_id: str = "anonymous",
    lab_id: str = None
) -> Dict[str, Any]:
    """
    Generate progressive hint using Gemini AI
    
    Args:
        topic: The security topic
        payload: User's current payload
        hint_number: Which hint number (1-3)
        skill_level: User's skill level
        previous_hints: List of previous hints given
        user_id: User identifier
        lab_id: Lab identifier
    
    Returns:
        Dictionary with hint and metadata
    """
    try:
        # Validate hint number
        if hint_number < 1 or hint_number > 3:
            hint_number = 1
        
        # Build the prompt
        prompt = build_hint_prompt(
            topic=topic,
            payload=payload,
            hint_number=hint_number,
            skill_level=skill_level,
            previous_hints=previous_hints or []
        )
        
        # Generate AI response
        project_context = {
            "project_id": user_id,
            "topic": topic,
            "skill_level": skill_level,
            "lab_id": lab_id
        }
        
        ai_response = await generate_ai_response(prompt, project_context)
        
        # Extract the answer
        answer = ai_response.get("answer", {})
        
        # If answer is a string (fallback), wrap it
        if isinstance(answer, str):
            hint_text = answer
            parsed_data = {
                "hint": hint_text,
                "hint_level": hint_number,
                "encouragement": "Keep trying! You're learning! 💪",
                "what_to_consider": "Think about the attack vectors"
            }
        else:
            # Parse the JSON response from Gemini
            hint_text = answer.get("hint", "")
            parsed_data = {
                "hint": hint_text,
                "hint_level": answer.get("hint_level", hint_number),
                "encouragement": answer.get("encouragement", "Keep trying!"),
                "what_to_consider": answer.get("what_to_consider", "Think about the approach")
            }
        
        # Format the hint with emojis
        formatted_hint = f"💡 Hint from CyberShield AI Tutor\n\n{parsed_data['hint']}\n\n{parsed_data.get('encouragement', '')}"
        
        return {
            "hint": formatted_hint,
            "hint_level": parsed_data["hint_level"],
            "next_hint_available": hint_number < 3,
            "topic": topic,
            "what_to_consider": parsed_data.get("what_to_consider", ""),
            "provider": ai_response.get("provider", "Unknown"),
            "model": ai_response.get("model", "Unknown")
        }
    
    except Exception as e:
        print(f"Error generating hint: {e}")
        return _get_fallback_hint(topic, payload, hint_number, skill_level)


def _get_fallback_hint(
    topic: str,
    payload: str,
    hint_number: int,
    skill_level: str
) -> Dict[str, Any]:
    """Provide fallback hint when AI is unavailable"""
    
    fallback_hints = {
        "SQL Injection": {
            1: "💡 Think about how SQL queries are structured. What characters have special meaning in SQL?",
            2: "💡 Consider how you can modify the query logic using SQL operators like OR or AND.",
            3: "💡 Try using ' OR '1'='1' -- to bypass authentication. The OR condition always evaluates to TRUE."
        },
        "XSS": {
            1: "💡 Think about how browsers interpret user input in HTML pages.",
            2: "💡 Consider injecting HTML or JavaScript tags that the browser will execute.",
            3: "💡 Try using <script>alert('XSS')</script> to test if the input is reflected without sanitization."
        },
        "CSRF": {
            1: "💡 Think about how browsers automatically send cookies with requests.",
            2: "💡 Consider creating a malicious form that submits to the vulnerable endpoint.",
            3: "💡 Try creating an HTML form with hidden fields that matches the expected parameters."
        }
    }
    
    topic_hints = fallback_hints.get(topic, {})
    hint_text = topic_hints.get(hint_number, f"💡 Review the {topic} concepts and try a different approach.")
    
    return {
        "hint": hint_text,
        "hint_level": hint_number,
        "next_hint_available": hint_number < 3,
        "topic": topic,
        "what_to_consider": "Think about the attack methodology",
        "provider": "Fallback",
        "model": "rule-based"
    }


async def generate_personalized_feedback(
    topic: str,
    payload: str,
    result: str,
    skill_level: str,
    user_id: str = "anonymous"
) -> str:
    """
    Generate personalized feedback for incorrect attempts
    
    Args:
        topic: The security topic
        payload: User's payload
        result: "correct" or "incorrect"
        skill_level: User's skill level
        user_id: User identifier
    
    Returns:
        Personalized feedback string
    """
    
    if result == "correct":
        return _get_correct_feedback(topic, skill_level)
    else:
        return _get_incorrect_feedback(topic, payload, skill_level)


def _get_correct_feedback(topic: str, skill_level: str) -> str:
    """Get feedback for correct answers"""
    
    feedback = {
        "Beginner": """🎉 Excellent work! You got it right!

You successfully exploited the vulnerability. This is a great achievement!

💡 What you learned:
• You understood how the attack works
• You applied the correct technique
• You're building your cybersecurity skills

🌟 Keep up the great work! Ready for the next challenge?""",
        
        "Intermediate": """🎯 Well done! You demonstrated solid understanding.

Your payload successfully exploited the {topic} vulnerability. You're showing strong skills!

💡 Key takeaways:
• You correctly identified the vulnerability
• You applied the right exploitation technique
• You're ready for more complex scenarios

🚀 Ready to level up? Try the next challenge!""",
        
        "Advanced": """🎓 Impressive work! You showed expert-level understanding.

Your exploitation of {topic} was precise and effective. You're thinking like a security professional!

💡 Technical insights:
• You demonstrated deep understanding of the vulnerability
• Your approach was technically sound
• You're ready for advanced scenarios

🏆 Outstanding performance! Ready for the next expert-level challenge?"""
    }
    
    return feedback.get(skill_level, feedback["Beginner"]).format(topic=topic)


def _get_incorrect_feedback(topic: str, payload: str, skill_level: str) -> str:
    """Get feedback for incorrect answers"""
    
    feedback = {
        "Beginner": f"""🤖 CyberShield AI Tutor

Your payload did not work as expected. Let me help you understand why!

📝 What happened:
Your payload: {payload}

💡 Let's break it down:
• Your input didn't modify the query as intended
• The application likely sanitized or rejected your input
• Let's try a different approach

🔍 What to consider:
• Review the basic concepts of {topic}
• Think about how the application processes user input
• Consider what characters or patterns might be filtered

💪 Don't worry! Every expert was once a beginner. Let's try again with a hint!""",
        
        "Intermediate": f"""🤖 CyberShield AI Tutor

Your payload didn't succeed, but that's part of the learning process!

📝 Analysis:
Your payload: {payload}

💡 Technical feedback:
• The payload didn't achieve the intended effect
• There might be filtering or validation in place
• Consider alternative approaches

🔍 Next steps:
• Review the {topic} exploitation techniques
• Think about bypassing common filters
• Consider edge cases and variations

💡 Remember: Failed attempts are valuable learning experiences. Let's refine your approach!""",
        
        "Advanced": f"""🤖 CyberShield AI Tutor

Interesting attempt! Let's analyze why it didn't work.

📝 Technical Analysis:
Your payload: {payload}

💡 Deep dive:
• The payload structure may need adjustment
• Consider the specific implementation details
• Think about modern防护 mechanisms

🔍 Advanced considerations:
• Analyze the application's input validation
• Consider context-specific filtering
• Explore alternative exploitation vectors

💪 This is how experts learn - through analysis and iteration. Let's optimize your approach!"""
    }
    
    return feedback.get(skill_level, feedback["Beginner"])


def get_hint_statistics(user_id: str, topic: str = None) -> Dict[str, Any]:
    """
    Get hint usage statistics for a user
    
    Args:
        user_id: User identifier
        topic: Optional topic filter
    
    Returns:
        Dictionary with hint statistics
    """
    # This would typically query a database
    # For now, return placeholder statistics
    return {
        "user_id": user_id,
        "total_hints_used": 0,
        "hints_by_topic": {},
        "average_hints_per_attempt": 0.0,
        "most_used_hint_level": 1
    }