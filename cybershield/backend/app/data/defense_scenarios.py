"""
Defense Mode Scenarios for OWASP Security Training
Each scenario provides vulnerable code that the user must secure
"""
from typing import Optional, Dict, Any, List

DEFENSE_SCENARIOS = {
    "SQL Injection": [
        {
            "scenario_id": "SQLI_001",
            "category": "SQL Injection",
            "title": "User Login Query",
            "vulnerable_code": """# Vulnerable SQL Query
email = request.form.get('email')
password = request.form.get('password')

query = f"SELECT * FROM users WHERE email='{email}' AND password='{password}'"
cursor.execute(query)""",
            "language": "python",
            "difficulty": "Easy",
            "hints": [
                "Use parameterized queries",
                "Never concatenate user input into SQL",
                "Use placeholders (?) in your query"
            ],
            "key_terms": ["execute", "?", "parameterized", "prepare"],
            "secure_example": """# Secure SQL Query
email = request.form.get('email')
password = request.form.get('password')

query = "SELECT * FROM users WHERE email=? AND password=?"
cursor.execute(query, (email, password))""",
            "owasp": "A03:2021 – Injection",
            "best_practices": [
                "Always use parameterized queries or prepared statements",
                "Never concatenate user input into SQL strings",
                "Use ORM frameworks when possible",
                "Implement proper input validation"
            ]
        },
        {
            "scenario_id": "SQLI_002",
            "category": "SQL Injection",
            "title": "Product Search",
            "vulnerable_code": """# Vulnerable Search
search_term = request.args.get('search')

query = f"SELECT * FROM products WHERE name LIKE '%{search_term}%'"
cursor.execute(query)""",
            "language": "python",
            "difficulty": "Medium",
            "hints": [
                "Use parameterized queries with LIKE",
                "Escape wildcard characters in user input",
                "Consider using full-text search"
            ],
            "key_terms": ["execute", "?", "parameterized", "LIKE"],
            "secure_example": """# Secure Search
search_term = request.args.get('search')
search_pattern = f"%{search_term}%"

query = "SELECT * FROM products WHERE name LIKE ?"
cursor.execute(query, (search_pattern,))""",
            "owasp": "A03:2021 – Injection",
            "best_practices": [
                "Use parameterized queries for all SQL operations",
                "Sanitize search inputs",
                "Limit search result size",
                "Use database-level permissions"
            ]
        }
    ],
    "XSS": [
        {
            "scenario_id": "XSS_001",
            "category": "XSS",
            "title": "User Profile Display",
            "vulnerable_code": """# Vulnerable XSS
username = request.form.get('username')

# Directly outputting user input
html = f"<div>Welcome, {username}!</div>"
return html""",
            "language": "python",
            "difficulty": "Easy",
            "hints": [
                "Use html.escape() to sanitize output",
                "Use a templating engine with auto-escaping",
                "Consider using DOMPurify for JavaScript"
            ],
            "key_terms": ["escape", "html.escape", "DOMPurify", "sanitize"],
            "secure_example": """# Secure XSS Prevention
import html

username = request.form.get('username')

# Escape user input before output
safe_username = html.escape(username)
html = f"<div>Welcome, {safe_username}!</div>"
return html""",
            "owasp": "A03:2021 – Injection",
            "best_practices": [
                "Always escape user input before outputting to HTML",
                "Use Content Security Policy (CSP) headers",
                "Use modern frameworks with built-in XSS protection",
                "Validate and sanitize all user inputs"
            ]
        },
        {
            "scenario_id": "XSS_002",
            "category": "XSS",
            "title": "Comment Section",
            "vulnerable_code": """# Vulnerable Comment Display
comment = request.form.get('comment')

# Storing and displaying without sanitization
db.save(comment)
return f"<p>{comment}</p>" """,
            "language": "python",
            "difficulty": "Medium",
            "hints": [
                "Sanitize input before storing",
                "Use DOMPurify for rich text",
                "Implement CSP headers"
            ],
            "key_terms": ["escape", "DOMPurify", "sanitize", "CSP"],
            "secure_example": """# Secure Comment Handling
import html
from DOMPurify import sanitize

comment = request.form.get('comment')

# Sanitize before storing
clean_comment = sanitize(comment)
db.save(clean_comment)

# Escape when displaying
safe_comment = html.escape(clean_comment)
return f"<p>{safe_comment}</p>" """,
            "owasp": "A03:2021 – Injection",
            "best_practices": [
                "Sanitize input on both client and server side",
                "Use DOMPurify for HTML content",
                "Implement strict Content Security Policy",
                "Use HttpOnly and Secure flags on cookies"
            ]
        }
    ],
    "Command Injection": [
        {
            "scenario_id": "CMD_001",
            "category": "Command Injection",
            "title": "File Conversion Service",
            "vulnerable_code": """# Vulnerable Command Injection
filename = request.form.get('filename')

# Directly passing user input to shell
os.system(f"convert {filename} output.pdf")""",
            "language": "python",
            "difficulty": "Easy",
            "hints": [
                "Use subprocess.run() instead of os.system()",
                "Pass arguments as a list, not a string",
                "Set shell=False"
            ],
            "key_terms": ["subprocess.run", "shell=False", "list"],
            "secure_example": """# Secure Command Execution
import subprocess

filename = request.form.get('filename')

# Use subprocess with argument list
subprocess.run(
    ["convert", filename, "output.pdf"],
    shell=False,
    check=True
)""",
            "owasp": "A03:2021 – Injection",
            "best_practices": [
                "Never use os.system() with user input",
                "Use subprocess with shell=False",
                "Pass arguments as a list",
                "Validate and whitelist allowed commands"
            ]
        },
        {
            "scenario_id": "CMD_002",
            "category": "Command Injection",
            "title": "Ping Utility",
            "vulnerable_code": """# Vulnerable Ping
host = request.form.get('host')

# User input directly in command
os.system(f"ping -c 4 {host}")""",
            "language": "python",
            "difficulty": "Medium",
            "hints": [
                "Use subprocess.run() with argument list",
                "Validate hostname/IP format",
                "Consider using Python libraries instead"
            ],
            "key_terms": ["subprocess.run", "shell=False", "validate"],
            "secure_example": """# Secure Ping Implementation
import subprocess
import re

host = request.form.get('host')

# Validate input
if not re.match(r'^[a-zA-Z0-9.-]+$', host):
    raise ValueError("Invalid hostname")

# Safe subprocess call
subprocess.run(
    ["ping", "-c", "4", host],
    shell=False,
    check=True
)""",
            "owasp": "A03:2021 – Injection",
            "best_practices": [
                "Validate all user inputs against whitelist",
                "Use subprocess with shell=False",
                "Consider using native Python libraries",
                "Implement proper error handling"
            ]
        }
    ],
    "Path Traversal": [
        {
            "scenario_id": "PATH_001",
            "category": "Path Traversal",
            "title": "File Download",
            "vulnerable_code": """# Vulnerable Path Traversal
filename = request.form.get('file')

# User input directly in path
filepath = f"/var/files/{filename}"
with open(filepath, 'r') as f:
    return f.read()""",
            "language": "python",
            "difficulty": "Easy",
            "hints": [
                "Use pathlib for path operations",
                "Use resolve() to get canonical path",
                "Check if path is within allowed directory"
            ],
            "key_terms": ["pathlib", "resolve", "basename", "startswith"],
            "secure_example": """# Secure File Access
from pathlib import Path

filename = request.form.get('file')
base_dir = Path("/var/files").resolve()

# Resolve the full path
filepath = (base_dir / filename).resolve()

# Check if path is within allowed directory
if not str(filepath).startswith(str(base_dir)):
    raise ValueError("Access denied")

# Safe file access
with open(filepath, 'r') as f:
    return f.read()""",
            "owasp": "A01:2021 – Broken Access Control",
            "best_practices": [
                "Use pathlib for path manipulation",
                "Always resolve and validate paths",
                "Use basename() to extract filename only",
                "Implement proper access controls"
            ]
        },
        {
            "scenario_id": "PATH_002",
            "category": "Path Traversal",
            "title": "Image Upload",
            "vulnerable_code": """# Vulnerable File Upload
uploaded_file = request.files['file']
filename = uploaded_file.filename

# Saving with user-provided filename
filepath = f"./uploads/{filename}"
uploaded_file.save(filepath)""",
            "language": "python",
            "difficulty": "Medium",
            "hints": [
                "Use pathlib.Path for path operations",
                "Extract only the basename",
                "Validate file extension",
                "Generate random filename"
            ],
            "key_terms": ["pathlib", "basename", "suffix", "random"],
            "secure_example": """# Secure File Upload
from pathlib import Path
import secrets

uploaded_file = request.files['file']
filename = uploaded_file.filename

# Extract safe filename
safe_filename = Path(filename).name  # Only basename
file_ext = Path(filename).suffix.lower()

# Validate extension
allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif'}
if file_ext not in allowed_extensions:
    raise ValueError("Invalid file type")

# Generate random filename
random_name = secrets.token_hex(16) + file_ext
filepath = Path("./uploads") / random_name

uploaded_file.save(filepath)""",
            "owasp": "A01:2021 – Broken Access Control",
            "best_practices": [
                "Never use user-provided filenames directly",
                "Generate random filenames for uploads",
                "Validate file extensions",
                "Store uploads outside web root"
            ]
        }
    ]
}


def get_scenario_by_id(scenario_id: str) -> Optional[Dict[str, Any]]:
    """Get a specific scenario by ID"""
    for category, scenarios in DEFENSE_SCENARIOS.items():
        for scenario in scenarios:
            if scenario["scenario_id"] == scenario_id:
                return scenario
    return None


def get_scenarios_by_category(category: str) -> List[Dict[str, Any]]:
    """Get all scenarios for a specific category"""
    return DEFENSE_SCENARIOS.get(category, [])


def get_all_categories() -> List[str]:
    """Get all available OWASP categories"""
    return list(DEFENSE_SCENARIOS.keys())


def get_random_scenario(category: str = None) -> Dict[str, Any]:
    """Get a random scenario, optionally from a specific category"""
    import random
    
    if category:
        scenarios = get_scenarios_by_category(category)
    else:
        # Get all scenarios
        all_scenarios = []
        for scenarios in DEFENSE_SCENARIOS.values():
            all_scenarios.extend(scenarios)
        scenarios = all_scenarios
    
    if not scenarios:
        return None
    
    return random.choice(scenarios)