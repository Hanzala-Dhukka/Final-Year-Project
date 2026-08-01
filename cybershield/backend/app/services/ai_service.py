"""
Google Gemini AI service wrapper for CyberShield.

Provides a thin async-friendly interface over the google-genai SDK so the
rest of the app can call `ai_service.generate_response(prompt)` without worrying
about blocking SDK calls. Falls back gracefully when no API key is configured.
"""
import asyncio
from typing import Optional, Any

try:
    from google import genai
    GENAI_AVAILABLE = True
except ImportError:
    genai = None
    GENAI_AVAILABLE = False

from app.config.settings import settings


class AIService:
    """Thin wrapper around the Google Gemini API."""

    def __init__(self):
        self.client: Optional[Any] = None
        self._initialized = False

    def _ensure_client(self) -> Optional[Any]:
        if self._initialized:
            return self.client

        self._initialized = True

        if not GENAI_AVAILABLE or genai is None:
            print("Warning: google-genai not installed. AI service runs in fallback mode.")
            return None

        key = getattr(settings, "GEMINI_API_KEY", "") or getattr(settings, "GROQ_API_KEY", "")
        if not key or key in ("your_gemini_api_key_here", "your-gemini-api-key-here", ""):
            print("Warning: GEMINI_API_KEY not set. AI service runs in fallback mode.")
            return None

        try:
            self.client = genai.Client(api_key=key)
            print(f"Google Gemini AI service ready (model: {settings.AI_MODEL})")
        except Exception as e:
            print(f"Error initialising Gemini client: {e}")
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
        Generate a text response from the configured Gemini model.

        Args:
            prompt: Full prompt (system instructions + user question).
            temperature: Optional sampling temperature override.
            max_tokens: Optional max output tokens override.

        Returns:
            The model's text reply. Raises on failure so callers can fall back.
        """
        client = self._ensure_client()
        if client is None:
            raise RuntimeError("Gemini AI model is not available")

        response = await asyncio.to_thread(
            client.models.generate_content,
            model=settings.AI_MODEL,
            contents=prompt,
        )
        return (response.text or "").strip()


# Module-level singleton used across the codebase.
ai_service = AIService()
