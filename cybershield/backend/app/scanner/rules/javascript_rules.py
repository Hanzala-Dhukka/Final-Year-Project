"""
CyberShield SAST JavaScript / TypeScript Rules

JavaScript and TypeScript specific security rules (CS200–CS299).
"""

import re

JAVASCRIPT_RULES = [
    # ── CS201: eval() Usage ───────────────────────────────────────────────
    {
        "id": "CS201",
        "name": "eval() Usage",
        "severity": "Critical",
        "owasp": "A03:2021",
        "cwe": "CWE-95",
        "cvss": 9.8,
        "confidence": 97,
        "description": "Use of eval() on potentially untrusted input allows arbitrary code execution",
        "pattern": r"eval\s*\(",
        "languages": [".js", ".jsx", ".ts", ".tsx"],
        "multi_line": False,
    },

    # ── CS202: innerHTML XSS ──────────────────────────────────────────────
    {
        "id": "CS202",
        "name": "innerHTML XSS",
        "severity": "High",
        "owasp": "A03:2021",
        "cwe": "CWE-79",
        "cvss": 7.5,
        "confidence": 92,
        "description": "Direct assignment to innerHTML can inject malicious HTML/scripts into the DOM",
        "pattern": r"\.innerHTML\s*=",
        "languages": [".js", ".jsx", ".ts", ".tsx"],
        "multi_line": False,
    },

    # ── CS203: dangerouslySetInnerHTML ─────────────────────────────────────
    {
        "id": "CS203",
        "name": "Dangerous dangerouslySetInnerHTML",
        "severity": "High",
        "owasp": "A03:2021",
        "cwe": "CWE-79",
        "cvss": 7.5,
        "confidence": 90,
        "description": "React dangerouslySetInnerHTML bypasses XSS protections when fed untrusted data",
        "pattern": r"dangerouslySetInnerHTML",
        "languages": [".jsx", ".tsx"],
        "multi_line": False,
    },

    # ── CS204: Document Write ─────────────────────────────────────────────
    {
        "id": "CS204",
        "name": "Document Write",
        "severity": "Medium",
        "owasp": "A03:2021",
        "cwe": "CWE-79",
        "cvss": 6.1,
        "confidence": 88,
        "description": "document.write() can inject unescaped HTML content into the page",
        "pattern": r"document\.write\(",
        "languages": [".js", ".jsx", ".ts", ".tsx"],
        "multi_line": False,
    },

    # ── CS205: Regex DoS ──────────────────────────────────────────────────
    {
        "id": "CS205",
        "name": "Regex DoS (ReDoS)",
        "severity": "High",
        "owasp": "A06:2021",
        "cwe": "CWE-1333",
        "cvss": 7.5,
        "confidence": 78,
        "description": "Dynamically constructed regular expression may be vulnerable to catastrophic backtracking",
        "pattern": r"new RegExp\(.*\+|\/.*\+.*\/",
        "languages": [".js", ".jsx", ".ts", ".tsx"],
        "multi_line": False,
    },

    # ── CS206: Hardcoded JWT Secret ───────────────────────────────────────
    {
        "id": "CS206",
        "name": "Hardcoded JWT Secret",
        "severity": "Critical",
        "owasp": "A07:2021",
        "cwe": "CWE-798",
        "cvss": 9.1,
        "confidence": 96,
        "description": "Hardcoded JWT secret key detected, allowing token forgery",
        "pattern": r"JWT_SECRET\s*=|jwt\.sign\(.*secret|jwt\.verify\(.*secret",
        "languages": [".js", ".jsx", ".ts", ".tsx"],
        "multi_line": False,
    },

    # ── CS207: Prototype Pollution ────────────────────────────────────────
    {
        "id": "CS207",
        "name": "Prototype Pollution",
        "severity": "High",
        "owasp": "A04:2021",
        "cwe": "CWE-1321",
        "cvss": 7.5,
        "confidence": 82,
        "description": "Prototype pollution via __proto__, Object.assign, or dynamic property access",
        "pattern": r"__proto__|Object\.assign\(.*req\.|\.prototype\[",
        "languages": [".js", ".jsx", ".ts", ".tsx"],
        "multi_line": False,
    },

    # ── CS208: Open Redirect ──────────────────────────────────────────────
    {
        "id": "CS208",
        "name": "Open Redirect",
        "severity": "Medium",
        "owasp": "A01:2021",
        "cwe": "CWE-601",
        "cvss": 6.1,
        "confidence": 84,
        "description": "Potential open redirect via user-controlled URL parameter",
        "pattern": r"window\.location\s*=.*\+|window\.location\.href\s*=.*\+|res\.redirect\(.*req\.",
        "languages": [".js", ".jsx", ".ts", ".tsx"],
        "multi_line": False,
    },

    # ── CS209: SQL Injection Node ─────────────────────────────────────────
    {
        "id": "CS209",
        "name": "SQL Injection (Node.js)",
        "severity": "Critical",
        "owasp": "A03:2021",
        "cwe": "CWE-89",
        "cvss": 9.8,
        "confidence": 94,
        "description": "SQL query constructed via string concatenation or template literal in Node.js",
        "pattern": r"\.query\(.*\+|\.query\(.*\$\{|\.execute\(.*\+",
        "languages": [".js", ".jsx", ".ts", ".tsx"],
        "multi_line": False,
    },

    # ── CS210: Command Injection Node ─────────────────────────────────────
    {
        "id": "CS210",
        "name": "Command Injection (Node.js)",
        "severity": "Critical",
        "owasp": "A03:2021",
        "cwe": "CWE-78",
        "cvss": 9.8,
        "confidence": 95,
        "description": "System command executed via child_process with user-controlled input",
        "pattern": r"child_process\.exec\(|child_process\.execSync\(|\.spawn\(.*shell",
        "languages": [".js", ".jsx", ".ts", ".tsx"],
        "multi_line": False,
    },

    # ── CS211: Hardcoded Credentials in Fetch ─────────────────────────────
    {
        "id": "CS211",
        "name": "Hardcoded Credentials in Fetch",
        "severity": "High",
        "owasp": "A07:2021",
        "cwe": "CWE-798",
        "cvss": 8.5,
        "confidence": 88,
        "description": "Hardcoded authorization token or password detected in HTTP request headers or body",
        "pattern": r'Authorization:\s*["\']Bearer\s*\w+|password\s*:\s*["\'][^"\']+["\']',
        "languages": [".js", ".jsx", ".ts", ".tsx"],
        "multi_line": False,
    },
]
