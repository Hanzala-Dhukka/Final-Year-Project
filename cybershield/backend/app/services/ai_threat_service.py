"""
AI Threat Analysis orchestrator.

Workflow (Step 4 of the spec):
  Receive Project -> Validate Request -> Build Prompt -> Send to Gemini
  -> Receive Response -> Parse JSON -> Validate Fields -> Save MongoDB
  -> Return Response

If Gemini times out, errors, or returns invalid JSON, we transparently fall
back to the local STRIDE rule engine so the user always gets a complete report
(Step 8). On fallback a ``message`` field explains that the local analyzer was
used.
"""
import traceback
from typing import Any, Dict

from app.core.config import settings
from app.ai import ai_service
from app.services import threat_analysis_service


FALLBACK_MESSAGE = "AI service unavailable. Using local threat analyzer."


async def analyze_with_ai(data: Dict[str, Any], user_id: str = None) -> Dict[str, Any]:
    ai_payload: Dict[str, Any] | None = None
    provider = "Rule Engine"
    model = None
    message = None

    try:
        raw = await ai_service.generate_threat_model(data)
        parsed = ai_service.parse_ai_response(raw)
        ai_payload = ai_service.validate_ai_response(parsed, data)
        provider = "Gemini"
        model = settings.AI_MODEL
    except Exception as e:  # timeout, API error, invalid JSON, validation error
        traceback.print_exc()
        message = FALLBACK_MESSAGE
        ai_payload = None

    payload = threat_analysis_service.build_report_payload(data, user_id, ai_payload)
    payload["ai_provider"] = provider
    payload["model"] = model

    if message:
        payload["message"] = message

    report_id = await threat_analysis_service.persist_report(payload, user_id)
    return threat_analysis_service.build_response(payload, report_id)
