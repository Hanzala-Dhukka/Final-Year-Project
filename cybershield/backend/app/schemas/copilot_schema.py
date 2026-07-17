"""
Pydantic schemas for the AI Security Copilot.

This module holds both:
  - the legacy copilot conversation schemas (Module 5.x chat/stream),
  - the new Security Copilot schemas (Module 5.5 assessment/advisory).
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


# ── Legacy copilot conversation schemas (used by routers/copilot_routes.py) ───
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


# ── Security Copilot schemas (Module 5.5) ─────────────────────────────────────
class CopilotAnalyzeRequest(BaseModel):
    """Body for POST /copilot/analyze (spec Step 5)."""
    project_id: Optional[str] = None
    question: Optional[str] = None  # optional natural-language question


class CopilotChatRequest(BaseModel):
    """Body for POST /copilot/chat (natural-language security query)."""
    project_id: Optional[str] = None
    question: str = Field(..., min_length=1)
    history: Optional[List[Dict[str, str]]] = None


# ── Responses ─────────────────────────────────────────────────────────────────
class RoadmapWeek(BaseModel):
    week: str
    tasks: List[str] = []


class CopilotAnalyzeResponse(BaseModel):
    advisory_id: str
    project_id: Optional[str] = None
    project: Optional[str] = None
    risk_level: str
    security_score: int
    summary: str
    critical_findings: List[str] = []
    recommendations: List[str] = []
    roadmap: List[RoadmapWeek] = []
    raw_context: Dict[str, Any] = {}


class CopilotChatResponse(BaseModel):
    answer: str
    advisory: Optional[CopilotAnalyzeResponse] = None


class SecurityAdvisorySummary(BaseModel):
    id: str
    project: Optional[str]
    risk_level: str
    security_score: int
    summary: str
    created_at: str


class SecurityScoreResponse(BaseModel):
    project_id: Optional[str]
    project: Optional[str]
    security_score: int
    risk_level: str
    breakdown: Dict[str, Any] = {}
