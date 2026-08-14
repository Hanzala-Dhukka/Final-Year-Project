
"""
Static OWASP Top 10 → finding category mapping (Module 6.3).

Maps a raw finding / vulnerability label (as produced by the GitHub scanner,
threat report or OWASP simulator) to an OWASP Top 10 (2021) category. Used by
the compliance engine to decide which OWASP categories are covered vs. missing.
"""

# OWASP Top 10 (2021) canonical categories.
OWASP_CATEGORIES = [
    "A01",  # Broken Access Control
    "A02",  # Cryptographic Failures
    "A03",  # Injection
    "A04",  # Insecure Design
    "A05",  # Security Misconfiguration
    "A06",  # Vulnerable and Outdated Components
    "A07",  # Identification and Authentication Failures
    "A08",  # Software and Data Integrity Failures
    "A09",  # Security Logging and Monitoring Failures
    "A10",  # Server-Side Request Forgery
]

OWASP_MAPPING = {
    "SQL Injection": "A03",
    "Injection": "A03",
    "Command Injection": "A03",
    "NoSQL Injection": "A03",
    "Cross Site Scripting": "A03",
    "Cross-Site Scripting": "A03",
    "XSS": "A03",
    "Broken Authentication": "A07",
    "Weak Password": "A07",
    "Hardcoded Secret": "A02",
    "Hardcoded Password": "A02",
    "Hardcoded API Key": "A02",
    "Hardcoded Token": "A02",
    "Hardcoded JWT Secret": "A02",
    "Hardcoded Credentials": "A02",
    "Password Variable": "A02",
    "Password": "A02",
    "AWS Access Key": "A02",
    "MongoDB URI": "A02",
    "Database Credentials": "A02",
    "Credentials": "A02",
    "Exposed API Key": "A02",
    "Insecure Cipher": "A02",
    "Weak Hashing": "A02",
    "Weak Hashing Algorithm": "A02",
    "TLS Verification Disabled": "A02",
    "Missing HTTPS": "A02",
    "CSRF": "A01",
    "Broken Access Control": "A01",
    "IDOR": "A01",
    "Security Misconfiguration": "A05",
    "Missing Security Headers": "A05",
    "Verbose Error": "A05",
    "Default Credentials": "A05",
    "Debug Mode Enabled": "A05",
    "Outdated Dependency": "A06",
    "Vulnerable Component": "A06",
    "Insecure Deserialization": "A08",
    "Unsafe Deserialization": "A08",
    "Unsafe YAML Deserialization": "A08",
    "Unsigned Update": "A08",
    "Command Execution": "A03",
    "JavaScript eval()": "A03",
    "Dangerous Function": "A03",
    "Missing Audit Log": "A09",
    "Insufficient Logging": "A09",
    "Server Side Request Forgery": "A10",
    "SSRF": "A10",
}

# Human-readable names for each OWASP category id.
OWASP_NAMES = {
    "A01": "Broken Access Control",
    "A02": "Cryptographic Failures",
    "A03": "Injection",
    "A04": "Insecure Design",
    "A05": "Security Misconfiguration",
    "A06": "Vulnerable and Outdated Components",
    "A07": "Identification and Authentication Failures",
    "A08": "Software and Data Integrity Failures",
    "A09": "Security Logging and Monitoring Failures",
    "A10": "Server-Side Request Forgery",
}
