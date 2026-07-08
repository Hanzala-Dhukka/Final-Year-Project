import os
from typing import Dict, Any
from datetime import datetime


def load_prompt_template(template_name: str) -> str:
    """
    Load a prompt template from the prompts directory
    
    Args:
        template_name: Name of the template file (without .txt extension)
    
    Returns:
        Template content as string
    """
    try:
        # Get the prompts directory (parent of services directory)
        current_dir = os.path.dirname(os.path.abspath(__file__))
        prompts_dir = os.path.join(current_dir, "..", "prompts")
        template_path = os.path.join(prompts_dir, f"{template_name}.txt")
        
        with open(template_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error loading prompt template {template_name}: {e}")
        return ""


def build_explanation_prompt(
    topic: str,
    payload: str,
    result: str,
    skill_level: str,
    attempt_number: int = 1,
    previous_hints: list = None
) -> str:
    """
    Build explanation prompt for Gemini AI
    
    Args:
        topic: The security topic (e.g., "SQL Injection")
        payload: The user's payload/attempt
        result: "correct" or "incorrect"
        skill_level: "Beginner", "Intermediate", or "Advanced"
        attempt_number: Which attempt this is
        previous_hints: List of previous hints given
    
    Returns:
        Formatted prompt string
    """
    template = load_prompt_template("explanation_prompt")
    
    if not template:
        # Fallback to default template
        template = """You are an expert cybersecurity tutor specializing in {topic}.

STUDENT INFORMATION:
- Skill Level: {skill_level}
- Topic: {topic}
- Payload/Attempt: {payload}
- Result: {result}
- Attempt Number: {attempt_number}

Provide a personalized explanation in JSON format:
{{
  "explanation": "Your personalized explanation here",
  "key_concept": "The main concept being taught",
  "why_it_worked": "Why this payload succeeded or failed",
  "prevention": "How to prevent this attack",
  "real_world_example": "A real-world example or analogy"
}}

Use chat-style format with emojis. Start with 🤖 CyberShield AI Tutor."""
    
    # Format the template
    prompt = template.format(
        topic=topic,
        payload=payload,
        result=result,
        skill_level=skill_level,
        attempt_number=attempt_number,
        previous_hints=", ".join(previous_hints) if previous_hints else "None"
    )
    
    return prompt


def build_hint_prompt(
    topic: str,
    payload: str,
    hint_number: int,
    skill_level: str,
    previous_hints: list = None
) -> str:
    """
    Build hint prompt for Gemini AI
    
    Args:
        topic: The security topic
        payload: The user's current payload
        hint_number: Which hint number (1-3)
        skill_level: User's skill level
        previous_hints: List of previous hints given
    
    Returns:
        Formatted prompt string
    """
    template = load_prompt_template("hint_prompt")
    
    if not template:
        # Fallback to default template
        template = """You are an expert cybersecurity tutor providing progressive hints for {topic}.

STUDENT INFORMATION:
- Skill Level: {skill_level}
- Topic: {topic}
- Current Payload: {payload}
- Hint Number: {hint_number}
- Previous Hints: {previous_hints}

Provide a progressive hint in JSON format:
{{
  "hint": "Your progressive hint here",
  "hint_level": {hint_number},
  "encouragement": "Encouraging message",
  "what_to_consider": "What to think about next"
}}

Use friendly tone with emojis. Start with 💡 Hint from CyberShield AI Tutor."""
    
    # Format the template
    prompt = template.format(
        topic=topic,
        payload=payload,
        hint_number=hint_number,
        skill_level=skill_level,
        previous_hints=", ".join(previous_hints) if previous_hints else "None"
    )
    
    return prompt


def build_practice_prompt(
    topic: str,
    skill_level: str,
    question_type: str = "multiple_choice"
) -> str:
    """
    Build practice question prompt for Gemini AI
    
    Args:
        topic: The security topic
        skill_level: User's skill level
        question_type: Type of question (multiple_choice, code_fix, payload_write)
    
    Returns:
        Formatted prompt string
    """
    template = load_prompt_template("practice_prompt")
    
    if not template:
        # Fallback to default template
        template = """You are an expert cybersecurity tutor creating a practice question for {topic}.

STUDENT INFORMATION:
- Skill Level: {skill_level}
- Topic: {topic}
- Question Type: {question_type}

Create a practice question in JSON format:
{{
  "question": "The practice question",
  "question_type": "{question_type}",
  "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
  "correct_answer": "A",
  "explanation": "Why this is correct",
  "difficulty": "Easy/Medium/Hard",
  "topic": "{topic}"
}}

Make it educational and appropriate for {skill_level} level."""
    
    # Format the template
    prompt = template.format(
        topic=topic,
        skill_level=skill_level,
        question_type=question_type
    )
    
    return prompt


def build_recommendation_prompt(
    topic: str,
    skill_level: str,
    performance_data: Dict[str, Any]
) -> str:
    """
    Build learning recommendation prompt for Gemini AI
    
    Args:
        topic: Current topic
        skill_level: User's skill level
        performance_data: Dictionary with performance metrics
    
    Returns:
        Formatted prompt string
    """
    prompt = f"""You are an expert cybersecurity education advisor.

STUDENT INFORMATION:
- Current Topic: {topic}
- Skill Level: {skill_level}
- Performance Data: {performance_data}

Based on the student's performance and current topic, recommend:
1. Next 3 topics to learn (in order of priority)
2. Specific areas to focus on
3. Practice exercises that would be most beneficial

Structure your response as JSON:
{{
  "recommended_topics": ["Topic 1", "Topic 2", "Topic 3"],
  "focus_areas": ["Area 1", "Area 2"],
  "practice_recommendations": ["Practice 1", "Practice 2"],
  "reasoning": "Why these recommendations"
}}

Consider the student's skill level and learning progress."""
    
    return prompt


def build_prompt(
    question: str,
    project_context: Dict[str, Any]
) -> str:
    """
    Build a comprehensive prompt for the AI copilot
    
    Args:
        question: User's question
        project_context: Project context including threats, risk, etc.
    
    Returns:
        Formatted prompt string
    """
    # Extract context information
    project = project_context.get("project", "Unknown")
    risk = project_context.get("risk", "Unknown")
    threats_found = project_context.get("threats_found", 0)
    critical_threats = project_context.get("critical_threats", 0)
    high_threats = project_context.get("high_threats", 0)
    medium_threats = project_context.get("medium_threats", 0)
    low_threats = project_context.get("low_threats", 0)
    average_score = project_context.get("average_score", 0)
    recommendations = project_context.get("recommendations", [])
    top_risks = project_context.get("top_risks", [])
    tech_stack = project_context.get("tech_stack", {})
    
    prompt = f"""You are an expert cybersecurity advisor for the CyberShield platform.

PROJECT CONTEXT:
- Project: {project}
- Overall Risk Level: {risk}
- Threats Found: {threats_found}
- Risk Score: {average_score}/100
- Critical Threats: {critical_threats}
- High Threats: {high_threats}
- Medium Threats: {medium_threats}
- Low Threats: {low_threats}

TECH STACK:
- Frontend: {tech_stack.get('Frontend', 'N/A')}
- Backend: {tech_stack.get('Backend', 'N/A')}
- Database: {tech_stack.get('Database', 'N/A')}
- Authentication: {tech_stack.get('Authentication', 'N/A')}
- Cloud: {tech_stack.get('Cloud', 'N/A')}

TOP RISKS:
{chr(10).join([f"- {risk}" for risk in top_risks[:5]]) if top_risks else "- No specific risks identified"}

USER QUESTION:
{question}

Provide a comprehensive, actionable response in JSON format:
{{
  "title": "Brief title for the response",
  "summary": "Clear, concise summary of the answer",
  "business_impact": "What this means for the business/project",
  "recommendation": "Specific recommendation to address the issue",
  "implementation_steps": ["Step 1", "Step 2", "Step 3"],
  "secure_code": "Code example if applicable, or empty string"
}}

Be educational, practical, and security-focused. Use clear language appropriate for developers."""
    
    return prompt


def build_follow_up_questions_prompt(
    topic: str,
    skill_level: str,
    explanation: str
) -> str:
    """
    Build follow-up questions prompt for Gemini AI
    
    Args:
        topic: Current topic
        skill_level: User's skill level
        explanation: The explanation just provided
    
    Returns:
        Formatted prompt string
    """
    prompt = f"""You are an expert cybersecurity tutor suggesting follow-up learning topics.

CURRENT CONTEXT:
- Topic Just Learned: {topic}
- Skill Level: {skill_level}
- Explanation Provided: {explanation}

Suggest 4 related follow-up topics the student might want to learn next. These should:
1. Be logically connected to the current topic
2. Progress in difficulty appropriately
3. Cover complementary concepts
4. Be specific and actionable

Structure your response as JSON:
{{
  "follow_up_questions": [
    "Would you like to learn about [Topic 1]?",
    "Would you like to learn about [Topic 2]?",
    "Would you like to learn about [Topic 3]?",
    "Would you like to learn about [Topic 4]?"
  ]
}}

Make them engaging and relevant to {topic}."""
    
    return prompt
