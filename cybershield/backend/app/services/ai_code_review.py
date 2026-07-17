"""
Rule-based static scanner + Gemini AI review for the AI Code Review module
(Module 5.3).

The rule scanner runs first (fast, offline) to catch well-known dangerous
patterns. The Gemini call then produces the human-readable explanation,
secure alternative, fixed code, and OWASP/CWE mapping, using the rule results
as grounding.
"""
import re
from typing import Dict, Any, List

from app.ai.gemini_client import generate, is_available
from app.ai.prompt_builder import SYSTEM_PROMPT

# Each rule: (id, regex, severity, owasp, cwe, title, recommendation)
# Severity order used for scoring: Critical > High > Medium > Low
RULES = [
    {
        "id": "eval_usage",
        "pattern": r"\beval\s*\(",
        "severity": "Critical",
        "owasp": "A03",
        "cwe": "CWE-95",
        "title": "Dangerous eval() usage",
        "recommendation": "Avoid eval(). Use safe parsers (e.g. ast.literal_eval, json.loads) or explicit validation.",
    },
    {
        "id": "exec_usage",
        "pattern": r"\b(os\.system|subprocess\.call|exec\s*)\(",
        "severity": "High",
        "owasp": "A03",
        "cwe": "CWE-78",
        "title": "Command execution",
        "recommendation": "Avoid shell execution with user input. Use subprocess with a list of args and shell=False.",
    },
    {
        "id": "hardcoded_secret",
        "pattern": r"(password|passwd|api_key|apikey|secret|token)\s*=\s*['\"][^'\"]+['\"]",
        "severity": "High",
        "owasp": "A02",
        "cwe": "CWE-798",
        "title": "Hardcoded credentials",
        "recommendation": "Store secrets in environment variables or a secrets manager, never in source code.",
    },
    {
        "id": "sql_injection",
        "pattern": r"(SELECT|INSERT|UPDATE|DELETE).*\+.*(user|request|input|req\.|params)",
        "severity": "Critical",
        "owasp": "A03",
        "cwe": "CWE-89",
        "title": "Possible SQL Injection",
        "recommendation": "Use parameterized queries / prepared statements instead of string concatenation.",
    },
    {
        "id": "sql_string_format",
        "pattern": r"(execute|cursor\.execute)\s*\(\s*([f\"']|[\"'].*%s|[\"'].*\.format)",
        "severity": "High",
        "owasp": "A03",
        "cwe": "CWE-89",
        "title": "Possible SQL Injection via formatting",
        "recommendation": "Pass parameters as query arguments, never via f-strings or .format().",
    },
    {
        "id": "xss_innerhtml",
        "pattern": r"\.innerHTML\s*=",
        "severity": "High",
        "owasp": "A03",
        "cwe": "CWE-79",
        "title": "Possible Cross-Site Scripting (XSS)",
        "recommendation": "Use textContent or sanitize with DOMPurify before inserting untrusted HTML.",
    },
    {
        "id": "md5_weak_hash",
        "pattern": r"(md5|sha1)\s*\(",
        "severity": "Medium",
        "owasp": "A02",
        "cwe": "CWE-327",
        "title": "Weak hashing algorithm",
        "recommendation": "Use a strong, salted KDF (bcrypt, scrypt, Argon2) for passwords; SHA-256+ for integrity.",
    },
    {
        "id": "disabled_ssl",
        "pattern": r"verify\s*=\s*False|ssl_verify\s*=\s*False|InsecureRequestWarning",
        "severity": "Medium",
        "owasp": "A02",
        "cwe": "CWE-295",
        "title": "TLS verification disabled",
        "recommendation": "Keep certificate verification enabled; use a proper CA bundle.",
    },
    {
        "id": "debug_true",
        "pattern": r"debug\s*=\s*True",
        "severity": "Low",
        "owasp": "A05",
        "cwe": "CWE-489",
        "title": "Debug mode enabled",
        "recommendation": "Disable debug mode in production environments.",
    },
    {
        "id": "yaml_load",
        "pattern": r"yaml\.load\s*\(",
        "severity": "Medium",
        "owasp": "A08",
        "cwe": "CWE-502",
        "title": "Unsafe YAML deserialization",
        "recommendation": "Use yaml.safe_load() to avoid arbitrary object deserialization.",
    },
]

SEVERITY_WEIGHTS = {"Critical": 25, "High": 10, "Medium": 5, "Low": 2}


def scan_rules(code: str, language: str) -> List[Dict[str, Any]]:
    """
    Run the static rule scanner over the code.

    Returns:
        List of finding dicts: {line, rule_id, title, severity, owasp, cwe,
        recommendation}.
    """
    findings = []
    lines = code.splitlines()
    for idx, line in enumerate(lines, start=1):
        for rule in RULES:
            if re.search(rule["pattern"], line, re.IGNORECASE):
                findings.append({
                    "line": idx,
                    "rule_id": rule["id"],
                    "title": rule["title"],
                    "severity": rule["severity"],
                    "owasp": rule["owasp"],
                    "cwe": rule["cwe"],
                    "recommendation": rule["recommendation"],
                    "snippet": line.strip(),
                })
    return findings


def compute_risk_score(findings: List[Dict[str, Any]]) -> int:
    """Compute a 0-100 risk score from finding severities."""
    points = sum(SEVERITY_WEIGHTS.get(f["severity"], 2) for f in findings)
    # Diminishing returns: cap at 100
    return min(100, points)


def severity_counts(findings: List[Dict[str, Any]]) -> Dict[str, int]:
    counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    for f in findings:
        counts[f["severity"]] = counts.get(f["severity"], 0) + 1
    return counts


def build_review_prompt(code: str, language: str, findings: List[Dict[str, Any]]) -> str:
    """
    Build the Gemini prompt for AI code review.

    Grounded with the rule-scanner findings so the AI explanation is consistent
    with what the static analyzer detected.
    """
    rule_summary = "\n".join(
        f"- Line {f['line']}: {f['title']} [{f['severity']}] "
        f"(OWASP {f['owasp']}, {f['cwe']})"
        for f in findings
    ) or "None detected by static rules."

    return (
        "You are CyberShield AI, a secure code reviewer.\n\n"
        f"Language: {language}\n\n"
        "CODE TO REVIEW:\n```" + language.lower() + "\n" + code + "\n```\n\n"
        "Static analysis already flagged these potential issues:\n"
        f"{rule_summary}\n\n"
        "Review the code for security vulnerabilities. For each vulnerability explain:\n"
        "1. Vulnerability\n2. Severity\n3. Business Impact\n"
        "4. Secure Alternative\n5. Fixed Code\n6. OWASP Mapping\n7. CWE Mapping\n\n"
        "Then provide a single '## Secure Code' section with the full corrected "
        "version of the code using a fenced code block.\n\n"
        "Return Markdown only."
    )


async def ai_review(code: str, language: str, findings: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Produce the AI explanation + secure code for the reviewed code.

    Falls back to a rule-based summary when Gemini is unavailable.

    Returns:
        {ai_explanation: str, secure_code: str}
    """
    prompt = build_review_prompt(code, language, findings)

    if not is_available():
        secure = "\n".join(f"# {f['title']} ({f['severity']}): {f['recommendation']}" for f in findings)
        return {
            "ai_explanation": (
                "Gemini is not configured, so this is a rule-based summary. "
                "Configure GEMINI_API_KEY for a full AI review.\n\n" + secure
            ),
            "secure_code": "",
        }

    try:
        text = await generate(prompt)
        # Split off a "## Secure Code" section if present
        secure_code = ""
        explanation = text
        match = re.split(r"\n##\s*Secure Code\s*\n", text, maxsplit=1, flags=re.IGNORECASE)
        if len(match) == 2:
            explanation = match[0].strip()
            secure_code = match[1].strip()
        return {"ai_explanation": explanation, "secure_code": secure_code}
    except Exception as e:
        return {
            "ai_explanation": f"AI review failed: {e}",
            "secure_code": "",
        }
