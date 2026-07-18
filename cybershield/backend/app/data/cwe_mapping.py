"""
Static CWE → finding category mapping (Module 6.3).

Maps a raw finding label to a CWE (Common Weakness Enumeration) identifier. The
compliance engine uses this to compute a CWE coverage score and to surface the
weaknesses that are still present in the project.
"""

CWE_MAPPING = {
    "SQL Injection": "CWE-89",
    "Injection": "CWE-89",
    "Command Injection": "CWE-77",
    "Cross Site Scripting": "CWE-79",
    "XSS": "CWE-79",
    "Hardcoded Secret": "CWE-798",
    "Hardcoded Password": "CWE-798",
    "Exposed API Key": "CWE-798",
    "Weak Password": "CWE-521",
    "Broken Authentication": "CWE-287",
    "Missing Authentication": "CWE-306",
    "CSRF": "CWE-352",
    "Broken Access Control": "CWE-284",
    "IDOR": "CWE-639",
    "Insecure Deserialization": "CWE-502",
    "Outdated Dependency": "CWE-1104",
    "Vulnerable Component": "CWE-1104",
    "Missing Security Headers": "CWE-693",
    "Security Misconfiguration": "CWE-16",
    "Missing Audit Log": "CWE-778",
    "Insufficient Logging": "CWE-778",
    "Server Side Request Forgery": "CWE-918",
    "SSRF": "CWE-918",
    "Insecure Cipher": "CWE-327",
    "Unsafe Randomness": "CWE-330",
    "Path Traversal": "CWE-22",
}

# Canonical list of CWEs tracked by the compliance engine.
CWE_LIST = sorted(set(CWE_MAPPING.values()))

# Human-readable names for tracked CWEs.
CWE_NAMES = {
    "CWE-22": "Path Traversal",
    "CWE-77": "Command Injection",
    "CWE-79": "Cross-site Scripting (XSS)",
    "CWE-89": "SQL Injection",
    "CWE-16": "Configuration",
    "CWE-284": "Improper Access Control",
    "CWE-287": "Improper Authentication",
    "CWE-306": "Missing Authentication for Critical Function",
    "CWE-327": "Broken/Risky Crypto Algorithm",
    "CWE-330": "Use of Insufficiently Random Values",
    "CWE-352": "Cross-Site Request Forgery (CSRF)",
    "CWE-502": "Deserialization of Untrusted Data",
    "CWE-521": "Weak Password Requirements",
    "CWE-639": "Authorization Bypass Through User-Controlled Key",
    "CWE-693": "Protection Mechanism Failure",
    "CWE-778": "Insufficient Logging",
    "CWE-798": "Use of Hard-coded Credentials",
    "CWE-918": "Server-Side Request Forgery (SSRF)",
    "CWE-1104": "Use of Unmaintained Third Party Components",
}
