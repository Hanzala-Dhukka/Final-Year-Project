"""
AI Coach service (Module 7.4, spec Steps 7 & 18).

Given a user attempt (vulnerability, difficulty, payload, success), returns a
rich, markdown explanation: why it worked, business impact, how to fix, OWASP
reference, and best practices. Uses Groq (Module 7.1 decision); falls back to
the scenario's curated explanation offline.
"""
from typing import Tuple

from app.ai.gemini_client import generate, is_available


PROMPT = """You are an OWASP security trainer.

The user attempted: {attack}
Difficulty: {difficulty}
Payload: {payload}
Result: {result}

Explain:
- Why the payload succeeded (or why it failed)
- Business impact
- How to fix the vulnerability
- OWASP reference
- Best practices

Return concise Markdown."""


def build_coach_prompt(attack: str, difficulty: str, payload: str, success: bool) -> str:
    result = "Successful exploit" if success else "Did not trigger the vulnerability"
    return PROMPT.format(
        attack=attack, difficulty=difficulty, payload=payload, result=result
    )


async def coach_explain(
    attack: str,
    difficulty: str,
    payload: str,
    success: bool,
    fallback: dict = None,
) -> Tuple[str, str]:
    """
    Return (markdown_explanation, provider). Falls back to curated text.
    """
    if is_available():
        try:
            text = await generate(build_coach_prompt(attack, difficulty, payload, success))
            if text:
                return text.strip(), "Groq"
        except Exception as e:
            print(f"AI coach failed, using fallback: {e}")

    return _fallback(attack, difficulty, payload, success, fallback), "Fallback"


def _fallback(attack, difficulty, payload, success, fallback) -> str:
    fb = fallback or {}
    outcome = (
        "Your payload **succeeded** — the simulated vulnerability was triggered."
        if success
        else "Your payload did not trigger the vulnerability. Review the hints and try again."
    )
    parts = [
        f"## {attack}",
        f"**Difficulty:** {difficulty}",
        f"**Payload:** `{payload}`",
        f"### Outcome\n{outcome}",
        f"### Why it worked\n{fb.get('explanation', 'The payload matched a known exploit pattern for this vulnerability.')}",
        f"### Business Impact\n{fb.get('business_impact', 'Exploitation can compromise confidentiality, integrity, or availability.')}",
        f"### How to fix\n{fb.get('fix', 'Apply the OWASP-recommended secure coding practice for this vulnerability.')}",
        f"### OWASP Reference\n{fb.get('owasp', 'See the OWASP Top 10 (2021).')}",
        "### Best Practices\n- Validate and sanitize all untrusted input.\n- Apply least privilege.\n- Use framework-provided security controls.",
    ]
    return "\n\n".join(parts)
