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
        pattern=r"AIza[0-9A-Za-z-_]{35}"
    ),
    SecurityRule(
        name="MongoDB URI",
        severity="Critical",
        pattern=r"mongodb\+srv://"
    ),
    SecurityRule(
        name="Private Key",
        severity="Critical",
        pattern=r"BEGIN PRIVATE KEY"
    ),
    SecurityRule(
        name="Hardcoded API Key",
        severity="High",
        pattern=r"(api[_-]?key|secret[_-]?key|apikey|client[_-]?secret|access[_-]?key)\s*=\s*['\"][^'\"]+['\"]"
    ),
    SecurityRule(
        name="Password Variable",
        severity="High",
        pattern=r"password\s*[:=]\s*['\"][^'\"]+['\"]"
    ),
    SecurityRule(
        name="JWT Secret",
        severity="High",
        pattern=r"jwt[_-]?secret"
    ),
    SecurityRule(
        name="JavaScript eval()",
        severity="High",
        pattern=r"\beval\s*\("
    ),
    SecurityRule(
        name="Hardcoded Token",
        severity="Medium",
        pattern=r"(api[_-]?key|token)\s*[:=]\s*['\"][^'\"]+['\"]"
    ),
]
