"""
Glossary API routes (Module 7.3).

Endpoints (mounted under /api/v1/glossary):
  GET    /                       List terms (pagination + optional category)
  GET    /search?q=&category=    Search terms
  GET    /categories             Distinct categories
  GET    /category/{category}    Terms by category
  GET    /{id}                   Single term (marks viewed; flags favorite)
  GET    /{id}/related           Related terms
  GET    /{id}/quiz              Mini quiz for a term
  POST   /explain                AI explanation (markdown)
  GET    /export/{id}            PDF export
  POST   /suggest                User suggestion
  POST   /{id}/favorite          Toggle favorite
  GET    /favorites/me           Current user's favorites
  GET    /progress/me            Current user's learning progress
  POST   /flashcards             Create a flashcard session
  POST   /flashcards/result      Record flashcard session result
  POST   /progress/learned       Mark a term learned
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response

from app.dependencies.auth import get_current_user
from app.schemas.glossary_schema import (
    ExplainRequest,
    SuggestTermRequest,
    FlashcardResultRequest,
    ExplainResponse,
    GlossaryDetailOut,
    ProgressOut,
    FlashcardSessionOut,
)
from app.services import glossary_service
from app.services.flashcard_service import create_session as fc_create, record_result as fc_record
from app.services.glossary_export_service import export_term_pdf

router = APIRouter(
    prefix="/api/v1/glossary",
    tags=["Glossary"],
)


@router.on_event("startup")
async def _startup_seed():
    """Seed the glossary on first startup."""
    try:
        await glossary_service.seed_if_empty()
    except Exception as e:
        print(f"Glossary seed skipped: {e}")


@router.get("/", response_model=dict)
async def list_terms(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    category: str = Query(None),
):
    terms, total = await glossary_service.list_terms(skip=skip, limit=limit, category=category)
    return {"terms": terms, "total": total, "skip": skip, "limit": limit}


@router.get("/search", response_model=dict)
async def search(q: str = Query(..., min_length=1), category: str = Query(None)):
    results = await glossary_service.search_terms(q, category=category)
    return {"results": results, "count": len(results)}


@router.get("/categories", response_model=list)
async def categories():
    return await glossary_service.get_categories()


@router.get("/category/{category}", response_model=dict)
async def by_category(category: str):
    terms, total = await glossary_service.list_terms(category=category, limit=500)
    return {"terms": terms, "total": total}


@router.get("/favorites/me", response_model=list)
async def my_favorites(user=Depends(get_current_user)):
    return await glossary_service.get_favorites(str(user["_id"]))


@router.get("/progress/me", response_model=ProgressOut)
async def my_progress(user=Depends(get_current_user)):
    return await glossary_service.get_progress(str(user["_id"]))


@router.get("/{term_id}", response_model=GlossaryDetailOut)
async def get_term(term_id: str, user=Depends(get_current_user)):
    term = await glossary_service.get_term(term_id, user_id=str(user["_id"]))
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
    return term


@router.get("/{term_id}/related", response_model=list)
async def related(term_id: str):
    from app.services.glossary_service import get_term as _gt
    term = await glossary_service.get_term(term_id)
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
    # get_term returns dict without _id; refetch raw for related resolution
    from bson import ObjectId
    from app.database.db import database
    raw = await database["glossary_terms"].find_one({"_id": ObjectId(term_id)})
    if not raw:
        return []
    return await glossary_service.related_terms(raw)


@router.get("/{term_id}/quiz", response_model=dict)
async def mini_quiz(term_id: str, user=Depends(get_current_user)):
    quiz = await glossary_service.mini_quiz(term_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz unavailable for this term")
    return quiz


@router.post("/explain", response_model=ExplainResponse)
async def explain(payload: ExplainRequest):
    explanation, provider = await glossary_service.explain(
        payload.term, definition=payload.definition
    )
    return ExplainResponse(term=payload.term, explanation=explanation, provider=provider)


@router.get("/export/{term_id}")
async def export_pdf(term_id: str, user=Depends(get_current_user)):
    pdf = await export_term_pdf(term_id, user_id=str(user["_id"]))
    if not pdf:
        raise HTTPException(status_code=404, detail="Term not found")
    filename = f"glossary_{term_id}.pdf"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/suggest", response_model=dict)
async def suggest(payload: SuggestTermRequest, user=Depends(get_current_user)):
    sid = await glossary_service.suggest_term(
        str(user["_id"]), payload.term, payload.definition, payload.category, payload.reason or ""
    )
    return {"id": sid, "status": "pending"}


@router.post("/{term_id}/favorite", response_model=dict)
async def toggle_favorite(term_id: str, user=Depends(get_current_user)):
    favorited = await glossary_service.toggle_favorite(str(user["_id"]), term_id)
    return {"favorited": favorited}


@router.post("/progress/learned", response_model=dict)
async def mark_learned(payload: dict, user=Depends(get_current_user)):
    term_id = payload.get("term_id")
    if not term_id:
        raise HTTPException(status_code=400, detail="term_id required")
    await glossary_service.mark_learned(str(user["_id"]), term_id)
    return {"ok": True}


@router.post("/flashcards", response_model=FlashcardSessionOut)
async def create_flashcards(
    payload: dict = {}, user=Depends(get_current_user)
):
    category = payload.get("category")
    limit = int(payload.get("limit", 20))
    session = await fc_create(str(user["_id"]), category=category, limit=limit)
    return session


@router.post("/flashcards/result", response_model=dict)
async def flashcard_result(payload: FlashcardResultRequest, user=Depends(get_current_user)):
    completed = await fc_record(
        str(user["_id"]),
        known=payload.known,
        learning=payload.learning,
        completed=payload.completed,
        term_ids=payload.term_ids,
    )
    return {"completed": completed}
