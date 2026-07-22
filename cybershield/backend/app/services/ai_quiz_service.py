"""
AI Quiz Generator service (Module 7.2).

Calls the configured AI model (Groq, per Module 7.1 decision) to generate
project/tech/difficulty-aware MCQs as strict JSON, with parsing + validation
and a graceful offline fallback to the static question bank.
"""
import json
import re
import random
from typing import List, Dict, Any, Optional

from app.ai.gemini_client import generate, is_available
from app.ai.quiz_prompt import build_quiz_prompt
from app.data.questions import QUESTIONS


def _strip_code_fences(text: str) -> str:
    """Remove ```json / ``` wrappers if the model returned markdown."""
    text = text.strip()
    if "```json" in text:
        text = text.split("```json", 1)[1].split("```", 1)[0].strip()
    elif "```" in text:
        text = text.split("```", 1)[1].split("```", 1)[0].strip()
    return text


def _validate_questions(raw: Any) -> List[Dict[str, Any]]:
    """
    Validate + normalise AI output into a clean list of question dicts.
    Returns [] when the data is malformed.
    """
    if not isinstance(raw, dict):
        return []
    questions = raw.get("questions")
    if not isinstance(questions, list):
        return []

    clean = []
    for q in questions:
        if not isinstance(q, dict):
            continue
        options = q.get("options")
        answer = q.get("correct_answer") or q.get("answer")
        question = q.get("question")
        if not question or not isinstance(options, list) or len(options) != 4 or not answer:
            continue
        # Ensure the correct answer is present in the option set
        if answer not in options:
            continue
        clean.append({
            "question": str(question).strip(),
            "options": [str(o).strip() for o in options],
            "correct_answer": str(answer).strip(),
            "explanation": str(q.get("explanation", "")).strip(),
            "owasp_reference": q.get("owasp") or q.get("owasp_reference"),
            "difficulty": q.get("difficulty", "Medium"),
            "category": q.get("category"),
            "technology": q.get("technology"),
        })
    return clean


async def generate_quiz_questions(
    difficulty: str,
    category: str,
    technology: str,
    count: int,
) -> tuple[List[Dict[str, Any]], str]:
    """
    Generate MCQs via the AI model.

    Returns:
        (questions, provider) where provider is "Groq" or "Fallback".
        Falls back to curated questions when the model is unavailable or the
        JSON is invalid.
    """
    if is_available():
        try:
            prompt = build_quiz_prompt(difficulty, category, technology, count)
            raw_text = await generate(prompt)
            parsed = _validate_questions(_safe_json_loads(_strip_code_fences(raw_text)))
            if parsed:
                return parsed[:count], "Groq"
        except Exception as e:
            print(f"AI quiz generation failed, using fallback: {e}")

    return _fallback_questions(difficulty, category, technology, count), "Fallback"


def _safe_json_loads(text: str) -> Any:
    try:
        return json.loads(text)
    except Exception:
        # Try to recover the first {...} JSON object
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                return None
        return None


def _fallback_questions(
    difficulty: str,
    category: str,
    technology: str,
    count: int,
) -> List[Dict[str, Any]]:
    """
    Curated offline questions. Prefers matches by category/difficulty, then
    falls back to random pool selection so the quiz always works offline.
    """
    def norm(s: str) -> str:
        return (s or "").lower().strip()

    pool = QUESTIONS if isinstance(QUESTIONS, list) else list(QUESTIONS)

    # Try to match by category first (case-insensitive contains)
    cat_matches = [
        q for q in pool
        if norm(category) in norm(q.get("category")) or norm(q.get("category")) in norm(category)
    ]
    # Then by difficulty
    diff_matches = [q for q in pool if norm(q.get("difficulty")) == norm(difficulty)]

    candidates = cat_matches or diff_matches or pool
    if len(candidates) > count:
        candidates = random.sample(candidates, count)

    out = []
    for q in candidates:
        options = list(q.get("options", []))
        random.shuffle(options)
        out.append({
            "question": q.get("question"),
            "options": options,
            "correct_answer": q.get("answer"),
            "explanation": q.get("explanation", ""),
            "owasp_reference": q.get("owasp") or q.get("owasp_reference"),
            "difficulty": q.get("difficulty", difficulty),
            "category": q.get("category", category),
            "technology": technology,
        })
    return out
