"""
Dashboard AI Service
Provides all AI-powered dashboard analysis features using the existing
Groq client (app/ai/gemini_client.py) and the dashboard prompt templates.

All public methods:
  - security_analysis(data)      → full security overview JSON
  - risk_score(data)             → risk score JSON
  - recommendations(data)        → tiered recommendations JSON
  - trend_analysis(data)         → trend highlights JSON
  - learning_recommendation(data)→ personalised learning JSON
  - executive_report(data)       → executive summary JSON
  - assistant_chat(question, ctx)→ plain markdown answer string

Every method falls back to sensible demo data so the dashboard never
breaks even when Groq is unreachable.
"""
from __future__ import annotations

import json
import re
from typing import Any, Dict, Optional

from app.ai.groq_client import generate, is_available
from app.ai.prompts import (
    SECURITY_ANALYSIS_PROMPT,
    RISK_SCORE_PROMPT,
    RECOMMENDATIONS_PROMPT,
    TREND_ANALYSIS_PROMPT,
    LEARNING_PROMPT,
    EXECUTIVE_REPORT_PROMPT,
    ASSISTANT_PROMPT,
)


# ── JSON extraction helper ────────────────────────────────────────────────────

def _extract_json(text: str) -> Dict[str, Any]:
    """
    Extract the first JSON object from a model response.
    Strips markdown fences if present.
    """
    # Remove ```json … ``` fences
    text = re.sub(r"```(?:json)?", "", text).replace("```", "").strip()
    # Find the first { … } block
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return json.loads(match.group())
    return json.loads(text)


def _compact(data: Any) -> str:
    """Serialize data to compact JSON string for prompt injection."""
    try:
        return json.dumps(data, default=str)
    except Exception:
        return str(data)


# ── Fallback values ───────────────────────────────────────────────────────────

FALLBACK_ANALYSIS = {
    "status": "Fair",
    "summary": "Your application has a moderate security posture with several areas for improvement.",
    "risk_score": 72,
    "risk_level": "Medium",
    "main_concerns": ["Missing MFA", "Outdated dependencies", "Weak API validation"],
    "recommended_actions": ["Enable MFA", "Run dependency audit", "Add input validation"],
    "learning_suggestion": {"topic": "OWASP API Security", "reason": "Your project has API risks."},
}

FALLBACK_RISK = {
    "score": 72,
    "level": "Medium",
    "breakdown": {"vulnerability_score": 28, "configuration_score": 22, "activity_score": 22},
    "trend": "improving",
    "trend_change": 8,
    "explanation": "Score is driven mainly by unresolved medium-severity vulnerabilities.",
}

FALLBACK_RECOMMENDATIONS = {
    "immediate": [
        {"action": "Enable MFA on all admin accounts", "reason": "Prevents credential stuffing", "effort": "Low", "impact": "High"},
        {"action": "Patch known CVEs in dependencies", "reason": "Reduces known attack surface", "effort": "Medium", "impact": "High"},
    ],
    "short_term": [
        {"action": "Add Content-Security-Policy headers", "reason": "Mitigates XSS", "effort": "Low", "impact": "Medium"},
        {"action": "Implement rate limiting on APIs", "reason": "Prevents brute-force attacks", "effort": "Medium", "impact": "Medium"},
    ],
    "long_term": [
        {"action": "Adopt SAST in CI/CD pipeline", "reason": "Catches vulnerabilities early", "effort": "High", "impact": "High"},
        {"action": "Schedule quarterly penetration tests", "reason": "Validates security posture", "effort": "High", "impact": "High"},
    ],
}

FALLBACK_TREND = {
    "overall_trend": "improving",
    "summary": "Vulnerabilities reduced by 20% compared to last month.",
    "highlights": [
        {"metric": "Critical issues", "change": "↓ 2", "direction": "down"},
        {"metric": "High issues", "change": "↓ 3", "direction": "down"},
        {"metric": "Medium issues", "change": "→ stable", "direction": "stable"},
    ],
    "forecast": "Continued improvement expected if dependency patching proceeds.",
    "recommendation": "Focus on resolving the remaining medium-severity API issues.",
}

FALLBACK_LEARNING = {
    "primary": {
        "topic": "OWASP API Security Top 10",
        "reason": "Your project has active API vulnerabilities.",
        "resource": "OWASP",
        "estimated_time": "45 minutes",
        "path": "/owasp",
    },
    "secondary": [
        {"topic": "Dependency Security", "reason": "Outdated packages detected", "resource": "Lab", "path": "/progress"},
        {"topic": "Authentication Best Practices", "reason": "MFA not enabled", "resource": "Quiz", "path": "/quiz"},
    ],
    "skill_gap": "API security and secure dependency management need attention.",
    "xp_reward": 200,
}

FALLBACK_REPORT = {
    "executive_summary": "The application maintains a medium risk profile. Key concerns include missing MFA and outdated dependencies that require prompt attention.",
    "current_risk": "Medium",
    "score": 72,
    "key_findings": ["MFA not enforced", "3 high-severity CVEs in dependencies", "API input validation gaps"],
    "priority_actions": [
        {"action": "Enable MFA", "owner": "Security Team", "deadline": "Immediate"},
        {"action": "Update vulnerable packages", "owner": "Developer", "deadline": "1 Week"},
        {"action": "Conduct API security review", "owner": "Security Team", "deadline": "1 Month"},
    ],
    "compliance_status": "Partially Compliant",
    "next_review": "30 days",
}


# ── Service class ─────────────────────────────────────────────────────────────

class DashboardAIService:

    async def _call(self, prompt: str, fallback: Dict) -> Dict:
        """Call Groq, parse JSON response, fall back on any failure."""
        if not is_available():
            return fallback
        try:
            raw = await generate(prompt)
            return _extract_json(raw)
        except Exception as exc:
            print(f"[DashboardAIService] Groq call failed: {exc}")
            return fallback

    # ── Public methods ────────────────────────────────────────────────────────

    async def security_analysis(self, data: Any) -> Dict:
        prompt = SECURITY_ANALYSIS_PROMPT.format(data=_compact(data))
        return await self._call(prompt, FALLBACK_ANALYSIS)

    async def risk_score(self, data: Any) -> Dict:
        prompt = RISK_SCORE_PROMPT.format(data=_compact(data))
        return await self._call(prompt, FALLBACK_RISK)

    async def recommendations(self, data: Any) -> Dict:
        prompt = RECOMMENDATIONS_PROMPT.format(data=_compact(data))
        return await self._call(prompt, FALLBACK_RECOMMENDATIONS)

    async def trend_analysis(self, data: Any) -> Dict:
        prompt = TREND_ANALYSIS_PROMPT.format(data=_compact(data))
        return await self._call(prompt, FALLBACK_TREND)

    async def learning_recommendation(self, data: Any) -> Dict:
        prompt = LEARNING_PROMPT.format(data=_compact(data))
        return await self._call(prompt, FALLBACK_LEARNING)

    async def executive_report(self, data: Any) -> Dict:
        prompt = EXECUTIVE_REPORT_PROMPT.format(data=_compact(data))
        return await self._call(prompt, FALLBACK_REPORT)

    async def assistant_chat(
        self,
        question: str,
        context: Optional[Any] = None,
    ) -> str:
        """Free-form Q&A — returns markdown string, not JSON."""
        if not is_available():
            return (
                "I'm currently running in offline mode. "
                "Please ensure GROQ_API_KEY is configured to enable the AI assistant."
            )
        prompt = ASSISTANT_PROMPT.format(
            context=_compact(context) if context else "No additional context provided.",
            question=question,
        )
        try:
            return await generate(prompt)
        except Exception as exc:
            print(f"[DashboardAIService] Assistant chat failed: {exc}")
            return "Sorry, I couldn't process your question right now. Please try again."


# Module-level singleton
dashboard_ai_service = DashboardAIService()
