"""
AI Security Assistant service.

Handles:
- Calling Groq AI with the security-scoped prompt
- Saving chat history to MongoDB (ai_chat_history collection)
- Retrieving chat history for a user
"""
from typing import Optional
import json

from app.database.db import database
from app.ai.gemini_client import generate, is_available
from app.ai_assistant.prompts import SECURITY_ASSISTANT_PROMPT
from app.ai_assistant.models import chat_history_document
from app.services.error_log_service import fire_and_forget_log

# MongoDB collection
chat_history = database.ai_chat_history


async def ask_ai(question: str, scan_data: dict = None, user_id: str = None) -> str:
    """
    Process a user question with optional scan context.

    Builds the security-scoped prompt, calls Groq AI, and returns the reply.

    Args:
        question: The user's security question.
        scan_data: Optional scan results to inject as context.
        user_id: The authenticated user's ID (for saving history).

    Returns:
        The AI's response text.
    """
    # Format scan data for the prompt
    scan_text = "No scan data available."
    if scan_data:
        try:
            scan_text = json.dumps(scan_data, indent=2, default=str)
        except Exception:
            fire_and_forget_log()
            scan_text = str(scan_data)

    # Build the prompt
    prompt = SECURITY_ASSISTANT_PROMPT.format(
        scan_data=scan_text,
        question=question,
    )

    if not is_available():
        return (
            "I'm currently running in offline mode because the AI service is "
            "not configured. Please configure `GROQ_API_KEY` in the backend `.env` "
            "to enable AI responses.\n\nIn the meantime, you can explore: "
            "OWASP Top 10, secure coding practices, authentication, and threat modeling."
        )

    try:
        answer = await generate(prompt)
    except Exception as e:
        fire_and_forget_log()
        print(f"[AI Assistant] Error generating response: {e}")
        answer = (
            "I encountered an error processing your question. Please try again "
            "or rephrase your question about security topics."
        )

    return answer


async def save_chat_history(
    user_id: str,
    question: str,
    answer: str,
    scan_id: str = None,
) -> None:
    """
    Save a question-answer pair to MongoDB.

    Args:
        user_id: The authenticated user's ID.
        question: The user's question.
        answer: The AI's response.
        scan_id: Optional scan ID for context.
    """
    doc = chat_history_document(user_id, question, answer, scan_id)
    await chat_history.insert_one(doc)


async def get_chat_history(user_id: str, limit: int = 50) -> list:
    """
    Retrieve chat history for a user, newest first.

    Args:
        user_id: The authenticated user's ID.
        limit: Maximum number of records to return.

    Returns:
        List of chat history documents.
    """
    cursor = (
        chat_history.find({"user_id": user_id})
        .sort("created_at", -1)
        .limit(limit)
    )
    results = []
    async for doc in cursor:
        results.append({
            "id": str(doc.get("_id")),
            "question": doc.get("question", ""),
            "answer": doc.get("answer", ""),
            "scan_id": doc.get("scan_id"),
            "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else "",
        })
    return results
