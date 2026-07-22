"""
Glossary AI service (Module 7.3).

Generates a rich, markdown-formatted explanation for a glossary term via the
configured AI model (Groq, per Module 7.1 decision), with a graceful offline
fallback that reuses the existing definition.
"""
from typing import Tuple

from app.ai.gemini_client import generate, is_available


PROMPT_TEMPLATE = """Explain the cybersecurity term.

Term: {term}

{context}

Provide:
- Definition
- Real-world analogy
- Technical explanation
- Business impact
- Common mistakes
- Best practices
- OWASP Reference
- Related concepts

Return Markdown."""


def build_explain_prompt(term: str, definition: str = None) -> str:
    context = f"Existing definition for context: {definition}" if definition else ""
    return PROMPT_TEMPLATE.format(term=term, context=context)


async def explain_term(term: str, definition: str = None) -> Tuple[str, str]:
    """
    Return (markdown_explanation, provider).

    Falls back to a simple markdown block built from the provided definition
    when the AI model is unavailable.
    """
    if is_available():
        try:
            prompt = build_explain_prompt(term, definition)
            text = await generate(prompt)
            if text:
                return text.strip(), "Groq"
        except Exception as e:
            print(f"Glossary AI explain failed, using fallback: {e}")

    fallback = _fallback_markdown(term, definition)
    return fallback, "Fallback"


def _fallback_markdown(term: str, definition: str = None) -> str:
    defn = definition or f"{term} is a cybersecurity concept."
    return (
        f"# {term}\n\n"
        f"## Definition\n\n{defn}\n\n"
        f"## Best Practices\n\n"
        f"- Study this term alongside related concepts.\n"
        f"- Apply it in hands-on labs and quizzes.\n\n"
        f"## Note\n\n"
        f"AI explanations are unavailable (no model configured). "
        f"The definition above is from the CyberShield glossary."
    )
