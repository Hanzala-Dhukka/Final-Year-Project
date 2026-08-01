"""
CyberShield SAST Java Rules

Java-specific security rules (CS300–CS399).
"""

import re

JAVA_RULES = [
    # ── CS301: Runtime.exec() ─────────────────────────────────────────────
    {
        "id": "CS301",
        "name": "Runtime.exec() Command Injection",
        "severity": "Critical",
        "owasp": "A03:2021",
        "cwe": "CWE-78",
        "cvss": 9.8,
        "confidence": 95,
        "description": "System command executed via Runtime.exec() or ProcessBuilder with user-controlled input",
        "pattern": r"Runtime\.getRuntime\(\)\.exec\(|ProcessBuilder\(",
        "languages": [".java"],
        "multi_line": False,
    },

    # ── CS302: SQL Injection Java ─────────────────────────────────────────
    {
        "id": "CS302",
        "name": "SQL Injection (Java)",
        "severity": "Critical",
        "owasp": "A03:2021",
        "cwe": "CWE-89",
        "cvss": 9.8,
        "confidence": 94,
        "description": "SQL query constructed via string concatenation with Statement methods",
        "pattern": r"Statement\.executeQuery\(.*\+|Statement\.execute\(.*\+|createStatement\(\)",
        "languages": [".java"],
        "multi_line": False,
    },

    # ── CS303: Deserialization Java ────────────────────────────────────────
    {
        "id": "CS303",
        "name": "Deserialization Vulnerability (Java)",
        "severity": "Critical",
        "owasp": "A08:2021",
        "cwe": "CWE-502",
        "cvss": 9.5,
        "confidence": 93,
        "description": "Java deserialization via ObjectInputStream allows arbitrary object graph reconstruction",
        "pattern": r"ObjectInputStream\(\)|readObject\(\)",
        "languages": [".java"],
        "multi_line": False,
    },

    # ── CS304: XSS Java ──────────────────────────────────────────────────
    {
        "id": "CS304",
        "name": "XSS Vulnerability (Java)",
        "severity": "High",
        "owasp": "A03:2021",
        "cwe": "CWE-79",
        "cvss": 7.5,
        "confidence": 88,
        "description": "User-controlled input from request parameters or headers reflected without sanitization",
        "pattern": r"getParameter\(|getHeader\(",
        "languages": [".java"],
        "multi_line": False,
    },

    # ── CS305: Hardcoded Password Java ────────────────────────────────────
    {
        "id": "CS305",
        "name": "Hardcoded Password (Java)",
        "severity": "High",
        "owasp": "A07:2021",
        "cwe": "CWE-798",
        "cvss": 8.5,
        "confidence": 90,
        "description": "Hardcoded password string detected in Java source code",
        "pattern": r'password\s*=\s*"[^"]+"|Password\s*=\s*"[^"]+"',
        "languages": [".java"],
        "multi_line": False,
    },

    # ── CS306: Weak Hash Java ────────────────────────────────────────────
    {
        "id": "CS306",
        "name": "Weak Hash Algorithm (Java)",
        "severity": "Medium",
        "owasp": "A02:2021",
        "cwe": "CWE-327",
        "cvss": 6.5,
        "confidence": 92,
        "description": "Use of weak or deprecated hash algorithm (MD5, SHA-1) in MessageDigest",
        "pattern": r'MessageDigest\.getInstance\("MD5"\)|MessageDigest\.getInstance\("SHA-1"\)',
        "languages": [".java"],
        "multi_line": False,
    },

    # ── CS307: Path Traversal Java ────────────────────────────────────────
    {
        "id": "CS307",
        "name": "Path Traversal (Java)",
        "severity": "High",
        "owasp": "A01:2021",
        "cwe": "CWE-22",
        "cvss": 7.5,
        "confidence": 85,
        "description": "File access via user-controlled request parameters enables directory traversal",
        "pattern": r"new File\(.*request|FileInputStream\(.*request|Files\.readAllBytes\(.*request",
        "languages": [".java"],
        "multi_line": False,
    },

    # ── CS308: LDAP Injection ─────────────────────────────────────────────
    {
        "id": "CS308",
        "name": "LDAP Injection",
        "severity": "High",
        "owasp": "A03:2021",
        "cwe": "CWE-90",
        "cvss": 7.5,
        "confidence": 82,
        "description": "LDAP query constructed via string concatenation with user-controlled input",
        "pattern": r"DirContext\.search\(.*\+|ldap\.search\(.*\+",
        "languages": [".java"],
        "multi_line": False,
    },
]
