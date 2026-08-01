"""
CyberShield SAST Rules — Module D6

Language-specific and common security rules for the Static Analysis Engine.
"""

from app.scanner.rules.common_rules import COMMON_RULES
from app.scanner.rules.python_rules import PYTHON_RULES
from app.scanner.rules.javascript_rules import JAVASCRIPT_RULES
from app.scanner.rules.java_rules import JAVA_RULES

# Combined rule registry: rule_id → rule_dict
ALL_RULES = {}
for rule_set in [COMMON_RULES, PYTHON_RULES, JAVASCRIPT_RULES, JAVA_RULES]:
    for rule in rule_set:
        ALL_RULES[rule["id"]] = rule

__all__ = ["ALL_RULES", "COMMON_RULES", "PYTHON_RULES", "JAVASCRIPT_RULES", "JAVA_RULES"]
