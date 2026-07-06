
import re
from typing import List, Dict, Any
from app.data.secret_patterns import SECRET_PATTERNS, IGNORE_DIRS


def scan_secrets(content: str, file_path: str) -> List[Dict[str, Any]]:
    """
    Scan a file's content for secrets using the secret patterns.
    Returns a list of findings.
    """
    findings = []
    seen_secrets = set()  # to avoid duplicates

    # Skip files in ignore directories
    for ignored_dir in IGNORE_DIRS:
        if ignored_dir in file_path:
            return []

    lines = content.splitlines()

    for pattern in SECRET_PATTERNS:
        for line_num, line in enumerate(lines, start=1):
            matches = re.findall(pattern["regex"], line, re.IGNORECASE)
            for match in matches:
                # Create a unique key for the secret to avoid duplicates
                secret_key = f"{pattern['name']}:{match}:{file_path}"
                if secret_key in seen_secrets:
                    continue
                seen_secrets.add(secret_key)

                findings.append({
                    "type": pattern["name"],
                    "file": file_path,
                    "line": line_num,
                    "secret": match,
                    "severity": pattern["severity"],
                    "recommendation": pattern["recommendation"]
                })

    return findings


def aggregate_secret_findings(findings: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Aggregate findings into a summary with counts.
    """
    summary = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "total": 0
    }

    for finding in findings:
        severity = finding["severity"].lower()
        if severity in summary:
            summary[severity] += 1
        summary["total"] += 1

    return {
        "secret_summary": summary,
        "detailed_findings": findings
    }
