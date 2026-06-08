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

CODE_PATTERNS = {

    "Python eval()": {
        "pattern": r"eval\s*\(",
        "severity": "High"
    },

    "Python exec()": {
        "pattern": r"exec\s*\(",
        "severity": "Critical"
    },

    "JavaScript eval()": {
        "pattern": r"eval\s*\(",
        "severity": "High"
    },

    "Shell Execution": {
        "pattern": r"os\.system\s*\(",
        "severity": "Critical"
    },

    "Subprocess Execution": {
        "pattern": r"subprocess\.run\s*\(",
        "severity": "Medium"
    }
}

TECH_FILES = {
    "package.json": "Node.js",
    "requirements.txt": "Python",
    "pom.xml": "Java",
    "composer.json": "PHP",
    "go.mod": "Go",
    "Cargo.toml": "Rust"
}


def detect_technology(file_name):

    return TECH_FILES.get(file_name)


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


def scan_dangerous_code(content):

    findings = []

    for name, config in CODE_PATTERNS.items():

        matches = re.findall(
            config["pattern"],
            content
        )

        if matches:

            findings.append({
                "type": name,
                "severity": config["severity"],
                "matches_found": len(matches)
            })

    return findings
