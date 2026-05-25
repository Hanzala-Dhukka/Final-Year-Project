import re

SECRET_PATTERNS = {

    "AWS Access Key": {
        "pattern": r"AKIA[0-9A-Z]{16}",
        "severity": "Critical"
    },

    "Google API Key": {
        "pattern": r"AIza[0-9A-Za-z-_]{35}",
        "severity": "Critical"
    },

    "JWT Secret": {
        "pattern": r"jwt[_-]?secret",
        "severity": "High"
    },

    "Password Variable": {
        "pattern": r"password\s*=",
        "severity": "High"
    },

    "MongoDB URI": {
        "pattern": r"mongodb\+srv://",
        "severity": "Critical"
    },

    "Private Key": {
        "pattern": r"BEGIN PRIVATE KEY",
        "severity": "Critical"
    },

    "Hardcoded Token": {
        "pattern": r"token\s*=",
        "severity": "Medium"
    }
}


def scan_file_content(content): 
 
    findings = [] 
 
    for name, config in SECRET_PATTERNS.items(): 
 
        matches = re.findall( 
            config["pattern"], 
            content, 
            re.IGNORECASE 
        ) 
 
        if matches: 
 
            findings.append({ 
                "type": name, 
                "severity": config["severity"], 
                "matches_found": len(matches) 
            }) 
 
    return findings
