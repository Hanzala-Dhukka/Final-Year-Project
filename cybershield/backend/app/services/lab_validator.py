import re
from typing import Dict, Any, List


class LabValidator:
    """Validate attack payloads for interactive labs"""
    
    @staticmethod
    def validate_sql_injection(payload: str, lab_id: str) -> Dict[str, Any]:
        """
        Validate SQL injection payload
        
        Args:
            payload: User's attack payload
            lab_id: Lab identifier
            
        Returns:
            Validation result
        """
        payload_lower = payload.lower()
        
        # Check for common SQL injection patterns
        sql_patterns = {
            "or_condition": bool(re.search(r"\bOR\b\s+1\s*=\s*1", payload, re.IGNORECASE)),
            "or_true": bool(re.search(r"\bOR\b\s+['\"]?\w+['\"]?\s*=\s*['\"]?\w+['\"]?", payload, re.IGNORECASE)),
            "union_select": bool(re.search(r"\bUNION\s+SELECT\b", payload, re.IGNORECASE)),
            "sql_comment": bool(re.search(r"--", payload)),
            "always_true": bool(re.search(r"1\s*=\s*1", payload)),
            "or_1_equals_1": bool(re.search(r"'\s*OR\s*1\s*=\s*1", payload, re.IGNORECASE)),
        }
        
        # Lab-specific validation
        if lab_id == "LAB001":
            # Login bypass lab
            if sql_patterns["or_1_equals_1"] or (sql_patterns["or_condition"] and sql_patterns["sql_comment"]):
                return {
                    "success": True,
                    "points": 100,
                    "response_type": "correct",
                    "modified_query": f"SELECT * FROM users WHERE username='' {payload}",
                    "explanation": "The OR 1=1 condition makes the WHERE clause always true, bypassing authentication."
                }
        
        elif lab_id == "LAB002":
            # UNION attack lab
            if sql_patterns["union_select"]:
                return {
                    "success": True,
                    "points": 150,
                    "response_type": "correct",
                    "modified_query": f"SELECT name, price FROM products WHERE name LIKE '%{payload}%'",
                    "explanation": "UNION SELECT combines results from the users table, exposing credentials."
                }
        
        # Generic SQL injection check
        if sql_patterns["or_1_equals_1"] or sql_patterns["union_select"]:
            return {
                "success": True,
                "points": 100,
                "response_type": "correct",
                "modified_query": "Modified SQL query detected",
                "explanation": "SQL injection pattern detected."
            }
        
        return {
            "success": False,
            "points": 0,
            "response_type": "wrong",
            "modified_query": None,
            "explanation": "Payload did not match expected SQL injection pattern."
        }
    
    @staticmethod
    def validate_xss(payload: str, lab_id: str) -> Dict[str, Any]:
        """
        Validate XSS payload
        
        Args:
            payload: User's attack payload
            lab_id: Lab identifier
            
        Returns:
            Validation result
        """
        payload_lower = payload.lower()
        
        # Check for XSS patterns
        xss_patterns = {
            "script_tag": bool(re.search(r"<script[^>]*>", payload, re.IGNORECASE)),
            "img_onerror": bool(re.search(r"<img[^>]*onerror", payload, re.IGNORECASE)),
            "svg_onload": bool(re.search(r"<svg[^>]*onload", payload, re.IGNORECASE)),
            "alert_function": bool(re.search(r"alert\s*\(", payload, re.IGNORECASE)),
            "javascript_protocol": bool(re.search(r"javascript:", payload, re.IGNORECASE)),
        }
        
        # Lab-specific validation
        if lab_id == "LAB003":
            # Reflected XSS - looking for script tag with alert
            if xss_patterns["script_tag"] and xss_patterns["alert_function"]:
                return {
                    "success": True,
                    "points": 100,
                    "response_type": "correct",
                    "explanation": "Script tag with alert() executed in the browser context."
                }
        
        elif lab_id == "LAB004":
            # Stored XSS - looking for img onerror
            if xss_patterns["img_onerror"]:
                return {
                    "success": True,
                    "points": 150,
                    "response_type": "correct",
                    "explanation": "Image onerror event triggered, potentially stealing cookies."
                }
        
        # Generic XSS check
        if xss_patterns["script_tag"] or xss_patterns["img_onerror"] or xss_patterns["svg_onload"]:
            return {
                "success": True,
                "points": 100,
                "response_type": "correct",
                "explanation": "XSS pattern detected."
            }
        
        return {
            "success": False,
            "points": 0,
            "response_type": "wrong",
            "explanation": "Payload did not match expected XSS pattern."
        }
    
    @staticmethod
    def validate_command_injection(payload: str, lab_id: str) -> Dict[str, Any]:
        """
        Validate command injection payload
        
        Args:
            payload: User's attack payload
            lab_id: Lab identifier
            
        Returns:
            Validation result
        """
        # Check for command injection patterns
        cmd_patterns = {
            "semicolon": ";" in payload,
            "pipe": "|" in payload,
            "ampersand": "&" in payload,
            "backtick": "`" in payload,
            "dollar_paren": "$(" in payload,
            "newline": "\n" in payload,
            "cat_command": bool(re.search(r"\bcat\b", payload, re.IGNORECASE)),
            "etc_passwd": "/etc/passwd" in payload.lower(),
        }
        
        # Lab-specific validation
        if lab_id == "LAB005":
            # File conversion - looking for cat /etc/passwd
            if cmd_patterns["semicolon"] and cmd_patterns["cat_command"] and cmd_patterns["etc_passwd"]:
                return {
                    "success": True,
                    "points": 150,
                    "response_type": "correct",
                    "explanation": "Command chaining with semicolon executed the cat command, revealing /etc/passwd contents."
                }
        
        # Generic command injection check
        if cmd_patterns["semicolon"] or cmd_patterns["pipe"] or cmd_patterns["ampersand"]:
            return {
                "success": True,
                "points": 100,
                "response_type": "correct",
                "explanation": "Command injection pattern detected."
            }
        
        return {
            "success": False,
            "points": 0,
            "response_type": "wrong",
            "explanation": "Payload did not match expected command injection pattern."
        }
    
    @staticmethod
    def validate_csrf(payload: str, lab_id: str) -> Dict[str, Any]:
        """
        Validate CSRF exploit payload
        
        Args:
            payload: User's attack payload
            lab_id: Lab identifier
            
        Returns:
            Validation result
        """
        payload_lower = payload.lower()
        
        # Check for CSRF patterns
        csrf_patterns = {
            "form_tag": bool(re.search(r"<form[^>]*>", payload, re.IGNORECASE)),
            "input_fields": bool(re.search(r"<input[^>]*name\s*=", payload, re.IGNORECASE)),
            "auto_submit": bool(re.search(r"submit\s*\(\)", payload, re.IGNORECASE)),
            "post_method": bool(re.search(r"method\s*=\s*['\"]?post['\"]?", payload, re.IGNORECASE)),
            "transfer_action": "/transfer" in payload_lower,
        }
        
        # Lab-specific validation
        if lab_id == "LAB006":
            # CSRF token bypass
            if csrf_patterns["form_tag"] and csrf_patterns["input_fields"] and csrf_patterns["auto_submit"]:
                return {
                    "success": True,
                    "points": 150,
                    "response_type": "correct",
                    "explanation": "CSRF exploit form created with auto-submit, transferring funds without user consent."
                }
        
        # Generic CSRF check
        if csrf_patterns["form_tag"] and csrf_patterns["auto_submit"]:
            return {
                "success": True,
                "points": 100,
                "response_type": "correct",
                "explanation": "CSRF pattern detected."
            }
        
        return {
            "success": False,
            "points": 0,
            "response_type": "wrong",
            "explanation": "Payload did not match expected CSRF pattern."
        }
    
    @staticmethod
    def validate_ssrf(payload: str, lab_id: str) -> Dict[str, Any]:
        """
        Validate SSRF payload
        
        Args:
            payload: User's attack payload
            lab_id: Lab identifier
            
        Returns:
            Validation result
        """
        payload_lower = payload.lower()
        
        # Check for SSRF patterns
        ssrf_patterns = {
            "localhost": "localhost" in payload_lower,
            "127_0_0_1": "127.0.0.1" in payload_lower,
            "internal_ip": bool(re.search(r"192\.168\.\d+\.\d+", payload)),
            "file_protocol": "file://" in payload_lower,
            "http_protocol": "http://" in payload_lower,
        }
        
        # Lab-specific validation
        if lab_id == "LAB007":
            # SSRF to localhost
            if ssrf_patterns["localhost"] and ssrf_patterns["http_protocol"]:
                return {
                    "success": True,
                    "points": 200,
                    "response_type": "correct",
                    "explanation": "SSRF payload accessed internal admin panel at localhost:8080/admin."
                }
        
        # Generic SSRF check
        if ssrf_patterns["localhost"] or ssrf_patterns["127_0_0_1"] or ssrf_patterns["internal_ip"]:
            return {
                "success": True,
                "points": 100,
                "response_type": "correct",
                "explanation": "SSRF pattern detected."
            }
        
        return {
            "success": False,
            "points": 0,
            "response_type": "wrong",
            "explanation": "Payload did not match expected SSRF pattern."
        }
    
    @staticmethod
    def validate_idor(payload: str, lab_id: str) -> Dict[str, Any]:
        """
        Validate IDOR payload
        
        Args:
            payload: User's attack payload
            lab_id: Lab identifier
            
        Returns:
            Validation result
        """
        # Check for IDOR patterns
        idor_patterns = {
            "user_id_change": bool(re.search(r"user_id\s*=\s*\d+", payload, re.IGNORECASE)),
            "id_change": bool(re.search(r"id\s*=\s*\d+", payload, re.IGNORECASE)),
            "different_id": bool(re.search(r"\d{4}", payload)),  # 4-digit ID
        }
        
        # Lab-specific validation
        if lab_id == "LAB008":
            # IDOR to access other users
            if idor_patterns["user_id_change"] or idor_patterns["id_change"]:
                return {
                    "success": True,
                    "points": 200,
                    "response_type": "correct",
                    "explanation": "IDOR vulnerability exploited by changing user ID parameter to access another user's data."
                }
        
        # Generic IDOR check
        if idor_patterns["id_change"]:
            return {
                "success": True,
                "points": 100,
                "response_type": "correct",
                "explanation": "IDOR pattern detected."
            }
        
        return {
            "success": False,
            "points": 0,
            "response_type": "wrong",
            "explanation": "Payload did not match expected IDOR pattern."
        }
    
    @staticmethod
    def validate_attack(category: str, payload: str, lab_id: str) -> Dict[str, Any]:
        """
        Main validation function - routes to specific validator
        
        Args:
            category: Attack category
            payload: User's attack payload
            lab_id: Lab identifier
            
        Returns:
            Validation result
        """
        validators = {
            "SQL Injection": LabValidator.validate_sql_injection,
            "XSS": LabValidator.validate_xss,
            "Command Injection": LabValidator.validate_command_injection,
            "CSRF": LabValidator.validate_csrf,
            "SSRF": LabValidator.validate_ssrf,
            "Insecure Direct Object Reference": LabValidator.validate_idor,
        }
        
        validator = validators.get(category)
        if not validator:
            return {
                "success": False,
                "points": 0,
                "response_type": "wrong",
                "explanation": f"Unknown category: {category}"
            }
        
        return validator(payload, lab_id)