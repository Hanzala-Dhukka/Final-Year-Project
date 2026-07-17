"""
AI Security Assistant API routes (Modules 5.1 & 5.2).

Endpoints (mounted under /chat):
  GET  /chat/context        Get the user's current active project + context domain
  POST /chat/context        Update the user's active project + context domain
  POST /chat/new            Create a new conversation
  POST /chat/message        Send a message (context-aware) and receive the AI reply
  GET  /chat/conversations  List the user's conversations
  GET  /chat/{id}           Get messages for a conversation
  DELETE /chat/{id}         Delete a conversation and its messages
"""
from fastapi import APIRouter, Depends, HTTPException

from app.dependencies.auth import get_current_user
from app.schemas.chat_schema import (
    ChatMessageRequest,
    ChatMessageResponse,
    NewConversationResponse,
    ConversationSummary,
    ConversationMessagesResponse,
)
from app.schemas.context_schema import ContextUpdate, ContextResponse
from app.services import ai_chat_service as svc
from app.services import context_service

router = APIRouter()


@router.get("/context", response_model=ContextResponse)
async def get_context(user=Depends(get_current_user)):
    """Return the user's current active project + context domain."""
    user_id = str(user["_id"])
    active = svc.get_active_context(user_id)
    project_id = active.get("project_id")
    project = await context_service.get_current_project(user_id, project_id)
    project_name = project.get("name") if project else None

    data = await context_service.build_context(user_id, project_id)
    return ContextResponse(
        project=project_name,
        project_id=project_id,
        context=active.get("context", "general"),
        has_scan=bool(data.get("latest_scan")),
        has_threat_report=bool(data.get("latest_threat_report")),
        has_owasp=bool(data.get("latest_owasp")),
        has_quiz=bool(data.get("latest_quiz")),
    )


@router.post("/context", response_model=ContextResponse)
async def update_context(payload: ContextUpdate, user=Depends(get_current_user)):
    """Update the user's active project + context domain."""
    user_id = str(user["_id"])
    state = svc.set_active_context(user_id, payload.project_id, payload.context)
    project = await context_service.get_current_project(user_id, state["project_id"])
    project_name = project.get("name") if project else None

    data = await context_service.build_context(user_id, state["project_id"])
    return ContextResponse(
        project=project_name,
        project_id=state["project_id"],
        context=state["context"],
        has_scan=bool(data.get("latest_scan")),
        has_threat_report=bool(data.get("latest_threat_report")),
        has_owasp=bool(data.get("latest_owasp")),
        has_quiz=bool(data.get("latest_quiz")),
    )


@router.post("/new", response_model=NewConversationResponse)
async def new_conversation(user=Depends(get_current_user)):
    """Create a new (empty) conversation using the active context."""
    user_id = str(user["_id"])
    active = svc.get_active_context(user_id)
    conversation_id = await svc.create_conversation(
        user_id,
        title="New Conversation",
        project_id=active.get("project_id"),
        context=active.get("context", "general"),
    )
    return NewConversationResponse(
        conversation_id=conversation_id, title="New Conversation"
    )


@router.post("/message", response_model=ChatMessageResponse)
async def send_message(
    payload: ChatMessageRequest,
    user=Depends(get_current_user),
):
    """
    Send a context-aware message. Creates a conversation automatically if none
    is provided, saves the user message, calls Gemini with the user's CyberShield
    context, saves the reply, and returns it.
    """
    user_id = str(user["_id"])
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Resolve active context (explicit param > conversation stored > user active)
    active = svc.get_active_context(user_id)
    project_id = payload.project_id or active.get("project_id")
    context_type = payload.context or active.get("context", "general")

    # Resolve or create the conversation
    conversation_id = payload.conversation_id
    title = None
    if not conversation_id:
        conv = await svc.get_conversations(user_id)
        existing = next((c for c in conv if c["title"] == "New Conversation"), None)
        if existing:
            conversation_id = existing["id"]
        else:
            conversation_id = await svc.create_conversation(
                user_id, project_id=project_id, context=context_type
            )

    # Ownership check
    conv = await svc.get_conversation(user_id, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Use the conversation's stored context if the caller didn't override it
    if not payload.context and not active.get("context"):
        context_type = conv.get("context", "general")
    if not payload.project_id and not active.get("project_id"):
        project_id = conv.get("project_id")

    # Save user message
    await svc.save_message(conversation_id, "user", message)

    # Auto-title from the first user message
    existing_messages = await svc.get_history(conversation_id)
    if len(existing_messages) <= 1:
        title = await svc.generate_title(message)
        await svc.update_title(conversation_id, title)

    # Get AI reply (context-aware) and store it
    reply = await svc.send_to_gemini(
        user_id, conversation_id, message, project_id=project_id, context_type=context_type
    )
    await svc.store_ai_reply(conversation_id, reply)

    return ChatMessageResponse(conversation_id=conversation_id, reply=reply, title=title)


@router.get("/conversations", response_model=list[ConversationSummary])
async def list_conversations(user=Depends(get_current_user)):
    """List all conversations for the current user."""
    user_id = str(user["_id"])
    return await svc.get_conversations(user_id)


@router.get("/{conversation_id}", response_model=ConversationMessagesResponse)
async def get_conversation_messages(conversation_id: str, user=Depends(get_current_user)):
    """Get a conversation's messages."""
    user_id = str(user["_id"])
    result = await svc.get_messages_for_user(conversation_id, user_id)
    if not result:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ConversationMessagesResponse(**result)


@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str, user=Depends(get_current_user)):
    """Delete a conversation and all its messages."""
    user_id = str(user["_id"])
    deleted = await svc.delete_chat(user_id, conversation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"detail": "Conversation deleted", "conversation_id": conversation_id}
