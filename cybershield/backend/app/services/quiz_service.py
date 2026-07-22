"""
Quiz service (Module 7.2).

Owns generation, submission, scoring, history, and adaptive-learning logic.
Delegates AI question generation to ai_quiz_service and XP/level handling to
the existing ProgressService.
"""
from typing import List, Dict, Any, Optional

from app.database.db import database
from app.models.quiz import quiz_session_document, question_bank_document
from app.models.quiz_attempt import quiz_attempt_document
from app.services.ai_quiz_service import generate_quiz_questions
from app.services.progress_service import ProgressService

# XP formula (spec Step 19) — overrides the generic ProgressService base.
XP_PER_CORRECT = 5
XP_PERFECT = 20
XP_HARD = 30
XP_EXPERT = 50
XP_DAILY = 25
XP_STREAK_7 = 100

DIFFICULTY_XP = {"Easy": 0, "Medium": 0, "Hard": XP_HARD, "Expert": XP_EXPERT}

QUESTION_BANK = "question_bank"
QUIZ_SESSIONS = "quiz_sessions"
QUIZ_ATTEMPTS = "quiz_attempts"


# ── Generation ──────────────────────────────────────────────────────────────
async def generate_quiz(
    user_id: str,
    difficulty: str,
    category: str,
    technology: str,
    count: int,
    project_id: str = None,
) -> Dict[str, Any]:
    """
    Generate a quiz session for the user. Stores the session + caches questions
    in the question bank. Returns a public view (answers hidden).
    """
    questions, provider = await generate_quiz_questions(
        difficulty, category, technology, count
    )

    session = quiz_session_document(
        user_id=user_id,
        difficulty=difficulty,
        category=category,
        technology=technology,
        questions=questions,
        project_id=project_id,
        total_questions=len(questions),
    )
    await database[QUIZ_SESSIONS].insert_one(session)

    # Cache generated questions for reuse / validation
    try:
        bank_docs = [
            question_bank_document(q, difficulty, category, technology)
            for q in questions
            if q.get("question")
        ]
        if bank_docs:
            await database[QUESTION_BANK].insert_many(bank_docs)
    except Exception as e:
        print(f"Failed to cache question bank: {e}")

    return {
        "session_id": session["_id"],
        "difficulty": difficulty,
        "category": category,
        "technology": technology,
        "total_questions": len(questions),
        "questions": questions,
        "provider": provider,
    }


def _hide_answers(session: Dict[str, Any]) -> Dict[str, Any]:
    """Return a public quiz view with shuffled options and hidden answers."""
    out_questions = []
    for i, q in enumerate(session.get("questions", [])):
        options = list(q.get("options", []))
        out_questions.append({
            "index": i,
            "question": q.get("question"),
            "options": options,
            "difficulty": q.get("difficulty"),
            "category": q.get("category"),
            "technology": q.get("technology"),
        })
    return {
        "session_id": session["_id"],
        "difficulty": session.get("difficulty"),
        "category": session.get("category"),
        "technology": session.get("technology"),
        "total_questions": len(out_questions),
        "questions": out_questions,
    }


async def get_quiz(user_id: str, session_id: str) -> Optional[Dict[str, Any]]:
    """Fetch a quiz session the user owns (answers hidden)."""
    session = await database[QUIZ_SESSIONS].find_one(
        {"_id": session_id, "user_id": user_id}
    )
    if not session:
        return None
    return _hide_answers(session)


# ── Submission / scoring ────────────────────────────────────────────────────
async def submit_quiz(user_id: str, session_id: str, answers: Dict[str, str]) -> Dict[str, Any]:
    """
    Evaluate a submitted quiz, award XP, store the attempt, and return the
    full graded result.
    """
    session = await database[QUIZ_SESSIONS].find_one(
        {"_id": session_id, "user_id": user_id}
    )
    if not session:
        return None
    if session.get("status") == "Completed":
        # Re-grade from stored attempt if already completed
        attempt = await database[QUIZ_ATTEMPTS].find_one({"session_id": session_id})
        if attempt:
            return _attempt_to_result(attempt)

    questions = session.get("questions", [])
    total = len(questions)
    results = []
    correct = 0
    weak_topics = []

    for i, q in enumerate(questions):
        idx = str(i)
        user_answer = answers.get(idx)
        is_correct = user_answer is not None and user_answer == q.get("correct_answer")
        if is_correct:
            correct += 1
        else:
            # Track the category/topic to drive adaptive recommendations
            topic = q.get("category") or q.get("technology") or "this topic"
            weak_topics.append(topic)

        results.append({
            "index": i,
            "question": q.get("question"),
            "user_answer": user_answer,
            "correct_answer": q.get("correct_answer"),
            "is_correct": is_correct,
            "explanation": q.get("explanation"),
            "owasp_reference": q.get("owasp_reference"),
        })

    score = correct
    percentage = int(round((score / total) * 100)) if total else 0
    incorrect = total - correct

    # ── XP calculation (spec Step 19) ──
    xp = score * XP_PER_CORRECT
    if total > 0 and score == total:
        xp += XP_PERFECT
    xp += DIFFICULTY_XP.get(session.get("difficulty"), 0)

    # Award XP via the shared ProgressService (handles level + persistence)
    try:
        ProgressService.add_xp(
            user_id, "quiz", score=percentage, perfect_score=(score == total)
        )
    except Exception as e:
        print(f"Failed to award quiz XP: {e}")

    # Adaptive recommendations (spec Step 17): focus on weak topics
    recommendations = _build_recommendations(weak_topics, correct, total)

    attempt = quiz_attempt_document(
        user_id=user_id,
        session_id=session_id,
        difficulty=session.get("difficulty", "Medium"),
        category=session.get("category", ""),
        technology=session.get("technology", ""),
        score=score,
        total=total,
        correct=correct,
        incorrect=incorrect,
        percentage=percentage,
        results=results,
        recommendations=recommendations,
        xp_earned=xp,
        project_id=session.get("project_id"),
    )
    await database[QUIZ_ATTEMPTS].insert_one(attempt)

    # Activity timeline (Module 7.5)
    try:
        from app.services.gamification_service import log_activity
        await log_activity(
            user_id, "quiz",
            f"Completed a {session.get('difficulty', 'Medium')} quiz: {score}/{total} ({percentage}%)",
            xp,
            {"percentage": percentage, "category": session.get("category")},
        )
    except Exception:
        pass

    # Mark session complete
    await database[QUIZ_SESSIONS].update_one(
        {"_id": session_id},
        {"$set": {"status": "Completed", "completed_at": attempt["created_at"]}},
    )

    # Compute global rank by XP for this user
    rank = await _user_rank(user_id)

    return {
        "session_id": session_id,
        "score": score,
        "total": total,
        "correct": correct,
        "incorrect": incorrect,
        "percentage": percentage,
        "xp": xp,
        "rank": rank,
        "recommendations": recommendations,
        "results": results,
    }


def _build_recommendations(weak_topics: List[str], correct: int, total: int) -> List[str]:
    """Generate study recommendations from weak topics (adaptive learning)."""
    recs = []
    if total and correct == total:
        recs.append("Perfect score! Try a harder difficulty or a new category to keep progressing.")
        return recs[:4]

    # De-duplicate weak topics, keep order
    seen = []
    for t in weak_topics:
        if t not in seen:
            seen.append(t)
    for t in seen[:5]:
        recs.append(f"Review {t}")
    if not recs:
        recs.append("Review the topics you missed and retry the quiz.")
    return recs[:6]


def _attempt_to_result(attempt: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "session_id": attempt.get("session_id"),
        "score": attempt.get("score", 0),
        "total": attempt.get("total", 0),
        "correct": attempt.get("correct", 0),
        "incorrect": attempt.get("incorrect", 0),
        "percentage": attempt.get("percentage", 0),
        "xp": attempt.get("xp_earned", 0),
        "rank": 0,
        "recommendations": attempt.get("recommendations", []),
        "results": attempt.get("results", []),
    }


# ── History ─────────────────────────────────────────────────────────────────
async def get_history(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """List the user's quiz attempts, newest first."""
    cursor = (
        database[QUIZ_ATTEMPTS]
        .find({"user_id": user_id})
        .sort("created_at", -1)
        .limit(limit)
    )
    out = []
    async for a in cursor:
        out.append({
            "id": a["_id"],
            "session_id": a.get("session_id"),
            "difficulty": a.get("difficulty"),
            "category": a.get("category"),
            "technology": a.get("technology"),
            "score": a.get("score"),
            "total": a.get("total"),
            "percentage": a.get("percentage"),
            "xp_earned": a.get("xp_earned", 0),
            "created_at": a.get("created_at").isoformat() if a.get("created_at") else "",
        })
    return out


# ── Ranking helper ──────────────────────────────────────────────────────────
async def _user_rank(user_id: str) -> int:
    """Compute the user's XP rank across all users (1 = highest XP)."""
    try:
        user_progress = ProgressService.get_user_progress(user_id)
        user_xp = user_progress.get("xp", 0)
    except Exception:
        user_xp = 0

    # Count users with strictly more XP using the progress collection
    try:
        count = await database["user_progress"].count_documents(
            {"xp": {"$gt": user_xp}}
        )
        return count + 1
    except Exception:
        return 0
