"""
Backwards-compatible re-export of the AI Quiz Generator router (Module 7.2).

The implementation now lives in app.api.quiz_routes; this module re-exports
its router so existing main.py imports keep working.
"""
from app.api.quiz_routes import router  # noqa: F401
