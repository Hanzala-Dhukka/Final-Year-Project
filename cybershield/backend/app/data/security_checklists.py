"""
Default security hardening checklists (Module 6.1).

These predefined requirements populate the ``security_checklists`` collection.
Each item maps to a category, a severity, an optional compliance framework
reference (OWASP / NIST) and a "recommended" flag for AI prioritisation.
"""

CHECKLISTS = [
    # ── Authentication ───────────────────────────────────────────────────────
    {
        "title": "Enable Multi-Factor Authentication",
        "category": "Authentication",
        "severity": "High",
        "description": "Add MFA for privileged accounts to reduce credential-theft risk.",
        "frameworks": ["OWASP A07", "NIST IA-2"],
        "recommended": True,
    },
    {
        "title": "Enforce Strong Password Policy",
        "category": "Authentication",
        "severity": "High",
        "description": "Require minimum length, complexity and rotation for passwords.",
        "frameworks": ["OWASP A07", "NIST IA-5"],
        "recommended": True,
    },
    {
        "title": "Implement JWT Expiration",
        "category": "Authentication",
        "severity": "High",
        "description": "Set short-lived access tokens with refresh token rotation.",
        "frameworks": ["OWASP A07"],
        "recommended": True,
    },
    # ── Authorization ─────────────────────────────────────────────────────────
    {
        "title": "Apply Role-Based Access Control",
        "category": "Authorization",
        "severity": "High",
        "description": "Enforce least-privilege roles on every protected endpoint.",
        "frameworks": ["OWASP A01", "NIST AC-6"],
        "recommended": True,
    },
    {
        "title": "Validate Object Ownership",
        "category": "Authorization",
        "severity": "High",
        "description": "Verify that a user owns the resource before allowing access (IDOR).",
        "frameworks": ["OWASP A01"],
        "recommended": True,
    },
    # ── Input Validation ──────────────────────────────────────────────────────
    {
        "title": "Validate and Sanitize Inputs",
        "category": "Input Validation",
        "severity": "High",
        "description": "Validate all user input against strict schemas (Pydantic/Fluent).",
        "frameworks": ["OWASP A03", "NIST SI-10"],
        "recommended": True,
    },
    {
        "title": "Escape Output to Prevent XSS",
        "category": "Input Validation",
        "severity": "Medium",
        "description": "Encode output in templates and set a strict CSP.",
        "frameworks": ["OWASP A03"],
        "recommended": True,
    },
    # ── Cryptography ──────────────────────────────────────────────────────────
    {
        "title": "Use Strong Encryption at Rest",
        "category": "Cryptography",
        "severity": "Critical",
        "description": "Encrypt sensitive fields with AES-256-GCM or equivalent.",
        "frameworks": ["OWASP A02", "NIST SC-28"],
        "recommended": True,
    },
    {
        "title": "Use TLS 1.2+ in Transit",
        "category": "Cryptography",
        "severity": "Critical",
        "description": "Enforce HTTPS/TLS for all traffic; disable legacy protocols.",
        "frameworks": ["OWASP A02", "NIST SC-8"],
        "recommended": True,
    },
    {
        "title": "Use Strong Password Hashing",
        "category": "Cryptography",
        "severity": "High",
        "description": "Hash passwords with bcrypt, argon2 or scrypt (never plaintext/MD5).",
        "frameworks": ["OWASP A02", "NIST IA-5"],
        "recommended": True,
    },
    # ── Secrets Management ────────────────────────────────────────────────────
    {
        "title": "Remove Hardcoded Secrets",
        "category": "Secrets Management",
        "severity": "Critical",
        "description": "Move API keys and credentials into environment variables / vault.",
        "frameworks": ["OWASP A02", "NIST IA-5"],
        "recommended": True,
    },
    {
        "title": "Rotate Exposed API Keys",
        "category": "Secrets Management",
        "severity": "Critical",
        "description": "Rotate any key that has been committed to source control.",
        "frameworks": ["OWASP A02", "NIST IA-5"],
        "recommended": True,
    },
    {
        "title": "Use a Secrets Manager",
        "category": "Secrets Management",
        "severity": "Medium",
        "description": "Store secrets in Vault / AWS Secrets Manager instead of .env files.",
        "frameworks": ["OWASP A02"],
        "recommended": False,
    },
    # ── Logging ───────────────────────────────────────────────────────────────
    {
        "title": "Enable Security Audit Logging",
        "category": "Logging",
        "severity": "Medium",
        "description": "Log auth events, access and admin actions for forensics.",
        "frameworks": ["OWASP A09", "NIST AU-2"],
        "recommended": True,
    },
    {
        "title": "Avoid Logging Sensitive Data",
        "category": "Logging",
        "severity": "Medium",
        "description": "Redact PII, tokens and passwords from application logs.",
        "frameworks": ["OWASP A09", "NIST AU-9"],
        "recommended": True,
    },
    # ── Network Security ──────────────────────────────────────────────────────
    {
        "title": "Configure HTTPS Redirect",
        "category": "Network Security",
        "severity": "High",
        "description": "Force HTTP to HTTPS and enable HSTS headers.",
        "frameworks": ["OWASP A05", "NIST SC-8"],
        "recommended": True,
    },
    {
        "title": "Restrict Network Exposure",
        "category": "Network Security",
        "severity": "Medium",
        "description": "Use security groups / firewalls to limit inbound ports.",
        "frameworks": ["OWASP A05", "NIST SC-7"],
        "recommended": False,
    },
    # ── API Security ──────────────────────────────────────────────────────────
    {
        "title": "Implement Rate Limiting",
        "category": "API Security",
        "severity": "High",
        "description": "Throttle requests to prevent brute-force and abuse.",
        "frameworks": ["OWASP A04", "NIST SC-5"],
        "recommended": True,
    },
    {
        "title": "Add Content Security Policy",
        "category": "API Security",
        "severity": "Medium",
        "description": "Set CSP, X-Frame-Options and other security headers.",
        "frameworks": ["OWASP A05"],
        "recommended": True,
    },
    {
        "title": "Validate API Request Schemas",
        "category": "API Security",
        "severity": "High",
        "description": "Reject malformed payloads with strict request models.",
        "frameworks": ["OWASP A04"],
        "recommended": True,
    },
    # ── Database Security ─────────────────────────────────────────────────────
    {
        "title": "Use Parameterized Queries",
        "category": "Database Security",
        "severity": "Critical",
        "description": "Prevent SQL Injection with ORM/parameterized statements.",
        "frameworks": ["OWASP A03", "NIST SI-10"],
        "recommended": True,
    },
    {
        "title": "Apply Least-Privilege DB Accounts",
        "category": "Database Security",
        "severity": "High",
        "description": "Grant the app user only the privileges it needs (no DROP/GRANT).",
        "frameworks": ["OWASP A01", "NIST AC-6"],
        "recommended": True,
    },
    # ── Cloud Security ────────────────────────────────────────────────────────
    {
        "title": "Harden Cloud IAM Policies",
        "category": "Cloud Security",
        "severity": "High",
        "description": "Remove wildcard IAM permissions and enable MFA on root.",
        "frameworks": ["OWASP A01", "NIST AC-6"],
        "recommended": True,
    },
    {
        "title": "Enable Cloud Audit Trails",
        "category": "Cloud Security",
        "severity": "Medium",
        "description": "Turn on CloudTrail / activity logging for all accounts.",
        "frameworks": ["OWASP A09", "NIST AU-2"],
        "recommended": False,
    },
    # ── Secure Coding ─────────────────────────────────────────────────────────
    {
        "title": "Keep Dependencies Patched",
        "category": "Secure Coding",
        "severity": "High",
        "description": "Run SCA scans and update vulnerable third-party packages.",
        "frameworks": ["OWASP A06", "NIST SI-2"],
        "recommended": True,
    },
    {
        "title": "Disable Verbose Error Responses",
        "category": "Secure Coding",
        "severity": "Low",
        "description": "Return generic errors to users; log details server-side.",
        "frameworks": ["OWASP A04"],
        "recommended": True,
    },
]
