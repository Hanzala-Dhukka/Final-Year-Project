"""
Context Analyzer — False Positive Detection

Determines whether a regex match at a given position in source code
is inside a string literal, comment, regex pattern, or other non-executable
context. This prevents the scanner from flagging:
  - Pattern matches inside string literals (educational data, examples)
  - Matches inside comments
  - Matches inside regex pattern definitions (the scanner's own rules)
  - Matches in documentation/markdown files
"""

import re
from typing import Optional


# ── File-level exclusions ──────────────────────────────────────────────
# Files that are documentation, educational data, or the scanner's own
# rule definitions should not produce findings.
SCANNER_OWN_PATHS = (
    "app/scanner/rules/",
    "app/scanner/security_rules.py",
    "app/services/github_scanner.py",
)

EDUCATIONAL_DATA_PATHS = (
    "app/data/defense_scenarios.py",
    "app/data/attack_labs.py",
    "app/data/glossary.py",
    "app/data/risky_packages.py",
    "app/data/daily_templates.py",
    "app/data/cwe_mapping.py",
    "app/data/nist_mapping.py",
    "app/data/mitre_mapping.py",
    "app/data/owasp_mapping.py",
)

TEST_FILE_PATTERNS = (
    "test_",
    "_test.py",
    "tests/",
    "test/",
    "conftest.py",
)

DOC_EXTENSIONS = {".md", ".txt", ".rst", ".doc", ".pdf"}


def is_excluded_file(file_path: str) -> bool:
    """
    Check if a file should be entirely excluded from scanning.
    Returns True for scanner own files, educational data, and docs.
    """
    if not file_path:
        return False

    normalized = file_path.replace("\\", "/")

    # Skip scanner's own rule definitions (they contain the patterns we detect)
    for prefix in SCANNER_OWN_PATHS:
        if prefix in normalized:
            return True

    # Skip educational/training data files
    for prefix in EDUCATIONAL_DATA_PATHS:
        if prefix in normalized:
            return True

    # Skip documentation files
    for ext in DOC_EXTENSIONS:
        if normalized.endswith(ext):
            return True

    return False


def is_test_file(file_path: str) -> bool:
    """Check if a file is a test file (findings get reduced confidence)."""
    if not file_path:
        return False
    normalized = file_path.replace("\\", "/").lower()
    for pattern in TEST_FILE_PATTERNS:
        if pattern in normalized:
            return True
    return False


# ── Line-level context detection ───────────────────────────────────────

# Compiled patterns for common comment/string starters
_COMMENT_PATTERNS = {
    "python": re.compile(r"^\s*(?:#.*)$"),
    "javascript": re.compile(r"^\s*(?://.*|/\*.*\*/\s*$)"),
    "java": re.compile(r"^\s*(?://.*|/\*.*\*/\s*$)"),
    "bash": re.compile(r"^\s*(?:#.*)$"),
}


def _find_string_ranges(line: str) -> list:
    """
    Find all string literal ranges in a line.
    Returns list of (start, end) tuples (0-based, end exclusive).
    Handles single, double, and triple-quoted strings.
    """
    ranges = []
    i = 0
    n = len(line)
    while i < n:
        # Triple-quoted strings
        if i + 2 < n and line[i:i+3] in ('"""', "'''"):
            quote = line[i:i+3]
            end = line.find(quote, i + 3)
            if end != -1:
                ranges.append((i, end + 3))
                i = end + 3
                continue
        # Double-quoted strings
        if line[i] == '"':
            j = i + 1
            while j < n:
                if line[j] == '\\':
                    j += 2
                    continue
                if line[j] == '"':
                    ranges.append((i, j + 1))
                    i = j + 1
                    break
                j += 1
            else:
                # Unterminated string - treat rest of line as string
                ranges.append((i, n))
                i = n
            continue
        # Single-quoted strings
        if line[i] == "'":
            j = i + 1
            while j < n:
                if line[j] == '\\':
                    j += 2
                    continue
                if line[j] == "'":
                    ranges.append((i, j + 1))
                    i = j + 1
                    break
                j += 1
            else:
                ranges.append((i, n))
                i = n
            continue
        i += 1
    return ranges


def _is_in_string(line: str, col: int) -> bool:
    """
    Check if a column position (0-based) falls inside a string literal.
    Uses string range detection instead of stripping.
    """
    if col < 0 or col >= len(line):
        return False
    ranges = _find_string_ranges(line)
    for start, end in ranges:
        if start <= col < end:
            return True
    return False

    stripped = _strip_strings_from_line(line)
    if col < len(stripped):
        return stripped[col] == '"'
    return False


def _is_comment_line(line: str, language: str = "python") -> bool:
    """Check if the entire line is a comment."""
    pattern = _COMMENT_PATTERNS.get(language)
    if pattern:
        return bool(pattern.match(line))
    # Fallback: check common comment starters
    stripped = line.strip()
    return stripped.startswith("#") or stripped.startswith("//") or stripped.startswith("/*")


def _is_in_block_comment(lines: list, line_idx: int) -> bool:
    """
    Check if a line index is inside a block comment (/* ... */).
    Simple state-tracking approach.
    """
    in_comment = False
    for i in range(line_idx + 1):
        line = lines[i]
        if not in_comment:
            if "/*" in line and "*/" not in line[line.index("/*") + 2:]:
                in_comment = True
        else:
            if "*/" in line:
                in_comment = False
            else:
                if i == line_idx:
                    return True
    return False


def is_in_string_context(line: str, col: int = 0) -> bool:
    """
    Check if a match at the given column is inside a string literal.
    Works for Python, JavaScript, and Java.
    """
    return _is_in_string(line, col)


def is_in_comment_context(line: str, language: str = "python") -> bool:
    """Check if the line is a comment."""
    return _is_comment_line(line, language)


def is_in_regex_pattern(line: str, col: int = 0) -> bool:
    """
    Check if a match is inside a regex pattern definition.
    E.g., pattern=r"eval\\s*\\(" or pattern="eval\\s*\\("
    """
    # Look for pattern= or pattern": " in the line before the match
    before_match = line[:col] if col <= len(line) else line

    # Check if this line defines a regex pattern
    if re.search(r'''pattern\s*[=:]\s*[rR]?['"]''', before_match):
        return True
    if re.search(r'''"pattern"\s*:\s*[rR]?['"]''', before_match):
        return True
    return False


def classify_match_context(
    lines: list,
    line_idx: int,
    col: int,
    file_path: str = "",
    language: str = "python",
) -> dict:
    """
    Classify the context of a regex match at a specific position.

    Returns:
        {
            "is_false_positive": bool,
            "reason": str,  # "string", "comment", "regex_pattern", "block_comment", "none"
            "confidence_penalty": int,  # 0-40 points to subtract from confidence
        }
    """
    line = lines[line_idx] if line_idx < len(lines) else ""

    # Check comment context first (unconditionally false positive)
    if is_in_comment_context(line, language):
        return {
            "is_false_positive": True,
            "reason": "comment",
            "confidence_penalty": 35,
        }

    # Check block comment (/* ... */)
    if language in ("javascript", "java"):
        if _is_in_block_comment(lines, line_idx):
            return {
                "is_false_positive": True,
                "reason": "block_comment",
                "confidence_penalty": 35,
            }

    # Check regex pattern definition
    if is_in_regex_pattern(line, col):
        return {
            "is_false_positive": True,
            "reason": "regex_pattern",
            "confidence_penalty": 40,
        }

    # Check string context — but only if it's NOT a variable assignment
    # Real secrets: AWS_KEY = "AKIA..." (has assignment before string)
    # False positives: "os.system(...)" (standalone string in data)
    if _is_in_string(line, col):
        # Check if the string is preceded by a variable assignment
        before_string = line[:col]
        # If there's an assignment operator before the string (with optional quote), it's a real secret
        # Patterns: VAR = "...", VAR: "...", "key": "..."
        if re.search(r'[=:]\s*["\']?\s*$', before_string):
            return {
                "is_false_positive": False,
                "reason": "none",
                "confidence_penalty": 0,
            }
        # Otherwise, it's likely educational data or a standalone string
        return {
            "is_false_positive": True,
            "reason": "string",
            "confidence_penalty": 40,
        }

    return {
        "is_false_positive": False,
        "reason": "none",
        "confidence_penalty": 0,
    }


def detect_language_from_path(file_path: str) -> str:
    """Detect language from file extension for comment detection."""
    if not file_path:
        return "python"
    ext = file_path.rsplit(".", 1)[-1].lower() if "." in file_path else ""
    lang_map = {
        "py": "python", "pyw": "python",
        "js": "javascript", "jsx": "javascript", "ts": "javascript", "tsx": "javascript",
        "java": "java",
        "go": "go", "rb": "ruby", "rs": "rust",
        "sh": "bash", "bash": "bash", "zsh": "bash",
    }
    return lang_map.get(ext, "python")
