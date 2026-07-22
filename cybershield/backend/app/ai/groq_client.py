"""
groq_client.py — thin re-export so new dashboard AI code can do:

    from app.ai.groq_client import generate, is_available

The real implementation lives in app/ai/gemini_client.py (kept as-is to avoid
breaking the existing AI assistant that already imports from there).
"""
from app.ai.gemini_client import generate, is_available, get_model, initialize

__all__ = ["generate", "is_available", "get_model", "initialize"]
