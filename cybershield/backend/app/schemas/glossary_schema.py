"""
Pydantic schemas for the Glossary API (Module 7.3).
"""
from typing import Optional, List
from pydantic import BaseModel, Field


# ── Request bodies ──────────────────────────────────────────────────────────
class ExplainRequest(BaseModel):
    """Body for POST /glossary/explain."""
    term: str = Field(..., description="The glossary term to explain with AI")
    definition: Optional[str] = Field(None, description="Existing definition for context")


class SuggestTermRequest(BaseModel):
    """Body for POST /glossary/suggest."""
    term: str = Field(..., min_length=1)
    definition: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1)
    reason: Optional[str] = ""


class FlashcardResultRequest(BaseModel):
    """Body for POST /glossary/flashcards/result (update progress)."""
    known: int = 0
    learning: int = 0
    completed: int = 0
    term_ids: List[str] = []


# ── Responses ───────────────────────────────────────────────────────────────
class GlossaryTermOut(BaseModel):
    id: str
    term: str
    category: str
    difficulty: Optional[str] = None
    definition: Optional[str] = None
    example: Optional[str] = None
    prevention: List[str] = []
    owasp_reference: Optional[str] = None
    related_terms: List[str] = []


class GlossaryDetailOut(BaseModel):
    id: str
    term: str
    category: str
    difficulty: Optional[str] = None
    definition: Optional[str] = None
    example: Optional[str] = None
    prevention: List[str] = []
    owasp_reference: Optional[str] = None
    related_terms: List[str] = []
    is_favorite: bool = False


class ExplainResponse(BaseModel):
    term: str
    explanation: str
    provider: str = "Groq"


class SuggestionOut(BaseModel):
    id: str
    term: str
    definition: str
    category: str
    reason: Optional[str]
    status: str


class ProgressOut(BaseModel):
    terms_viewed: int
    terms_learned: int
    flashcards_completed: int
    mini_quizzes_passed: int
    favorite_count: int
    study_streak: int
    total_terms: int
    percentage: float


class FlashcardSessionOut(BaseModel):
    id: str
    terms: List[GlossaryTermOut]
    known: int
    learning: int
    completed: int
