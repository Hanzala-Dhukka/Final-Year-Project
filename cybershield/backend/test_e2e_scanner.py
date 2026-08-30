"""
End-to-end test: Scan actual project files and verify accuracy.
Simulates what the scanner does on a real scan.
"""
import sys
sys.path.insert(0, ".")

from app.services.github_scanner import scan_file_content, scan_dangerous_code
from app.scanner.context_analyzer import is_excluded_file
import os

PROJECT_ROOT = os.path.join(os.path.dirname(__file__), ".")

# Files that should produce NO findings (educational data, scanner rules, docs)
EXCLUDED_FILES = [
    "app/data/defense_scenarios.py",
    "app/data/attack_labs.py",
    "app/data/glossary.py",
    "app/data/risky_packages.py",
    "app/data/daily_templates.py",
    "app/data/cwe_mapping.py",
    "app/data/nist_mapping.py",
    "app/data/mitre_mapping.py",
    "app/data/owasp_mapping.py",
    "app/scanner/rules/python_rules.py",
    "app/scanner/rules/javascript_rules.py",
    "app/scanner/rules/java_rules.py",
    "app/scanner/rules/common_rules.py",
    "app/scanner/security_rules.py",
    "app/services/github_scanner.py",
]

# Files that SHOULD have real findings (actual executable code with vulnerabilities)
REAL_VULN_FILES = [
    "app/routes/scan_routes.py",
    "app/routes/github_routes.py",
]

# Files that are data/knowledge bases (no real vulnerabilities, old scanner false positives)
DATA_FILES_NO_FINDINGS = [
    "app/services/threat_analyzer.py",  # Knowledge base - all "vulnerabilities" are string descriptions
]

total_excluded_ok = 0
total_excluded_fail = 0
total_real_ok = 0
total_real_fail = 0

print("=" * 60)
print("TEST 1: Excluded files should produce NO findings")
print("=" * 60)

for file_path in EXCLUDED_FILES:
    full = os.path.join(PROJECT_ROOT, file_path)
    if not os.path.exists(full):
        print(f"  SKIP (not found): {file_path}")
        continue

    content = open(full, encoding="utf-8", errors="ignore").read()
    secret_findings = scan_file_content(content, file_path)
    code_findings = scan_dangerous_code(content, file_path)
    all_findings = secret_findings + code_findings

    if len(all_findings) == 0:
        print(f"  PASS: {file_path} -> 0 findings")
        total_excluded_ok += 1
    else:
        print(f"  FAIL: {file_path} -> {len(all_findings)} findings: {[f['type'] for f in all_findings]}")
        total_excluded_fail += 1

print(f"\n  Excluded files: {total_excluded_ok} passed, {total_excluded_fail} failed")

print("\n" + "=" * 60)
print("TEST 2: is_excluded_file should return True for excluded paths")
print("=" * 60)

for fp in EXCLUDED_FILES:
    result = is_excluded_file(fp)
    if result:
        print(f"  PASS: {fp} -> excluded")
        total_excluded_ok += 1
    else:
        print(f"  FAIL: {fp} -> NOT excluded (should be)")
        total_excluded_fail += 1

print("\n" + "=" * 60)
print("TEST 3: Real vulnerability files should still have findings")
print("=" * 60)

for file_path in REAL_VULN_FILES:
    full = os.path.join(PROJECT_ROOT, file_path)
    if not os.path.exists(full):
        print(f"  SKIP (not found): {file_path}")
        continue

    content = open(full, encoding="utf-8", errors="ignore").read()
    secret_findings = scan_file_content(content, file_path)
    code_findings = scan_dangerous_code(content, file_path)
    all_findings = secret_findings + code_findings

    if len(all_findings) > 0:
        types = [f["type"] for f in all_findings]
        print(f"  PASS: {file_path} -> {len(all_findings)} findings: {types}")
        total_real_ok += 1
    else:
        print(f"  FAIL: {file_path} -> 0 findings (should have some)")
        total_real_fail += 1

print(f"\n  Real vulnerability files: {total_real_ok} passed, {total_real_fail} failed")

print("\n" + "=" * 60)
print("TEST 3b: Data/knowledge base files should produce 0 findings")
print("=" * 60)

total_data_ok = 0
total_data_fail = 0

for file_path in DATA_FILES_NO_FINDINGS:
    full = os.path.join(PROJECT_ROOT, file_path)
    if not os.path.exists(full):
        print(f"  SKIP (not found): {file_path}")
        continue

    content = open(full, encoding="utf-8", errors="ignore").read()
    secret_findings = scan_file_content(content, file_path)
    code_findings = scan_dangerous_code(content, file_path)
    all_findings = secret_findings + code_findings

    if len(all_findings) == 0:
        print(f"  PASS: {file_path} -> 0 findings (knowledge base)")
        total_data_ok += 1
    else:
        types = [f["type"] for f in all_findings]
        print(f"  FAIL: {file_path} -> {len(all_findings)} findings: {types}")
        total_data_fail += 1

print(f"\n  Data files: {total_data_ok} passed, {total_data_fail} failed")

print("\n" + "=" * 60)
print("TEST 4: Specific false positive scenarios from old report")
print("=" * 60)

# Test: Monorepo token in UI config
ui_content = '''
const theme = {
    token: "comment",
    foreground: "6B7280",
    fontStyle: "italic"
};
'''
findings = scan_file_content(ui_content, "src/hooks/useCodeViewer.js")
if len(findings) == 0:
    print("  PASS: useCodeViewer.js token config -> 0 findings")
    total_excluded_ok += 1
else:
    print(f"  FAIL: useCodeViewer.js -> {len(findings)} findings")
    total_excluded_fail += 1

# Test: eval() inside CWE mapping string
cwe_content = '''"JavaScript eval()": "CWE-95",'''
findings = scan_dangerous_code(cwe_content, "app/data/cwe_mapping.py")
if len(findings) == 0:
    print("  PASS: cwe_mapping.py eval() in string -> 0 findings")
    total_excluded_ok += 1
else:
    print(f"  FAIL: cwe_mapping.py -> {len(findings)} findings")
    total_excluded_fail += 1

# Test: os.system in comment
comment_content = '''    # os.system("convert " + filename + " output.pdf")'''
findings = scan_dangerous_code(comment_content, "app/services/scanner_service.py")
if len(findings) == 0:
    print("  PASS: os.system in comment -> 0 findings")
    total_excluded_ok += 1
else:
    print(f"  FAIL: os.system in comment -> {len(findings)} findings")
    total_excluded_fail += 1

print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
print(f"  Total passed: {total_excluded_ok + total_real_ok}")
print(f"  Total failed: {total_excluded_fail + total_real_fail}")

if total_excluded_fail == 0 and total_real_fail == 0:
    print("\n  ALL TESTS PASSED!")
else:
    print(f"\n  {total_excluded_fail + total_real_fail} TESTS FAILED!")
    sys.exit(1)
