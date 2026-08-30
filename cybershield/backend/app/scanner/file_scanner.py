"""
Module E2 — File Scanner (Context-Aware)

Line-by-line scanner that enriches every finding location with:
  - line number
  - column number
  - snippet (the single vulnerable line, stripped)
  - context (surrounding lines with is_vulnerable flag)
  - language

Uses context analysis to skip false positives in string literals,
comments, and regex pattern definitions.
"""
import re
from app.scanner.code_extractor import extract_code_context, get_snippet
from app.scanner.language_detector import detect_language
from app.scanner.context_analyzer import (
    classify_match_context,
    is_excluded_file,
    detect_language_from_path,
)
from app.services.github_scanner import SECRET_PATTERNS, CODE_PATTERNS, _ext


def scan_content_with_snippets(content: str, file_path: str) -> list[dict]:
    """
    Scan file content string line-by-line for all security rules.
    Uses context analysis to filter false positives.

    Args:
        content:   Raw file text downloaded from GitHub.
        file_path: The repo-relative path (e.g. 'app/routes/server.js').

    Returns:
        List of enriched findings (only true positives).
    """
    # Skip excluded files entirely
    if is_excluded_file(file_path):
        return []

    lines = content.splitlines()
    ext = _ext(file_path)
    language = detect_language(file_path)
    ctx_language = detect_language_from_path(file_path)
    findings_map: dict[str, dict] = {}

    # ── Secret Patterns ─────────────────────────────────────────────────────
    for name, config in SECRET_PATTERNS.items():
        for line_no, line in enumerate(lines, start=1):
            line_idx = line_no - 1
            for match in re.finditer(config["pattern"], line, re.IGNORECASE):
                col = match.start()

                # Context analysis: skip false positives
                ctx = classify_match_context(lines, line_idx, col, file_path, ctx_language)
                if ctx["is_false_positive"]:
                    continue

                col_display = col + 1
                location = {
                    "line": line_no,
                    "column": col_display,
                    "snippet": get_snippet(lines, line_no),
                    "context": extract_code_context(lines, line_no),
                }
                if name not in findings_map:
                    findings_map[name] = {
                        "type": name,
                        "severity": config["severity"],
                        "matches_found": 0,
                        "line": line_no,
                        "column": col_display,
                        "language": language,
                        "locations": [],
                    }
                findings_map[name]["matches_found"] += 1
                findings_map[name]["locations"].append(location)

    # ── Code Patterns (language-restricted) ─────────────────────────────────
    for name, config in CODE_PATTERNS.items():
        if "languages" in config and ext is not None and ext not in config["languages"]:
            continue
        for line_no, line in enumerate(lines, start=1):
            line_idx = line_no - 1
            for match in re.finditer(config["pattern"], line, re.IGNORECASE):
                col = match.start()

                # Context analysis: skip false positives
                ctx = classify_match_context(lines, line_idx, col, file_path, ctx_language)
                if ctx["is_false_positive"]:
                    continue

                col_display = col + 1
                location = {
                    "line": line_no,
                    "column": col_display,
                    "snippet": get_snippet(lines, line_no),
                    "context": extract_code_context(lines, line_no),
                }
                if name not in findings_map:
                    findings_map[name] = {
                        "type": name,
                        "severity": config["severity"],
                        "matches_found": 0,
                        "line": line_no,
                        "column": col_display,
                        "language": language,
                        "locations": [],
                    }
                findings_map[name]["matches_found"] += 1
                findings_map[name]["locations"].append(location)

    return list(findings_map.values())
