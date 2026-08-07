"""
MongoDB document models for the AI Security Assistant chat history.

Collection: ai_chat_history
Document structure:
{
    "_id": "...",
    "user_id": "123",
    "question": "Why is SQL Injection dangerous?",
    "answer": "SQL Injection allows attackers...",
    "scan_id": "scan_123",
    "created_at": "..."
}
"""
from datetime import datetime, timezone


def chat_history_document(
    user_id: str,
    question: str,
    answer: str,
    scan_id: str = None,
) -> dict:
    """Create a new chat history document."""
    return {
        "user_id": user_id,
        "question": question,
        "answer": answer,
        "scan_id": scan_id,
        "created_at": datetime.now(timezone.utc),
    }
