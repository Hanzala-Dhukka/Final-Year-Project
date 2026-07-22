"""
Prompt construction for the AI Quiz Generator (Module 7.2).

Builds a strict JSON-only prompt for the AI model that returns
`{ "questions": [ ... ] }` with the fields required by the spec (Step 5/6).
"""

SYSTEM_PROMPT = """You are CyberShield AI, an expert Application Security instructor.

Generate high-quality multiple-choice cybersecurity quiz questions.

Rules:
- Each question MUST have exactly 4 distinct options.
- Exactly one option must be the correct answer.
- Questions must be technically accurate and scenario-based where possible.
- Provide a concise, educational explanation for the correct answer.
- Reference the relevant OWASP Top 10 category when applicable.
- Return ONLY valid minified JSON. No markdown, no code fences, no prose.
"""

SCHEMA_HINT = """Return this exact JSON shape:

{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correct_answer": "string (must match one of the options exactly)",
      "explanation": "string",
      "owasp_reference": "string (e.g. 'A03 Injection')",
      "difficulty": "Easy|Medium|Hard|Expert",
      "category": "string",
      "technology": "string"
    }
  ]
}
"""


def build_quiz_prompt(
    difficulty: str,
    category: str,
    technology: str,
    count: int,
) -> str:
    """
    Build the full JSON-only prompt for the AI model.

    Args:
        difficulty: Easy|Medium|Hard|Expert.
        category: Quiz category.
        technology: Target technology.
        count: Number of questions.

    Returns:
        A single prompt string.
    """
    return (
        f"{SYSTEM_PROMPT.strip()}\n\n"
        f"Generate exactly {count} cybersecurity multiple-choice questions.\n\n"
        f"Difficulty: {difficulty}\n"
        f"Category: {category}\n"
        f"Technology: {technology}\n\n"
        f"Requirements:\n"
        f"- Return only valid JSON (no markdown fences).\n"
        f"- Each question must contain: question, 4 options, correct_answer, "
        f"explanation, owasp_reference, difficulty, category, technology.\n"
        f"- The correct_answer must be one of the four options verbatim.\n\n"
        f"{SCHEMA_HINT.strip()}"
    )
