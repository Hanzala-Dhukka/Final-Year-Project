from typing import Dict, List, Any, Optional
from datetime import datetime
import uuid
from app.schemas.copilot_schema import Conversation, ConversationMessage


# In-memory conversation storage
# In production, use a database
conversations_store: Dict[str, Conversation] = {}


def create_conversation(project_id: Optional[str] = None, user_name: str = "User") -> Conversation:
    """
    Create a new conversation
    
    Args:
        project_id: Optional project ID
        user_name: User name
        
    Returns:
        New conversation object
    """
    conversation_id = f"CONV-{str(uuid.uuid4())[:8].upper()}"
    
    conversation = Conversation(
        conversation_id=conversation_id,
        project_id=project_id,
        user_name=user_name,
        messages=[],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        context={}
    )
    
    conversations_store[conversation_id] = conversation
    return conversation


def get_conversation(conversation_id: str) -> Optional[Conversation]:
    """
    Get conversation by ID
    
    Args:
        conversation_id: Conversation ID
        
    Returns:
        Conversation object or None
    """
    return conversations_store.get(conversation_id)


def append_message(conversation_id: str, role: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> Optional[ConversationMessage]:
    """
    Append message to conversation
    
    Args:
        conversation_id: Conversation ID
        role: Message role ("user" or "assistant")
        content: Message content
        metadata: Optional metadata
        
    Returns:
        Created message or None
    """
    conversation = conversations_store.get(conversation_id)
    if not conversation:
        return None
    
    message = ConversationMessage(
        role=role,
        content=content,
        timestamp=datetime.utcnow(),
        metadata=metadata or {}
    )
    
    conversation.messages.append(message)
    conversation.updated_at = datetime.utcnow()
    
    return message


def get_history(conversation_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Get conversation history
    
    Args:
        conversation_id: Conversation ID
        limit: Maximum number of messages to return
        
    Returns:
        List of messages
    """
    conversation = conversations_store.get(conversation_id)
    if not conversation:
        return []
    
    messages = conversation.messages[-limit:] if limit > 0 else conversation.messages
    
    return [
        {
            "role": msg.role,
            "content": msg.content,
            "timestamp": msg.timestamp.isoformat(),
            "metadata": msg.metadata
        }
        for msg in messages
    ]


def clear_memory(conversation_id: str) -> bool:
    """
    Clear conversation memory
    
    Args:
        conversation_id: Conversation ID
        
    Returns:
        True if cleared, False if not found
    """
    if conversation_id in conversations_store:
        conversations_store[conversation_id].messages = []
        conversations_store[conversation_id].context = {}
        conversations_store[conversation_id].updated_at = datetime.utcnow()
        return True
    return False


def delete_conversation(conversation_id: str) -> bool:
    """
    Delete conversation
    
    Args:
        conversation_id: Conversation ID
        
    Returns:
        True if deleted, False if not found
    """
    if conversation_id in conversations_store:
        del conversations_store[conversation_id]
        return True
    return False


def get_all_conversations(project_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Get all conversations, optionally filtered by project
    
    Args:
        project_id: Optional project ID filter
        
    Returns:
        List of conversation summaries
    """
    conversations = []
    
    for conv in conversations_store.values():
        if project_id is None or conv.project_id == project_id:
            conversations.append({
                "conversation_id": conv.conversation_id,
                "project_id": conv.project_id,
                "user_name": conv.user_name,
                "message_count": len(conv.messages),
                "created_at": conv.created_at.isoformat(),
                "updated_at": conv.updated_at.isoformat()
            })
    
    # Sort by updated_at descending
    conversations.sort(key=lambda x: x["updated_at"], reverse=True)
    return conversations


def update_conversation_context(conversation_id: str, context: Dict[str, Any]) -> bool:
    """
    Update conversation context
    
    Args:
        conversation_id: Conversation ID
        context: Context dictionary
        
    Returns:
        True if updated, False if not found
    """
    conversation = conversations_store.get(conversation_id)
    if not conversation:
        return False
    
    conversation.context.update(context)
    conversation.updated_at = datetime.utcnow()
    return True


def get_conversation_context(conversation_id: str) -> Dict[str, Any]:
    """
    Get conversation context
    
    Args:
        conversation_id: Conversation ID
        
    Returns:
        Context dictionary
    """
    conversation = conversations_store.get(conversation_id)
    if not conversation:
        return {}
    return conversation.context


def build_context_window(conversation_id: str, max_messages: int = 10) -> str:
    """
    Build context window from conversation history
    
    Args:
        conversation_id: Conversation ID
        max_messages: Maximum messages to include
        
    Returns:
        Formatted context string
    """
    history = get_history(conversation_id, limit=max_messages)
    
    if not history:
        return ""
    
    context_parts = ["Previous Conversation:"]
    for msg in history:
        role = msg["role"].upper()
        content = msg["content"]
        context_parts.append(f"{role}: {content}")
    
    context_parts.append("\nCurrent Question:")
    return "\n".join(context_parts)