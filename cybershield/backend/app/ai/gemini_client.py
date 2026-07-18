"""
Groq AI client wrapper for the AI Security Assistant.

Initialises the Groq client once and exposes a simple `generate(text)` helper
that returns plain markdown text. The Groq SDK is synchronous, so the blocking
call is dispatched on a worker thread to keep the event loop responsive. Falls
back gracefully when no API key is configured.
"""
import asyncio
from typing import Optional

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    Groq = None
    GROQ_AVAILABLE = False

from app.config.settings import settings

_client = None
_initialized = False


def initialize() -> Optional[object]:
    """Initialise (once) and return the Groq client, or None."""
    global _client, _initialized

    if _initialized:
        return _client

    _initialized = True

    if not GROQ_AVAILABLE or Groq is None:
        print("Warning: groq not installed. AI Assistant runs in fallback mode.")
        return None

    key = settings.GROQ_API_KEY
    if not key or key == "your-groq-api-key-here":
        print("Warning: GROQ_API_KEY not set. AI Assistant runs in fallback mode.")
        return None

    try:
        _client = Groq(api_key=key)
        print(f"AI Assistant Groq client ready (model: {settings.AI_MODEL})")
    except Exception as e:  # pragma: no cover - defensive
        print(f"Error initialising Groq client: {e}")
        _client = None

    return _client


def get_model() -> Optional[object]:
    """Return the initialised client, initialising lazily if needed."""
    global _client
    if _client is None and not _initialized:
        _client = initialize()
    return _client


def is_available() -> bool:
    """Whether a working Groq client is configured."""
    return get_model() is not None


async def generate(prompt: str) -> str:
    """
    Generate a plain-text (markdown) response from the Groq model.

    Args:
        prompt: Full prompt including the system instructions.

    Returns:
        The model's text reply. Raises on failure so callers can fall back.
    """
    client = get_model()
    if not client:
        raise RuntimeError("Groq model is not available")

    response = await asyncio.to_thread(
        client.chat.completions.create,
        model=settings.AI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=settings.AI_TEMPERATURE,
        max_tokens=settings.AI_MAX_TOKENS,
    )
    return (response.choices[0].message.content or "").strip()
