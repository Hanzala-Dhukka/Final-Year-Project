"""
Rule Engine — Module D6

Matches security rules against file content and produces structured findings.
"""

import re
from typing import List, Dict, Optional, Tuple

from app.scanner.engine.location_engine import find_pattern_locations, find_all_pattern_locations
from app.scanner.engine.snippet_engine import extract_snippet, get_file_lines
from app.scanner.engine.confidence_engine import calculate_confidence


def match_rules(
    content: str,
    file_path: str,
    rules: List[Dict],
) -> List[Dict]:
    """
    Match all applicable rules against file content.

    Returns a list of finding dicts with precise location information.
    """
    findings = []
    lines = get_file_lines(content)
    file_ext = _get_file_extension(file_path)

    for rule in rules:
        # Check if rule applies to this file type
        rule_langs = rule.get("languages", ["*"])
        if "*" not in rule_langs and file_ext not in rule_langs:
            continue

        # Get all patterns for this rule
        patterns = [rule["pattern"]]
        if rule.get("alt_patterns"):
            patterns.extend(rule["alt_patterns"])

        # Find all matches across all patterns
        for pattern_str in patterns:
            try:
                locations = find_pattern_locations(content, pattern_str, file_path)
            except re.error:
                continue  # Skip invalid regex

            for loc in locations:
                # Extract code snippet
                snippet = extract_snippet(lines, loc["line"])

                # Calculate confidence
                confidence = calculate_confidence(
                    rule_id=rule["id"],
                    matched_text=loc.get("matched_text", ""),
                    line_content=loc.get("line_content", ""),
                    rule_data=rule,
                )

                finding = {
                    "file": file_path,
                    "line": loc["line"],
                    "end_line": loc["end_line"],
                    "column": loc["column"],
                    "end_column": loc["end_column"],
                    "severity": rule["severity"],
                    "rule_id": rule["id"],
                    "rule_name": rule["name"],
                    "message": rule["description"],
                    "code": loc.get("line_content", "").strip(),
                    "snippet": snippet,
                    "confidence": confidence,
                    "owasp": rule.get("owasp", ""),
                    "cwe": rule.get("cwe", ""),
                    "cvss": rule.get("cvss", 0.0),
                    "status": "Open",
                }
                findings.append(finding)

    # Deduplicate findings at same file+line+rule
    findings = _deduplicate_findings(findings)

    return findings


def _get_file_extension(file_path: str) -> str:
    """Extract file extension (e.g., '.py')."""
    if "." in file_path:
        return "." + file_path.rsplit(".", 1)[-1].lower()
    return ""


def _deduplicate_findings(findings: List[Dict]) -> List[Dict]:
    """Remove duplicate findings at the same file+line+rule_id."""
    seen = set()
    unique = []
    for f in findings:
        key = (f["file"], f["line"], f["rule_id"])
        if key not in seen:
            seen.add(key)
            unique.append(f)
    return unique


def calculate_severity_summary(findings: List[Dict]) -> Dict:
    """Calculate summary statistics from findings."""
    summary = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0,
        "total": len(findings),
        "avg_confidence": 0,
        "files_affected": set(),
        "rules_triggered": set(),
    }

    total_confidence = 0
    for f in findings:
        sev = f.get("severity", "Medium").lower()
        if sev in summary:
            summary[sev] += 1
        total_confidence += f.get("confidence", 0)
        summary["files_affected"].add(f["file"])
        summary["rules_triggered"].add(f["rule_id"])

    if findings:
        summary["avg_confidence"] = round(total_confidence / len(findings), 1)

    summary["files_affected"] = len(summary["files_affected"])
    summary["rules_triggered"] = len(summary["rules_triggered"])

    return summary
