"""
AI Security Assistant service.

Handles conversation/message persistence in MongoDB and Groq calls.
Mirrors the functions described in Module 5.1:
  create_conversation, save_message, send_to_gemini, store_ai_reply,
  get_history, get_conversations, delete_chat

Module 5.2 extends this with context-awareness: the active project and context
domain (general/github_scan/threat_report/owasp/quiz/glossary) are tracked per
user and injected into the Groq prompt via the context service.
"""
from typing import Optional

from app.database.db import database
from app.models.conversation_model import (
    conversation_document,
    message_document,
    utcnow,
)
from app.ai.prompt_builder import (
    build_user_prompt,
    build_context_prompt,
    build_title_prompt,
)
from app.ai.gemini_client import generate, is_available
from app.services import context_service


# ── Collections ──────────────────────────────────────────────────────────────
conversations = database.conversations
messages = database.messages

# Per-user active context (in-memory; ephemeral session state).
_active_context: dict = {}

VALID_CONTEXTS = {"general", "github_scan", "threat_report", "owasp", "quiz", "glossary"}


def _normalize_context(value: str) -> str:
    return value if value in VALID_CONTEXTS else "general"


def get_active_context(user_id: str) -> dict:
    """Return the user's current active project_id + context domain."""
    return _active_context.get(user_id, {"project_id": None, "context": "general"})


def set_active_context(user_id: str, project_id: Optional[str], context: str) -> dict:
    """Set the user's active project_id + context domain."""
    state = {"project_id": project_id, "context": _normalize_context(context)}
    _active_context[user_id] = state
    return state


# ── Conversation helpers ─────────────────────────────────────────────────────
async def create_conversation(
    user_id: str,
    title: str = "New Conversation",
    project_id: str = None,
    context: str = "general",
) -> str:
    """
    Create a new conversation document and return its id.

    Args:
        user_id: Owner id.
        title: Conversation title.
        project_id: Active project for context-aware chats.
        context: Active context domain.

    Returns:
        The new conversation id (string).
    """
    doc = conversation_document(user_id, title, project_id, context)
    await conversations.insert_one(doc)
    return doc["_id"]


async def get_conversations(user_id: str) -> list:
    """
    List a user's conversations, newest first.

    Returns:
        List of dicts with id, title, project_id, context, created_at, updated_at.
    """
    cursor = conversations.find({"user_id": user_id}).sort("updated_at", -1)
    result = []
    async for doc in cursor:
        result.append({
            "id": doc["_id"],
            "title": doc.get("title", "New Conversation"),
            "project_id": doc.get("project_id"),
            "context": doc.get("context", "general"),
            "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else "",
            "updated_at": doc.get("updated_at").isoformat() if doc.get("updated_at") else "",
        })
    return result


async def get_conversation(user_id: str, conversation_id: str) -> Optional[dict]:
    """Fetch a single conversation if it belongs to the user."""
    return await conversations.find_one({"_id": conversation_id, "user_id": user_id})


async def update_title(conversation_id: str, title: str) -> None:
    """Set the conversation title (used for auto-titling)."""
    await conversations.update_one(
        {"_id": conversation_id},
        {"$set": {"title": title, "updated_at": utcnow()}},
    )


async def touch_conversation(conversation_id: str) -> None:
    """Bump updated_at so the conversation floats to the top of the list."""
    await conversations.update_one(
        {"_id": conversation_id},
        {"$set": {"updated_at": utcnow()}},
    )


# ── Message helpers ──────────────────────────────────────────────────────────
async def save_message(conversation_id: str, role: str, content: str) -> None:
    """
    Persist a single message and bump the parent conversation timestamp.

    Args:
        conversation_id: Parent conversation id.
        role: "user" or "assistant".
        content: Message text.
    """
    await messages.insert_one(message_document(conversation_id, role, content))
    await touch_conversation(conversation_id)


async def get_history(conversation_id: str, limit: int = 50) -> list:
    """
    Return prior messages for a conversation (oldest first) for context building.

    Returns:
        List of {"role", "content"} dicts.
    """
    cursor = messages.find({"conversation_id": conversation_id}).sort("created_at", 1).limit(limit)
    out = []
    async for doc in cursor:
        out.append({"role": doc.get("role"), "content": doc.get("content", "")})
    return out


async def get_messages_for_user(conversation_id: str, user_id: str) -> Optional[dict]:
    """
    Return a conversation with its messages, verifying ownership.

    Returns:
        {"conversation_id", "title", "project_id", "context", "messages": [...]} or None.
    """
    conv = await get_conversation(user_id, conversation_id)
    if not conv:
        return None

    raw = await get_history(conversation_id, limit=1000)
    msgs = [
        {
            "role": m["role"],
            "content": m["content"],
            "created_at": "",
        }
        for m in raw
    ]
    # Attach real timestamps from the DB for accurate ordering/display
    cursor = messages.find({"conversation_id": conversation_id}).sort("created_at", 1)
    idx = 0
    async for doc in cursor:
        if idx < len(msgs):
            ts = doc.get("created_at")
            msgs[idx]["created_at"] = ts.isoformat() if ts else ""
        idx += 1

    return {
        "conversation_id": conversation_id,
        "title": conv.get("title", "New Conversation"),
        "project_id": conv.get("project_id"),
        "context": conv.get("context", "general"),
        "messages": msgs,
    }


async def delete_chat(user_id: str, conversation_id: str) -> bool:
    """
    Delete a conversation and all of its messages (ownership-checked).

    Returns:
        True if a conversation was deleted, False if not found / not owned.
    """
    conv = await get_conversation(user_id, conversation_id)
    if not conv:
        return False
    await messages.delete_many({"conversation_id": conversation_id})
    await conversations.delete_one({"_id": conversation_id})
    return True


# ── Groq integration ─────────────────────────────────────────────────────────
async def send_to_gemini(
    user_id: str,
    conversation_id: str,
    message: str,
    project_id: str = None,
    context_type: str = "general",
) -> str:
    """
    Send the user message (with context) to the Groq model and return the reply text.

    Falls back to a friendly offline message when the Groq API key is not configured.

    Args:
        user_id: Owner id (used to load history for context).
        conversation_id: Conversation id.
        message: Latest user message.
        project_id: Active project for context building.
        context_type: Context domain to focus on.

    Returns:
        The assistant reply (markdown text).
    """
    history = await get_history(conversation_id)
    data = await context_service.build_context(user_id, project_id)
    prompt = build_context_prompt(
        message, data, context_type=context_type, history=history
    )

    if not is_available():
        return (
            "I'm currently running in offline mode because the Groq API key is "
            "not configured on the server. Please configure `GROQ_API_KEY` to "
            "enable AI responses.\n\nIn the meantime, here are some topics to "
            "explore: OWASP Top 10, secure coding, authentication, and threat modeling."
        )

    return await generate(prompt)


async def generate_title(message: str) -> str:
    """
    Generate a short (<=40 char) title from the first user message.

    Returns:
        A title string, truncated to 40 characters.
    """
    fallback = message.strip()[:40]
    if not is_available():
        return fallback

    try:
        raw = await generate(build_title_prompt(message))
        title = raw.strip().strip('"').strip("'").replace("\n", " ")
        title = title[:40]
        return title or fallback
    except Exception:
        return fallback


async def store_ai_reply(conversation_id: str, reply: str) -> None:
    """Persist the assistant reply message."""
    await save_message(conversation_id, "assistant", reply)
