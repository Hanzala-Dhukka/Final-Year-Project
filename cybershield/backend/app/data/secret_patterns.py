
SECRET_PATTERNS = [
    {
        "name": "AWS Access Key",
        "regex": r"AKIA[0-9A-Z]{16}",
        "severity": "Critical",
        "recommendation": "Rotate the AWS key immediately."
    },
    {
        "name": "AWS Secret Key",
        "regex": r"(?i)aws.*secret.*['\"]?[a-zA-Z0-9/+=]{40}['\"]?",
        "severity": "Critical",
        "recommendation": "Rotate AWS secret key immediately."
    },
    {
        "name": "Google API Key",
        "regex": r"AIza[0-9A-Za-z-_]{35}",
        "severity": "Critical",
        "recommendation": "Regenerate Google API key."
    },
    {
        "name": "GitHub Personal Access Token",
        "regex": r"gh[pousr]_[A-Za-z0-9]{36,}",
        "severity": "Critical",
        "recommendation": "Revoke GitHub token immediately."
    },
    {
        "name": "GitLab Personal Access Token",
        "regex": r"glpat-[A-Za-z0-9_-]{20,}",
        "severity": "Critical",
        "recommendation": "Revoke GitLab token immediately."
    },
    {
        "name": "Slack Token",
        "regex": r"xox[baprs]-[0-9]{10,12}-[0-9]{10,12}-[0-9a-zA-Z]{24,}",
        "severity": "Critical",
        "recommendation": "Revoke Slack token immediately."
    },
    {
        "name": "Discord Token",
        "regex": r"[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}",
        "severity": "Critical",
        "recommendation": "Revoke Discord token immediately."
    },
    {
        "name": "JWT Token",
        "regex": r"eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*",
        "severity": "High",
        "recommendation": "Never hardcode JWTs. Store them securely in environment variables."
    },
    {
        "name": "RSA Private Key",
        "regex": r"-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----",
        "severity": "Critical",
        "recommendation": "Remove private key from repository immediately."
    },
    {
        "name": "EC Private Key",
        "regex": r"-----BEGIN\s+EC\s+PRIVATE\s+KEY-----",
        "severity": "Critical",
        "recommendation": "Remove private key from repository immediately."
    },
    {
        "name": "OpenSSH Private Key",
        "regex": r"-----BEGIN\s+OPENSSH\s+PRIVATE\s+KEY-----",
        "severity": "Critical",
        "recommendation": "Remove private key from repository immediately."
    },
    {
        "name": "SSH Public Key",
        "regex": r"ssh-(rsa|dss|ed25519)\s+[A-Za-z0-9+/]+[=]{0,3}",
        "severity": "Medium",
        "recommendation": "Public keys are generally safe, but review usage."
    },
    {
        "name": "MongoDB Connection String",
        "regex": r"mongodb(?:\+srv)?://[^\s]+",
        "severity": "High",
        "recommendation": "Move MongoDB URI to environment variables."
    },
    {
        "name": "PostgreSQL Connection String",
        "regex": r"postgresql(?:\+srv)?://[^\s]+",
        "severity": "High",
        "recommendation": "Move database URL to environment variables."
    },
    {
        "name": "MySQL Connection String",
        "regex": r"mysql(?:\+pymysql)?://[^\s]+",
        "severity": "High",
        "recommendation": "Move database URL to environment variables."
    },
    {
        "name": "Redis Connection String",
        "regex": r"redis(?:\+srv)?://[^\s]+",
        "severity": "High",
        "recommendation": "Move Redis URI to environment variables."
    },
    {
        "name": "Hardcoded Password",
        "regex": r"(?i)(?:password|passwd|pwd)\s*[=:]\s*['\"]?[^\s'\"]{3,}['\"]?",
        "severity": "High",
        "recommendation": "Store passwords in environment variables or secrets manager."
    },
    {
        "name": "Generic API Key",
        "regex": r"(?i)(?:api[_-]?key|secret[_-]?key|access[_-]?key)\s*[=:]\s*['\"]?[^\s'\"]{8,}['\"]?",
        "severity": "Medium",
        "recommendation": "Store API keys in environment variables."
    },
    {
        "name": "Bearer Token",
        "regex": r"(?i)Bearer\s+[A-Za-z0-9._-]{20,}",
        "severity": "High",
        "recommendation": "Do not hardcode bearer tokens in code."
    },
    {
        "name": "OAuth Client Secret",
        "regex": r"(?i)client[_-]?secret\s*[=:]\s*['\"]?[^\s'\"]{10,}['\"]?",
        "severity": "High",
        "recommendation": "Store client secrets in environment variables."
    },
    {
        "name": "Firebase API Key",
        "regex": r"AIza[0-9A-Za-z-_]{35}",
        "severity": "Critical",
        "recommendation": "Regenerate Firebase API key."
    },
    {
        "name": "Stripe Secret Key",
        "regex": r"sk_(live|test)_[0-9a-zA-Z]{24,}",
        "severity": "Critical",
        "recommendation": "Regenerate Stripe secret key immediately."
    },
    {
        "name": "Twilio SID",
        "regex": r"AC[a-f0-9]{32}",
        "severity": "Medium",
        "recommendation": "Store Twilio credentials in environment variables."
    },
    {
        "name": "SendGrid API Key",
        "regex": r"SG\.[A-Za-z0-9_-]{22,}",
        "severity": "Critical",
        "recommendation": "Regenerate SendGrid API key immediately."
    }
]

# Directories to ignore
IGNORE_DIRS = [
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    "vendor"
]
