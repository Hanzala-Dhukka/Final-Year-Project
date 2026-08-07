"""
Rule Matcher (Module SC2).

Matches a scanner finding (dict with 'type' and/or 'description')
against the rule database and returns the first matching rule.

Usage:
    from app.rules.rule_matcher import match_rule

    result = match_rule({"type": "SQL Injection", "description": "..."})
    # => {"matched": True, "rule_id": "SQL_INJECTION_001", "task": ..., "category": ..., "severity": ...}
"""

from .checklist_rules import CHECKLIST_RULES


def match_rule(finding: dict) -> dict:
    """
    Match a single scanner finding against the rule database.

    Args:
        finding: dict with at least 'type' or 'description' key.
                 Example: {"type": "SQL Injection", "description": "Unsafe query"}

    Returns:
        dict with keys:
            matched   : bool — whether a rule was found
            rule_id   : str | None — the rule identifier
            task      : str | None — the checklist task title
            category  : str | None — the security category
            severity  : str | None — severity level
    """
    finding_text = (
        finding.get("type", "")
        + " "
        + finding.get("description", "")
        + " "
        + finding.get("title", "")
    ).lower()

    for rule_id, rule in CHECKLIST_RULES.items():
        for pattern in rule["patterns"]:
            if pattern.lower() in finding_text:
                return {
                    "matched": True,
                    "rule_id": rule_id,
                    "task": rule["task"],
                    "category": rule["category"],
                    "severity": rule["severity"],
                }

    return {
        "matched": False,
        "rule_id": None,
        "task": None,
        "category": None,
        "severity": None,
    }


def match_rules(findings: list) -> list:
    """
    Match multiple scanner findings against the rule database.

    Args:
        findings: list of finding dicts

    Returns:
        list of match results (same format as match_rule output)
    """
    results = []
    seen_rules = set()

    for finding in findings:
        result = match_rule(finding)
        if result["matched"] and result["rule_id"] not in seen_rules:
            results.append(result)
            seen_rules.add(result["rule_id"])

    return results
