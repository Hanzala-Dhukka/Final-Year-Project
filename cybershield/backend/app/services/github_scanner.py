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
    },

    "Hardcoded API Key": {
        "pattern": r"(api[_-]?key|secret[_-]?key|apikey|client[_-]?secret|access[_-]?key)\s*=\s*[\"'][^\"']+[\"']",
        "severity": "High"
    }
}

CODE_PATTERNS = {

    "Python eval()": {
        "pattern": r"eval\s*\(",
        "severity": "High",
        "languages": ["py", "pyw"]
    },

    "Python exec()": {
        "pattern": r"exec\s*\(",
        "severity": "Critical",
        "languages": ["py", "pyw"]
    },

    "JavaScript eval()": {
        "pattern": r"eval\s*\(",
        "severity": "High",
        "languages": ["js", "jsx", "ts", "tsx", "mjs", "cjs", "vue"]
    },

    "Shell Execution": {
        "pattern": r"os\.system\s*\(",
        "severity": "Critical",
        "languages": ["py", "pyw"]
    },

    "Subprocess Execution": {
        "pattern": r"subprocess\.run\s*\(",
        "severity": "Medium",
        "languages": ["py", "pyw"]
    }
}

LANG_BY_EXT = {
    "py": "python", "pyw": "python",
    "js": "javascript", "jsx": "javascript", "ts": "javascript",
    "tsx": "javascript", "mjs": "javascript", "cjs": "javascript",
    "vue": "javascript",
}

def _ext(file_path):
    if not file_path:
        return None
    if "." not in file_path:
        return None
    return file_path.rsplit(".", 1)[-1].lower()

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


def scan_dangerous_code(content, file_path=None):

    findings = []
    ext = _ext(file_path)

    for name, config in CODE_PATTERNS.items():

        # Skip patterns that don't apply to this file's language
        if "languages" in config and ext is not None and ext not in config["languages"]:
            continue

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
