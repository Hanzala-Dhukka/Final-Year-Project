"""
groq_client.py — canonical Groq client.

Other modules may import from here directly.  The actual implementation
lives in gemini_client.py (kept at that path so existing imports don't break).
"""
from app.ai.gemini_client import generate, is_available, get_model, initialize

__all__ = ["generate", "is_available", "get_model", "initialize"]
