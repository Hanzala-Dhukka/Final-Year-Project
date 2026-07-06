from fastapi import APIRouter, HTTPException
from app.schemas.chatbot_schema import ChatRequest, ChatResponse
from app.services.chatbot_service import save_chat, get_chat_history
from app.services.gemini_service import generate_ai_response
from app.services.context_builder import build_context
from app.services.google_sheets_service import save_chat_to_sheet

router = APIRouter()


@router.post("/ask", response_model=ChatResponse)
async def ask_question(request: ChatRequest):
    """
    Ask a question to the AI security assistant
    
    Args:
        request: Chat request with project_id and question
        
    Returns:
        Chat response with AI-generated answer
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question is required")
    
    try:
        # Build project context
        project_context = build_context(request.project_id)
        project_context["project_id"] = request.project_id
        
        # Generate AI response
        result = await generate_ai_response(request.question, project_context)
        
        # Extract answer text for storage
        answer_text = result["answer"].get("summary", str(result["answer"]))
        
        # Save chat history
        if request.project_id:
            save_chat(request.project_id, request.question, answer_text)
            
            # Save to Google Sheets
            save_chat_to_sheet(
                project_id=request.project_id,
                question=request.question,
                answer=answer_text,
                provider=result.get("provider", "unknown"),
                model=result.get("model", "unknown"),
                response_time=result.get("response_time")
            )
        
        return ChatResponse(
            provider=result.get("provider", "Unknown"),
            model=result.get("model", "unknown"),
            answer=result["answer"],
            response_time=result.get("response_time"),
            error=result.get("error")
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate response: {str(e)}"
        )


@router.get("/history/{project_id}")
async def get_history(project_id: str):
    """
    Get chat history for a project
    
    Args:
        project_id: Project ID
        
    Returns:
        List of chat history items
    """
    history = get_chat_history(project_id)
    return history


@router.get("/health")
async def health_check():
    """
    Check if Gemini AI is available
    
    Returns:
        Health status of the AI service
    """
    from app.services.gemini_service import get_model
    model = get_model()
    
    return {
        "status": "healthy" if model else "fallback_mode",
        "provider": "Gemini" if model else "Rule-Based",
        "model": "gemini-2.5-flash" if model else "rule-based"
    }
