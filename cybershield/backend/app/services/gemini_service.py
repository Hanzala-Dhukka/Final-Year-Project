"""
gemini_service.py — Groq-backed AI service.

All existing callers use:
    from app.services.gemini_service import generate_ai_response, get_model, ...

The implementation now delegates to the Groq client in app/ai/gemini_client.py.
No callers need to change.
"""
from __future__ import annotations

import json
import time
from typing import Any, Dict, Optional

from app.config.settings import settings
from app.ai.gemini_client import generate as _ai_generate, is_available, get_model


# ── Compatibility shims used by various routes ────────────────────────────────

def initialize_groq():
    """Legacy init helper — delegates to the Groq singleton."""
    from app.ai.gemini_client import initialize
    return initialize()


def get_async_model():
    """Return the async Groq client."""
    return get_model()


# ── Internal helpers ──────────────────────────────────────────────────────────

async def _generate_content(prompt: str, retries: int = 2) -> Optional[str]:
    """
    Call Groq and return the response text, or None on failure.
    Callers that want exceptions should use app.ai.gemini_client.generate directly.
    """
    try:
        return await _ai_generate(prompt)
    except Exception as e:
        print(f"[gemini_service] AI generate failed: {e}")
        return None


def call_groq_sync(prompt: str, max_tokens: int = None, retries: int = 2) -> Optional[str]:
    """
    Synchronous wrapper around the async generate call.
    Use sparingly — prefer the async path where possible.
    """
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Can't call run() from a running loop; schedule as task
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
                future = ex.submit(asyncio.run, _ai_generate(prompt))
                return future.result(timeout=int(getattr(settings, "AI_TIMEOUT", 30)))
        else:
            return loop.run_until_complete(_ai_generate(prompt))
    except Exception as e:
        print(f"[gemini_service] sync generate failed: {e}")
        return None


# ── Primary public API ────────────────────────────────────────────────────────

async def generate_ai_response(
    question: str,
    project_context: Dict[str, Any],
    max_retries: int = 3,
) -> Dict[str, Any]:
    """
    Generate an AI response for a project-context question.

    Returns a dict with keys: provider, model, answer (and optionally error).
    Falls back to the rule-based chatbot when Groq is unavailable.
    """
    if not is_available():
        print("[gemini_service] Groq not available — using rule-based fallback.")
        return _rule_based_fallback(question, project_context)

    try:
        from app.services.prompt_builder import build_prompt
        prompt = build_prompt(question, project_context)

        start = time.time()
        response_text = await _ai_generate(prompt)
        elapsed = round(time.time() - start, 2)

        response_text = response_text.strip()

        # Strip markdown fences if present
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()

        try:
            answer_data = json.loads(response_text)
        except json.JSONDecodeError:
            answer_data = {
                "title": "AI Response",
                "summary": response_text,
                "business_impact": "See summary above.",
                "recommendation": response_text,
                "implementation_steps": [],
                "secure_code": "",
            }

        return {
            "provider": "Groq",
            "model": settings.AI_MODEL,
            "response_time": elapsed,
            "answer": answer_data,
        }

    except Exception as e:
        print(f"[gemini_service] generate_ai_response failed: {e}")
        return _rule_based_fallback(question, project_context, error=str(e))


def _rule_based_fallback(
    question: str,
    project_context: Dict[str, Any],
    error: str = "",
) -> Dict[str, Any]:
    try:
        from app.services.chatbot_service import generate_answer as fallback_answer
        fallback = fallback_answer(question, project_context.get("project_id"))
        answer_text = fallback["answer"]
    except Exception:
        answer_text = "Please configure GROQ_API_KEY in backend/.env for AI-powered responses."

    return {
        "provider": "Fallback",
        "model": "rule-based",
        **({"error": error} if error else {}),
        "answer": {
            "title": "Rule-Based Response",
            "summary": answer_text,
            "business_impact": "N/A",
            "recommendation": answer_text,
            "implementation_steps": [],
            "secure_code": "# Set GROQ_API_KEY in backend/.env for AI responses",
        },
    }


async def generate_daily_explanation(
    category: str,
    title: str,
    user_answer: str,
) -> str:
    """Generate an educational explanation for a daily challenge."""
    if not is_available():
        return _daily_fallback(category)

    prompt = f"""You are a cybersecurity expert explaining a daily challenge to a learner.

Challenge Category: {category}
Challenge Title: {title}
User's Answer: {user_answer}

Provide a comprehensive explanation covering:
1. What this challenge demonstrated (explain the vulnerability simply)
2. Why it worked (why the answer was correct / what the vulnerability enables)
3. How to prevent it (3-4 specific prevention techniques)
4. An industry example of this vulnerability being exploited
5. The related OWASP Top 10 category

Keep it educational, clear, and actionable. Use bullet points and code examples where helpful."""

    try:
        return (await _ai_generate(prompt)).strip()
    except Exception as e:
        print(f"[gemini_service] generate_daily_explanation failed: {e}")
        return _daily_fallback(category)


def _daily_fallback(category: str) -> str:
    return f"""Today's challenge demonstrated {category}.

**Why it worked:**
The payload exploited a vulnerability in the application's input validation.

**How to prevent it:**
- Use parameterised queries / prepared statements
- Implement strict input validation and allowlists
- Apply the principle of least privilege
- Deploy a Web Application Firewall (WAF)

**Industry example:**
Many major breaches have stemmed from {category} vulnerabilities, including the TalkTalk (2015) and Heartland Payment Systems incidents.

**Related OWASP category:** A03:2021 – Injection"""
