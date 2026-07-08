"""
Chat and conversation model for MongoDB document structure.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any


class ChatMessage(BaseModel):
    """Individual chat message model."""
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = {}


class Conversation(BaseModel):
    """AI conversation model."""
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    conversation_id: str  # Unique conversation identifier
    messages: List[ChatMessage] = []
    context: Optional[str] = None  # Conversation context/topic
    status: str = "active"  # "active", "closed", "archived"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_message_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True


class ConversationCreate(BaseModel):
    """Schema for creating a conversation."""
    user_id: str
    conversation_id: str
    context: Optional[str] = None


class ConversationResponse(BaseModel):
    """Schema for conversation response."""
    id: str
    user_id: str
    conversation_id: str
    message_count: int
    context: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    last_message_at: datetime


class ChatHistory(BaseModel):
    """Chat history model for storing all user conversations."""
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    conversation_id: str
    messages: List[Dict[str, Any]] = []
    summary: Optional[str] = None
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True