"""
Rule Engine (Module SC2).

Orchestrates the mapping pipeline:
  Scanner Finding → Rule Matcher → Checklist Recommendation

This module provides the higher-level interface that SC3
(Auto Recommendation Service) will call to convert scan
results into checklist task recommendations.
"""

from typing import List, Optional

from .rule_matcher import match_rule, match_rules


def process_finding(finding: dict) -> Optional[dict]:
    """
    Process a single scanner finding and return its checklist mapping.

    Args:
        finding: scanner finding dict (must have 'type' or 'description')

    Returns:
        dict with scan_finding + checklist_rule info, or None if no match.
    """
    result = match_rule(finding)

    if result["matched"]:
        return {
            "scan_finding": finding,
            "checklist_rule": result["rule_id"],
            "task": result["task"],
            "category": result["category"],
            "severity": result["severity"],
        }

    return None


def process_findings(findings: List[dict]) -> List[dict]:
    """
    Process multiple scanner findings and return all checklist mappings.

    Deduplicates by rule_id (same rule won't appear twice).

    Args:
        findings: list of scanner finding dicts

    Returns:
        list of checklist recommendation dicts
    """
    results = []
    seen_rules = set()

    for finding in findings:
        mapped = process_finding(finding)
        if mapped and mapped["checklist_rule"] not in seen_rules:
            results.append(mapped)
            seen_rules.add(mapped["checklist_rule"])

    return results
