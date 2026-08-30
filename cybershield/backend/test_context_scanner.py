"""
Quick test to verify the context-aware scanner works correctly.
Tests that false positives are filtered and true positives are kept.
"""
import sys
sys.path.insert(0, ".")

from app.services.github_scanner import scan_file_content, scan_dangerous_code
from app.scanner.context_analyzer import is_excluded_file, classify_match_context, detect_language_from_path, _is_in_string


def test_excluded_files():
    """Test that scanner own files and educational data are excluded."""
    assert is_excluded_file("app/scanner/rules/python_rules.py") == True
    assert is_excluded_file("app/scanner/security_rules.py") == True
    assert is_excluded_file("app/services/github_scanner.py") == True
    assert is_excluded_file("app/data/defense_scenarios.py") == True
    assert is_excluded_file("app/data/attack_labs.py") == True
    assert is_excluded_file("app/data/glossary.py") == True
    assert is_excluded_file("app/data/risky_packages.py") == True
    assert is_excluded_file("app/data/daily_templates.py") == True
    assert is_excluded_file("app/data/cwe_mapping.py") == True
    assert is_excluded_file("app/routes/auth_routes.py") == False
    assert is_excluded_file("app/services/scanner_service.py") == False
    print("PASS: test_excluded_files")


def test_string_context_detection():
    """Test that matches inside strings are detected."""
    # Line with os.system inside a string literal
    line = '    "os.system(convert {filename} output.pdf)"'
    ctx = classify_match_context([line], 0, 8, "test.py", "python")
    assert ctx["is_false_positive"] == True
    assert ctx["reason"] == "string"

    # Line with actual os.system call (not in string)
    line2 = '    os.system(f"convert {filename} output.pdf")'
    ctx2 = classify_match_context([line2], 0, 4, "test.py", "python")
    assert ctx2["is_false_positive"] == False

    print("PASS: test_string_context_detection")


def test_comment_detection():
    """Test that matches in comments are detected."""
    # Python comment
    line = "    # os.system('command')"
    ctx = classify_match_context([line], 0, 8, "test.py", "python")
    assert ctx["is_false_positive"] == True
    assert ctx["reason"] == "comment"

    # JavaScript comment
    line2 = "    // eval('code')"
    ctx2 = classify_match_context([line2], 0, 8, "test.js", "javascript")
    assert ctx2["is_false_positive"] == True
    assert ctx2["reason"] == "comment"

    print("PASS: test_comment_detection")


def test_regex_pattern_detection():
    """Test that matches inside regex patterns are detected."""
    line = '        "pattern": r"exec\\s*\\("'
    ctx = classify_match_context([line], 0, 24, "rules.py", "python")
    assert ctx["is_false_positive"] == True
    assert ctx["reason"] in ("regex_pattern", "string")  # Either is correct

    print("PASS: test_regex_pattern_detection")


def test_scan_educational_data_false_positive():
    """Test that scanning educational data produces no findings."""
    content = '''
vulnerable_code = """
import os
os.system("convert " + filename + "output.pdf")
"""

hint = "Filename is passed to system() or exec()"
'''
    findings = scan_file_content(content, "app/data/defense_scenarios.py")
    assert len(findings) == 0, f"Expected 0 findings, got {len(findings)}: {findings}"
    print("PASS: test_scan_educational_data_false_positive")


def test_scan_own_rules_no_self_flag():
    """Test that the scanner doesn't flag its own rule definitions."""
    content = '''
PYTHON_RULES = [
    {
        "id": "CS101",
        "pattern": r"eval\\s*\\(",
    },
    {
        "id": "CS102",
        "pattern": r"exec\\s*\\(",
    },
]
'''
    findings = scan_dangerous_code(content, "app/scanner/rules/python_rules.py")
    assert len(findings) == 0, f"Expected 0 findings, got {len(findings)}: {findings}"
    print("PASS: test_scan_own_rules_no_self_flag")


def test_scan_real_vulnerability():
    """Test that real vulnerabilities are still detected."""
    content = '''
import os
import subprocess

def run_command(user_input):
    os.system(user_input)  # This is a real vulnerability
    subprocess.run(user_input, shell=True)  # This is also real
'''
    findings = scan_dangerous_code(content, "app/services/scanner_service.py")
    finding_types = [f["type"] for f in findings]
    assert "Shell Execution" in finding_types, f"Expected 'Shell Execution' in {finding_types}"
    print("PASS: test_scan_real_vulnerability")


def test_scan_real_secret():
    """Test that real hardcoded secrets are detected."""
    content = '''
AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE"
MONGO_URI = "mongodb+srv://user:pass@cluster.mongodb.net/db"
JWT_SECRET_KEY = "super-secret-key-12345"
'''
    findings = scan_file_content(content, "app/config/settings.py")
    finding_types = [f["type"] for f in findings]
    assert "AWS Access Key" in finding_types, f"Expected 'AWS Access Key' in {finding_types}"
    assert "MongoDB URI" in finding_types, f"Expected 'MongoDB URI' in {finding_types}"
    assert "JWT Secret Assignment" in finding_types, f"Expected 'JWT Secret Assignment' in {finding_types}"
    print("PASS: test_scan_real_secret")


def test_scan_token_in_ui_config():
    """Test that token in Monaco editor config is NOT flagged."""
    content = '''
const theme = {
    token: "comment",
    foreground: "6B7280",
    fontStyle: "italic"
};
'''
    findings = scan_file_content(content, "src/hooks/useCodeViewer.js")
    assert len(findings) == 0, f"Expected 0 findings, got {len(findings)}: {findings}"
    print("PASS: test_scan_token_in_ui_config")


def test_scan_glossary_aws_example():
    """Test that AWS example in glossary is NOT flagged."""
    content = '''
"example": "api_key = 'AKIA1234567890EXAMPLE' in a repo.",
"definition": "A hardcoded secret is a credential embedded in source code.",
'''
    findings = scan_file_content(content, "app/data/glossary.py")
    assert len(findings) == 0, f"Expected 0 findings, got {len(findings)}: {findings}"
    print("PASS: test_scan_glossary_aws_example")


if __name__ == "__main__":
    test_excluded_files()
    test_string_context_detection()
    test_comment_detection()
    test_regex_pattern_detection()
    test_scan_educational_data_false_positive()
    test_scan_own_rules_no_self_flag()
    test_scan_real_vulnerability()
    test_scan_real_secret()
    test_scan_token_in_ui_config()
    test_scan_glossary_aws_example()
    print("\n=== ALL TESTS PASSED ===")
