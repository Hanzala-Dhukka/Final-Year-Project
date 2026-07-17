"""
Pydantic schemas for the AI Security Assistant API.
"""
from typing import Optional
from pydantic import BaseModel, Field


class ChatMessageRequest(BaseModel):
    """Body for POST /chat/message."""
    conversation_id: Optional[str] = Field(
        None, description="Existing conversation id. Omit to start a new chat."
    )
    message: str = Field(..., min_length=1, description="User's question")
    context: Optional[str] = Field(
        None,
        description="Context domain: general|github_scan|threat_report|owasp|quiz|glossary. "
                    "Defaults to the user's active context or the conversation's stored context.",
    )
    project_id: Optional[str] = Field(
        None, description="Project to focus on. Defaults to the user's active project."
    )


class ChatMessageResponse(BaseModel):
    """Response for POST /chat/message."""
    conversation_id: str
    reply: str
    title: Optional[str] = None


class NewConversationResponse(BaseModel):
    """Response for POST /chat/new."""
    conversation_id: str
    title: str


class ConversationSummary(BaseModel):
    """Lightweight conversation entry for the sidebar."""
    id: str
    title: str
    created_at: str
    updated_at: str


class MessageOut(BaseModel):
    """A single stored message returned to the client."""
    role: str
    content: str
    created_at: str


class ConversationMessagesResponse(BaseModel):
    """Response for GET /chat/{conversation_id}."""
    conversation_id: str
    title: str
    messages: list[MessageOut]
