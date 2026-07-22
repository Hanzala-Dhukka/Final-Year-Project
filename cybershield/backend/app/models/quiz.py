"""
MongoDB document models for the AI Quiz Generator (Module 7.2).

Collections:
  quiz_sessions   - one document per generated quiz attempt (in progress / done)
  question_bank   - cache of AI-generated questions for reuse / validation
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId


def new_id() -> str:
    """Generate a string id for documents that do not use ObjectId."""
    return str(uuid.uuid4())


def utcnow() -> datetime:
    """Timezone-aware UTC datetime for consistent storage."""
    return datetime.now(timezone.utc)


def quiz_session_document(
    user_id: str,
    difficulty: str,
    category: str,
    technology: str,
    questions: list,
    project_id: str = None,
    total_questions: int = 10,
) -> dict:
    """
    Build a `quiz_sessions` document.

    Args:
        user_id: Owner id.
        difficulty: Easy|Medium|Hard|Expert.
        category: Quiz category (OWASP, Threat Modeling, ...).
        technology: Target technology (FastAPI, React, ...).
        questions: List of question dicts (with correct answers + explanation).
        project_id: Optional linked project.
        total_questions: Number of questions requested.

    Returns:
        A dict ready to insert into MongoDB.
    """
    now = utcnow()
    return {
        "_id": new_id(),
        "user_id": user_id,
        "project_id": project_id,
        "difficulty": difficulty,
        "category": category,
        "technology": technology,
        "total_questions": total_questions,
        "questions": questions,
        "status": "In Progress",
        "created_at": now,
        "updated_at": now,
        "completed_at": None,
    }


def question_bank_document(question: dict, difficulty: str, category: str, technology: str) -> dict:
    """
    Build a `question_bank` document for caching generated questions.
    """
    return {
        "_id": new_id(),
        "question": question.get("question"),
        "options": question.get("options", []),
        "answer": question.get("correct_answer") or question.get("answer"),
        "explanation": question.get("explanation"),
        "owasp_reference": question.get("owasp") or question.get("owasp_reference"),
        "difficulty": difficulty,
        "category": category,
        "technology": technology,
        "created_at": utcnow(),
    }


def to_object_id(value: str) -> Optional[ObjectId]:
    """Convert a string to ObjectId, returning None on failure."""
    try:
        return ObjectId(value)
    except Exception:
        return None
