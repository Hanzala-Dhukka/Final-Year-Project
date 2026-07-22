"""
MongoDB document models for the Glossary module (Module 7.3).

Collections:
  glossary_terms      - curated cybersecurity terms (seeded)
  glossary_progress    - per-user learning progress
  glossary_favorites   - per-user bookmarked terms
  glossary_suggestions - user-submitted term suggestions (admin review)
  flashcard_sessions    - flashcard study sessions
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId


def new_id() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def glossary_term_document(term: dict) -> dict:
    """Build a glossary_terms document from a seed/term dict."""
    now = utcnow()
    return {
        "_id": new_id(),
        "term": term.get("term"),
        "category": term.get("category"),
        "difficulty": term.get("difficulty", "Beginner"),
        "definition": term.get("definition"),
        "example": term.get("example"),
        "prevention": term.get("prevention", []),
        "owasp_reference": term.get("owasp_reference"),
        "related_terms": term.get("related_terms", []),
        "created_at": now,
        "updated_at": now,
    }


def progress_document(user_id: str) -> dict:
    """Build an initial glossary_progress document."""
    return {
        "_id": new_id(),
        "user_id": user_id,
        "terms_viewed": [],
        "terms_learned": [],
        "flashcards_completed": 0,
        "mini_quizzes_passed": 0,
        "favorite_count": 0,
        "study_streak": 0,
        "last_activity": utcnow(),
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }


def favorite_document(user_id: str, term_id: str) -> dict:
    return {
        "_id": new_id(),
        "user_id": user_id,
        "term_id": term_id,
        "created_at": utcnow(),
    }


def suggestion_document(
    user_id: str, term: str, definition: str, category: str, reason: str
) -> dict:
    return {
        "_id": new_id(),
        "user_id": user_id,
        "term": term,
        "definition": definition,
        "category": category,
        "reason": reason,
        "status": "pending",  # pending | approved | rejected
        "created_at": utcnow(),
    }


def flashcard_session_document(
    user_id: str, term_ids: list, known: int = 0, learning: int = 0, completed: int = 0
) -> dict:
    return {
        "_id": new_id(),
        "user_id": user_id,
        "terms": term_ids,
        "known": known,
        "learning": learning,
        "completed": completed,
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }


def to_object_id(value: str) -> Optional[ObjectId]:
    try:
        return ObjectId(value)
    except Exception:
        return None
