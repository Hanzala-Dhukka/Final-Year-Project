"""
Checklist generator (Module 6.2).

Parses and validates the JSON returned by Gemini, sorts tasks by priority,
computes an estimated risk-after score by applying each task's predicted
risk_reduction in priority order, and produces a short AI summary.
"""
import json
import re
from typing import Dict, List, Optional

from app.schemas.ai_checklist_schema import ChecklistTask

PRIORITY_ORDER = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
DIFFICULTY_LEVELS = {"Easy", "Medium", "Hard"}


def _parse_risk_reduction(value) -> int:
    """Extract an integer percentage from values like '12%', 12, '12 %'."""
    if isinstance(value, (int, float)):
        return max(0, int(value))
    if isinstance(value, str):
        m = re.search(r"(\d+)", value)
        if m:
            return max(0, int(m.group(1)))
    return 0


def extract_json(text: str) -> Optional[dict]:
    """
    Extract a JSON object from a Gemini response that may be wrapped in a
    ```json fenced block or contain surrounding prose.
    """
    if not text:
        return None

    # Try a fenced ```json block first
    fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    candidates = []
    if fence:
        candidates.append(fence.group(1))
    # Fallback: first { ... } balanced-ish slice
    brace = re.search(r"\{.*\}", text, re.DOTALL)
    if brace:
        candidates.append(brace.group(0))

    for cand in candidates:
        try:
            return json.loads(cand)
        except Exception:
            continue
    return None


def _normalise_task(raw: Dict) -> ChecklistTask:
    priority = str(raw.get("priority", "Medium")).strip().title()
    if priority not in PRIORITY_ORDER:
        priority = "Medium"
    difficulty = str(raw.get("difficulty", "Medium")).strip().title()
    if difficulty not in DIFFICULTY_LEVELS:
        difficulty = "Medium"
    return ChecklistTask(
        title=str(raw.get("title", "")).strip(),
        description=str(raw.get("description", "")).strip(),
        priority=priority,
        difficulty=difficulty,
        estimated_time=str(raw.get("estimated_time", "")).strip(),
        risk_reduction=str(raw.get("risk_reduction", "0%")).strip(),
        framework=str(raw.get("framework", "")).strip(),
        reason=str(raw.get("reason", "")).strip(),
    )


def build_summary(items: List[ChecklistTask], risk_score: Optional[int],
                  estimated_risk_after: Optional[int]) -> str:
    """Generate a short natural-language recommendation for the summary card."""
    if not items:
        return "No critical actions identified. Keep your dependencies patched and configurations hardened."

    top = items[0]
    parts = [f"Your highest priority is to {top.title.lower()}."]
    if top.reason:
        parts.append(top.reason)
    if top.risk_reduction:
        parts.append(f"Doing this first will reduce approximately {top.risk_reduction} of your risk.")
    if top.estimated_time:
        parts.append(f"Estimated completion: {top.estimated_time}.")
    if risk_score is not None and estimated_risk_after is not None:
        parts.append(f"Overall risk is projected to drop from {risk_score} to {estimated_risk_after}.")
    return " ".join(parts)


def generate_checklist(ai_text: str, risk_score: Optional[int] = None) -> Dict:
    """
    Process raw Gemini text into a validated checklist structure.

    Returns:
        {
          "items": [...sorted ChecklistTask...],
          "estimated_risk_after": int,
          "ai_summary": str,
          "raw_error": optional str
        }
    """
    data = extract_json(ai_text)

    if not data:
        raise ValueError("AI did not return parseable JSON for the checklist.")

    if "error" in data:
        raise ValueError(str(data.get("error")))

    raw_tasks = data.get("tasks") or []
    if not isinstance(raw_tasks, list):
        raise ValueError("AI response 'tasks' field is not a list.")

    items = [_normalise_task(t) for t in raw_tasks if t.get("title")]
    # Sort by priority (Critical first)
    items.sort(key=lambda t: PRIORITY_ORDER.get(t.priority, 99))

    # Compute estimated risk after applying reductions in priority order
    estimated_risk_after = risk_score
    if risk_score is not None:
        remaining = risk_score
        for it in items:
            remaining -= _parse_risk_reduction(it.risk_reduction)
        estimated_risk_after = max(0, remaining)

    summary = build_summary(items, risk_score, estimated_risk_after)

    return {
        "items": items,
        "estimated_risk_after": estimated_risk_after,
        "ai_summary": summary,
    }
