"""
Confidence Engine — Module D6 (Enhanced)

Calculates confidence scores (0-100) for each finding based on:
  1. Rule specificity
  2. Match context
  3. Pattern certainty
  4. File type (test files get reduced confidence)
  5. Context classification (string/comment matches get heavy penalty)
"""

from typing import Dict, Optional

# Base confidence overrides per rule type
RULE_CONFIDENCE = {
    "CS001": 99,   # Hardcoded Secret
    "CS002": 95,   # Hardcoded Password
    "CS003": 96,   # SQL Injection
    "CS004": 95,   # Command Injection
    "CS005": 88,   # XSS
    "CS006": 90,   # Insecure Deserialization
    "CS007": 85,   # Path Traversal
    "CS008": 92,   # Weak Cryptography
    "CS009": 82,   # Open Redirect
    "CS010": 98,   # Debug Mode
    "CS101": 97,   # Python eval()
    "CS102": 97,   # Python exec()
    "CS106": 94,   # SQL Injection f-string
    "CS107": 93,   # Pickle
    "CS108": 92,   # PyYAML
    "CS109": 96,   # Hardcoded JWT
    "CS112": 90,   # Blind SQLi
    "CS201": 97,   # JS eval()
    "CS202": 92,   # innerHTML
    "CS206": 96,   # JS JWT
    "CS209": 94,   # Node SQLi
    "CS210": 95,   # Node Command Injection
    "CS301": 95,   # Java Runtime.exec
    "CS302": 94,   # Java SQLi
    "CS303": 93,   # Java Deserialization
}

DEFAULT_CONFIDENCE = 80


def calculate_confidence(
    rule_id: str,
    matched_text: str = "",
    line_content: str = "",
    rule_data: Optional[Dict] = None,
) -> int:
    """
    Calculate confidence score (0-100) for a finding.

    Factors:
    1. Base rule confidence (from RULE_CONFIDENCE or rule_data)
    2. Match specificity boost: longer match = more certain
    3. Context indicators: presence of comments reduces confidence
    4. Test file detection: findings in test files get reduced confidence
    5. String literal detection: findings that look like data reduce confidence
    """
    # Start with base confidence from rule
    base = RULE_CONFIDENCE.get(rule_id, DEFAULT_CONFIDENCE)
    if rule_data and "confidence" in rule_data:
        base = rule_data["confidence"]

    confidence = base

    # Boost for specific variable names (not generic)
    if matched_text:
        specific_indicators = [
            "api_key", "secret_key", "password", "aws_secret",
            "github_token", "private_key", "mongodb+srv://",
        ]
        if any(ind in matched_text.lower() for ind in specific_indicators):
            confidence = min(confidence + 2, 109)  # cap at 99 later
        # Reduce for very short generic matches
        if len(matched_text.strip()) < 5:
            confidence = max(confidence - 5, 30)

    # Reduce for comments
    if line_content:
        stripped = line_content.strip()
        if stripped.startswith("#") or stripped.startswith("//") or stripped.startswith("*"):
            confidence = max(confidence - 20, 20)
        # Reduce for test assertion lines
        if "assert" in stripped.lower() or "test" in stripped.lower():
            confidence = max(confidence - 10, 30)
        # Reduce for TODO/FIXME/HACK comments
        if any(kw in stripped.upper() for kw in ["TODO", "FIXME", "HACK", "XXX"]):
            confidence = max(confidence - 5, 30)

    # Detect if the match looks like it's inside a string/data
    # by checking for surrounding quote patterns
    if line_content:
        # If the line is predominantly string content (e.g., educational data)
        quote_count = line_content.count('"') + line_content.count("'")
        if quote_count >= 4:
            confidence = max(confidence - 15, 30)

    return min(confidence, 99)  # Cap at 99


def get_confidence_label(confidence: int) -> str:
    """Get human-readable confidence label."""
    if confidence >= 95:
        return "Very High"
    elif confidence >= 85:
        return "High"
    elif confidence >= 70:
        return "Medium"
    elif confidence >= 50:
        return "Low"
    return "Very Low"
