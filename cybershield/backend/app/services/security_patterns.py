"""
Security Patterns — Regex-based vulnerability detection rules.
Each pattern defines a type, regex, severity, and message.
"""
SECURITY_PATTERNS = [
    {
        "type": "Hardcoded API Key",
        "regex": r"(?:api[_-]?key|apikey)\s*[=:]\s*['\"].+['\"]",
        "severity": "High",
        "message": "API key stored inside source code",
    },
    {
        "type": "Hardcoded Token",
        "regex": r"(?:token|secret|SECRET)\s*[=:]\s*['\"].+['\"]",
        "severity": "High",
        "message": "Sensitive token/secret detected in code",
    },
    {
        "type": "Password Variable",
        "regex": r"(?:password|passwd|pwd)\s*[=:]\s*['\"].+['\"]",
        "severity": "High",
        "message": "Password value exposed in source code",
    },
    {
        "type": "JavaScript eval()",
        "regex": r"\beval\s*\(",
        "severity": "High",
        "message": "eval() can execute unsafe user-controlled code",
    },
    {
        "type": "Command Execution",
        "regex": r"\b(?:exec|execSync|execFile|spawn)\s*\(",
        "severity": "High",
        "message": "Command execution function detected — injection risk",
    },
    {
        "type": "SQL Injection Risk",
        "regex": r"(?:query|execute)\s*\(\s*[`\"'].*?\+",
        "severity": "High",
        "message": "String concatenation in SQL query — injection risk",
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
        "regex": r"(?:jwt[_-]?secret|JWT_SECRET)\s*[=:]\s*['\"].+['\"]",
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
