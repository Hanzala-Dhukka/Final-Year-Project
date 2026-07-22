"""
Glossary service (Module 7.3).

Owns term storage, search/category filtering, seeding, favorites, suggestions,
learning progress, and mini-quiz question generation. Delegates AI explanations
to glossary_ai_service.
"""
from typing import List, Dict, Any, Optional, Tuple

from app.database.db import database
from app.data.glossary import GLOSSARY
from app.models.glossary import (
    glossary_term_document,
    progress_document,
    favorite_document,
    suggestion_document,
)
from app.services.glossary_ai_service import explain_term

TERMS = "glossary_terms"
PROGRESS = "glossary_progress"
FAVORITES = "glossary_favorites"
SUGGESTIONS = "glossary_suggestions"


# ── Seeding ─────────────────────────────────────────────────────────────────
async def seed_if_empty() -> int:
    """Seed the glossary_terms collection from the curated dataset if empty."""
    try:
        count = await database[TERMS].count_documents({})
    except Exception:
        count = 0
    if count > 0:
        return 0

    docs = [glossary_term_document(t) for t in GLOSSARY]
    if docs:
        await database[TERMS].insert_many(docs)
    return len(docs)


# ── Read ────────────────────────────────────────────────────────────────────
def _term_out(doc: Dict[str, Any], is_favorite: bool = False) -> Dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "term": doc.get("term"),
        "category": doc.get("category"),
        "difficulty": doc.get("difficulty"),
        "definition": doc.get("definition"),
        "example": doc.get("example"),
        "prevention": doc.get("prevention", []),
        "owasp_reference": doc.get("owasp_reference"),
        "related_terms": doc.get("related_terms", []),
        "is_favorite": is_favorite,
    }


async def list_terms(
    skip: int = 0, limit: int = 100, category: str = None
) -> tuple[List[Dict[str, Any]], int]:
    """List glossary terms with optional category filter + pagination."""
    query = {}
    if category:
        query["category"] = category
    total = await database[TERMS].count_documents(query)
    cursor = database[TERMS].find(query).sort("term", 1).skip(skip).limit(limit)
    out = []
    async for d in cursor:
        out.append(_term_out(d))
    return out, total


async def search_terms(q: str, category: str = None) -> List[Dict[str, Any]]:
    """Partial, case-insensitive search by term (and definition)."""
    query: Dict[str, Any] = {
        "$or": [
            {"term": {"$regex": q, "$options": "i"}},
            {"definition": {"$regex": q, "$options": "i"}},
        ]
    }
    if category:
        query["category"] = category
    cursor = database[TERMS].find(query).sort("term", 1).limit(200)
    out = []
    async for d in cursor:
        out.append(_term_out(d))
    return out


async def get_categories() -> List[str]:
    """Distinct categories present in the glossary."""
    try:
        cats = await database[TERMS].distinct("category")
        return sorted([c for c in cats if c])
    except Exception:
        return []


async def get_term(term_id: str, user_id: str = None) -> Optional[Dict[str, Any]]:
    """Fetch a single term by id, marking it viewed and flagging favorite."""
    from bson import ObjectId

    try:
        doc = await database[TERMS].find_one({"_id": ObjectId(term_id)})
    except Exception:
        return None
    if not doc:
        return None

    is_fav = False
    if user_id:
        is_fav = await is_favorite(user_id, term_id)
        await mark_viewed(user_id, term_id)

    return _term_out(doc, is_favorite=is_fav)


async def related_terms(term_doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Resolve the related_terms list into full term documents."""
    names = term_doc.get("related_terms", [])
    if not names:
        return []
    cursor = database[TERMS].find({"term": {"$in": names}}).limit(20)
    out = []
    async for d in cursor:
        out.append(_term_out(d))
    return out


# ── Mini quiz ───────────────────────────────────────────────────────────────
async def mini_quiz(term_id: str) -> Optional[Dict[str, Any]]:
    """
    Build a short multiple-choice quiz for a term. The correct answer is drawn
    from the term's prevention list (or definition), with distractors from
    other terms' prevention items / names.
    """
    from bson import ObjectId

    try:
        doc = await database[TERMS].find_one({"_id": ObjectId(term_id)})
    except Exception:
        return None
    if not doc:
        return None

    prevention = doc.get("prevention") or []
    correct = prevention[0] if prevention else doc.get("definition")
    if not correct:
        return None

    # Gather distractors from other terms
    distractors = []
    cursor = database[TERMS].find({"_id": {"$ne": ObjectId(term_id)}}).limit(60)
    async for d in cursor:
        for p in d.get("prevention", []):
            if p != correct and p not in distractors:
                distractors.append(p)
        if d.get("term") != doc.get("term") and d.get("term") not in distractors:
            distractors.append(d.get("term"))

    import random
    random.shuffle(distractors)
    options = [correct] + distractors[:3]
    random.shuffle(options)

    # Simple explanation: reuse the term's first prevention rationale
    explanation = (
        f"{correct} helps mitigate {doc.get('term')}. "
        f"See the term's prevention guidance for details."
    )
    return {
        "question": f"Which technique helps prevent {doc.get('term')}?",
        "options": options,
        "correct_answer": correct,
        "explanation": explanation,
    }


# ── Favorites ───────────────────────────────────────────────────────────────
async def is_favorite(user_id: str, term_id: str) -> bool:
    try:
        doc = await database[FAVORITES].find_one(
            {"user_id": user_id, "term_id": term_id}
        )
        return doc is not None
    except Exception:
        return False


async def toggle_favorite(user_id: str, term_id: str) -> bool:
    """Add/remove a favorite; returns True if now favorited."""
    existing = await database[FAVORITES].find_one(
        {"user_id": user_id, "term_id": term_id}
    )
    if existing:
        await database[FAVORITES].delete_one({"_id": existing["_id"]})
        await _bump_favorite_count(user_id, -1)
        return False
    await database[FAVORITES].insert_one(favorite_document(user_id, term_id))
    await _bump_favorite_count(user_id, 1)
    return True


async def get_favorites(user_id: str) -> List[Dict[str, Any]]:
    cursor = database[FAVORITES].find({"user_id": user_id})
    term_ids = []
    async for f in cursor:
        term_ids.append(f["term_id"])
    from bson import ObjectId
    if not term_ids:
        return []
    try:
        oids = [ObjectId(t) for t in term_ids if ObjectId(t)]
    except Exception:
        return []
    cursor = database[TERMS].find({"_id": {"$in": oids}})
    out = []
    async for d in cursor:
        out.append(_term_out(d, is_favorite=True))
    return out


async def _bump_favorite_count(user_id: str, delta: int) -> None:
    await database[PROGRESS].update_one(
        {"user_id": user_id},
        {"$inc": {"favorite_count": delta}, "$set": {"updated_at": _now()}},
        upsert=True,
    )


# ── Suggestions ─────────────────────────────────────────────────────────────
async def suggest_term(
    user_id: str, term: str, definition: str, category: str, reason: str
) -> str:
    """Store a user-submitted term suggestion (status: pending)."""
    doc = suggestion_document(user_id, term, definition, category, reason)
    await database[SUGGESTIONS].insert_one(doc)
    return doc["_id"]


async def list_suggestions(status: str = None) -> List[Dict[str, Any]]:
    query = {"status": status} if status else {}
    cursor = database[SUGGESTIONS].find(query).sort("created_at", -1).limit(200)
    out = []
    async for s in cursor:
        out.append({
            "id": str(s["_id"]),
            "term": s.get("term"),
            "definition": s.get("definition"),
            "category": s.get("category"),
            "reason": s.get("reason"),
            "status": s.get("status"),
        })
    return out


async def review_suggestion(suggestion_id: str, action: str) -> bool:
    """
    Approve/reject a suggestion. On approve, the term is added to glossary_terms.
    action: 'approve' | 'reject'
    """
    from bson import ObjectId

    try:
        s = await database[SUGGESTIONS].find_one({"_id": ObjectId(suggestion_id)})
    except Exception:
        return False
    if not s:
        return False

    new_status = "approved" if action == "approve" else "rejected"
    await database[SUGGESTIONS].update_one(
        {"_id": ObjectId(suggestion_id)}, {"$set": {"status": new_status}}
    )
    if action == "approve":
        term_doc = glossary_term_document({
            "term": s.get("term"),
            "category": s.get("category"),
            "difficulty": "Beginner",
            "definition": s.get("definition"),
            "example": "",
            "prevention": [],
            "owasp_reference": None,
            "related_terms": [],
        })
        await database[TERMS].insert_one(term_doc)
    return True


# ── Progress ────────────────────────────────────────────────────────────────
def _now():
    from datetime import datetime, timezone
    return datetime.now(timezone.utc)


async def _ensure_progress(user_id: str) -> Dict[str, Any]:
    prog = await database[PROGRESS].find_one({"user_id": user_id})
    if not prog:
        doc = progress_document(user_id)
        await database[PROGRESS].insert_one(doc)
        return doc
    return prog


async def mark_viewed(user_id: str, term_id: str) -> None:
    await _ensure_progress(user_id)
    await database[PROGRESS].update_one(
        {"user_id": user_id},
        {
            "$addToSet": {"terms_viewed": term_id},
            "$set": {"last_activity": _now(), "updated_at": _now()},
        },
    )


async def mark_learned(user_id: str, term_id: str) -> None:
    await _ensure_progress(user_id)
    await database[PROGRESS].update_one(
        {"user_id": user_id},
        {
            "$addToSet": {"terms_learned": term_id},
            "$set": {"last_activity": _now(), "updated_at": _now()},
        },
    )
    # Activity timeline + glossary progress counter (Module 7.5)
    try:
        from app.services.gamification_service import log_activity
        await log_activity(user_id, "glossary", "Learned a glossary term", 5, {"term_id": term_id})
        # update completed_glossary on the persisted user_progress doc
        await database["user_progress"].update_one(
            {"user_id": user_id}, {"$inc": {"completed_glossary": 1}}, upsert=True
        )
    except Exception:
        pass


async def record_flashcards(user_id: str, completed: int) -> None:
    await _ensure_progress(user_id)
    await database[PROGRESS].update_one(
        {"user_id": user_id},
        {"$inc": {"flashcards_completed": completed}, "$set": {"updated_at": _now()}},
    )


async def record_quiz_passed(user_id: str) -> None:
    await _ensure_progress(user_id)
    await database[PROGRESS].update_one(
        {"user_id": user_id},
        {"$inc": {"mini_quizzes_passed": 1}, "$set": {"updated_at": _now()}},
    )


async def get_progress(user_id: str) -> Dict[str, Any]:
    await _ensure_progress(user_id)
    prog = await database[PROGRESS].find_one({"user_id": user_id})
    total = await database[TERMS].count_documents({})
    learned = len(prog.get("terms_learned", []))
    pct = round((learned / total) * 100, 1) if total else 0.0
    return {
        "terms_viewed": len(prog.get("terms_viewed", [])),
        "terms_learned": learned,
        "flashcards_completed": prog.get("flashcards_completed", 0),
        "mini_quizzes_passed": prog.get("mini_quizzes_passed", 0),
        "favorite_count": prog.get("favorite_count", 0),
        "study_streak": prog.get("study_streak", 0),
        "total_terms": total,
        "percentage": pct,
    }


# ── AI explain (delegated) ─────────────────────────────────────────────────
async def explain(term: str, definition: str = None) -> Tuple[str, str]:
    return await explain_term(term, definition)
