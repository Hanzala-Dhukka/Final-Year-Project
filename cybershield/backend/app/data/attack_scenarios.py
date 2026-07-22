"""
Attack-mode scenario dataset for the OWASP Simulator (Module 7.4).

Each scenario defines an attackable vulnerability with:
  - a realistic scenario description (safe, simulated)
  - difficulty
  - a set of regex patterns that detect a *successful* exploit
  - 3 progressive hints (Step 10)
  - the AI coach context (why it works, business impact, how to fix, OWASP)

No real exploitation occurs — this is a pure educational simulator.
"""
from typing import Dict, Any, List

# Detection patterns: if any matches the user's payload, the attack "succeeds".
ATTACK_SCENARIOS: Dict[str, Dict[str, Any]] = {
    "SQL Injection": {
        "title": "E-commerce Login Bypass",
        "difficulty": "Beginner",
        "scenario": (
            "You are testing the login form of an online store. The backend builds "
            "the SQL query by string concatenation. Craft a payload in the username "
            "field to bypass authentication."
        ),
        "field": "Username",
        "example_payload": "' OR 1=1 --",
        "success_patterns": [r"'(\s|$)", r"\bOR\b\s+1=1", r"--", r"#", r"\bUNION\b.*\bSELECT\b", r"1=1"],
        "hints": [
            "Think about how the SQL query is constructed from your input.",
            "Authentication logic can often be bypassed by changing the query's truth value.",
            "Use a comment (--) or a tautology like OR 1=1 to make the WHERE clause always true.",
        ],
        "business_impact": "Full account takeover, exposure of all customer records, and potential payment data theft.",
        "explanation": "The input alters the SQL query so the authentication check always evaluates to true, bypassing the login.",
        "owasp": "A03:2021 – Injection",
        "fix": "Use parameterized queries / prepared statements and never concatenate user input into SQL.",
        "learning_path": ["SQL Injection", "Authentication", "JWT", "XSS", "CSRF", "SSRF", "API Security"],
    },
    "XSS": {
        "title": "Reflected XSS in Search",
        "difficulty": "Beginner",
        "scenario": (
            "A search box reflects your query back into the page without escaping. "
            "Inject a script that would execute in a victim's browser."
        ),
        "field": "Search",
        "example_payload": "<script>alert(1)</script>",
        "success_patterns": [r"<script", r"javascript:", r"on\w+\s*=", r"document\.cookie", r"<img", r"<svg", r"<iframe"],
        "hints": [
            "The page prints your input back into the HTML.",
            "Browsers execute <script> tags placed in the page body.",
            "Inject a <script> tag or an event handler like onerror=.",
        ],
        "business_impact": "Session hijacking, credential theft, defacement, and malware delivery to users.",
        "explanation": "Untrusted input is reflected into the DOM without encoding, letting an attacker run JavaScript.",
        "owasp": "A03:2021 – Injection",
        "fix": "Context-aware output encoding, Content Security Policy (CSP), and framework auto-escaping.",
        "learning_path": ["XSS", "CSRF", "SQL Injection", "JWT", "API Security"],
    },
    "Command Injection": {
        "title": "Ping Utility Exploit",
        "difficulty": "Intermediate",
        "scenario": (
            "A network diagnostics tool passes the host field straight to a shell. "
            "Chain a second OS command to read a sensitive file."
        ),
        "field": "Host",
        "example_payload": "127.0.0.1; cat /etc/passwd",
        "success_patterns": [r"[;&|]", r"\$\(", r"`", r"&&", r"\|\|", r"cat\s+/etc", r"whoami", r"id\b"],
        "hints": [
            "The input is passed to a shell command.",
            "Shell metacharacters let you run a second command.",
            "Separate commands with ; or && and add cat /etc/passwd.",
        ],
        "business_impact": "Remote code execution, full server compromise, and lateral movement.",
        "explanation": "User input is concatenated into a shell command, allowing additional commands to be executed.",
        "owasp": "A03:2021 – Injection",
        "fix": "Use subprocess with shell=False and argument lists; validate/whitelist input.",
        "learning_path": ["Command Injection", "Path Traversal", "SSRF", "API Security"],
    },
    "Path Traversal": {
        "title": "File Download Reader",
        "difficulty": "Intermediate",
        "scenario": (
            "A file viewer builds the path from a 'file' parameter. Escape the intended "
            "directory to read /etc/passwd."
        ),
        "field": "File",
        "example_payload": "../../../../etc/passwd",
        "success_patterns": [r"\.\./", r"\.\.\\", r"/etc/passwd", r"boot.ini", r"%2e%2e"],
        "hints": [
            "The parameter controls which file is opened.",
            "Use ../ to move up one directory at a time.",
            "Traverse to the root and request /etc/passwd.",
        ],
        "business_impact": "Disclosure of source code, credentials, and system configuration files.",
        "explanation": "User-controlled paths are joined without validation, allowing access outside the web root.",
        "owasp": "A01:2021 – Broken Access Control",
        "fix": "Use pathlib, resolve() to canonicalize, and validate the final path stays within an allowed base.",
        "learning_path": ["Path Traversal", "Command Injection", "Security Misconfiguration"],
    },
    "Broken Authentication": {
        "title": "Weak Credential Brute Force",
        "difficulty": "Beginner",
        "scenario": (
            "The admin panel accepts any username/password and has no rate limiting. "
            "Demonstrate a weak-credential attack by submitting common defaults."
        ),
        "field": "Password",
        "example_payload": "admin:admin",
        "success_patterns": [r"admin", r"password", r"123456", r"letmein", r"root"],
        "hints": [
            "Many systems ship with default credentials.",
            "Common weak passwords are widely known.",
            "Try admin / admin or password / 123456.",
        ],
        "business_impact": "Unauthorized admin access and full application compromise.",
        "explanation": "Absence of strong password policy and rate limiting lets attackers guess credentials.",
        "owasp": "A07:2021 – Identification and Authentication Failures",
        "fix": "Enforce strong passwords, MFA, account lockout, and rate limiting.",
        "learning_path": ["Broken Authentication", "JWT", "CSRF", "IDOR"],
    },
    "CSRF": {
        "title": "Unauthorized Fund Transfer",
        "difficulty": "Intermediate",
        "scenario": (
            "A banking app performs state-changing actions using a simple GET/POST with "
            "no anti-CSRF token. Craft a request that transfers funds when a logged-in "
            "victim visits your page."
        ),
        "field": "Payload",
        "example_payload": "<img src='/transfer?to=attacker&amt=1000'>",
        "success_patterns": [r"<img", r"<form", r"transfer", r"src=", r"action=", r"auto"],
        "hints": [
            "The victim's browser automatically attaches their session cookie.",
            "An image or form can trigger a request without consent.",
            "Use an <img> tag pointing at the transfer endpoint.",
        ],
        "business_impact": "Unauthorized money transfers, profile changes, and actions on the victim's behalf.",
        "explanation": "State-changing requests lack an unpredictable token, so a forged cross-site request succeeds.",
        "owasp": "A01:2021 – Broken Access Control",
        "fix": "Use anti-CSRF tokens, SameSite cookies, and require re-authentication for sensitive actions.",
        "learning_path": ["CSRF", "XSS", "Broken Authentication", "JWT"],
    },
    "SSRF": {
        "title": "Cloud Metadata Exposure",
        "difficulty": "Advanced",
        "scenario": (
            "A 'fetch URL' feature requests internal resources. Abuse it to reach the "
            "cloud instance metadata service and read credentials."
        ),
        "field": "URL",
        "example_payload": "http://169.254.169.254/latest/meta-data/iam/security-credentials/",
        "success_patterns": [r"169\.254\.169\.254", r"metadata", r"localhost", r"127\.0\.0\.1", r"internal", r"file://"],
        "hints": [
            "The server can reach internal-only addresses.",
            "Cloud instances expose a link-local metadata IP.",
            "Request http://169.254.169.254/latest/meta-data.",
        ],
        "business_impact": "Theft of cloud IAM credentials, leading to full cloud account compromise.",
        "explanation": "The server fetches attacker-supplied URLs, including internal/metadata endpoints.",
        "owasp": "A10:2021 – Server-Side Request Forgery",
        "fix": "Allowlist destinations, block link-local/metadata ranges, and restrict egress.",
        "learning_path": ["SSRF", "API Security", "Cloud Security", "Command Injection"],
    },
    "IDOR": {
        "title": "Invoice ID Manipulation",
        "difficulty": "Intermediate",
        "scenario": (
            "An invoice page reads ?id=N with no ownership check. Change the id to view "
            "another user's invoice."
        ),
        "field": "Invoice ID",
        "example_payload": "id=1002",
        "success_patterns": [r"id=\d+", r"\d{3,}", r"user=", r"account="],
        "hints": [
            "The object reference is a simple number in the URL.",
            "The server may not verify who owns the object.",
            "Increment the id parameter to access another record.",
        ],
        "business_impact": "Unauthorized disclosure of other users' financial and personal data.",
        "explanation": "Direct object references are predictable and not validated against the owner.",
        "owasp": "A01:2021 – Broken Access Control",
        "fix": "Verify ownership server-side and use unguessable references (UUIDs).",
        "learning_path": ["IDOR", "Broken Access Control", "Authorization", "CSRF"],
    },
    "File Upload": {
        "title": "Malicious Upload",
        "difficulty": "Advanced",
        "scenario": (
            "The upload endpoint accepts any file type and serves it from an executable "
            "path. Upload a script disguised as an image."
        ),
        "field": "Filename",
        "example_payload": "shell.php",
        "success_patterns": [r"\.php$", r"\.jsp$", r"\.asp$", r"\.phtml", r"\.exe$", r"polyglot"],
        "hints": [
            "The server doesn't restrict file extensions.",
            "Executable server-side scripts can be uploaded.",
            "Name the file shell.php to be interpreted as code.",
        ],
        "business_impact": "Remote code execution on the server via the uploaded web shell.",
        "explanation": "Unrestricted file types and executable storage let attackers upload runnable code.",
        "owasp": "A03:2021 – Injection",
        "fix": "Validate MIME type and extension, store outside the web root, and rename files.",
        "learning_path": ["File Upload", "Command Injection", "Security Misconfiguration"],
    },
    "XXE": {
        "title": "XML Entity Expansion",
        "difficulty": "Advanced",
        "scenario": (
            "An endpoint parses user-supplied XML with external entities enabled. Inject "
            "a DOCTYPE that reads a local file."
        ),
        "field": "XML Body",
        "example_payload": "<!ENTITY xxe SYSTEM 'file:///etc/passwd'>",
        "success_patterns": [r"<!ENTITY", r"SYSTEM", r"file://", r"<!DOCTYPE", r"&xxe;"],
        "hints": [
            "XML parsers may resolve entities.",
            "External entities can read local files.",
            "Define <!ENTITY xxe SYSTEM 'file:///etc/passwd'> and reference &xxe;.",
        ],
        "business_impact": "Local file disclosure, SSRF, and denial of service via entity expansion.",
        "explanation": "The parser resolves attacker-controlled external entities, exposing internal resources.",
        "owasp": "A05:2021 – Security Misconfiguration",
        "fix": "Disable DTDs/external entities and use a safe parser configuration.",
        "learning_path": ["XXE", "SSRF", "Security Misconfiguration"],
    },
    "Security Misconfiguration": {
        "title": "Exposed Admin Console",
        "difficulty": "Beginner",
        "scenario": (
            "A default admin console is left enabled with default credentials. Access it "
            "to demonstrate the misconfiguration."
        ),
        "field": "Path",
        "example_payload": "/admin",
        "success_patterns": [r"/admin", r"phpmyadmin", r"console", r"debug", r"default"],
        "hints": [
            "Default apps often ship with admin panels.",
            "They may be reachable without authentication.",
            "Try navigating to /admin or /phpmyadmin.",
        ],
        "business_impact": "Full control of the application and underlying infrastructure.",
        "explanation": "Unnecessary features and default settings are exposed in production.",
        "owasp": "A05:2021 – Security Misconfiguration",
        "fix": "Harden configs, remove unused features, and disable default accounts.",
        "learning_path": ["Security Misconfiguration", "Broken Authentication", "IDOR"],
    },
    "Insecure Deserialization": {
        "title": "Pickle Payload",
        "difficulty": "Expert",
        "scenario": (
            "The server unpickles untrusted data. Submit a serialized payload that would "
            "execute code on deserialization (simulated)."
        ),
        "field": "Payload",
        "example_payload": "cos\nsystem\n(S'id'\ntR.",
        "success_patterns": [r"pickle", r"__reduce__", r"os\.system", r"\x63\x6f\x73", r"yaml\.load", r"POP", r"cos\\n"],
        "hints": [
            "Native deserializers can run code during reconstruction.",
            "Python pickle calls __reduce__ on load.",
            "Craft a pickle that invokes os.system.",
        ],
        "business_impact": "Remote code execution and full host compromise.",
        "explanation": "Deserializing untrusted bytes lets an attacker control object reconstruction.",
        "owasp": "A08:2021 – Software and Data Integrity Failures",
        "fix": "Avoid native deserialization of untrusted data; use signed, schema-validated formats.",
        "learning_path": ["Insecure Deserialization", "Command Injection", "API Security"],
    },
    "JWT Attacks": {
        "title": "Algorithm Confusion",
        "difficulty": "Advanced",
        "scenario": (
            "A JWT implementation accepts the 'none' algorithm or a weak secret. Forge a "
            "token claiming admin by tampering with the header/payload."
        ),
        "field": "JWT",
        "example_payload": '{"alg":"none"}',
        "success_patterns": [r'"alg"\s*:\s*"none"', r"alg=none", r"HS256", r"admin", r"\\.", r"eyJ"],
        "hints": [
            "JWTs have a header declaring the signing algorithm.",
            "Some libraries accept 'none' as unsigned.",
            "Set alg to 'none' or crack a weak HMAC secret to forge admin claims.",
        ],
        "business_impact": "Privilege escalation to admin and authentication bypass.",
        "explanation": "Weak JWT validation allows algorithm confusion or forged tokens.",
        "owasp": "A07:2021 – Identification and Authentication Failures",
        "fix": "Pin the algorithm, use strong secrets/asymmetric keys, and verify signatures strictly.",
        "learning_path": ["JWT", "Broken Authentication", "CSRF", "API Security"],
    },
    "API Security": {
        "title": "Unauthenticated Endpoint",
        "difficulty": "Intermediate",
        "scenario": (
            "An internal API endpoint lacks an authorization check. Call it directly to "
            "retrieve data meant only for admins."
        ),
        "field": "Request",
        "example_payload": "GET /api/v1/admin/users",
        "success_patterns": [r"/api/", r"admin", r"users", r"internal", r"GET ", r"\.json"],
        "hints": [
            "APIs often forget object/function-level authorization.",
            "Internal endpoints may be reachable directly.",
            "Call /api/v1/admin/users without a token.",
        ],
        "business_impact": "Mass data exposure and unauthorized administrative actions.",
        "explanation": "Endpoints rely on obscurity instead of enforced authorization.",
        "owasp": "A01:2021 – Broken Access Control",
        "fix": "Enforce authn + authz on every endpoint and validate scopes.",
        "learning_path": ["API Security", "Broken Access Control", "IDOR", "SSRF"],
    },
    "Rate Limiting": {
        "title": "Credential Stuffing",
        "difficulty": "Intermediate",
        "scenario": (
            "The login endpoint has no rate limit. Demonstrate an automated brute-force "
            "by submitting many credential pairs quickly."
        ),
        "field": "Requests",
        "example_payload": "1000 requests/sec",
        "success_patterns": [r"\d+\s*req", r"loop", r"burst", r"automated", r"bot", r"throttle"],
        "hints": [
            "Without throttling, attackers can try unlimited attempts.",
            "Automation is the core of credential stuffing.",
            "Describe issuing many requests per second (a burst).",
        ],
        "business_impact": "Account takeover at scale using leaked credentials.",
        "explanation": "Absence of rate limiting enables automated guessing attacks.",
        "owasp": "A07:2021 – Identification and Authentication Failures",
        "fix": "Apply per-IP/user rate limits, CAPTCHA, and breached-password checks.",
        "learning_path": ["Rate Limiting", "Broken Authentication", "API Security"],
    },
}


def get_attack_scenario(name: str) -> Dict[str, Any]:
    return ATTACK_SCENARIOS.get(name)


def list_attack_scenarios() -> List[Dict[str, Any]]:
    """Return all attack scenarios as a list of {name, title, difficulty}."""
    out = []
    for name, data in ATTACK_SCENARIOS.items():
        out.append({
            "name": name,
            "title": data.get("title"),
            "difficulty": data.get("difficulty"),
            "learning_path": data.get("learning_path", []),
        })
    return out


def get_random_scenario() -> tuple[str, Dict[str, Any]]:
    import random
    name = random.choice(list(ATTACK_SCENARIOS.keys()))
    return name, ATTACK_SCENARIOS[name]
