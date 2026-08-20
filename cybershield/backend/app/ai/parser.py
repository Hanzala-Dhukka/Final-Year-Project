"""
AI Response Parser — Module D4

Robustly parses Groq AI responses into structured vulnerability analysis objects.
Handles markdown fences, incomplete JSON, and edge cases.
"""

import json
import re
from typing import Any, Dict, Optional

from app.services.error_log_service import fire_and_forget_log

# Default structure when AI response is missing fields
DEFAULT_ANALYSIS = {
    "summary": "Analysis unavailable",
    "technical_explanation": "",
    "attack_scenario": "",
    "owasp": "",
    "cwe": "",
    "cvss_reason": "",
    "risk_priority": "Medium",
    "remediation": [],
    "secure_code": "",
    "prevention": [],
    "learning_resources": [],
}

REQUIRED_FIELDS = ["summary", "technical_explanation", "attack_scenario",
                   "owasp", "cwe", "cvss_reason", "risk_priority",
                   "remediation", "secure_code", "prevention", "learning_resources"]


def parse_ai_response(raw: str) -> Dict[str, Any]:
    """
    Parse an AI text response into a structured dictionary.

    Handles:
    - Raw JSON strings
    - Markdown-fenced JSON (```json ... ```)
    - Partially malformed JSON (extracts the JSON object)
    - Missing fields (fills defaults)
    """
    text = raw.strip()

    # Strip markdown code fences
    fence_pattern = r"```(?:json)?\s*\n?(.*?)```"
    match = re.search(fence_pattern, text, re.DOTALL)
    if match:
        text = match.group(1).strip()

    # Try direct parse
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return _fill_defaults(parsed)
    except json.JSONDecodeError:
        fire_and_forget_log()
        pass

    # Try extracting JSON object from surrounding text
    brace_start = text.find("{")
    brace_end = text.rfind("}")
    if brace_start != -1 and brace_end > brace_start:
        try:
            parsed = json.loads(text[brace_start:brace_end + 1])
            if isinstance(parsed, dict):
                return _fill_defaults(parsed)
        except json.JSONDecodeError:
            fire_and_forget_log()
            pass

    # Last resort: try to fix common issues
    cleaned = text.replace("\n", " ").replace("\t", " ")
    cleaned = re.sub(r',\s*}', '}', cleaned)
    cleaned = re.sub(r',\s*]', ']', cleaned)

    brace_start = cleaned.find("{")
    brace_end = cleaned.rfind("}")
    if brace_start != -1 and brace_end > brace_start:
        try:
            parsed = json.loads(cleaned[brace_start:brace_end + 1])
            if isinstance(parsed, dict):
                return _fill_defaults(parsed)
        except json.JSONDecodeError:
            fire_and_forget_log()
            pass

    raise ValueError(f"Unable to parse AI response as JSON. Raw: {text[:200]}...")


def _fill_defaults(data: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure all required fields exist with sensible defaults."""
    result = {}
    for field in REQUIRED_FIELDS:
        value = data.get(field)
        if value is None or value == "":
            result[field] = DEFAULT_ANALYSIS.get(field)
        else:
            result[field] = value

    # Ensure list fields are actually lists
    for list_field in ["remediation", "prevention", "learning_resources"]:
        if not isinstance(result[list_field], list):
            result[list_field] = []

    return result
