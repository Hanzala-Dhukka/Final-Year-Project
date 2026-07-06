from pydantic import BaseModel
from typing import Optional, Dict, Any, List


class ChatRequest(BaseModel):
    project_id: Optional[str] = None
    question: str


class ChatResponse(BaseModel):
    provider: str
    model: str
    answer: Dict[str, Any]
    response_time: Optional[float] = None
    error: Optional[str] = None


class ChatHistoryItem(BaseModel):
    chat_id: str
    project_id: str
    question: str
    answer: str
    timestamp: str
    provider: Optional[str] = "rule-based"
    model: Optional[str] = "rule-based"
    response_time: Optional[float] = None
