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
    def validate_broken_authentication(user_code: str) -> Dict[str, Any]:
        score = 0
        feedback = []
        best_practices = []
        code_lower = user_code.lower()

        if 'mfa' in code_lower or 'multi-factor' in code_lower or 'otp' in code_lower or 'totp' in code_lower:
            score += 30
            feedback.append("✅ Multi-factor authentication implemented")
            best_practices.append("Multi-factor authentication")
        if 'bcrypt' in code_lower or 'argon2' in code_lower or 'scrypt' in code_lower or 'hashlib' in code_lower:
            score += 25
            feedback.append("✅ Strong password hashing used")
            best_practices.append("Strong password hashing")
        if 'lockout' in code_lower or 'rate_limit' in code_lower or 'throttle' in code_lower or 'brute' in code_lower:
            score += 20
            feedback.append("✅ Account lockout / rate limiting detected")
            best_practices.append("Brute-force protection")
        if 'password_policy' in code_lower or 'min_length' in code_lower or 'regex' in code_lower:
            score += 15
            feedback.append("✅ Password policy enforced")
            best_practices.append("Password policy")
        if 'session' in code_lower and ('expire' in code_lower or 'timeout' in code_lower):
            score += 10
            feedback.append("✅ Session expiration configured")
            best_practices.append("Session expiration")
        if 'os.system' in user_code:
            score -= 20
            feedback.append("❌ Avoid os.system()")

        score = max(0, min(100, score))
        status = "Passed" if score >= 80 else ("Partial" if score >= 50 else "Failed")
        return {"score": score, "status": status, "feedback": "\n".join(feedback) if feedback else "❌ No authentication hardening detected", "best_practices": best_practices, "details": {}}

    @staticmethod
    def validate_csrf(user_code: str) -> Dict[str, Any]:
        score = 0
        feedback = []
        best_practices = []
        code_lower = user_code.lower()

        if 'csrf' in code_lower:
            score += 40
            feedback.append("✅ CSRF token/reference detected")
            best_practices.append("CSRF token protection")
        if 'samesite' in code_lower or 'same_site' in code_lower:
            score += 25
            feedback.append("✅ SameSite cookie attribute set")
            best_practices.append("SameSite cookies")
        if 'referer' in code_lower or 'origin' in code_lower:
            score += 15
            feedback.append("✅ Origin/Referer header validation")
            best_practices.append("Origin validation")
        if 'double_submit' in code_lower or 'synchronizer' in code_lower:
            score += 15
            feedback.append("✅ Double-submit or synchronizer token pattern")
            best_practices.append("Double-submit cookie pattern")
        if '<img' in user_code.lower() or '<form' in user_code.lower():
            score -= 10
            feedback.append("⚠️ HTML form/img detected — ensure it's defense code, not attack")

        score = max(0, min(100, score))
        status = "Passed" if score >= 80 else ("Partial" if score >= 50 else "Failed")
        return {"score": score, "status": status, "feedback": "\n".join(feedback) if feedback else "❌ No CSRF protection detected", "best_practices": best_practices, "details": {}}

    @staticmethod
    def validate_ssrf(user_code: str) -> Dict[str, Any]:
        score = 0
        feedback = []
        best_practices = []
        code_lower = user_code.lower()

        if 'allowlist' in code_lower or 'whitelist' in code_lower or 'allowed_hosts' in code_lower:
            score += 35
            feedback.append("✅ URL allowlist/whitelist implemented")
            best_practices.append("URL allowlist")
        if '169.254' in user_code or 'metadata' in code_lower and ('block' in code_lower or 'deny' in code_lower):
            score += 25
            feedback.append("✅ Cloud metadata endpoint blocked")
            best_practices.append("Block metadata endpoints")
        if 'validate' in code_lower and ('url' in code_lower or 'domain' in code_lower):
            score += 20
            feedback.append("✅ URL validation implemented")
            best_practices.append("URL validation")
        if 'http' in code_lower and ('parse' in code_lower or 'urlparse' in code_lower):
            score += 10
            feedback.append("✅ URL parsing for validation")
            best_practices.append("URL parsing")
        if 'file://' in user_code:
            score -= 15
            feedback.append("⚠️ file:// protocol detected — consider blocking local file access")

        score = max(0, min(100, score))
        status = "Passed" if score >= 80 else ("Partial" if score >= 50 else "Failed")
        return {"score": score, "status": status, "feedback": "\n".join(feedback) if feedback else "❌ No SSRF protection detected", "best_practices": best_practices, "details": {}}

    @staticmethod
    def validate_idor(user_code: str) -> Dict[str, Any]:
        score = 0
        feedback = []
        best_practices = []
        code_lower = user_code.lower()

        if 'ownership' in code_lower or 'owner' in code_lower and 'check' in code_lower:
            score += 30
            feedback.append("✅ Ownership verification detected")
            best_practices.append("Ownership verification")
        if 'uuid' in code_lower or 'unguessable' in code_lower or 'token' in code_lower:
            score += 25
            feedback.append("✅ UUID / unguessable references used")
            best_practices.append("UUID object references")
        if 'authorize' in code_lower or 'permission' in code_lower or 'access_control' in code_lower:
            score += 25
            feedback.append("✅ Authorization check present")
            best_practices.append("Server-side authorization")
        if 'session' in code_lower and ('user' in code_lower or 'id' in code_lower):
            score += 10
            feedback.append("✅ Session-based user identification")
            best_practices.append("Session-based user binding")

        score = max(0, min(100, score))
        status = "Passed" if score >= 80 else ("Partial" if score >= 50 else "Failed")
        return {"score": score, "status": status, "feedback": "\n".join(feedback) if feedback else "❌ No IDOR protection detected", "best_practices": best_practices, "details": {}}

    @staticmethod
    def validate_file_upload(user_code: str) -> Dict[str, Any]:
        score = 0
        feedback = []
        best_practices = []
        code_lower = user_code.lower()

        if 'allowed_ext' in code_lower or 'whitelist' in code_lower or 'mime' in code_lower:
            score += 30
            feedback.append("✅ File extension/MIME type validation")
            best_practices.append("File type validation")
        if 'secure_filename' in code_lower or 'basename' in code_lower:
            score += 25
            feedback.append("✅ Secure filename extraction")
            best_practices.append("Secure filename handling")
        if 'path' in code_lower and ('resolve' in code_lower or 'join' in code_lower):
            score += 15
            feedback.append("✅ Safe path construction")
            best_practices.append("Safe path construction")
        if 'content_type' in code_lower or 'file_type' in code_lower:
            score += 15
            feedback.append("✅ Content-type validation")
            best_practices.append("Content-type verification")
        if 'random' in code_lower or 'token' in code_lower or 'uuid' in code_lower:
            score += 15
            feedback.append("✅ Random filename generation")
            best_practices.append("Random filename generation")

        score = max(0, min(100, score))
        status = "Passed" if score >= 80 else ("Partial" if score >= 50 else "Failed")
        return {"score": score, "status": status, "feedback": "\n".join(feedback) if feedback else "❌ No file upload protection detected", "best_practices": best_practices, "details": {}}

    @staticmethod
    def validate_xxe(user_code: str) -> Dict[str, Any]:
        score = 0
        feedback = []
        best_practices = []
        code_lower = user_code.lower()

        if 'defusedxml' in code_lower or 'defuse' in code_lower:
            score += 40
            feedback.append("✅ Using defusedxml — excellent choice")
            best_practices.append("defusedxml library")
        if 'resolve' in code_lower and ('false' in code_lower or '0' in code_lower or 'no' in code_lower):
            score += 25
            feedback.append("✅ External entity resolution disabled")
            best_practices.append("Disable external entities")
        if 'dtd' in code_lower and ('disable' in code_lower or 'disallow' in code_lower or 'false' in code_lower):
            score += 20
            feedback.append("✅ DTD processing disabled")
            best_practices.append("Disable DTD processing")
        if 'etree' in code_lower and 'iterparse' in code_lower:
            score += 15
            feedback.append("✅ Using iterative XML parsing")
            best_practices.append("Safe XML parsing")
        if 'lxml' in code_lower and 'resolve_entities' in code_lower:
            score += 15
            feedback.append("✅ lxml with entity resolution disabled")
            best_practices.append("lxml safe config")

        score = max(0, min(100, score))
        status = "Passed" if score >= 80 else ("Partial" if score >= 50 else "Failed")
        return {"score": score, "status": status, "feedback": "\n".join(feedback) if feedback else "❌ No XXE protection detected", "best_practices": best_practices, "details": {}}

    @staticmethod
    def validate_security_misconfiguration(user_code: str) -> Dict[str, Any]:
        score = 0
        feedback = []
        best_practices = []
        code_lower = user_code.lower()

        if 'debug' in code_lower and ('false' in code_lower or 'off' in code_lower):
            score += 25
            feedback.append("✅ Debug mode disabled")
            best_practices.append("Disable debug mode")
        if 'default' in code_lower and ('remove' in code_lower or 'change' in code_lower or 'disable' in code_lower):
            score += 20
            feedback.append("✅ Default credentials/settings addressed")
            best_practices.append("Remove default credentials")
        if 'https' in code_lower or 'tls' in code_lower or 'ssl' in code_lower:
            score += 20
            feedback.append("✅ HTTPS/TLS configured")
            best_practices.append("Enforce HTTPS")
        if 'cors' in code_lower:
            score += 15
            feedback.append("✅ CORS configuration present")
            best_practices.append("CORS configuration")
        if 'header' in code_lower and ('security' in code_lower or 'x-frame' in code_lower or 'csp' in code_lower):
            score += 15
            feedback.append("✅ Security headers configured")
            best_practices.append("Security headers")
        if 'verbose' in code_lower and ('false' in code_lower or 'error' in code_lower):
            score += 10
            feedback.append("✅ Verbose error responses disabled")
            best_practices.append("Disable verbose errors")

        score = max(0, min(100, score))
        status = "Passed" if score >= 80 else ("Partial" if score >= 50 else "Failed")
        return {"score": score, "status": status, "feedback": "\n".join(feedback) if feedback else "❌ No security hardening detected", "best_practices": best_practices, "details": {}}

    @staticmethod
    def validate_insecure_deserialization(user_code: str) -> Dict[str, Any]:
        score = 0
        feedback = []
        best_practices = []
        code_lower = user_code.lower()

        if 'json' in code_lower and ('loads' in code_lower or 'load' in code_lower):
            score += 30
            feedback.append("✅ Using JSON (safe alternative to pickle)")
            best_practices.append("JSON instead of pickle")
        if 'pickle' in code_lower and ('avoid' in code_lower or 'never' in code_lower or 'dangerous' in code_lower or 'json' in code_lower):
            score += 25
            feedback.append("✅ Pickle dangers acknowledged")
            best_practices.append("Avoid native deserialization")
        if 'signed' in code_lower or 'hmac' in code_lower or 'verify' in code_lower:
            score += 25
            feedback.append("✅ Signed/verified deserialization")
            best_practices.append("Signed data formats")
        if 'schema' in code_lower and ('valid' in code_lower or 'check' in code_lower):
            score += 15
            feedback.append("✅ Schema validation applied")
            best_practices.append("Schema validation")
        if 'yaml' in code_lower and ('safe_load' in code_lower or 'safe' in code_lower):
            score += 15
            feedback.append("✅ Safe YAML loading")
            best_practices.append("Safe YAML parsing")

        score = max(0, min(100, score))
        status = "Passed" if score >= 80 else ("Partial" if score >= 50 else "Failed")
        return {"score": score, "status": status, "feedback": "\n".join(feedback) if feedback else "❌ No deserialization protection detected", "best_practices": best_practices, "details": {}}

    @staticmethod
    def validate_jwt_attacks(user_code: str) -> Dict[str, Any]:
        score = 0
        feedback = []
        best_practices = []
        code_lower = user_code.lower()

        if 'algorithm' in code_lower and ('verify' in code_lower or 'pin' in code_lower or 'whitelist' in code_lower):
            score += 30
            feedback.append("✅ Algorithm verification/pinning implemented")
            best_practices.append("JWT algorithm pinning")
        if 'secret' in code_lower and ('strong' in code_lower or 'length' in code_lower or 'generate' in code_lower):
            score += 25
            feedback.append("✅ Strong secret/key management")
            best_practices.append("Strong JWT secrets")
        if 'expir' in code_lower or 'exp' in code_lower or 'ttl' in code_lower:
            score += 20
            feedback.append("✅ Token expiration configured")
            best_practices.append("Token expiration")
        if 'rsa' in code_lower or 'ecdsa' in code_lower or 'asymmetric' in code_lower:
            score += 15
            feedback.append("✅ Asymmetric key signing")
            best_practices.append("Asymmetric JWT signing")
        if 'refresh' in code_lower:
            score += 10
            feedback.append("✅ Refresh token pattern")
            best_practices.append("Refresh token rotation")

        score = max(0, min(100, score))
        status = "Passed" if score >= 80 else ("Partial" if score >= 50 else "Failed")
        return {"score": score, "status": status, "feedback": "\n".join(feedback) if feedback else "❌ No JWT hardening detected", "best_practices": best_practices, "details": {}}

    @staticmethod
    def validate_api_security(user_code: str) -> Dict[str, Any]:
        score = 0
        feedback = []
        best_practices = []
        code_lower = user_code.lower()

        if 'auth' in code_lower and ('check' in code_lower or 'verify' in code_lower or 'decorator' in code_lower or 'required' in code_lower):
            score += 30
            feedback.append("✅ Authentication check on endpoint")
            best_practices.append("Endpoint authentication")
        if 'rate_limit' in code_lower or 'throttle' in code_lower:
            score += 20
            feedback.append("✅ Rate limiting implemented")
            best_practices.append("API rate limiting")
        if 'validate' in code_lower and ('input' in code_lower or 'schema' in code_lower or 'request' in code_lower):
            score += 20
            feedback.append("✅ Input validation on API requests")
            best_practices.append("Request validation")
        if 'cors' in code_lower:
            score += 10
            feedback.append("✅ CORS policy configured")
            best_practices.append("CORS policy")
        if 'scope' in code_lower or 'permission' in code_lower or 'role' in code_lower:
            score += 15
            feedback.append("✅ Scope/permission checks present")
            best_practices.append("Scope-based access control")

        score = max(0, min(100, score))
        status = "Passed" if score >= 80 else ("Partial" if score >= 50 else "Failed")
        return {"score": score, "status": status, "feedback": "\n".join(feedback) if feedback else "❌ No API security measures detected", "best_practices": best_practices, "details": {}}

    @staticmethod
    def validate_rate_limiting(user_code: str) -> Dict[str, Any]:
        score = 0
        feedback = []
        best_practices = []
        code_lower = user_code.lower()

        if 'rate_limit' in code_lower or 'ratelimit' in code_lower or 'throttle' in code_lower:
            score += 40
            feedback.append("✅ Rate limiting mechanism detected")
            best_practices.append("Rate limiting")
        if 'per_minute' in code_lower or 'per_second' in code_lower or 'burst' in code_lower:
            score += 20
            feedback.append("✅ Rate limit thresholds configured")
            best_practices.append("Rate limit thresholds")
        if 'captcha' in code_lower or 'recaptcha' in code_lower:
            score += 15
            feedback.append("✅ CAPTCHA implemented")
            best_practices.append("CAPTCHA for abuse prevention")
        if 'lockout' in code_lower or 'ban' in code_lower or 'block' in code_lower:
            score += 15
            feedback.append("✅ IP/account blocking after threshold")
            best_practices.append("Abuse blocking")
        if '429' in user_code or 'too_many' in code_lower:
            score += 10
            feedback.append("✅ Proper 429 response handling")
            best_practices.append("HTTP 429 responses")

        score = max(0, min(100, score))
        status = "Passed" if score >= 80 else ("Partial" if score >= 50 else "Failed")
        return {"score": score, "status": status, "feedback": "\n".join(feedback) if feedback else "❌ No rate limiting detected", "best_practices": best_practices, "details": {}}

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
            "Path Traversal": DefenseValidator.validate_path_traversal,
            "Broken Authentication": DefenseValidator.validate_broken_authentication,
            "CSRF": DefenseValidator.validate_csrf,
            "SSRF": DefenseValidator.validate_ssrf,
            "IDOR": DefenseValidator.validate_idor,
            "File Upload": DefenseValidator.validate_file_upload,
            "XXE": DefenseValidator.validate_xxe,
            "Security Misconfiguration": DefenseValidator.validate_security_misconfiguration,
            "Insecure Deserialization": DefenseValidator.validate_insecure_deserialization,
            "JWT Attacks": DefenseValidator.validate_jwt_attacks,
            "API Security": DefenseValidator.validate_api_security,
            "Rate Limiting": DefenseValidator.validate_rate_limiting,
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