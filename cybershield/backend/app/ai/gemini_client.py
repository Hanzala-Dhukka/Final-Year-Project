"""
Gemini AI client wrapper for the AI Security Assistant.

Initialises the Gemini model once and exposes a simple `generate(text)` helper
that returns plain markdown text (unlike the project-style structured client
which returns JSON). Falls back gracefully when no API key is configured.
"""
import warnings
from typing import Optional

# Try to import Gemini AI, fallback to None if not available
try:
    try:
        from google import genai  # new package (google.genai)
        GEMINI_AVAILABLE = True
        USING_NEW_API = True
    except ImportError:
        warnings.filterwarnings("ignore", category=FutureWarning, module="google.generativeai")
        import google.generativeai as genai  # legacy package
        GEMINI_AVAILABLE = True
        USING_NEW_API = False
except ImportError:
    genai = None
    GEMINI_AVAILABLE = False
    USING_NEW_API = False

from app.config.settings import settings

_model = None
_initialized = False


def initialize() -> Optional[object]:
    """Initialise (once) and return the Gemini generative model, or None."""
    global _model, _initialized

    if _initialized:
        return _model

    _initialized = True

    if not GEMINI_AVAILABLE or genai is None:
        print("Warning: google-generativeai not installed. AI Assistant runs in fallback mode.")
        return None

    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your-gemini-api-key-here":
        print("Warning: GEMINI_API_KEY not set. AI Assistant runs in fallback mode.")
        return None

    try:
        if USING_NEW_API:
            _model = genai.GenerativeModel(settings.AI_MODEL)
        else:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            _model = genai.GenerativeModel(settings.AI_MODEL)
        print(f"AI Assistant Gemini client ready (model: {settings.AI_MODEL})")
    except Exception as e:  # pragma: no cover - defensive
        print(f"Error initialising Gemini client: {e}")
        _model = None

    return _model


def get_model() -> Optional[object]:
    """Return the initialised model, initialising lazily if needed."""
    global _model
    if _model is None and not _initialized:
        _model = initialize()
    return _model


def is_available() -> bool:
    """Whether a working Gemini model is configured."""
    return get_model() is not None


async def generate(prompt: str) -> str:
    """
    Generate a plain-text (markdown) response from Gemini.

    Args:
        prompt: Full prompt including the system instructions.

    Returns:
        The model's text reply. Raises on failure so callers can fall back.
    """
    model = get_model()
    if not model:
        raise RuntimeError("Gemini model is not available")

    response = model.generate_content(prompt)
    return (response.text or "").strip()
