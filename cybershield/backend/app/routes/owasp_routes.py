from fastapi import APIRouter, Depends
import re
from datetime import datetime
from app.database.db import database
from app.dependencies.auth import get_current_user
 
router = APIRouter( 
    prefix="/api/v1/owasp", 
    tags=["OWASP Simulator"] 
)

OWASP_GUIDANCE = {
    "SQL Injection": {
        "prevention": "Use parameterized queries or prepared statements. Never concatenate user input into SQL strings."
    },
    "XSS": {
        "prevention": "Sanitize user input, use Content Security Policy (CSP), and use modern frameworks that auto-escape data."
    },
    "Command Injection": {
        "prevention": "Avoid shell-executing functions. Use higher-level APIs (like subprocess with argument lists) and validate input strictly."
    },
    "Path Traversal": {
        "prevention": "Use indirect object references, validate file paths against an allow-list, and use built-in path normalization functions."
    }
}

async def save_simulation(attack: str, payload: str, success: bool, user_id: str = None):
    simulation_data = {
        "attack": attack,
        "payload": payload,
        "success": success,
        "created_at": datetime.utcnow()
    }
    if user_id:
        simulation_data["user_id"] = user_id
        
    await database["owasp_simulations"].insert_one(simulation_data)

@router.post("/simulate/sqli") 
async def simulate_sqli( 
    payload: str,
    current_user: dict = Depends(get_current_user)
):
    # Fake vulnerable login logic
    if "' OR 1=1" in payload:
        attack_type = "SQL Injection"
        result = {
            "success": True,
            "attack": attack_type,
            "impact": "Login Bypass",
            "prevention": OWASP_GUIDANCE[attack_type]["prevention"],
            "vulnerability": "SQL Injection (SQLi)",
            "status": "Vulnerable Detected",
            "payload_received": payload,
            "analysis": "The input contains a classic SQL Injection bypass pattern (' OR 1=1).",
            "risk_score": 9.8
        }
        await save_simulation(attack_type, payload, True, current_user["_id"])
        return result

    # Common SQL Injection patterns for broader detection
    sqli_patterns = [
        r"'.*OR.*'",
        r"--",
        r"\bUNION\b.*\bSELECT\b",
        r"\bDROP\b.*\bTABLE\b",
        r"\bSELECT\b.*\bFROM\b",
        r"1=1",
        r"'"
    ]
    
    is_vulnerable = any(re.search(pattern, payload, re.IGNORECASE) for pattern in sqli_patterns)
    
    if is_vulnerable:
        attack_type = "SQL Injection"
        result = {
            "success": True,
            "attack": attack_type,
            "impact": "Data Leakage / Query Manipulation",
            "prevention": OWASP_GUIDANCE[attack_type]["prevention"],
            "vulnerability": "SQL Injection (SQLi)",
            "status": "Vulnerable Detected",
            "payload_received": payload,
            "analysis": "The input contains characters or keywords often used to manipulate SQL queries.",
            "risk_score": 9.8
        }
        await save_simulation(attack_type, payload, True, current_user["_id"])
        return result
    
    await save_simulation("SQL Injection", payload, False, current_user["_id"])
    return {
        "success": False,
        "vulnerability": "SQL Injection (SQLi)",
        "status": "Secure",
        "payload_received": payload,
        "analysis": "No common SQLi patterns detected.",
        "risk_score": 0.0
    }

@router.post("/simulate/xss")
async def simulate_xss(
    payload: str,
    current_user: dict = Depends(get_current_user)
):
    # Detect <script> tag for specific response
    if "<script>" in payload:
        attack_type = "XSS"
        result = {
            "attack": attack_type,
            "impact": "JavaScript Executed",
            "risk": "High",
            "prevention": OWASP_GUIDANCE[attack_type]["prevention"],
            "vulnerability": "Cross-Site Scripting (XSS)",
            "status": "Vulnerable Detected",
            "payload_received": payload,
            "analysis": "The input contains a <script> tag, which is the most common vector for XSS attacks.",
            "risk_score": 9.5
        }
        await save_simulation(attack_type, payload, True, current_user["_id"])
        return result

    # Common XSS patterns
    xss_patterns = [
        r"<script.*?>.*?</script.*?>",
        r"javascript:",
        r"onerror\s*=",
        r"onload\s*=",
        r"onclick\s*=",
        r"alert\s*\(",
        r"<img.*?>",
        r"<iframe.*?>",
        r"document\.cookie"
    ]
    
    is_vulnerable = any(re.search(pattern, payload, re.IGNORECASE) for pattern in xss_patterns)
    
    if is_vulnerable:
        attack_type = "XSS"
        result = {
            "attack": attack_type,
            "impact": "Script Injection",
            "prevention": OWASP_GUIDANCE[attack_type]["prevention"],
            "vulnerability": "Cross-Site Scripting (XSS)",
            "status": "Vulnerable Detected",
            "payload_received": payload,
            "analysis": "The input contains potentially executable script tags or event handlers that could be used for XSS.",
            "risk_score": 8.5,
            "reflected_payload": f"<div>{payload}</div>" # Simulating how it might be reflected in a vulnerable app
        }
        await save_simulation(attack_type, payload, True, current_user["_id"])
        return result
    
    await save_simulation("XSS", payload, False, current_user["_id"])
    return {
        "vulnerability": "Cross-Site Scripting (XSS)",
        "status": "Secure",
        "payload_received": payload,
        "analysis": "No common XSS patterns detected.",
        "risk_score": 0.0
    }

@router.post("/simulate/cmdi")
async def simulate_cmdi(
    payload: str,
    current_user: dict = Depends(get_current_user)
):
    # Detect Command Injection delimiters
    cmdi_delimiters = [";", "&&", "||"]
    
    is_vulnerable = any(delimiter in payload for delimiter in cmdi_delimiters)
    
    if is_vulnerable:
        attack_type = "Command Injection"
        result = {
            "attack": attack_type,
            "impact": "OS Command Execution",
            "prevention": OWASP_GUIDANCE[attack_type]["prevention"],
            "vulnerability": "Command Injection (CMDi)",
            "status": "Vulnerable Detected",
            "payload_received": payload,
            "analysis": "The input contains shell command delimiters like ;, &&, or || which can be used to chain malicious commands.",
            "risk_score": 9.9
        }
        await save_simulation(attack_type, payload, True, current_user["_id"])
        return result
    
    # Common Command Injection patterns (e.g., common commands)
    cmdi_patterns = [
        r"\bwhoami\b",
        r"\bls\b",
        r"\bcat\b\s+/etc/passwd",
        r"\bid\b",
        r"\bping\b",
        r"\bnc\b"
    ]
    
    is_pattern_vulnerable = any(re.search(pattern, payload, re.IGNORECASE) for pattern in cmdi_patterns)
    
    if is_pattern_vulnerable:
        attack_type = "Command Injection"
        result = {
            "attack": attack_type,
            "impact": "OS Command Execution",
            "prevention": OWASP_GUIDANCE[attack_type]["prevention"],
            "vulnerability": "Command Injection (CMDi)",
            "status": "Vulnerable Detected",
            "payload_received": payload,
            "analysis": "The input contains keywords associated with system commands.",
            "risk_score": 9.5
        }
        await save_simulation(attack_type, payload, True, current_user["_id"])
        return result

    await save_simulation("Command Injection", payload, False, current_user["_id"])
    return {
        "vulnerability": "Command Injection (CMDi)",
        "status": "Secure",
        "payload_received": payload,
        "analysis": "No command injection delimiters or patterns detected.",
        "risk_score": 0.0
    }

@router.post("/simulate/path-traversal")
async def simulate_path_traversal(
    payload: str,
    current_user: dict = Depends(get_current_user)
):
    # Detect Path Traversal patterns
    traversal_patterns = ["../", "..\\"]
    
    is_vulnerable = any(pattern in payload for pattern in traversal_patterns)
    
    if is_vulnerable:
        attack_type = "Path Traversal"
        result = {
            "attack": attack_type,
            "impact": "Sensitive File Disclosure",
            "prevention": OWASP_GUIDANCE[attack_type]["prevention"],
            "vulnerability": "Path Traversal (LFI)",
            "status": "Vulnerable Detected",
            "payload_received": payload,
            "analysis": "The input contains directory traversal sequences like ../ or ..\\ which can be used to access files outside the intended directory.",
            "risk_score": 8.8
        }
        await save_simulation(attack_type, payload, True, current_user["_id"])
        return result
    
    await save_simulation("Path Traversal", payload, False, current_user["_id"])
    return {
        "vulnerability": "Path Traversal (LFI)",
        "status": "Secure",
        "payload_received": payload,
        "analysis": "No path traversal patterns detected.",
        "risk_score": 0.0
    }
