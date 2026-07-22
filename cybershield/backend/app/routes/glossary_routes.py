"""
Backwards-compatible re-export of the Glossary router (Module 7.3).

The implementation now lives in app.api.glossary_routes; this module re-exports
its router so existing main.py imports keep working.
"""
from app.api.glossary_routes import router  # noqa: F401
