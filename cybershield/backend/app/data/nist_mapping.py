"""
Static NIST Cybersecurity Framework (CSF 2.0) → finding category mapping
(Module 6.3).

Maps a raw finding label to a NIST CSF function/category code. The compliance
engine derives a NIST CSF coverage score and the missing categories from the
loaded data.
"""

NIST_MAPPING = {
    "Broken Authentication": "PR.AA",
    "Weak Password": "PR.AA",
    "Missing Authentication": "PR.AA",
    "Hardcoded Secret": "PR.DS",
    "Hardcoded Password": "PR.DS",
    "Exposed API Key": "PR.DS",
    "Insecure Cipher": "PR.DS",
    "Missing HTTPS": "PR.DS",
    "Broken Access Control": "PR.AC",
    "IDOR": "PR.AC",
    "CSRF": "PR.AC",
    "Missing Audit Log": "DE.CM",
    "Insufficient Logging": "DE.CM",
    "Outdated Dependency": "ID.RA",
    "Vulnerable Component": "ID.RA",
    "SQL Injection": "PR.IP",
    "Injection": "PR.IP",
    "Command Injection": "PR.IP",
    "Cross Site Scripting": "PR.IP",
    "XSS": "PR.IP",
    "Server Side Request Forgery": "PR.IP",
    "SSRF": "PR.IP",
    "Security Misconfiguration": "PR.IP",
    "Missing Security Headers": "PR.IP",
    "Insecure Deserialization": "PR.IP",
}

# Canonical list of NIST CSF categories tracked by the engine.
NIST_LIST = [
    "PR.AA",  # Identity Management, Authentication & Access Control
    "PR.AC",  # Access Control
    "PR.DS",  # Data Security
    "PR.IP",  # Technology Infrastructure Resilience
    "ID.RA",  # Vulnerability / Risk Assessment
    "DE.CM",  # Security Continuous Monitoring
]

NIST_NAMES = {
    "PR.AA": "Identity Management, Authentication & Access Control",
    "PR.AC": "Access Control",
    "PR.DS": "Data Security",
    "PR.IP": "Technology Infrastructure Resilience",
    "ID.RA": "Vulnerability & Risk Assessment",
    "DE.CM": "Security Continuous Monitoring",
}
