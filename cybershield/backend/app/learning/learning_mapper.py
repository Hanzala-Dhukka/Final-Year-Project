"""
Vulnerability-to-learning-topic mapper (Step 3).

Maps detected vulnerability types to recommended learning topics,
OWASP categories, and priority levels. This serves as the foundation
for the recommendation engine before AI enhancement is applied.
"""

VULNERABILITY_MAP = {
    "SQL Injection": {
        "topics": [
            {"topic": "SQL Injection", "link": "/owasp/SQL%20Injection"},
            {"topic": "Prepared Statements", "link": "/glossary/prepared-statements"},
            {"topic": "Input Validation", "link": "/glossary/input-validation"},
        ],
        "owasp": "A03:2021 Injection",
        "quiz_topic": "SQL Injection",
    },
    "Cross Site Scripting": {
        "topics": [
            {"topic": "XSS Prevention", "link": "/owasp/Cross-Site%20Scripting"},
            {"topic": "Output Encoding", "link": "/glossary/output-encoding"},
        ],
        "owasp": "A03:2021 Injection",
        "quiz_topic": "XSS",
    },
    "XSS": {
        "topics": [
            {"topic": "XSS Prevention", "link": "/owasp/Cross-Site%20Scripting"},
            {"topic": "Output Encoding", "link": "/glossary/output-encoding"},
            {"topic": "Content Security Policy", "link": "/glossary/csp"},
        ],
        "owasp": "A03:2021 Injection",
        "quiz_topic": "XSS",
    },
    "Hardcoded Secret": {
        "topics": [
            {"topic": "Secret Management", "link": "/glossary/secret-management"},
            {"topic": "Environment Variables", "link": "/glossary/environment-variables"},
            {"topic": "OWASP A05", "link": "/owasp/A05:2021%20Security%20Misconfiguration"},
        ],
        "owasp": "A05:2021 Security Misconfiguration",
        "quiz_topic": "Secrets",
    },
    "Exposed Secret": {
        "topics": [
            {"topic": "Secret Management", "link": "/glossary/secret-management"},
            {"topic": "Environment Variables", "link": "/glossary/environment-variables"},
        ],
        "owasp": "A05:2021 Security Misconfiguration",
        "quiz_topic": "Secrets",
    },
    "Broken Authentication": {
        "topics": [
            {"topic": "Authentication Security", "link": "/owasp/A07:2021%20Identification%20and%20Authentication%20Failures"},
            {"topic": "Multi-Factor Authentication", "link": "/glossary/mfa"},
            {"topic": "Password Hashing", "link": "/glossary/password-hashing"},
        ],
        "owasp": "A07:2021 Identification and Authentication Failures",
        "quiz_topic": "Authentication",
    },
    "Cross-Site Request Forgery": {
        "topics": [
            {"topic": "CSRF Prevention", "link": "/owasp/A01:2021%20Broken%20Access%20Control"},
            {"topic": "CSRF Tokens", "link": "/glossary/csrf-token"},
        ],
        "owasp": "A01:2021 Broken Access Control",
        "quiz_topic": "CSRF",
    },
    "CSRF": {
        "topics": [
            {"topic": "CSRF Prevention", "link": "/owasp/A01:2021%20Broken%20Access%20Control"},
            {"topic": "CSRF Tokens", "link": "/glossary/csrf-token"},
        ],
        "owasp": "A01:2021 Broken Access Control",
        "quiz_topic": "CSRF",
    },
    "Insecure Deserialization": {
        "topics": [
            {"topic": "Secure Deserialization", "link": "/owasp/A08:2021%20Software%20and%20Data%20Integrity%20Failures"},
            {"topic": "Input Validation", "link": "/glossary/input-validation"},
        ],
        "owasp": "A08:2021 Software and Data Integrity Failures",
        "quiz_topic": "Deserialization",
    },
    "Server-Side Request Forgery": {
        "topics": [
            {"topic": "SSRF Prevention", "link": "/owasp/A10:2021%20Server-Side%20Request%20Forgery"},
            {"topic": "URL Validation", "link": "/glossary/url-validation"},
        ],
        "owasp": "A10:2021 Server-Side Request Forgery",
        "quiz_topic": "SSRF",
    },
    "SSRF": {
        "topics": [
            {"topic": "SSRF Prevention", "link": "/owasp/A10:2021%20Server-Side%20Request%20Forgery"},
            {"topic": "URL Validation", "link": "/glossary/url-validation"},
        ],
        "owasp": "A10:2021 Server-Side Request Forgery",
        "quiz_topic": "SSRF",
    },
    "Command Injection": {
        "topics": [
            {"topic": "Command Injection Prevention", "link": "/owasp/A03:2021%20Injection"},
            {"topic": "Input Sanitization", "link": "/glossary/input-sanitization"},
        ],
        "owasp": "A03:2021 Injection",
        "quiz_topic": "Command Injection",
    },
    "Path Traversal": {
        "topics": [
            {"topic": "Path Traversal Prevention", "link": "/owasp/A01:2021%20Broken%20Access%20Control"},
            {"topic": "File System Security", "link": "/glossary/file-system-security"},
        ],
        "owasp": "A01:2021 Broken Access Control",
        "quiz_topic": "Path Traversal",
    },
    "Broken Access Control": {
        "topics": [
            {"topic": "Access Control", "link": "/owasp/A01:2021%20Broken%20Access%20Control"},
            {"topic": "Authorization", "link": "/glossary/authorization"},
            {"topic": "RBAC", "link": "/glossary/rbac"},
        ],
        "owasp": "A01:2021 Broken Access Control",
        "quiz_topic": "Access Control",
    },
    "Security Misconfiguration": {
        "topics": [
            {"topic": "Security Configuration", "link": "/owasp/A05:2021%20Security%20Misconfiguration"},
            {"topic": "Hardening", "link": "/glossary/hardening"},
        ],
        "owasp": "A05:2021 Security Misconfiguration",
        "quiz_topic": "Configuration",
    },
    "Vulnerable Dependency": {
        "topics": [
            {"topic": "Dependency Management", "link": "/glossary/dependency-management"},
            {"topic": "OWASP A06", "link": "/owasp/A06:2021%20Vulnerable%20and%20Outdated%20Components"},
        ],
        "owasp": "A06:2021 Vulnerable and Outdated Components",
        "quiz_topic": "Dependencies",
    },
    "Outdated Dependency": {
        "topics": [
            {"topic": "Dependency Management", "link": "/glossary/dependency-management"},
            {"topic": "OWASP A06", "link": "/owasp/A06:2021%20Vulnerable%20and%20Outdated%20Components"},
        ],
        "owasp": "A06:2021 Vulnerable and Outdated Components",
        "quiz_topic": "Dependencies",
    },
    "Information Disclosure": {
        "topics": [
            {"topic": "Error Handling", "link": "/glossary/error-handling"},
            {"topic": "Data Protection", "link": "/glossary/data-protection"},
        ],
        "owasp": "A04:2021 Insecure Design",
        "quiz_topic": "Data Protection",
    },
}


# Severity to priority mapping
SEVERITY_PRIORITY = {
    "Critical": "High",
    "High": "High",
    "Medium": "Medium",
    "Low": "Low",
    "Informational": "Low",
}
