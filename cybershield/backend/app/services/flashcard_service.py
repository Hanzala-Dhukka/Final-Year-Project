"""
Flashcard service (Module 7.3, spec Steps 8-9).

Builds study sessions from glossary terms and records spaced-repetition-style
results (known / learning / completed). Uses the simple SM-2-inspired heuristic
of tracking per-session counters; full SM-2 scheduling is a recommended
enhancement.
"""
from typing import List, Dict, Any, Optional

from app.database.db import database
from app.models.glossary import flashcard_session_document, utcnow
from app.services import glossary_service

FLASHCARDS = "flashcard_sessions"


async def create_session(user_id: str, category: str = None, limit: int = 20) -> Dict[str, Any]:
    """
    Create a flashcard session from glossary terms (optionally filtered by
    category). Returns the session with embedded term cards.
    """
    terms, _ = await glossary_service.list_terms(
        category=category, limit=limit, skip=0
    )
    term_ids = [t["id"] for t in terms]
    doc = flashcard_session_document(user_id, term_ids)
    await database[FLASHCARDS].insert_one(doc)

    cards = []
    for t in terms:
        cards.append({
            "id": t["id"],
            "term": t["term"],
            "definition": t.get("definition"),
            "example": t.get("example"),
            "prevention": t.get("prevention", []),
            "owasp_reference": t.get("owasp_reference"),
            "difficulty": t.get("difficulty"),
        })
    return {
        "id": doc["_id"],
        "terms": cards,
        "known": 0,
        "learning": 0,
        "completed": 0,
    }


async def record_result(
    user_id: str, known: int, learning: int, completed: int, term_ids: List[str]
) -> int:
    """
    Persist a flashcard session result and update user progress.
    Returns the number of flashcards marked completed.
    """
    doc = flashcard_session_document(
        user_id, term_ids, known=known, learning=learning, completed=completed
    )
    await database[FLASHCARDS].insert_one(doc)
    await glossary_service.record_flashcards(user_id, completed)
    return completed
