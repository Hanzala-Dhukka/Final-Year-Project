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
        "pattern": r"password\s*[:=]\s*['\"][^'\"]+['\"]",
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
        "pattern": r"token\s*[:=]\s*['\"][^'\"]+['\"]",
        "severity": "Medium"
    },
    "Hardcoded API Key": {
        "pattern": r"(api[_-]?key|secret[_-]?key|apikey|client[_-]?secret|access[_-]?key)\s*[:=]\s*['\"][^'\"]+['\"]",
        "severity": "High"
    }
}

CODE_PATTERNS = {
    "Python eval()": {
        "pattern": r"\beval\s*\(",
        "severity": "High",
        "languages": ["py", "pyw"]
    },
    "Python exec()": {
        "pattern": r"\bexec\s*\(",
        "severity": "Critical",
        "languages": ["py", "pyw"]
    },
    "JavaScript eval()": {
        "pattern": r"\beval\s*\(",
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
    findings_map = {}
    lines = content.splitlines()

    for line_no, line in enumerate(lines, start=1):
        for name, config in SECRET_PATTERNS.items():
            pattern = config["pattern"]
            for match in re.finditer(pattern, line, re.IGNORECASE):
                col = match.start() + 1
                if name not in findings_map:
                    findings_map[name] = {
                        "type": name,
                        "severity": config["severity"],
                        "matches_found": 0,
                        "locations": [],
                        "line": line_no,
                        "column": col
                    }
                findings_map[name]["matches_found"] += 1
                findings_map[name]["locations"].append({
                    "line": line_no,
                    "column": col
                })

    return list(findings_map.values())


def scan_dangerous_code(content, file_path=None):
    findings_map = {}
    ext = _ext(file_path)
    lines = content.splitlines()

    for line_no, line in enumerate(lines, start=1):
        for name, config in CODE_PATTERNS.items():
            if "languages" in config and ext is not None and ext not in config["languages"]:
                continue

            pattern = config["pattern"]
            for match in re.finditer(pattern, line, re.IGNORECASE):
                col = match.start() + 1
                if name not in findings_map:
                    findings_map[name] = {
                        "type": name,
                        "severity": config["severity"],
                        "matches_found": 0,
                        "locations": [],
                        "line": line_no,
                        "column": col
                    }
                findings_map[name]["matches_found"] += 1
                findings_map[name]["locations"].append({
                    "line": line_no,
                    "column": col
                })

    return list(findings_map.values())
