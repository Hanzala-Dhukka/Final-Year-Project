"""
Module E2 — File Scanner
Line-by-line scanner that enriches every finding location with:
  - line number
  - column number
  - snippet (the single vulnerable line, stripped)
  - context (surrounding lines with is_vulnerable flag)
  - language
"""
import re
from app.scanner.code_extractor import extract_code_context, get_snippet
from app.scanner.language_detector import detect_language
from app.services.github_scanner import SECRET_PATTERNS, CODE_PATTERNS, _ext


def scan_content_with_snippets(content: str, file_path: str) -> list[dict]:
    """
    Scan file content string line-by-line for all security rules.
    Returns a list of findings, each with full location + code context.

    Args:
        content:   Raw file text downloaded from GitHub.
        file_path: The repo-relative path (e.g. 'app/routes/server.js').

    Returns:
        List of enriched findings.
    """
    lines = content.splitlines()
    ext = _ext(file_path)
    language = detect_language(file_path)
    findings_map: dict[str, dict] = {}

    # ── Secret Patterns ─────────────────────────────────────────────────────
    for name, config in SECRET_PATTERNS.items():
        for line_no, line in enumerate(lines, start=1):
            for match in re.finditer(config["pattern"], line, re.IGNORECASE):
                col = match.start() + 1
                location = {
                    "line": line_no,
                    "column": col,
                    "snippet": get_snippet(lines, line_no),
                    "context": extract_code_context(lines, line_no),
                }
                if name not in findings_map:
                    findings_map[name] = {
                        "type": name,
                        "severity": config["severity"],
                        "matches_found": 0,
                        "line": line_no,
                        "column": col,
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
            for match in re.finditer(config["pattern"], line, re.IGNORECASE):
                col = match.start() + 1
                location = {
                    "line": line_no,
                    "column": col,
                    "snippet": get_snippet(lines, line_no),
                    "context": extract_code_context(lines, line_no),
                }
                if name not in findings_map:
                    findings_map[name] = {
                        "type": name,
                        "severity": config["severity"],
                        "matches_found": 0,
                        "line": line_no,
                        "column": col,
                        "language": language,
                        "locations": [],
                    }
                findings_map[name]["matches_found"] += 1
                findings_map[name]["locations"].append(location)

    return list(findings_map.values())
