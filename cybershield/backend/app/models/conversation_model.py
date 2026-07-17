"""
MongoDB document models for the AI Security Assistant.

Collection `conversations` stores one document per chat thread.
Collection `messages` stores one document per message (user or assistant).
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


def conversation_document(user_id: str, title: str, project_id: str = None, context: str = "general") -> dict:
    """
    Build a `conversations` document.

    Args:
        user_id: Owner user id.
        title: Conversation title (auto-generated from first message).
        project_id: Optional active project for context-aware chats.
        context: Active context domain (general/github_scan/...).

    Returns:
        A dict ready to insert into MongoDB.
    """
    now = utcnow()
    return {
        "_id": new_id(),
        "user_id": user_id,
        "title": title or "New Conversation",
        "project_id": project_id,
        "context": context or "general",
        "created_at": now,
        "updated_at": now,
    }


def message_document(conversation_id: str, role: str, content: str) -> dict:
    """
    Build a `messages` document.

    Args:
        conversation_id: Parent conversation id.
        role: "user" or "assistant".
        content: Message text (markdown).

    Returns:
        A dict ready to insert into MongoDB.
    """
    return {
        "_id": new_id(),
        "conversation_id": conversation_id,
        "role": role,
        "content": content,
        "created_at": utcnow(),
    }


def to_object_id(value: str) -> Optional[ObjectId]:
    """Convert a string to ObjectId, returning None on failure."""
    try:
        return ObjectId(value)
    except Exception:
        return None
