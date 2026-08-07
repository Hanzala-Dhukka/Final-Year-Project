"""
AI Learning Recommendation Service (Steps 4-5).

Two-layer recommendation:
1. Rule-based mapping from VULNERABILITY_MAP (fast, deterministic)
2. AI-enhanced learning path via Groq (personalised roadmap)
"""
import json
from typing import List, Dict, Any, Optional

from app.database.db import database
from app.learning.learning_mapper import VULNERABILITY_MAP, SEVERITY_PRIORITY
from app.learning.models import recommendation_document, learning_progress_document
from app.ai.gemini_client import generate, is_available

# MongoDB collections
recommendations_col = database.learning_recommendations
progress_col = database.user_learning_progress


# ── Rule-based recommendations (Step 4) ─────────────────────────────────────

def generate_recommendations(vulnerabilities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Map detected vulnerabilities to learning recommendations.

    Args:
        vulnerabilities: List of {"type": str, "severity": str, ...}

    Returns:
        List of recommendation objects with topic, reason, type, priority, link.
    """
    seen = set()
    recommendations = []

    for item in vulnerabilities:
        vuln_type = item.get("type", "")
        severity = item.get("severity", "Medium")

        if vuln_type not in VULNERABILITY_MAP:
            continue

        data = VULNERABILITY_MAP[vuln_type]
        priority = SEVERITY_PRIORITY.get(severity, "Medium")

        for topic_info in data["topics"]:
            topic_name = topic_info["topic"]
            if topic_name in seen:
                continue
            seen.add(topic_name)

            # Determine recommendation type based on the link
            link = topic_info.get("link", "")
            if "/owasp/" in link:
                rec_type = "OWASP"
            elif "/glossary/" in link:
                rec_type = "Glossary"
            elif "/quiz" in link:
                rec_type = "Quiz"
            else:
                rec_type = "Learning"

            recommendations.append({
                "topic": topic_name,
                "reason": f"Detected {vuln_type} vulnerability (Severity: {severity})",
                "type": rec_type,
                "priority": priority,
                "link": link,
                "owasp": data.get("owasp", ""),
            })

    # Sort: High priority first
    priority_order = {"High": 0, "Medium": 1, "Low": 2}
    recommendations.sort(key=lambda r: priority_order.get(r["priority"], 1))

    return recommendations


# ── AI-enhanced learning path (Step 5) ──────────────────────────────────────

AI_LEARNING_PROMPT = """You are a cybersecurity mentor creating a personalised learning roadmap.

Based on these vulnerabilities found in the user's project:
{vulnerabilities}

Create a structured learning roadmap. Return ONLY valid JSON (no markdown fences):
{{
  "learning_path": [
    {{"level": "Beginner", "topic": "...", "reason": "..."}},
    {{"level": "Intermediate", "topic": "...", "reason": "..."}},
    {{"level": "Advanced", "topic": "...", "reason": "..."}}
  ],
  "summary": "1-2 sentence summary of the user's main learning needs",
  "estimated_time": "e.g. 2-3 weeks",
  "top_priority": "The single most important topic to learn first"
}}

Rules:
- Include 2-3 topics per level (Beginner, Intermediate, Advanced)
- Be specific to the actual vulnerabilities found
- Focus on practical, actionable learning
- Keep the summary under 50 words
"""


async def generate_ai_learning_path(
    vulnerabilities: List[Dict[str, Any]],
) -> Optional[Dict[str, Any]]:
    """
    Use Groq AI to generate a personalised learning roadmap.

    Args:
        vulnerabilities: List of detected vulnerabilities.

    Returns:
        AI-generated learning path dict, or None if AI is unavailable.
    """
    if not is_available():
        return None

    vuln_text = json.dumps(vulnerabilities[:10], indent=2, default=str)
    prompt = AI_LEARNING_PROMPT.format(vulnerabilities=vuln_text)

    try:
        raw = await generate(prompt)
        # Strip markdown fences if present
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = "\n".join(cleaned.split("\n")[1:])
        if cleaned.endswith("```"):
            cleaned = "\n".join(cleaned.split("\n")[:-1])
        return json.loads(cleaned)
    except Exception as e:
        print(f"[Learning] AI learning path generation failed: {e}")
        return None


# ── Full recommendation pipeline ─────────────────────────────────────────────

async def get_full_recommendations(
    user_id: str,
    vulnerabilities: List[Dict[str, Any]],
    scan_id: str = None,
) -> Dict[str, Any]:
    """
    Generate rule-based + AI-enhanced recommendations and persist them.

    Args:
        user_id: The authenticated user's ID.
        vulnerabilities: Detected vulnerabilities from scan.
        scan_id: Optional scan ID for reference.

    Returns:
        Dict with "recommendations" and optionally "ai_path".
    """
    # 1. Rule-based recommendations
    recs = generate_recommendations(vulnerabilities)

    # 2. AI-enhanced learning path
    ai_path = await generate_ai_learning_path(vulnerabilities)

    # 3. Persist to MongoDB
    doc = recommendation_document(user_id, scan_id or "", recs)
    if ai_path:
        doc["ai_path"] = ai_path
    try:
        await recommendations_col.insert_one(doc)
    except Exception as e:
        print(f"[Learning] Failed to save recommendations: {e}")

    return {
        "recommendations": recs,
        "ai_path": ai_path,
        "scan_id": scan_id,
    }


# ── Learning progress (Steps 12-13) ─────────────────────────────────────────

async def get_learning_progress(user_id: str) -> Dict[str, Any]:
    """Get the user's learning progress."""
    doc = await progress_col.find_one({"user_id": user_id})
    if doc:
        return {
            "user_id": user_id,
            "completed": doc.get("completed", []),
            "percentage": doc.get("percentage", 0),
        }
    return {"user_id": user_id, "completed": [], "percentage": 0}


async def mark_topic_completed(user_id: str, topic: str) -> Dict[str, Any]:
    """Mark a learning topic as completed and recalculate percentage."""
    doc = await progress_col.find_one({"user_id": user_id})
    completed = doc.get("completed", []) if doc else []

    if topic not in completed:
        completed.append(topic)

    # Total unique topics across all vulnerabilities
    total_topics = len(set(
        t["topic"]
        for v_data in VULNERABILITY_MAP.values()
        for t in v_data["topics"]
    ))
    percentage = round((len(completed) / max(total_topics, 1)) * 100, 1)

    progress_doc = learning_progress_document(user_id, completed, percentage)
    await progress_col.update_one(
        {"user_id": user_id},
        {"$set": progress_doc},
        upsert=True,
    )

    return {
        "user_id": user_id,
        "completed": completed,
        "percentage": percentage,
    }


async def get_latest_recommendations(user_id: str) -> Dict[str, Any]:
    """Get the most recent recommendations for a user."""
    doc = await recommendations_col.find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)],
    )
    if doc:
        return {
            "recommendations": doc.get("recommendations", []),
            "ai_path": doc.get("ai_path"),
            "scan_id": doc.get("scan_id"),
            "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else "",
        }
    return {"recommendations": [], "ai_path": None}
