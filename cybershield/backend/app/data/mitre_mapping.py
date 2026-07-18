"""
Static MITRE ATT&CK technique → finding category mapping (Module 6.3).

Maps a raw finding label (e.g. a credential-exposure secret, a command-injection
sink, or a weak-authentication issue) to a MITRE ATT&CK technique id. The
compliance engine derives a MITRE ATT&CK coverage score and the missing
techniques from the loaded data.
"""

MITRE_MAPPING = {
    "Hardcoded Secret": "T1552",
    "Hardcoded Password": "T1552",
    "Exposed API Key": "T1552",
    "Credential Exposure": "T1552",
    "Command Injection": "T1059",
    "Insecure Deserialization": "T1059",
    "Weak Password": "T1110",
    "Broken Authentication": "T1110",
    "Missing Authentication": "T1110",
    "Password Attack": "T1110",
    "Brute Force": "T1110",
    "CSRF": "T1190",
    "Server Side Request Forgery": "T1190",
    "SSRF": "T1190",
    "Exploit Public Facing Application": "T1190",
    "SQL Injection": "T1190",
    "Cross Site Scripting": "T1190",
    "XSS": "T1190",
    "Missing Audit Log": "T1070",
    "Insufficient Logging": "T1070",
    "Broken Access Control": "T1078",
    "IDOR": "T1078",
}

# Canonical list of MITRE ATT&CK techniques tracked by the engine.
MITRE_LIST = [
    "T1552",  # Unsecured Credentials
    "T1059",  # Command and Scripting Interpreter
    "T1110",  # Brute Force
    "T1190",  # Exploit Public-Facing Application
    "T1070",  # Indicator Removal
    "T1078",  # Valid Accounts
]

MITRE_NAMES = {
    "T1552": "Unsecured Credentials",
    "T1059": "Command and Scripting Interpreter",
    "T1110": "Brute Force",
    "T1190": "Exploit Public-Facing Application",
    "T1070": "Indicator Removal",
    "T1078": "Valid Accounts",
}
