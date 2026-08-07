"""
AI Recommendation Service (Module SC5).

Converts security findings into actionable checklist tasks using:
  1. Groq LLM (primary) — generates contextual, project-aware recommendations
  2. Rule-based fallback (SC2) — when AI is unavailable

Follows the same pattern as existing AI services:
  from app.ai.gemini_client import generate, is_available
"""

import json
import re
from typing import Optional, List

from app.ai.gemini_client import generate as ai_generate, is_available as ai_available
from app.rules.rule_engine import process_finding

# ── AI Prompt Template ────────────────────────────────────────────────────────

RECOMMENDATION_PROMPT = """You are a senior Application Security Engineer.
Convert this vulnerability finding into an actionable security checklist task.

Finding:
- Type: {finding_type}
- Severity: {severity}
- File: {file}
- Description: {description}

Return ONLY a JSON object with these fields:
{{
  "task": "concise action title (5-10 words)",
  "category": "one of: Authentication, Authorization, Input Validation, Cryptography, Secrets Management, Logging, Network Security, API Security, Database Security, Cloud Security, Secure Coding",
  "priority": "Critical | High | Medium | Low",
  "reason": "1-2 sentence explanation of why this matters",
  "impact_score": 5
}}

Rules:
- task must be a specific, actionable security control
- priority must match the finding severity
- impact_score: Critical=20, High=10, Medium=5, Low=2
- Return ONLY the JSON object, no markdown fences, no explanation
"""


def _parse_ai_response(raw: str) -> Optional[dict]:
    """Parse JSON from AI response, handling markdown fences."""
    # Strip markdown code fences
    cleaned = re.sub(r"```(?:json)?\s*", "", raw)
    cleaned = re.sub(r"```\s*$", "", cleaned)
    cleaned = cleaned.strip()

    # Try direct parse
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Try extracting first JSON object
    match = re.search(r"\{[^{}]*\}", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    return None


async def generate_ai_recommendation(finding: dict) -> Optional[dict]:
    """
    Generate an AI-powered checklist recommendation for a single finding.

    Falls back to SC2 rule engine when AI is unavailable.

    Args:
        finding: dict with 'type', 'severity', 'file', 'description'

    Returns:
        dict with task, category, priority, reason, impact_score, source
    """
    finding_type = finding.get("type", "Unknown")
    severity = finding.get("severity", "Medium")
    file_path = finding.get("file", "N/A")
    description = finding.get("description", finding.get("message", ""))

    # Try AI first
    if ai_available():
        try:
            prompt = RECOMMENDATION_PROMPT.format(
                finding_type=finding_type,
                severity=severity,
                file=file_path,
                description=description,
            )
            raw = await ai_generate(prompt)
            parsed = _parse_ai_response(raw)

            if parsed and parsed.get("task"):
                # Map severity to impact score
                impact_map = {"Critical": 20, "High": 10, "Medium": 5, "Low": 2}
                return {
                    "task": parsed.get("task", f"Fix {finding_type}"),
                    "category": parsed.get("category", "Secure Coding"),
                    "priority": parsed.get("priority", severity),
                    "reason": parsed.get("reason", ""),
                    "impact_score": parsed.get("impact_score", impact_map.get(severity, 5)),
                    "source": "AI_RECOMMENDATION",
                    "source_finding": finding_type,
                    "file": file_path,
                }
        except Exception:
            pass  # Fall through to rule-based

    # Fallback: SC2 rule engine
    rule_result = process_finding(finding)
    if rule_result:
        impact_map = {"Critical": 20, "High": 10, "Medium": 5, "Low": 2}
        return {
            "task": rule_result["task"],
            "category": rule_result["category"],
            "priority": rule_result["severity"],
            "reason": f"Automated recommendation based on {finding_type} detection.",
            "impact_score": impact_map.get(rule_result["severity"], 5),
            "source": "RULE_RECOMMENDATION",
            "source_finding": finding_type,
            "file": file_path,
        }

    return None


async def generate_batch_recommendations(findings: List[dict]) -> List[dict]:
    """
    Generate recommendations for multiple findings.

    Deduplicates by source_finding type.

    Args:
        findings: list of finding dicts

    Returns:
        list of recommendation dicts
    """
    results = []
    seen_types = set()

    for finding in findings:
        finding_type = finding.get("type", "Unknown")
        if finding_type in seen_types:
            continue

        rec = await generate_ai_recommendation(finding)
        if rec:
            results.append(rec)
            seen_types.add(finding_type)

    return results
