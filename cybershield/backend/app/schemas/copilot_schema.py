from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class ConversationCreate(BaseModel):
    project_id: Optional[str] = None
    user_name: Optional[str] = "User"


class ConversationMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = {}


class Conversation(BaseModel):
    conversation_id: str
    project_id: Optional[str]
    user_name: str
    messages: List[ConversationMessage]
    created_at: datetime
    updated_at: datetime
    context: Optional[Dict[str, Any]] = {}


class ChatRequest(BaseModel):
    conversation_id: str
    question: str
    use_context: bool = True


class ChatResponse(BaseModel):
    conversation_id: str
    answer: str
    sources: Optional[List[str]] = []
    suggested_questions: Optional[List[str]] = []
    metadata: Optional[Dict[str, Any]] = {}


class FileUploadResponse(BaseModel):
    status: str
    filename: str
    report_type: str
    summary: Dict[str, Any]
    conversation_id: str


class CompareRequest(BaseModel):
    old_report: str
    new_report: str
    conversation_id: Optional[str] = None


class CompareResponse(BaseModel):
    improvement_percentage: float
    critical_fixed: int
    critical_remaining: int
    high_fixed: int
    high_remaining: int
    medium_fixed: int
    medium_remaining: int
    summary: str
    chart_data: Dict[str, Any]


class ExportRequest(BaseModel):
    conversation_id: str
    format: str = "txt"  # "txt" or "pdf"


class ConversationMemory(BaseModel):
    conversation_id: str
    project_id: Optional[str]
    user_name: str
    messages: List[Dict[str, Any]]
    context: Dict[str, Any]
    created_at: str
    updated_at: str