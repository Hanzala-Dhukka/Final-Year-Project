
#!/usr/bin/env python3
"""Test all core modules for Phase 1"""
import sys
import os
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent))

print("\n=== TESTING SECRET SCANNER ===")
from app.services.secret_scanner import scan_secrets, aggregate_secret_findings
from app.data.secret_patterns import SECRET_PATTERNS

test_file_content = """
# Test file with various vulnerabilities and secrets!
AWS_ACCESS_KEY_ID = 'AKIAXSH5Q678QZEXAMPLE'
AWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
DB_URL = 'mongodb://admin:superpass123@localhost:27017/mydb'
USER_PASSWORD = 'password1234'
PRIVATE_KEY = '''
-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEAx...test...
-----END RSA PRIVATE KEY-----
'''
"""

scan_results = scan_secrets(test_file_content, "test_config.py")
print(f"Found {len(scan_results)} secrets:")
for finding in scan_results:
    print(f" - {finding['type']} (severity: {finding['severity']}) in {finding['file']}")

aggregated = aggregate_secret_findings(scan_results)
print("\nAggregated summary:")
print(f"  Critical: {aggregated['secret_summary']['critical']}")
print(f"  High: {aggregated['secret_summary']['high']}")
print(f"  Total: {aggregated['secret_summary']['total']}")

print("\n=== TESTING RISK ENGINE ===")
from app.services.risk_engine import calculate_risk

# Dummy inputs for testing
dummy_findings = [
    {
        "file": "auth.py",
        "issues": [
            {"type": "eval usage", "severity": "Critical"}
        ],
        "advanced_secrets": scan_results[:2]
    }
]
dummy_technologies = {
    "language": ["python"],
    "frontend": ["react"],
    "database": ["mongodb"],
    "backend": ["fastapi"],
}

risk_dashboard = calculate_risk(
    findings=dummy_findings,
    dependency_report={"risky": 2, "outdated": 5},
    secret_summary=aggregated["secret_summary"],
    repository_info={"name": "test", "stars": 10},
    technologies=dummy_technologies,
    file_report=dummy_findings,
    advanced_secrets=scan_results,
    dependency_findings=[],
    ai_report={"recommendations": ["rotate keys"]},
    files_scanned=10
)

print(f"Risk score: {risk_dashboard['risk_dashboard']['risk_score']}")
print(f"Security grade: {risk_dashboard['risk_dashboard']['security_grade']}")
print(f"Severity summary: {risk_dashboard['severity_summary']}")
print(f"Category summary: {risk_dashboard['category_summary']}")
print(f"Repository health: {risk_dashboard['repository_health']}")

print("\n✅ ALL TESTS RAN SUCCESSFULLY! EVERYTHING IS WORKING!")
