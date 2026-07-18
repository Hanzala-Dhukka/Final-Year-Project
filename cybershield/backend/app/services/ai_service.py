"""
Groq AI service wrapper for CyberShield.

Provides a thin async-friendly interface over the (synchronous) Groq SDK so the
rest of the app can call `ai_service.generate_response(prompt)` without worrying
about the blocking SDK call. The sync call is dispatched on a worker thread so
the FastAPI event loop stays responsive.
"""
import asyncio
from typing import Optional

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    print("Warning: groq not installed. AI service runs in fallback mode.")
    Groq = None
    GROQ_AVAILABLE = False

from app.config.settings import settings


class AIService:
    """Thin wrapper around the Groq chat.completions API."""

    def __init__(self):
        self.client: Optional[Groq] = None
        self._initialized = False

    def _ensure_client(self) -> Optional[Groq]:
        if self._initialized:
            return self.client

        self._initialized = True

        if not GROQ_AVAILABLE or Groq is None:
            print("Warning: groq not installed. AI service runs in fallback mode.")
            return None

        key = settings.GROQ_API_KEY
        if not key or key == "your-groq-api-key-here":
            print("Warning: GROQ_API_KEY not set. AI service runs in fallback mode.")
            return None

        try:
            self.client = Groq(api_key=key)
            print(f"Groq AI service ready (model: {settings.AI_MODEL})")
        except Exception as e:  # pragma: no cover - defensive
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
            raise RuntimeError("Groq model is not available")

        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=settings.AI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature if temperature is not None else settings.AI_TEMPERATURE,
            max_tokens=max_tokens if max_tokens is not None else settings.AI_MAX_TOKENS,
        )
        return (response.choices[0].message.content or "").strip()


# Module-level singleton used across the codebase.
ai_service = AIService()
