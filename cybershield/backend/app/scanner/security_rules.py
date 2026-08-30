"""
Security Rules — Legacy Format

These rules are used by the file_scanner.py for the legacy scanning path.
Kept in sync with the patterns in github_scanner.py.
"""

from dataclasses import dataclass
import re


@dataclass
class SecurityRule:
    name: str
    severity: str
    pattern: str


RULES = [
    SecurityRule(
        name="AWS Access Key",
        severity="Critical",
        pattern=r"AKIA[0-9A-Z]{16}"
    ),
    SecurityRule(
        name="Google API Key",
        severity="Critical",
        pattern=r"AIza[0-9A-Za-z\-_]{35}"
    ),
    SecurityRule(
        name="MongoDB URI",
        severity="Critical",
        pattern=r"mongodb\+srv://[^:\s]+:[^@\s]+@"
    ),
    SecurityRule(
        name="Private Key Block",
        severity="Critical",
        pattern=r"-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----"
    ),
    SecurityRule(
        name="GitHub Personal Access Token",
        severity="Critical",
        pattern=r"ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82}"
    ),
    SecurityRule(
        name="Hardcoded Password",
        severity="High",
        pattern=r'''(?:password|passwd|pwd)\s*=\s*['"][^'"]{8,}['"]'''
    ),
    SecurityRule(
        name="Hardcoded API Key Assignment",
        severity="High",
        pattern=r'''(?:api[_-]?key|secret[_-]?key|apikey|client[_-]?secret|access[_-]?key)\s*=\s*['"][A-Za-z0-9_\-]{16,}['"]'''
    ),
    SecurityRule(
        name="JWT Secret Assignment",
        severity="High",
        pattern=r'''(?:JWT_SECRET|jwt_secret)\s*=\s*['"][^'"]+['"]'''
    ),
]
