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
        "severity": "High",
        "ext": [".py"]
    },

    "Python exec()": {
        "pattern": r"exec\s*\(",
        "severity": "Critical",
        "ext": [".py"]
    },

    "JavaScript eval()": {
        "pattern": r"eval\s*\(",
        "severity": "High",
        "ext": [".js", ".jsx", ".ts", ".tsx"]
    },

    "Shell Execution": {
        "pattern": r"os\.system\s*\(",
        "severity": "Critical",
        "ext": [".py"]
    },

    "Subprocess Execution": {
        "pattern": r"subprocess\.run\s*\(",
        "severity": "Medium",
        "ext": [".py"]
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


def scan_file_content(content, file_path): 
 
    findings = [] 
 
    for line_number, line in enumerate(content.splitlines(), start=1):
        for name, config in SECRET_PATTERNS.items(): 
            if re.search(config["pattern"], line, re.IGNORECASE):
                findings.append({ 
                    "file": file_path,
                    "line": line_number,
                    "finding": name,
                    "severity": config["severity"], 
                    "evidence": line.strip()
                }) 
 
    return findings


def scan_dangerous_code(content, file_path):

    findings = []
    file_ext = "." + file_path.split(".")[-1].lower() if "." in file_path else ""

    for line_number, line in enumerate(content.splitlines(), start=1):
        for name, config in CODE_PATTERNS.items():
            # Only apply pattern if it matches the file extension or has no extension restrictions
            if "ext" in config and file_ext not in config["ext"]:
                continue
                
            if re.search(config["pattern"], line):
                findings.append({
                    "file": file_path,
                    "line": line_number,
                    "finding": name,
                    "severity": config["severity"],
                    "evidence": line.strip()
                })

    return findings
