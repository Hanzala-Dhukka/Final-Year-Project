import json
import re
from typing import Dict, Any, Optional
from app.services.gemini_service import generate_ai_response
from app.services.prompt_builder import build_explanation_prompt


async def generate_explanation(
    topic: str,
    payload: str,
    result: str,
    skill_level: str,
    attempt_number: int = 1,
    previous_hints: list = None,
    user_id: str = "anonymous"
) -> Dict[str, Any]:
    """
    Generate personalized explanation using Gemini AI
    
    Args:
        topic: The security topic
        payload: User's payload/attempt
        result: "correct" or "incorrect"
        skill_level: User's skill level
        attempt_number: Which attempt this is
        previous_hints: List of previous hints
        user_id: User identifier
    
    Returns:
        Dictionary with explanation and metadata
    """
    try:
        # Build the prompt
        prompt = build_explanation_prompt(
            topic=topic,
            payload=payload,
            result=result,
            skill_level=skill_level,
            attempt_number=attempt_number,
            previous_hints=previous_hints or []
        )
        
        # Generate AI response
        project_context = {
            "project_id": user_id,
            "topic": topic,
            "skill_level": skill_level
        }
        
        ai_response = await generate_ai_response(prompt, project_context)
        
        # Extract the answer
        answer = ai_response.get("answer", {})
        
        # If answer is a string (fallback), wrap it
        if isinstance(answer, str):
            explanation_text = answer
            parsed_data = {
                "explanation": explanation_text,
                "key_concept": topic,
                "why_it_worked": "See explanation",
                "prevention": "See explanation",
                "real_world_example": "See explanation"
            }
        else:
            # Parse the JSON response from Gemini
            explanation_text = answer.get("explanation", "")
            parsed_data = {
                "explanation": explanation_text,
                "key_concept": answer.get("key_concept", topic),
                "why_it_worked": answer.get("why_it_worked", ""),
                "prevention": answer.get("prevention", ""),
                "real_world_example": answer.get("real_world_example", "")
            }
        
        # Build personalized feedback
        personalized_feedback = _build_personalized_feedback(
            result=result,
            skill_level=skill_level,
            parsed_data=parsed_data
        )
        
        # Generate recommendations
        recommendations = _generate_recommendations(topic, result, skill_level)
        
        # Generate next topics
        next_topics = _generate_next_topics(topic, skill_level)
        
        # Calculate confidence score
        confidence_score = _calculate_confidence_score(
            result=result,
            attempt_number=attempt_number,
            skill_level=skill_level
        )
        
        return {
            "explanation": explanation_text,
            "personalized_feedback": personalized_feedback,
            "recommendations": recommendations,
            "next_topics": next_topics,
            "skill_level": skill_level,
            "confidence_score": confidence_score,
            "provider": ai_response.get("provider", "Unknown"),
            "key_concepts": [parsed_data.get("key_concept", topic)],
            "common_mistakes": _get_common_mistakes(topic, result),
            "real_world_example": parsed_data.get("real_world_example", "")
        }
    
    except Exception as e:
        return generate_fallback_explanation(topic, payload, result, skill_level)


def _build_personalized_feedback(result: str, skill_level: str, parsed_data: Dict[str, Any]) -> str:
    """Build personalized feedback based on result and skill level"""
    
    if result == "correct":
        feedback_templates = {
            "Beginner": "🎉 Excellent work! You've successfully completed this challenge. Your understanding is growing!",
            "Intermediate": "👏 Great job! You've demonstrated solid understanding of the concept. Keep building on this knowledge!",
            "Advanced": "💪 Impressive! You've mastered this technique. Ready for more advanced challenges?"
        }
    else:
        feedback_templates = {
            "Beginner": "💪 Not quite right, but that's okay! Learning takes practice. Let me explain what happened...",
            "Intermediate": "🤔 Close, but not quite. Let's analyze what went wrong and how to fix it...",
            "Advanced": "🔍 Not this time. Let's dive deeper into why this didn't work and explore alternative approaches..."
        }
    
    base_feedback = feedback_templates.get(skill_level, feedback_templates["Beginner"])
    
    # Add specific feedback from parsed data
    if parsed_data.get("why_it_worked"):
        base_feedback += f"\n\n{parsed_data['why_it_worked']}"
    
    return base_feedback


def _generate_recommendations(topic: str, result: str, skill_level: str) -> list:
    """Generate learning recommendations based on topic and result"""
    
    recommendations = {
        "SQL Injection": [
            "Learn about Prepared Statements",
            "Understand Parameterized Queries",
            "Study Input Validation techniques",
            "Explore Stored Procedures"
        ],
        "XSS": [
            "Learn about Output Encoding",
            "Understand Content Security Policy (CSP)",
            "Study HTML Escaping",
            "Explore DOM-based XSS prevention"
        ],
        "CSRF": [
            "Learn about CSRF Tokens",
            "Understand SameSite Cookies",
            "Study Anti-CSRF frameworks"
        ]
    }
    
    topic_recs = recommendations.get(topic, [
        "Practice more challenges in this category",
        "Study the OWASP guidelines",
        "Learn defensive coding practices"
    ])
    
    # Adjust based on result
    if result == "incorrect":
        topic_recs.insert(0, "Review the basics of " + topic)
    
    return topic_recs[:4]  # Return top 4


def _generate_next_topics(topic: str, skill_level: str) -> list:
    """Generate recommended next topics based on current topic and skill level"""
    
    topic_progression = {
        "SQL Injection": {
            "Beginner": ["XSS Basics", "CSRF Introduction", "Input Validation"],
            "Intermediate": ["Blind SQL Injection", "UNION-based SQL Injection", "SQLMap"],
            "Advanced": ["Second-Order SQL Injection", "Out-of-band SQL Injection", "NoSQL Injection"]
        },
        "XSS": {
            "Beginner": ["SQL Injection Basics", "CSRF", "HTML Encoding"],
            "Intermediate": ["DOM-based XSS", "CSRF Tokens", "CSP"],
            "Advanced": ["Mutation XSS", "Polyglot Payloads", "XSS Filter Evasion"]
        }
    }
    
    next_topics = topic_progression.get(topic, {}).get(skill_level, [
        "Advanced " + topic,
        "Related Attack Vectors",
        "Defense Strategies"
    ])
    
    return next_topics[:3]  # Return top 3


def _calculate_confidence_score(result: str, attempt_number: int, skill_level: str) -> float:
    """Calculate confidence score based on performance"""
    
    base_score = 0.5
    
    if result == "correct":
        base_score = 0.8
    else:
        base_score = 0.3
    
    # Adjust for attempt number (more attempts = lower confidence)
    attempt_penalty = (attempt_number - 1) * 0.1
    base_score -= attempt_penalty
    
    # Adjust for skill level
    skill_bonus = {
        "Beginner": 0.0,
        "Intermediate": 0.1,
        "Advanced": 0.2
    }
    base_score += skill_bonus.get(skill_level, 0.0)
    
    # Clamp between 0 and 1
    return max(0.0, min(1.0, base_score))


def _get_common_mistakes(topic: str, result: str) -> list:
    """Get common mistakes for a topic"""
    
    if result == "correct":
        return []
    
    common_mistakes = {
        "SQL Injection": [
            "Forgetting to close the quote",
            "Not commenting out the rest of the query",
            "Using wrong comment syntax",
            "Incorrect payload syntax"
        ],
        "XSS": [
            "Not encoding special characters",
            "Using innerHTML instead of textContent",
            "Forgetting to validate input",
            "Not implementing CSP"
        ]
    }
    
    return common_mistakes.get(topic, ["Review the topic basics", "Check your payload syntax"])


def generate_fallback_explanation(topic: str, payload: str, result: str, skill_level: str) -> Dict[str, Any]:
    """Generate fallback explanation when AI is not available"""
    
    explanations = {
        "SQL Injection": {
            "Beginner": {
                "correct": "Great job! You successfully used SQL Injection to bypass authentication. Think of it like tricking a security guard by saying 'I'm allowed in OR 1 equals 1' - the guard gets confused and lets you through because 1=1 is always true!",
                "incorrect": "Not quite! SQL Injection is about tricking a database by inserting special SQL commands into user input. Try using ' OR 1=1 -- which adds a condition that's always true."
            },
            "Intermediate": {
                "correct": "Excellent! Your payload ' OR 1=1 -- modified the SQL query's WHERE clause, making it always return TRUE. This bypassed the authentication check by exploiting improper input validation.",
                "incorrect": "Your payload didn't work because it wasn't properly formatted. SQL Injection requires breaking out of the string context and adding SQL logic. Try: ' OR 1=1 --"
            },
            "Advanced": {
                "correct": "Perfect exploitation. The payload successfully altered the authentication query's logic by injecting a tautology. The WHERE clause now evaluates to TRUE for all records, effectively bypassing credential verification.",
                "incorrect": "The payload failed to achieve SQL Injection. Ensure you're closing the string literal with a quote, adding the injection payload (OR 1=1), and commenting out the rest of the query with -- or #."
            }
        }
    }
    
    topic_explanations = explanations.get(topic, {})
    skill_explanations = topic_explanations.get(skill_level, {})
    
    explanation = skill_explanations.get(result, "Keep practicing! Understanding how attacks work is key to defending against them.")
    
    return {
        "success": True,
        "explanation": explanation,
        "personalized_feedback": explanation,
        "key_concepts": [topic, "Input Validation", "Authentication Bypass"],
        "common_mistakes": ["Forgetting to close quotes", "Not commenting out rest of query"],
        "real_world_example": "SQL Injection is one of the OWASP Top 10 vulnerabilities",
        "recommendations": _generate_recommendations(topic, result, skill_level),
        "next_topics": _generate_next_topics(topic, skill_level),
        "skill_level": skill_level,
        "confidence_score": 0.5,
        "provider": "Fallback"
    }


async def generate_hint(topic: str, payload: str, hint_number: int, skill_level: str, 
                        previous_attempts: list = None) -> Dict[str, Any]:
    """
    Generate progressive hint using AI
    
    Args:
        topic: Security topic
        payload: Current payload attempt
        hint_number: 1, 2, or 3
        skill_level: User's skill level
        previous_attempts: List of previous payload attempts
    
    Returns:
        Dictionary with hint and metadata
    """
    previous_attempts = previous_attempts or []
    
    # Build prompt
    prompt = build_hint_prompt(topic, payload, hint_number, skill_level, previous_attempts)
    
    # Create project context
    project_context = {
        "project": "CyberShield Learning Platform",
        "question": f"Provide hint {hint_number} for {topic}"
    }
    
    # Generate AI response
    ai_response = await generate_ai_response(prompt, project_context)
    
    # Parse response
    if ai_response.get("provider") == "Gemini":
        answer = ai_response.get("answer", {})
        if isinstance(answer, dict):
            return {
                "success": True,
                "hint": answer.get("hint", ""),
                "hint_level": hint_number,
                "concept_to_review": answer.get("concept_to_review", ""),
                "example": answer.get("example", ""),
                "encouragement": answer.get("encouragement", "Keep trying!"),
                "next_hint_available": hint_number < 3,
                "provider": "Gemini",
                "skill_level": skill_level
            }
    
    # Fallback hints
    return generate_fallback_hint(topic, hint_number, skill_level)


def build_hint_prompt(topic: str, payload: str, hint_number: int, skill_level: str, previous_attempts: list) -> str:
    """Build hint prompt with user context"""
    try:
        with open("app/prompts/hint_prompt.txt", "r") as f:
            template = f.read()
    except FileNotFoundError:
        template = get_fallback_hint_prompt()
    
    attempts_str = ", ".join(previous_attempts) if previous_attempts else "None"
    
    prompt = template.format(
        topic=topic,
        payload=payload,
        hint_number=hint_number,
        skill_level=skill_level,
        previous_attempts=attempts_str
    )
    
    return prompt


def get_fallback_hint_prompt() -> str:
    """Fallback hint prompt"""
    return """
You are a cybersecurity tutor. Provide hint level {hint_number} for {skill_level} student.

Topic: {topic}
Payload: {payload}

Provide hint in JSON format:
{{"hint": "...", "hint_level": {hint_number}, "concept_to_review": "..."}}
"""


def generate_fallback_hint(topic: str, hint_number: int, skill_level: str) -> Dict[str, Any]:
    """Generate fallback hints when AI is not available"""
    
    hints_db = {
        "SQL Injection": {
            1: {
                "Beginner": "Think about what happens when you type special characters in a login form. What if the website doesn't check your input?",
                "Intermediate": "Consider how SQL queries are constructed. What happens if user input is directly concatenated into the query string?",
                "Advanced": "Examine the query structure. You need to break out of the string literal context and inject SQL logic that modifies the WHERE clause."
            },
            2: {
                "Beginner": "Try using a quote (') to close the username field, then add OR with a condition that's always true, like 1=1.",
                "Intermediate": "Use the payload: ' OR 1=1 -- The quote closes the string, OR 1=1 makes the condition always true, and -- comments out the rest.",
                "Advanced": "Inject a tautology using: ' OR 1=1 -- Ensure proper quote closure and comment syntax to bypass the password check."
            },
            3: {
                "Beginner": "Try this exact payload: ' OR 1=1 -- This will make the database think the condition is always true!",
                "Intermediate": "Your payload should be: ' OR 1=1 -- This closes the string, adds a true condition, and comments out the password check.",
                "Advanced": "Use: ' OR 1=1 -- to transform the WHERE clause to WHERE username='' OR 1=1 --' AND password='...' which always evaluates to TRUE."
            }
        }
    }
    
    topic_hints = hints_db.get(topic, {})
    level_hints = topic_hints.get(hint_number, {})
    hint_text = level_hints.get(skill_level, "Keep analyzing the input validation. What characters have special meaning in SQL?")
    
    return {
        "success": True,
        "hint": hint_text,
        "hint_level": hint_number,
        "concept_to_review": f"{topic} fundamentals",
        "example": "Example: ' OR 1=1 --" if hint_number > 1 else "",
        "encouragement": "You're getting closer!",
        "next_hint_available": hint_number < 3,
        "provider": "Fallback",
        "skill_level": skill_level
    }


async def generate_practice_question(topic: str, skill_level: str, question_type: str = "multiple_choice") -> Dict[str, Any]:
    """
    Generate practice question using AI
    
    Args:
        topic: Security topic
        skill_level: User's skill level
        question_type: Type of question (multiple_choice, code_fix, write_payload)
    
    Returns:
        Dictionary with question and metadata
    """
    # Build prompt
    prompt = build_practice_prompt(topic, skill_level, question_type)
    
    # Create project context
    project_context = {
        "project": "CyberShield Learning Platform",
        "question": f"Generate {question_type} practice question for {topic} at {skill_level} level"
    }
    
    # Generate AI response
    ai_response = await generate_ai_response(prompt, project_context)
    
    # Parse response
    if ai_response.get("provider") == "Gemini":
        answer = ai_response.get("answer", {})
        if isinstance(answer, dict):
            return {
                "success": True,
                "question": answer.get("question", ""),
                "options": answer.get("options", []),
                "correct_answer": answer.get("correct_answer", ""),
                "explanation": answer.get("explanation", ""),
                "difficulty": answer.get("difficulty", "Medium"),
                "skill_level": skill_level,
                "provider": "Gemini"
            }
    
    # Fallback question
    return generate_fallback_question(topic, skill_level, question_type)


def build_practice_prompt(topic: str, skill_level: str, question_type: str) -> str:
    """Build practice question prompt"""
    try:
        with open("app/prompts/practice_prompt.txt", "r") as f:
            template = f.read()
    except FileNotFoundError:
        template = get_fallback_practice_prompt()
    
    prompt = template.format(
        topic=topic,
        skill_level=skill_level,
        question_type=question_type
    )
    
    return prompt


def get_fallback_practice_prompt() -> str:
    """Fallback practice prompt"""
    return """
You are a cybersecurity educator. Create a {skill_level} level practice question about {topic}.

Provide question in JSON format:
{{"question": "...", "options": [...], "correct_answer": "...", "explanation": "..."}}
"""


def generate_fallback_question(topic: str, skill_level: str, question_type: str) -> Dict[str, Any]:
    """Generate fallback practice question when AI is not available"""
    
    questions_db = {
        "SQL Injection": {
            "Beginner": {
                "multiple_choice": {
                    "question": "What is SQL Injection?",
                    "options": [
                        "A) A type of database optimization",
                        "B) Inserting malicious SQL code through user input",
                        "C) A way to speed up database queries",
                        "D) A database backup method"
                    ],
                    "correct_answer": "B",
                    "explanation": "SQL Injection occurs when attackers insert malicious SQL code through user input fields, which is then executed by the database.",
                    "difficulty": "Easy"
                }
            },
            "Intermediate": {
                "multiple_choice": {
                    "question": "Why does the payload ' OR 1=1 -- bypass authentication?",
                    "options": [
                        "A) It always evaluates to TRUE",
                        "B) It encrypts the password",
                        "C) It deletes the users table",
                        "D) It hashes the input"
                    ],
                    "correct_answer": "A",
                    "explanation": "The OR 1=1 condition always evaluates to TRUE, making the WHERE clause return all records and bypassing authentication.",
                    "difficulty": "Medium"
                }
            },
            "Advanced": {
                "multiple_choice": {
                    "question": "In a blind SQL Injection scenario with no visible output, what technique would you use?",
                    "options": [
                        "A) UNION-based injection",
                        "B) Time-based blind injection using SLEEP()",
                        "C) Error-based injection",
                        "D) All of the above depending on the context"
                    ],
                    "correct_answer": "D",
                    "explanation": "Different blind SQL Injection scenarios require different techniques. Time-based, error-based, or UNION-based methods can be used depending on the application's behavior.",
                    "difficulty": "Hard"
                }
            }
        }
    }
    
    topic_questions = questions_db.get(topic, {})
    skill_questions = topic_questions.get(skill_level, {})
    question_data = skill_questions.get(question_type, {})
    
    if not question_data:
        question_data = {
            "question": f"What is {topic}?",
            "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
            "correct_answer": "A",
            "explanation": f"{topic} is an important security concept to understand.",
            "difficulty": "Medium"
        }
    
    return {
        "success": True,
        **question_data,
        "skill_level": skill_level,
        "provider": "Fallback"
    }