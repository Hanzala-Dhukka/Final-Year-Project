"""
Security Patterns — Regex-based vulnerability detection rules.
Each pattern defines a type, regex, severity, and message.

These patterns are used by the vulnerability locator as a supplementary
scan pass. They are intentionally more specific than the github_scanner
patterns to minimize false positives.
"""
SECURITY_PATTERNS = [
    {
        "type": "Hardcoded API Key",
        "regex": r"(?:api[_-]?key|apikey)\s*=\s*['\"][A-Za-z0-9_\-]{16,}['\"]",
        "severity": "High",
        "message": "API key stored inside source code",
    },
    {
        "type": "Hardcoded Token",
        "regex": r"(?:token|secret|SECRET)\s*=\s*['\"][A-Za-z0-9_\-]{20,}['\"]",
        "severity": "High",
        "message": "Sensitive token/secret detected in code",
    },
    {
        "type": "Password Variable",
        "regex": r"(?:password|passwd|pwd)\s*=\s*['\"][^'\"]{8,}['\"]",
        "severity": "High",
        "message": "Password value exposed in source code",
    },
    {
        "type": "AWS Access Key",
        "regex": r"AKIA[0-9A-Z]{16}",
        "severity": "Critical",
        "message": "AWS access key detected in source code",
    },
    {
        "type": "MongoDB URI",
        "regex": r"mongodb(\+srv)?://[^\s\"']+",
        "severity": "High",
        "message": "Database connection string with credentials exposed",
    },
    {
        "type": "Hardcoded JWT Secret",
        "regex": r"(?:jwt[_-]?secret|JWT_SECRET)\s*=\s*['\"].+['\"]",
        "severity": "High",
        "message": "JWT secret key exposed in source code",
    },
    {
        "type": "Dangerous Function",
        "regex": r"\b(?:Function|setTimeout|setInterval)\s*\(\s*['\"]",
        "severity": "Medium",
        "message": "Dynamic code execution via string argument",
    },
]
