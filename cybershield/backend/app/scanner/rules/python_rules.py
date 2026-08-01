"""
CyberShield SAST Python Rules

Python-specific security rules (CS100–CS199).
"""

import re

PYTHON_RULES = [
    # ── CS101: Python eval() ──────────────────────────────────────────────
    {
        "id": "CS101",
        "name": "Python eval() Usage",
        "severity": "Critical",
        "owasp": "A03:2021",
        "cwe": "CWE-95",
        "cvss": 9.8,
        "confidence": 97,
        "description": "Use of eval() on potentially untrusted input allows arbitrary code execution",
        "pattern": r"eval\s*\(",
        "languages": [".py"],
        "multi_line": False,
    },

    # ── CS102: Python exec() ─────────────────────────────────────────────
    {
        "id": "CS102",
        "name": "Python exec() Usage",
        "severity": "Critical",
        "owasp": "A03:2021",
        "cwe": "CWE-95",
        "cvss": 9.8,
        "confidence": 97,
        "description": "Use of exec() on potentially untrusted input allows arbitrary code execution",
        "pattern": r"exec\s*\(",
        "languages": [".py"],
        "multi_line": False,
    },

    # ── CS103: Django Debug Mode ──────────────────────────────────────────
    {
        "id": "CS103",
        "name": "Django Debug Mode",
        "severity": "Medium",
        "owasp": "A05:2021",
        "cwe": "CWE-489",
        "cvss": 5.3,
        "confidence": 98,
        "description": "Django DEBUG mode is enabled, exposing detailed error pages in production",
        "pattern": r"DEBUG\s*=\s*True",
        "languages": [".py"],
        "multi_line": False,
    },

    # ── CS104: Django CSRF Exempt ─────────────────────────────────────────
    {
        "id": "CS104",
        "name": "Django CSRF Exempt",
        "severity": "Medium",
        "owasp": "A01:2021",
        "cwe": "CWE-352",
        "cvss": 6.5,
        "confidence": 95,
        "description": "Django view is exempted from CSRF protection, making it vulnerable to cross-site request forgery",
        "pattern": r"@csrf_exempt",
        "languages": [".py"],
        "multi_line": False,
    },

    # ── CS105: Flask Debug Mode ───────────────────────────────────────────
    {
        "id": "CS105",
        "name": "Flask Debug Mode",
        "severity": "Medium",
        "owasp": "A05:2021",
        "cwe": "CWE-489",
        "cvss": 5.3,
        "confidence": 98,
        "description": "Flask application is running with debug mode enabled",
        "pattern": r"app\.run\(.*debug\s*=\s*True|app\.config\[.*DEBUG.*\]\s*=\s*True",
        "languages": [".py"],
        "multi_line": False,
    },

    # ── CS106: SQL Injection via f-string ─────────────────────────────────
    {
        "id": "CS106",
        "name": "SQL Injection via f-string",
        "severity": "Critical",
        "owasp": "A03:2021",
        "cwe": "CWE-89",
        "cvss": 9.8,
        "confidence": 94,
        "description": "SQL query constructed using f-string interpolation, enabling SQL injection attacks",
        "pattern": r'f["\'].*SELECT|f["\'].*INSERT|f["\'].*UPDATE|f["\'].*DELETE|execute\(f["\']',
        "languages": [".py"],
        "multi_line": False,
    },

    # ── CS107: Pickle Deserialization ─────────────────────────────────────
    {
        "id": "CS107",
        "name": "Pickle Deserialization",
        "severity": "High",
        "owasp": "A08:2021",
        "cwe": "CWE-502",
        "cvss": 8.8,
        "confidence": 93,
        "description": "Deserialization of pickle data can execute arbitrary code when processing untrusted input",
        "pattern": r"pickle\.loads?\(|cloudpickle\.loads?\(",
        "languages": [".py"],
        "multi_line": False,
    },

    # ── CS108: PyYAML Unsafe Load ─────────────────────────────────────────
    {
        "id": "CS108",
        "name": "PyYAML Unsafe Load",
        "severity": "High",
        "owasp": "A08:2021",
        "cwe": "CWE-502",
        "cvss": 8.0,
        "confidence": 92,
        "description": "yaml.load() without SafeLoader allows arbitrary Python object deserialization",
        "pattern": r"yaml\.load\((?!.*Loader\s*=\s*yaml\.SafeLoader)",
        "languages": [".py"],
        "multi_line": False,
    },

    # ── CS109: Hardcoded JWT Secret ───────────────────────────────────────
    {
        "id": "CS109",
        "name": "Hardcoded JWT Secret",
        "severity": "Critical",
        "owasp": "A07:2021",
        "cwe": "CWE-798",
        "cvss": 9.1,
        "confidence": 96,
        "description": "Hardcoded JWT secret key detected, allowing token forgery",
        "pattern": r"JWT_SECRET\s*=|jwt_secret\s*=|SECRET_KEY\s*=.*jwt",
        "languages": [".py"],
        "multi_line": False,
    },

    # ── CS110: Insecure Temporary File ────────────────────────────────────
    {
        "id": "CS110",
        "name": "Insecure Temporary File",
        "severity": "Medium",
        "owasp": "A04:2021",
        "cwe": "CWE-377",
        "cvss": 5.3,
        "confidence": 85,
        "description": "Use of insecure temporary file creation that may lead to symlink attacks or race conditions",
        "pattern": r'tempfile\.mktemp\(|tmp\s*=\s*"/tmp/',
        "languages": [".py"],
        "multi_line": False,
    },

    # ── CS111: Request Without Timeout ────────────────────────────────────
    {
        "id": "CS111",
        "name": "Request Without Timeout",
        "severity": "Low",
        "owasp": "A05:2021",
        "cwe": "CWE-400",
        "cvss": 3.7,
        "confidence": 75,
        "description": "HTTP request made without a timeout parameter, potentially causing indefinite blocking",
        "pattern": r"requests\.(get|post|put|delete)\((?!.*timeout)",
        "languages": [".py"],
        "multi_line": False,
    },

    # ── CS112: Blind SQL Injection ────────────────────────────────────────
    {
        "id": "CS112",
        "name": "Blind SQL Injection",
        "severity": "Critical",
        "owasp": "A03:2021",
        "cwe": "CWE-89",
        "cvss": 9.8,
        "confidence": 90,
        "description": "SQL query constructed via string concatenation with cursor.execute() or Django ORM raw()",
        "pattern": r"cursor\.execute\(.*\+|\.raw\(.*\%s",
        "languages": [".py"],
        "multi_line": False,
    },
]
