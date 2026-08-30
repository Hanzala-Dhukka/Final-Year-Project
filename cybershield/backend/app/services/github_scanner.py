"""
GitHub Scanner — Secret & Code Pattern Detection

Scans file content for hardcoded secrets and dangerous code patterns.
Uses context analysis to avoid false positives in:
  - String literals (educational data, examples)
  - Comments
  - Regex pattern definitions
  - Documentation files
"""

import re
from app.scanner.context_analyzer import (
    classify_match_context,
    is_excluded_file,
    detect_language_from_path,
)

# ── Secret Patterns ────────────────────────────────────────────────────
# These patterns detect hardcoded credentials and secrets.
# Context analysis will filter matches inside strings/comments.

SECRET_PATTERNS = {
    "AWS Access Key": {
        "pattern": r"AKIA[0-9A-Z]{16}",
        "severity": "Critical",
    },
    "Google API Key": {
        "pattern": r"AIza[0-9A-Za-z\-_]{35}",
        "severity": "Critical",
    },
    "MongoDB URI": {
        "pattern": r"mongodb\+srv://[^:\s]+:[^@\s]+@",
        "severity": "Critical",
    },
    "Private Key Block": {
        "pattern": r"-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----",
        "severity": "Critical",
    },
    "GitHub Personal Access Token": {
        "pattern": r"ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82}",
        "severity": "Critical",
    },
    "Hardcoded Password": {
        "pattern": r'''(?:password|passwd|pwd)\s*=\s*['"][^'"]{8,}['"]''',
        "severity": "High",
    },
    "Hardcoded API Key Assignment": {
        "pattern": r'''(?:api[_-]?key|secret[_-]?key|apikey|client[_-]?secret|access[_-]?key)\s*=\s*['"][A-Za-z0-9_\-]{16,}['"]''',
        "severity": "High",
    },
    "JWT Secret Assignment": {
        "pattern": r'''(?:JWT_SECRET|jwt_secret|SECRET_KEY)\s*=\s*['"][^'"]+['"]''',
        "severity": "High",
    },
    "Bearer Token Hardcoded": {
        "pattern": r'''(?:Authorization|auth|token)\s*[:=]\s*['"]Bearer\s+[A-Za-z0-9_\-\.]+['"]''',
        "severity": "High",
    },
    "Hardcoded Token Assignment": {
        "pattern": r'''(?:TOKEN|token)\s*=\s*['"][A-Za-z0-9_\-]{20,}['"]''',
        "severity": "Medium",
    },
}

# ── Code Patterns ──────────────────────────────────────────────────────
# These patterns detect dangerous code usage.
# Only matched against actual code files (not data/docs).

CODE_PATTERNS = {
    "Python eval()": {
        "pattern": r"\beval\s*\(",
        "severity": "Critical",
        "languages": ["py", "pyw"],
    },
    "Python exec()": {
        "pattern": r"\bexec\s*\(",
        "severity": "Critical",
        "languages": ["py", "pyw"],
    },
    "JavaScript eval()": {
        "pattern": r"\beval\s*\(",
        "severity": "Critical",
        "languages": ["js", "jsx", "ts", "tsx", "mjs", "cjs", "vue"],
    },
    "Shell Execution": {
        "pattern": r"\bos\.system\s*\(",
        "severity": "Critical",
        "languages": ["py", "pyw"],
    },
    "Subprocess Shell": {
        "pattern": r"\bsubprocess\.\w+\(.*shell\s*=\s*True",
        "severity": "High",
        "languages": ["py", "pyw"],
    },
    "Node.js Command Injection": {
        "pattern": r"\bchild_process\.exec\s*\(",
        "severity": "Critical",
        "languages": ["js", "jsx", "ts", "tsx", "mjs", "cjs"],
    },
}

LANG_BY_EXT = {
    "py": "python", "pyw": "python",
    "js": "javascript", "jsx": "javascript", "ts": "javascript",
    "tsx": "javascript", "mjs": "javascript", "cjs": "javascript",
    "vue": "javascript",
    "java": "java",
}


def _ext(file_path):
    if not file_path:
        return None
    if "." not in file_path:
        return None
    return file_path.rsplit(".", 1)[-1].lower()


TECH_FILES = {
    "package.json": "Node.js",
    "requirements.txt": "Python",
    "pom.xml": "Java",
    "composer.json": "PHP",
    "go.mod": "Go",
    "Cargo.toml": "Rust",
}


def detect_technology(file_name):
    return TECH_FILES.get(file_name)


def scan_file_content(content, file_path=""):
    """
    Scan file content for hardcoded secrets.
    Uses context analysis to skip false positives.
    """
    # Skip excluded files entirely
    if is_excluded_file(file_path):
        return []

    findings_map = {}
    lines = content.splitlines()
    language = detect_language_from_path(file_path)

    for line_no, line in enumerate(lines, start=1):
        line_idx = line_no - 1
        for name, config in SECRET_PATTERNS.items():
            pattern = config["pattern"]
            for match in re.finditer(pattern, line, re.IGNORECASE):
                col = match.start()

                # Context analysis: skip matches in strings, comments, regex patterns
                ctx = classify_match_context(lines, line_idx, col, file_path, language)
                if ctx["is_false_positive"]:
                    continue

                col_display = col + 1
                if name not in findings_map:
                    findings_map[name] = {
                        "type": name,
                        "severity": config["severity"],
                        "matches_found": 0,
                        "locations": [],
                        "line": line_no,
                        "column": col_display,
                    }
                findings_map[name]["matches_found"] += 1
                findings_map[name]["locations"].append({
                    "line": line_no,
                    "column": col_display,
                })

    return list(findings_map.values())


def scan_dangerous_code(content, file_path=None):
    """
    Scan file content for dangerous code patterns.
    Uses context analysis to skip false positives.
    """
    # Skip excluded files entirely
    if is_excluded_file(file_path):
        return []

    findings_map = {}
    ext = _ext(file_path)
    lines = content.splitlines()
    language = detect_language_from_path(file_path)

    for line_no, line in enumerate(lines, start=1):
        line_idx = line_no - 1
        for name, config in CODE_PATTERNS.items():
            if "languages" in config and ext is not None and ext not in config["languages"]:
                continue

            pattern = config["pattern"]
            for match in re.finditer(pattern, line, re.IGNORECASE):
                col = match.start()

                # Context analysis: skip matches in strings, comments, regex patterns
                ctx = classify_match_context(lines, line_idx, col, file_path, language)
                if ctx["is_false_positive"]:
                    continue

                col_display = col + 1
                if name not in findings_map:
                    findings_map[name] = {
                        "type": name,
                        "severity": config["severity"],
                        "matches_found": 0,
                        "locations": [],
                        "line": line_no,
                        "column": col_display,
                    }
                findings_map[name]["matches_found"] += 1
                findings_map[name]["locations"].append({
                    "line": line_no,
                    "column": col_display,
                })

    return list(findings_map.values())
