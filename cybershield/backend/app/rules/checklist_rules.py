"""
Rule Database (Module SC2).

Central mapping of scanner findings → checklist tasks.

Each rule contains:
  - patterns  : list of strings to match against finding text (case-insensitive)
  - task      : the checklist task title
  - category  : security category for the task
  - severity  : Critical / High / Medium / Low
"""

CHECKLIST_RULES = {
    # ── Injection ─────────────────────────────────────────────────────────────
    "SQL_INJECTION_001": {
        "patterns": [
            "SQL Injection",
            "sql injection",
            "CWE-89",
            "CWE89",
            "Unparameterized query",
        ],
        "task": "Use Parameterized Queries",
        "category": "Input Validation",
        "severity": "Critical",
    },

    "NOSQL_INJECTION_001": {
        "patterns": [
            "NoSQL Injection",
            "nosql injection",
            "MongoDB Injection",
        ],
        "task": "Sanitize NoSQL Query Inputs",
        "category": "Input Validation",
        "severity": "Critical",
    },

    "COMMAND_INJECTION_001": {
        "patterns": [
            "Command Injection",
            "command injection",
            "OS Command",
            "CWE-78",
        ],
        "task": "Avoid Shell Command Execution from User Input",
        "category": "Input Validation",
        "severity": "Critical",
    },

    # ── XSS ───────────────────────────────────────────────────────────────────
    "XSS_001": {
        "patterns": [
            "Cross Site Scripting",
            "XSS",
            "CWE-79",
            "Reflected XSS",
            "Stored XSS",
            "DOM XSS",
        ],
        "task": "Implement Output Encoding",
        "category": "Input Validation",
        "severity": "High",
    },

    # ── Secrets ───────────────────────────────────────────────────────────────
    "SECRET_EXPOSURE_001": {
        "patterns": [
            "API Key Exposure",
            "Hardcoded Secret",
            "Password Leak",
            "Hardcoded Password",
            "Exposed Credential",
            "Secret in Code",
            "Gitleaks",
            "trufflehog",
        ],
        "task": "Remove Exposed Secrets and Use Environment Variables",
        "category": "Secrets Management",
        "severity": "Critical",
    },

    "WEAK_CRYPTO_001": {
        "patterns": [
            "Weak Hash",
            "MD5",
            "SHA1",
            "Deprecated Algorithm",
        ],
        "task": "Use Strong Cryptographic Hashes (SHA-256+)",
        "category": "Cryptography",
        "severity": "High",
    },

    # ── Authentication ────────────────────────────────────────────────────────
    "WEAK_AUTH_001": {
        "patterns": [
            "Weak Authentication",
            "Missing MFA",
            "No Multi-Factor",
            "Insecure Login",
        ],
        "task": "Enable Multi-Factor Authentication",
        "category": "Authentication",
        "severity": "High",
    },

    "BROKEN_AUTH_001": {
        "patterns": [
            "Broken Authentication",
            "Session Fixation",
            "Session Hijacking",
            "CWE-287",
        ],
        "task": "Implement Secure Session Management",
        "category": "Authentication",
        "severity": "Critical",
    },

    # ── Authorization ─────────────────────────────────────────────────────────
    "IDOR_001": {
        "patterns": [
            "IDOR",
            "Insecure Direct Object Reference",
            "CWE-639",
            "Unauthorized Access",
        ],
        "task": "Add Authorization Checks on All Object Access",
        "category": "Authorization",
        "severity": "High",
    },

    # ── Network / Transport ──────────────────────────────────────────────────
    "HTTPS_001": {
        "patterns": [
            "Missing HTTPS",
            "HTTP Only",
            "No TLS",
            "Insecure Transport",
            "CWE-319",
        ],
        "task": "Enable HTTPS and Enforce TLS",
        "category": "Network Security",
        "severity": "High",
    },

    "CORS_001": {
        "patterns": [
            "CORS Misconfiguration",
            "Wildcard Origin",
            "Overly Permissive CORS",
        ],
        "task": "Restrict CORS to Trusted Origins",
        "category": "API Security",
        "severity": "Medium",
    },

    "SECURITY_HEADERS_001": {
        "patterns": [
            "Missing Security Header",
            "No CSP",
            "No X-Frame-Options",
            "No HSTS",
            "Missing Content Security Policy",
        ],
        "task": "Configure Security Headers (CSP, HSTS, X-Frame-Options)",
        "category": "Network Security",
        "severity": "Medium",
    },

    # ── Dependencies ──────────────────────────────────────────────────────────
    "DEPENDENCY_001": {
        "patterns": [
            "Vulnerable Dependency",
            "Outdated Package",
            "CVE in Dependency",
            "Known Vulnerability",
            "Dependabot",
            "Snyk",
        ],
        "task": "Update Dependencies to Latest Secure Versions",
        "category": "Secure Coding",
        "severity": "High",
    },

    # ── Database ──────────────────────────────────────────────────────────────
    "SQLI_DB_001": {
        "patterns": [
            "Unparameterized DB Query",
            "String Concatenation SQL",
        ],
        "task": "Use Prepared Statements for Database Queries",
        "category": "Database Security",
        "severity": "Critical",
    },

    # ── Configuration ─────────────────────────────────────────────────────────
    "DEBUG_MODE_001": {
        "patterns": [
            "Debug Mode Enabled",
            "Debug True",
            "DEBUG=True",
            "Verbose Error",
        ],
        "task": "Disable Debug Mode in Production",
        "category": "Cloud Security",
        "severity": "Medium",
    },

    "HARDCODED_CRED_001": {
        "patterns": [
            "Hardcoded Credential",
            "Hardcoded Token",
            "Embedded Password",
            "Private Key in Code",
        ],
        "task": "Store Credentials in a Secure Vault",
        "category": "Secrets Management",
        "severity": "Critical",
    },

    # ── Logging ───────────────────────────────────────────────────────────────
    "MISSING_LOGS_001": {
        "patterns": [
            "Missing Audit Log",
            "No Security Logging",
            "Unlogged Access",
        ],
        "task": "Add Security Event Logging",
        "category": "Logging",
        "severity": "Medium",
    },

    "SENSITIVE_LOG_001": {
        "patterns": [
            "Sensitive Data in Logs",
            "Password in Log",
            "Token in Log",
        ],
        "task": "Sanitize Sensitive Data from Logs",
        "category": "Logging",
        "severity": "High",
    },

    # ── File Handling ─────────────────────────────────────────────────────────
    "PATH_TRAVERSAL_001": {
        "patterns": [
            "Path Traversal",
            "Directory Traversal",
            "CWE-22",
            "File Inclusion",
        ],
        "task": "Validate and Sanitize File Paths",
        "category": "Input Validation",
        "severity": "Critical",
    },

    "UNSAFE_DESERIALIZATION_001": {
        "patterns": [
            "Unsafe Deserialization",
            "Insecure Deserialization",
            "CWE-502",
        ],
        "task": "Avoid Deserializing Untrusted Data",
        "category": "Secure Coding",
        "severity": "Critical",
    },
}
