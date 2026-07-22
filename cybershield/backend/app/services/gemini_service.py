import asyncio
import json
import time
from typing import Dict, Any, Optional

# Use the Groq SDK (synchronous client). It calls chat.completions with the
# model configured via GROQ_API_KEY / AI_MODEL in settings. The blocking call
# is dispatched on a worker thread to keep the event loop responsive.
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    print("Warning: groq not installed. Using fallback mode.")
    Groq = None
    GROQ_AVAILABLE = False

from app.config.settings import settings


# Initialize Groq client once at module level
_groq_configured = False
_client = None


def initialize_groq():
    """
    Initialize the Groq AI client.

    Reads the API key from settings.GROQ_API_KEY. Returns None (fallback mode)
    when the package is not installed or no key is configured.
    """
    global _groq_configured, _client

    if _groq_configured:
        return _client

    try:
        if not GROQ_AVAILABLE or Groq is None:
            print("Warning: Groq not available (package not installed). Using fallback mode.")
            return None

        key = settings.GROQ_API_KEY
        if not key or key == "your-groq-api-key-here":
            print("Warning: GROQ_API_KEY not set. Using fallback mode.")
            return None

        _client = Groq(api_key=key)
        print(f"Groq AI initialized with model: {settings.AI_MODEL}")

        _groq_configured = True
        return _client

    except Exception as e:
        print(f"Error initializing Groq: {str(e)}")
        return None


def get_model():
    """Get or initialize the Groq client."""
    global _client
    if _client is None:
        _client = initialize_groq()
    return _client


async def _generate_content(prompt: str, retries: int = 2):
    """Generate content via the configured Groq client with rate limit retry & fallback model.

    Returns the raw text of the completion (or None if unavailable).
    """
    client = get_model()
    if client is None:
        return None

    model_to_use = settings.AI_MODEL
    for attempt in range(retries + 1):
        try:
            response = await asyncio.to_thread(
                client.chat.completions.create,
                model=model_to_use,
                messages=[{"role": "user", "content": prompt}],
                temperature=settings.AI_TEMPERATURE,
                max_tokens=settings.AI_MAX_TOKENS,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            err_msg = str(e).lower()
            if ("rate_limit" in err_msg or "429" in err_msg) and attempt < retries:
                # Switch to faster 8b model if 70b rate-limited
                if "70b" in model_to_use:
                    model_to_use = "llama-3.1-8b-instant"
                await asyncio.sleep(1.5)
                continue
            print(f"Notice: Groq API call handled fallback ({e})")
            return None


def call_groq_sync(prompt: str, max_tokens: int = None, retries: int = 2) -> str | None:
    """Synchronous Groq call with rate limit retry & fallback model."""
    client = get_model()
    if client is None:
        return None

    model_to_use = settings.AI_MODEL
    for attempt in range(retries + 1):
        try:
            response = client.chat.completions.create(
                model=model_to_use,
                messages=[{"role": "user", "content": prompt}],
                temperature=settings.AI_TEMPERATURE,
                max_tokens=max_tokens or settings.AI_MAX_TOKENS,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            err_msg = str(e).lower()
            if ("rate_limit" in err_msg or "429" in err_msg) and attempt < retries:
                if "70b" in model_to_use:
                    model_to_use = "llama-3.1-8b-instant"
                time.sleep(1.5)
                continue
            print(f"Notice: Groq sync call handled fallback ({e})")
            return None




async def generate_ai_response(
    question: str,
    project_context: Dict[str, Any],
    max_retries: int = 3
) -> Dict[str, Any]:
    """
    Generate AI response using Groq

    Args:
        question: User's question
        project_context: Project context including threats, risk, etc.
        max_retries: Maximum number of retries on failure

    Returns:
        Dictionary with AI response or fallback response
    """
    client = get_model()

    if not client:
        # Fallback to rule-based chatbot
        print("Groq not available, using fallback mode")
        from app.services.chatbot_service import generate_answer as fallback_answer
        fallback = fallback_answer(question, project_context.get("project_id"))
        return {
            "provider": "Fallback",
            "model": "rule-based",
            "answer": {
                "title": "Rule-Based Response",
                "summary": fallback["answer"],
                "business_impact": "N/A",
                "recommendation": fallback["answer"],
                "implementation_steps": [],
                "secure_code": "# Configure GROQ_API_KEY for AI-powered responses"
            }
        }

    try:
        # Build prompt with context
        from app.services.prompt_builder import build_prompt
        prompt = build_prompt(question, project_context)

        # Generate response with retry logic
        for attempt in range(max_retries):
            try:
                start_time = time.time()

                response_text = await _generate_content(prompt)

                response_time = time.time() - start_time

                # Parse JSON response
                response_text = response_text.strip()

                # Try to extract JSON from response
                try:
                    # Remove markdown code blocks if present
                    if "```json" in response_text:
                        response_text = response_text.split("```json")[1].split("```")[0].strip()
                    elif "```" in response_text:
                        response_text = response_text.split("```")[1].split("```")[0].strip()

                    answer_data = json.loads(response_text)

                    return {
                        "provider": "Groq",
                        "model": settings.AI_MODEL,
                        "response_time": round(response_time, 2),
                        "answer": answer_data
                    }

                except json.JSONDecodeError:
                    # If JSON parsing fails, wrap the text response
                    return {
                        "provider": "Groq",
                        "model": settings.AI_MODEL,
                        "response_time": round(response_time, 2),
                        "answer": {
                            "title": "AI Response",
                            "summary": response_text,
                            "business_impact": "See summary",
                            "recommendation": response_text,
                            "implementation_steps": [],
                            "secure_code": ""
                        }
                    }

            except Exception as e:
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    print(f"Groq API error (attempt {attempt + 1}/{max_retries}): {str(e)}. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    raise e

    except Exception as e:
        print(f"Groq API failed after {max_retries} retries: {str(e)}")
        # Fallback to rule-based chatbot
        from app.services.chatbot_service import generate_answer as fallback_answer
        fallback = fallback_answer(question, project_context.get("project_id"))
        return {
            "provider": "Fallback",
            "model": "rule-based",
            "error": str(e),
            "answer": {
                "title": "Rule-Based Response (Fallback)",
                "summary": fallback["answer"],
                "business_impact": "N/A",
                "recommendation": fallback["answer"],
                "implementation_steps": [],
                "secure_code": "# Configure GROQ_API_KEY for AI-powered responses"
            }
        }


async def generate_daily_explanation(
    category: str,
    title: str,
    user_answer: str
) -> str:
    """
    Generate AI explanation for daily challenge

    Args:
        category: Challenge category (e.g., "SQL Injection")
        title: Challenge title
        user_answer: User's submitted answer

    Returns:
        Explanation string
    """
    client = get_model()

    if not client:
        # Return fallback explanation
        return f"""
Today's challenge demonstrated {category}.

Why it worked:
The payload you submitted exploited a vulnerability in the application's input validation.

How to prevent it:
- Use parameterized queries/prepared statements
- Implement proper input validation
- Apply the principle of least privilege
- Use Web Application Firewalls (WAF)

Industry Example:
Many major breaches have occurred due to {category} vulnerabilities, including the famous TalkTalk breach.

Related OWASP Category:
A03:2021 - Injection
"""

    try:
        prompt = f"""
You are a cybersecurity expert explaining a daily challenge to a learner.

Challenge Category: {category}
Challenge Title: {title}
User's Answer: {user_answer}

Provide a comprehensive explanation in this format:

1. **What this challenge demonstrated**: Explain the vulnerability in simple terms.

2. **Why it worked**: Explain why the user's answer was correct or what the vulnerability allows.

3. **How to prevent it**: Provide 3-4 specific prevention techniques.

4. **Industry Example**: Give a real-world example of this vulnerability being exploited.

5. **Related OWASP Category**: Reference the specific OWASP Top 10 category.

Keep the explanation educational, clear, and actionable. Use bullet points and code examples where appropriate.
"""

        response_text = await _generate_content(prompt)
        return response_text.strip()

    except Exception as e:
        print(f"Error generating daily explanation: {str(e)}")
        return f"""
Today's challenge demonstrated {category}.

Why it worked:
The payload you submitted exploited a vulnerability in the application's input validation.

How to prevent it:
- Use parameterized queries/prepared statements
- Implement proper input validation
- Apply the principle of least privilege
- Use Web Application Firewalls (WAF)

Industry Example:
Many major breaches have occurred due to {category} vulnerabilities.

Related OWASP Category:
A03:2021 - Injection
"""
