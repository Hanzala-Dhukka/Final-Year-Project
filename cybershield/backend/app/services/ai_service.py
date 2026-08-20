"""
Groq AI service wrapper for CyberShield.

Provides a thin async-friendly interface so the
rest of the app can call `ai_service.generate_response(prompt)` without worrying
about blocking SDK calls. Falls back gracefully when no API key is configured.
"""
from typing import Optional, Any

from app.services.error_log_service import fire_and_forget_log

try:
    from groq import AsyncGroq
    GROQ_AVAILABLE = True
except ImportError:
    fire_and_forget_log()
    AsyncGroq = None  # type: ignore
    GROQ_AVAILABLE = False

from app.config.settings import settings


class AIService:
    """Thin wrapper around the Groq API."""

    def __init__(self):
        self.client: Optional[Any] = None
        self._initialized = False

    def _ensure_client(self) -> Optional[Any]:
        if self._initialized:
            return self.client

        self._initialized = True

        if not GROQ_AVAILABLE or AsyncGroq is None:
            print("Warning: groq package not installed. Run: pip install groq. AI service runs in fallback mode.")
            return None

        key = getattr(settings, "GROQ_API_KEY", "") or getattr(settings, "GEMINI_API_KEY", "")
        if not key or key in ("your_groq_api_key_here", ""):
            print("Warning: GROQ_API_KEY not set. AI service runs in fallback mode.")
            return None

        try:
            self.client = AsyncGroq(api_key=key)
            print(f"Groq AI service ready (model: {settings.AI_MODEL})")
        except Exception as e:
            fire_and_forget_log()
            print(f"Error initialising Groq client: {e}")
            self.client = None

        return self.client

    @property
    def is_available(self) -> bool:
        return self._ensure_client() is not None

    async def generate_response(
        self,
        prompt: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> str:
        """
        Generate a text response from the configured Groq model.

        Args:
            prompt: Full prompt (system instructions + user question).
            temperature: Optional sampling temperature override.
            max_tokens: Optional max output tokens override.

        Returns:
            The model's text reply. Raises on failure so callers can fall back.
        """
        client = self._ensure_client()
        if client is None:
            raise RuntimeError("Groq AI model is not available")

        temp = temperature if temperature is not None else settings.AI_TEMPERATURE
        tokens = max_tokens if max_tokens is not None else settings.AI_MAX_TOKENS

        response = await client.chat.completions.create(
            model=settings.AI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=float(temp),
            max_tokens=int(tokens),
        )
        return (response.choices[0].message.content or "").strip()


# Module-level singleton used across the codebase.
ai_service = AIService()
