"""
CyberShield SAST Common Rules

Cross-language security rules (CS001–CS099) applicable to any file type.
"""

import re

COMMON_RULES = [
    # ── CS001: Hardcoded Secret / API Key ──────────────────────────────────
    {
        "id": "CS001",
        "name": "Hardcoded Secret",
        "severity": "Critical",
        "owasp": "A07:2021",
        "cwe": "CWE-798",
        "cvss": 9.8,
        "confidence": 99,
        "description": "Hardcoded API key or secret detected in source code",
        "pattern": r"(?:API_KEY|SECRET_KEY|AWS_SECRET|GITHUB_TOKEN|PRIVATE_KEY)\s*[=:]\s*['\"]",
        "alt_patterns": [
            r"TOKEN\s*=\s*['\"]",
            r"PASSWORD\s*=\s*['\"][^'\"]+['\"]",
            r"api[_-]?key\s*=\s*['\"]",
            r"secret\s*=\s*['\"]",
        ],
        "languages": ["*"],
        "multi_line": False,
    },

    # ── CS002: Hardcoded Password ──────────────────────────────────────────
    {
        "id": "CS002",
        "name": "Hardcoded Password",
        "severity": "Critical",
        "owasp": "A07:2021",
        "cwe": "CWE-798",
        "cvss": 9.1,
        "confidence": 95,
        "description": "Hardcoded password detected in source code",
        "pattern": r"password\s*=\s*['\"][^'\"]+['\"]",
        "alt_patterns": [
            r"passwd\s*=",
            r"pwd\s*=\s*['\"]",
            r"db_password",
            r"database_password",
        ],
        "languages": ["*"],
        "multi_line": False,
    },

    # ── CS003: SQL Injection ───────────────────────────────────────────────
    {
        "id": "CS003",
        "name": "SQL Injection",
        "severity": "Critical",
        "owasp": "A03:2021",
        "cwe": "CWE-89",
        "cvss": 9.8,
        "confidence": 96,
        "description": "Potential SQL injection via string concatenation or f-string formatting",
        "pattern": r"SELECT.*\+.*\+",
        "alt_patterns": [
            r"INSERT.*\+.*\+",
            r"UPDATE.*\+.*\+",
            r"DELETE.*\+.*\+",
            r"execute\(.*\+",
            r"\.format\(.*SELECT",
            r'f".*SELECT',
            r'f".*INSERT',
            r'f".*UPDATE',
            r'f".*DELETE',
        ],
        "languages": ["*"],
        "multi_line": False,
    },

    # ── CS004: Command Injection ───────────────────────────────────────────
    {
        "id": "CS004",
        "name": "Command Injection",
        "severity": "Critical",
        "owasp": "A03:2021",
        "cwe": "CWE-78",
        "cvss": 9.8,
        "confidence": 95,
        "description": "System command executed with user-controlled input",
        "pattern": r"os\.system\(",
        "alt_patterns": [
            r"os\.popen\(",
            r"subprocess\.call\(.*shell\s*=\s*True",
            r"subprocess\.Popen\(.*shell\s*=\s*True",
            r"exec\(",
            r"child_process\.exec\(",
            r"Runtime\.getRuntime\(\)\.exec\(",
        ],
        "languages": ["*"],
        "multi_line": False,
    },

    # ── CS005: XSS Vulnerability ──────────────────────────────────────────
    {
        "id": "CS005",
        "name": "XSS Vulnerability",
        "severity": "High",
        "owasp": "A03:2021",
        "cwe": "CWE-79",
        "cvss": 7.5,
        "confidence": 88,
        "description": "Potential cross-site scripting via unescaped HTML rendering",
        "pattern": r"innerHTML\s*=",
        "alt_patterns": [
            r"document\.write\(",
            r"dangerouslySetInnerHTML",
            r"v-html\s*=",
            r"\{\{.*\|.*safe",
            r"render_template_string",
            r"mark_safe\(",
        ],
        "languages": ["*"],
        "multi_line": False,
    },

    # ── CS006: Insecure Deserialization ────────────────────────────────────
    {
        "id": "CS006",
        "name": "Insecure Deserialization",
        "severity": "High",
        "owasp": "A08:2021",
        "cwe": "CWE-502",
        "cvss": 8.8,
        "confidence": 90,
        "description": "Insecure deserialization of untrusted data detected",
        "pattern": r"pickle\.loads?\(",
        "alt_patterns": [
            r"yaml\.load\(",
            r"unserialize\(",
            r"ObjectInputStream\(\)",
            r"JSON\.parse\(.*req",
        ],
        "languages": ["*"],
        "multi_line": False,
    },

    # ── CS007: Path Traversal ─────────────────────────────────────────────
    {
        "id": "CS007",
        "name": "Path Traversal",
        "severity": "High",
        "owasp": "A01:2021",
        "cwe": "CWE-22",
        "cvss": 7.5,
        "confidence": 85,
        "description": "Potential path traversal via user-controlled file path",
        "pattern": r"open\(.*\+",
        "alt_patterns": [
            r"os\.path\.join\(.*request",
            r"send_file\(.*request",
            r"readFile\(.*\+",
        ],
        "languages": ["*"],
        "multi_line": False,
    },

    # ── CS008: Weak Cryptography ──────────────────────────────────────────
    {
        "id": "CS008",
        "name": "Weak Cryptography",
        "severity": "Medium",
        "owasp": "A02:2021",
        "cwe": "CWE-327",
        "cvss": 6.5,
        "confidence": 92,
        "description": "Use of weak or deprecated cryptographic algorithm",
        "pattern": r"md5\(",
        "alt_patterns": [
            r"sha1\(",
            r"DES\(",
            r"RC4\(",
            r"ECB\(",
            r"hashlib\.md5",
            r"hashlib\.sha1",
        ],
        "languages": ["*"],
        "multi_line": False,
    },

    # ── CS009: Open Redirect ──────────────────────────────────────────────
    {
        "id": "CS009",
        "name": "Open Redirect",
        "severity": "Medium",
        "owasp": "A01:2021",
        "cwe": "CWE-601",
        "cvss": 6.1,
        "confidence": 82,
        "description": "Potential open redirect via user-controlled URL parameter",
        "pattern": r"redirect\(.*request",
        "alt_patterns": [
            r"window\.location\s*=.*\+",
            r"window\.location\.href\s*=.*\+",
            r"Response\(.*location.*request",
        ],
        "languages": ["*"],
        "multi_line": False,
    },

    # ── CS010: Debug Mode Enabled ─────────────────────────────────────────
    {
        "id": "CS010",
        "name": "Debug Mode Enabled",
        "severity": "Medium",
        "owasp": "A05:2021",
        "cwe": "CWE-489",
        "cvss": 5.3,
        "confidence": 98,
        "description": "Application debug mode is enabled in configuration",
        "pattern": r"DEBUG\s*=\s*True",
        "alt_patterns": [
            r"debug\s*:\s*true",
            r"app\.run\(.*debug\s*=\s*True",
        ],
        "languages": ["*"],
        "multi_line": False,
    },
]
