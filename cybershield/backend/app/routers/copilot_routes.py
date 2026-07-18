from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse, FileResponse
from typing import Optional
import json
import os
from datetime import datetime

from app.schemas.copilot_schema import (
    ChatRequest, ChatResponse, FileUploadResponse,
    CompareRequest, CompareResponse, ExportRequest,
    ConversationCreate
)
from app.services.memory_service import (
    create_conversation, get_conversation, append_message,
    get_history, get_all_conversations, clear_memory, delete_conversation,
    build_context_window
)
from app.services.file_analyzer import FileAnalyzer
from app.services.report_comparator import ReportComparator
from app.services.streaming_service import StreamingService
from app.services.gemini_service import generate_ai_response
from app.services.context_builder import build_context
from app.services.google_sheets_service import save_chat_to_sheet

router = APIRouter()

# Ensure upload directory exists
UPLOAD_DIR = "uploads/reports"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/conversation", response_model=dict)
async def create_new_conversation(request: ConversationCreate):
    """Create a new conversation"""
    try:
        conversation = create_conversation(
            project_id=request.project_id,
            user_name=request.user_name
        )
        return {
            "conversation_id": conversation.conversation_id,
            "project_id": conversation.project_id,
            "created_at": conversation.created_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create conversation: {str(e)}")


@router.get("/conversations")
async def list_conversations(project_id: Optional[str] = None):
    """List all conversations"""
    try:
        conversations = get_all_conversations(project_id)
        return {"conversations": conversations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list conversations: {str(e)}")


@router.get("/conversation/{conversation_id}")
async def get_conversation_history(conversation_id: str):
    """Get conversation history"""
    try:
        conversation = get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        history = get_history(conversation_id)
        return {
            "conversation_id": conversation.conversation_id,
            "project_id": conversation.project_id,
            "messages": history,
            "context": conversation.context
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get conversation: {str(e)}")


@router.delete("/conversation/{conversation_id}")
async def delete_conversation_endpoint(conversation_id: str):
    """Delete a conversation"""
    try:
        success = delete_conversation(conversation_id)
        if not success:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return {"message": "Conversation deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete conversation: {str(e)}")


@router.post("/clear/{conversation_id}")
async def clear_conversation_memory(conversation_id: str):
    """Clear conversation memory"""
    try:
        success = clear_memory(conversation_id)
        if not success:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return {"message": "Conversation memory cleared"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear memory: {str(e)}")


@router.post("/upload", response_model=FileUploadResponse)
async def upload_report(file: UploadFile = File(...), conversation_id: Optional[str] = Form(None)):
    """Upload and analyze security report"""
    try:
        # Validate file type
        allowed_extensions = ['.pdf', '.json', '.txt', '.csv', '.md']
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"File type not allowed. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Read file content
        content = await file.read()
        
        # Try to decode as text
        try:
            content_str = content.decode('utf-8')
        except:
            content_str = content.decode('latin-1', errors='ignore')
        
        # Analyze file
        analysis = FileAnalyzer.analyze_file(file.filename, content_str)
        
        # Save file
        file_path = FileAnalyzer.save_uploaded_file(content, file.filename, UPLOAD_DIR)
        
        # Create conversation if not provided
        if not conversation_id:
            conv = create_conversation()
            conversation_id = conv.conversation_id
        
        # Add to conversation context
        from app.services.memory_service import update_conversation_context
        update_conversation_context(conversation_id, {
            "last_uploaded_file": file.filename,
            "last_analysis": analysis
        })
        
        # Add system message about upload
        append_message(conversation_id, "user", f"[Uploaded file: {file.filename}]")
        append_message(conversation_id, "assistant", 
            f"I've analyzed your {analysis['report_type']}. {analysis['summary']}",
            metadata={"type": "file_analysis", "analysis": analysis}
        )
        
        return FileUploadResponse(
            status="Uploaded",
            filename=file.filename,
            report_type=analysis["report_type"],
            summary=analysis,
            conversation_id=conversation_id
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")


@router.post("/ask", response_model=ChatResponse)
async def ask_copilot(request: ChatRequest):
    """Ask the AI copilot a question"""
    try:
        # Get or create conversation
        conversation = get_conversation(request.conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Build context
        project_context = build_context(conversation.project_id)
        
        # Add conversation context if enabled
        question = request.question
        if request.use_context:
            context_window = build_context_window(request.conversation_id, max_messages=10)
            if context_window:
                question = f"{context_window}\nCurrent Question: {request.question}"
        
        # Generate AI response
        ai_response = await generate_ai_response(question, project_context)
        
        # Extract answer
        answer_text = ai_response["answer"].get("summary", str(ai_response["answer"]))
        
        # Generate suggested questions
        suggested_questions = await StreamingService.generate_suggested_questions(
            request.conversation_id,
            answer_text
        )
        
        # Save to conversation
        append_message(request.conversation_id, "user", request.question)
        append_message(request.conversation_id, "assistant", answer_text, metadata={
            "provider": ai_response.get("provider", "unknown"),
            "model": ai_response.get("model", "unknown"),
            "response_time": ai_response.get("response_time")
        })
        
        # Save to Google Sheets
        save_chat_to_sheet(
            project_id=conversation.project_id or "",
            question=request.question,
            answer=answer_text,
            provider=ai_response.get("provider", "unknown"),
            model=ai_response.get("model", "unknown"),
            response_time=ai_response.get("response_time")
        )
        
        return ChatResponse(
            conversation_id=request.conversation_id,
            answer=answer_text,
            sources=[],
            suggested_questions=suggested_questions,
            metadata={
                "provider": ai_response.get("provider"),
                "model": ai_response.get("model"),
                "response_time": ai_response.get("response_time")
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")


@router.post("/stream")
async def stream_copilot_response(request: ChatRequest):
    """Stream AI response"""
    try:
        # Get conversation
        conversation = get_conversation(request.conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Build context
        project_context = build_context(conversation.project_id)
        
        # Return streaming response
        return StreamingResponse(
            StreamingService.stream_response(
                request.conversation_id,
                request.question,
                project_context
            ),
            media_type="text/event-stream"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stream response: {str(e)}")


@router.post("/compare", response_model=CompareResponse)
async def compare_reports(request: CompareRequest):
    """Compare two security reports"""
    try:
        # This would typically load reports from storage
        # For now, we'll assume the reports are passed as content
        # In production, you'd load from files or database
        
        # Placeholder - in real implementation, load actual report content
        old_content = request.old_report
        new_content = request.new_report
        
        # Compare reports
        result = ReportComparator.compare_reports(old_content, new_content)
        
        return CompareResponse(
            improvement_percentage=result["improvement_percentage"],
            critical_fixed=result["critical_fixed"],
            critical_remaining=result["critical_remaining"],
            high_fixed=result["high_fixed"],
            high_remaining=result["high_remaining"],
            medium_fixed=result["medium_fixed"],
            medium_remaining=result["medium_remaining"],
            summary=result["summary"],
            chart_data=result["chart_data"]
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compare reports: {str(e)}")


@router.get("/export/{conversation_id}")
async def export_conversation(conversation_id: str, format: str = "txt"):
    """Export conversation to file"""
    try:
        conversation = get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        history = get_history(conversation_id)
        
        if format == "pdf":
            # Generate PDF (you'd need to implement PDF generation)
            # For now, return txt
            format = "txt"
        
        # Generate text file
        content = f"Conversation: {conversation_id}\n"
        content += f"Project: {conversation.project_id or 'N/A'}\n"
        content += f"User: {conversation.user_name}\n"
        content += f"Date: {conversation.created_at.isoformat()}\n"
        content += "=" * 80 + "\n\n"
        
        for msg in history:
            role = msg["role"].upper()
            timestamp = msg["timestamp"]
            content += f"[{timestamp}] {role}:\n{msg['content']}\n\n"
        
        # Save to file
        filename = f"conversation_{conversation_id}.txt"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        
        return FileResponse(
            filepath,
            media_type="text/plain",
            filename=filename
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export conversation: {str(e)}")


@router.get("/health")
async def health_check():
    """Check copilot service health"""
    from app.services.gemini_service import get_model
    model = get_model()
    
    return {
        "status": "healthy" if model else "fallback_mode",
        "provider": "Groq" if model else "Rule-Based",
        "features": {
            "conversation_memory": True,
            "file_upload": True,
            "streaming": True,
            "report_comparison": True
        }
    }