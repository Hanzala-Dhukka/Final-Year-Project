import re
from typing import Dict, Any, List, Tuple


class DefenseValidator:
    """Validate user defense code submissions"""
    
    @staticmethod
    def validate_sql_injection(user_code: str) -> Dict[str, Any]:
        """
        Validate SQL Injection defense code
        
        Checks for:
        - Parameterized queries (execute with ?)
        - Prepared statements
        - No string concatenation in SQL
        """
        score = 0
        feedback = []
        best_practices = []
        
        # Check for parameterized queries
        has_parameterized = bool(re.search(r'execute\s*\([^,]+,\s*\(', user_code))
        has_question_mark = '?' in user_code
        has_prepared = 'prepare' in user_code.lower()
        
        if has_parameterized and has_question_mark:
            score += 80
            feedback.append("✅ Excellent! You're using parameterized queries.")
            best_practices.append("Using parameterized queries with placeholders")
        elif has_prepared:
            score += 70
            feedback.append("✅ Good! You're using prepared statements.")
            best_practices.append("Using prepared statements")
        else:
            feedback.append("❌ Missing parameterized queries. Use execute(query, (params,))")
        
        # Check for dangerous patterns
        has_concat = bool(re.search(r'f["\'].*SELECT.*{', user_code))
        has_format = bool(re.search(r'format.*SELECT', user_code, re.IGNORECASE))
        has_plus = bool(re.search(r'\+.*SELECT', user_code))
        
        if has_concat or has_format or has_plus:
            score -= 30
            feedback.append("❌ Warning: String concatenation detected in SQL query")
        
        # Check for ORM usage
        if 'orm' in user_code.lower() or 'session.query' in user_code or 'Model.query' in user_code:
            score += 10
            best_practices.append("Using ORM framework")
        
        # Check for input validation
        if 'validate' in user_code.lower() or 'sanitize' in user_code.lower():
            score += 10
            best_practices.append("Input validation implemented")
        
        # Normalize score
        score = max(0, min(100, score))
        
        # Determine status
        if score >= 80:
            status = "Passed"
        elif score >= 50:
            status = "Partial"
        else:
            status = "Failed"
        
        return {
            "score": score,
            "status": status,
            "feedback": "\n".join(feedback),
            "best_practices": best_practices,
            "details": {
                "parameterized": has_parameterized,
                "prepared_statements": has_prepared,
                "no_concatenation": not (has_concat or has_format or has_plus)
            }
        }
    
    @staticmethod
    def validate_xss(user_code: str) -> Dict[str, Any]:
        """
        Validate XSS defense code
        
        Checks for:
        - html.escape()
        - DOMPurify
        - sanitize functions
        - CSP headers
        """
        score = 0
        feedback = []
        best_practices = []
        
        # Check for html.escape
        has_html_escape = 'html.escape' in user_code or 'escape(' in user_code
        
        # Check for DOMPurify
        has_dompurify = 'DOMPurify' in user_code or 'dompurify' in user_code.lower()
        
        # Check for sanitize
        has_sanitize = 'sanitize' in user_code.lower()
        
        # Check for CSP
        has_csp = 'Content-Security-Policy' in user_code or 'CSP' in user_code
        
        # Scoring
        if has_html_escape:
            score += 40
            feedback.append("✅ Good! Using html.escape() for output encoding")
            best_practices.append("HTML escaping implemented")
        
        if has_dompurify:
            score += 30
            feedback.append("✅ Excellent! Using DOMPurify for sanitization")
            best_practices.append("DOMPurify sanitization")
        
        if has_sanitize and not has_html_escape:
            score += 20
            feedback.append("⚠️ Sanitization found, but consider also using html.escape()")
        
        if has_csp:
            score += 20
            feedback.append("✅ Excellent! Content Security Policy mentioned")
            best_practices.append("CSP headers implemented")
        
        # Check for dangerous patterns
        has_innerhtml = 'innerHTML' in user_code
        has_dangerouslysetinnerhtml = 'dangerouslySetInnerHTML' in user_code
        
        if has_innerhtml or has_dangerouslysetinnerhtml:
            score -= 20
            feedback.append("❌ Warning: innerHTML or dangerouslySetInnerHTML detected")
        
        # Check for template escaping
        if 'jinja2' in user_code.lower() or 'autoescape' in user_code.lower():
            score += 10
            best_practices.append("Using auto-escaping templating engine")
        
        # Normalize score
        score = max(0, min(100, score))
        
        # Determine status
        if score >= 80:
            status = "Passed"
        elif score >= 50:
            status = "Partial"
        else:
            status = "Failed"
        
        return {
            "score": score,
            "status": status,
            "feedback": "\n".join(feedback) if feedback else "❌ No XSS protection detected",
            "best_practices": best_practices,
            "details": {
                "html_escape": has_html_escape,
                "dompurify": has_dompurify,
                "csp": has_csp,
                "no_dangerous_methods": not (has_innerhtml or has_dangerouslysetinnerhtml)
            }
        }
    
    @staticmethod
    def validate_command_injection(user_code: str) -> Dict[str, Any]:
        """
        Validate Command Injection defense code
        
        Checks for:
        - subprocess.run() or subprocess.call()
        - shell=False
        - Argument list (not string)
        - No os.system()
        """
        score = 0
        feedback = []
        best_practices = []
        
        # Check for subprocess usage
        has_subprocess_run = 'subprocess.run' in user_code
        has_subprocess_call = 'subprocess.call' in user_code
        has_subprocess = has_subprocess_run or has_subprocess_call
        
        # Check for shell=False
        has_shell_false = 'shell=False' in user_code or 'shell = False' in user_code
        
        # Check for os.system (bad)
        has_os_system = 'os.system' in user_code
        
        # Check for argument list (not string concatenation)
        has_list_args = bool(re.search(r'subprocess\.\w+\s*\(\[', user_code))
        
        # Scoring
        if has_subprocess and has_shell_false:
            score += 60
            feedback.append("✅ Excellent! Using subprocess with shell=False")
            best_practices.append("Using subprocess with shell=False")
        
        if has_list_args:
            score += 20
            feedback.append("✅ Good! Using argument list instead of string")
            best_practices.append("Passing arguments as list")
        
        if has_os_system:
            score -= 50
            feedback.append("❌ Critical: os.system() detected - this is vulnerable!")
        
        # Check for input validation
        if 'validate' in user_code.lower() or 'whitelist' in user_code.lower():
            score += 10
            best_practices.append("Input validation implemented")
        
        # Check for shlex.quote
        if 'shlex' in user_code:
            score += 10
            best_practices.append("Using shlex for safe command construction")
        
        # Normalize score
        score = max(0, min(100, score))
        
        # Determine status
        if score >= 80:
            status = "Passed"
        elif score >= 50:
            status = "Partial"
        else:
            status = "Failed"
        
        return {
            "score": score,
            "status": status,
            "feedback": "\n".join(feedback) if feedback else "❌ No command injection protection detected",
            "best_practices": best_practices,
            "details": {
                "uses_subprocess": has_subprocess,
                "shell_false": has_shell_false,
                "no_os_system": not has_os_system,
                "uses_list_args": has_list_args
            }
        }
    
    @staticmethod
    def validate_path_traversal(user_code: str) -> Dict[str, Any]:
        """
        Validate Path Traversal defense code
        
        Checks for:
        - pathlib usage
        - resolve() for canonical path
        - basename() for filename only
        - startswith() check
        """
        score = 0
        feedback = []
        best_practices = []
        
        # Check for pathlib
        has_pathlib = 'pathlib' in user_code or 'Path(' in user_code
        
        # Check for resolve()
        has_resolve = 'resolve()' in user_code or 'resolve' in user_code
        
        # Check for basename
        has_basename = 'basename' in user_code
        
        # Check for startswith validation
        has_startswith = 'startswith' in user_code
        
        # Check for os.path.join (better than string concatenation)
        has_path_join = 'os.path.join' in user_code or '/' in user_code or '\\' in user_code
        
        # Scoring
        if has_pathlib:
            score += 30
            feedback.append("✅ Good! Using pathlib for path operations")
            best_practices.append("Using pathlib library")
        
        if has_resolve:
            score += 25
            feedback.append("✅ Excellent! Using resolve() for canonical path")
            best_practices.append("Resolving paths to canonical form")
        
        if has_basename:
            score += 20
            feedback.append("✅ Good! Using basename() to extract filename")
            best_practices.append("Extracting only basename")
        
        if has_startswith:
            score += 25
            feedback.append("✅ Excellent! Validating path is within allowed directory")
            best_practices.append("Path validation with startswith()")
        
        # Check for dangerous patterns
        has_direct_concat = bool(re.search(r'f["\'].*\{.*\}.*/', user_code))
        has_string_add = bool(re.search(r'\+\s*["\']/', user_code))
        
        if has_direct_concat or has_string_add:
            score -= 20
            feedback.append("⚠️ Warning: String concatenation in path detected")
        
        # Check for chroot or jail
        if 'chroot' in user_code.lower():
            score += 10
            best_practices.append("Using chroot for isolation")
        
        # Normalize score
        score = max(0, min(100, score))
        
        # Determine status
        if score >= 80:
            status = "Passed"
        elif score >= 50:
            status = "Partial"
        else:
            status = "Failed"
        
        return {
            "score": score,
            "status": status,
            "feedback": "\n".join(feedback) if feedback else "❌ No path traversal protection detected",
            "best_practices": best_practices,
            "details": {
                "uses_pathlib": has_pathlib,
                "uses_resolve": has_resolve,
                "uses_basename": has_basename,
                "validates_path": has_startswith
            }
        }
    
    @staticmethod
    def validate_defense(category: str, user_code: str) -> Dict[str, Any]:
        """
        Main validation function - routes to specific validator
        
        Args:
            category: OWASP category
            user_code: User's defense code
            
        Returns:
            Validation result with score and feedback
        """
        validators = {
            "SQL Injection": DefenseValidator.validate_sql_injection,
            "XSS": DefenseValidator.validate_xss,
            "Command Injection": DefenseValidator.validate_command_injection,
            "Path Traversal": DefenseValidator.validate_path_traversal
        }
        
        validator = validators.get(category)
        if not validator:
            return {
                "score": 0,
                "status": "Failed",
                "feedback": f"Unknown category: {category}",
                "best_practices": [],
                "details": {}
            }
        
        return validator(user_code)