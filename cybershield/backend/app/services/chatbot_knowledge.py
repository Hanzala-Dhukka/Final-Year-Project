"""
Chatbot Knowledge Base - Contains security knowledge for answering questions
"""

# OWASP Knowledge
OWASP_KNOWLEDGE = {
    "SQL Injection": {
        "definition": "SQL Injection is a code injection technique that exploits security vulnerabilities in an application's software by inserting malicious SQL statements into an entry field.",
        "prevention": [
            "Use parameterized queries/prepared statements",
            "Validate and sanitize all user inputs",
            "Use stored procedures",
            "Implement least privilege database access",
            "Use ORM frameworks that handle escaping automatically"
        ],
        "severity": "Critical"
    },
    "XSS": {
        "definition": "Cross-Site Scripting (XSS) allows attackers to inject malicious scripts into web pages viewed by other users.",
        "prevention": [
            "Sanitize all user input using DOMPurify",
            "Implement Content Security Policy (CSP)",
            "Use output encoding/escaping",
            "Set HttpOnly and Secure flags on cookies",
            "Use modern frameworks that auto-escape (React, Vue)"
        ],
        "severity": "High"
    },
    "CSRF": {
        "definition": "Cross-Site Request Forgery forces authenticated users to submit requests they didn't intend to send.",
        "prevention": [
            "Implement anti-CSRF tokens",
            "Use SameSite cookie attribute",
            "Validate Origin/Referer headers",
            "Use custom request headers for AJAX"
        ],
        "severity": "High"
    },
    "SSRF": {
        "definition": "Server-Side Request Forgery allows attackers to make requests from the server to internal resources or arbitrary external systems.",
        "prevention": [
            "Validate and whitelist URLs",
            "Use network segmentation",
            "Implement allowlists for external requests",
            "Don't send raw user input to backend requests"
        ],
        "severity": "High"
    },
    "Broken Authentication": {
        "definition": "Broken Authentication allows attackers to bypass authentication mechanisms and compromise passwords, keys, or session tokens.",
        "prevention": [
            "Implement multi-factor authentication",
            "Use strong password policies",
            "Implement account lockout after failed attempts",
            "Use secure session management",
            "Store passwords with strong hashing (bcrypt, Argon2)"
        ],
        "severity": "Critical"
    }
}

# Secure Coding Knowledge
SECURE_CODING_KNOWLEDGE = {
    "Input Validation": {
        "description": "Always validate user input on both client and server side",
        "best_practices": [
            "Use allowlists over denylists",
            "Validate type, length, format, and range",
            "Use Pydantic models for validation in FastAPI",
            "Sanitize input before processing"
        ]
    },
    "Output Encoding": {
        "description": "Encode output to prevent injection attacks",
        "best_practices": [
            "HTML encode for web output",
            "URL encode for URLs",
            "JavaScript encode for scripts",
            "Use framework auto-escaping features"
        ]
    },
    "Parameterized Queries": {
        "description": "Use parameterized queries to prevent SQL injection",
        "example": "cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))"
    },
    "Password Hashing": {
        "description": "Hash passwords with strong algorithms",
        "algorithms": ["bcrypt", "Argon2", "scrypt", "PBKDF2"]
    },
    "JWT": {
        "description": "JSON Web Tokens for authentication",
        "best_practices": [
            "Use strong 256-bit secrets",
            "Set short expiration times (15-60 minutes)",
            "Use refresh tokens",
            "Store in HTTP-only cookies, not localStorage",
            "Validate token on every request"
        ]
    },
    "HTTPS": {
        "description": "Always use HTTPS in production",
        "best_practices": [
            "Get SSL certificate from Let's Encrypt or cloud provider",
            "Enable HSTS headers",
            "Redirect all HTTP to HTTPS",
            "Use secure cookie flags"
        ]
    },
    "Rate Limiting": {
        "description": "Limit API requests to prevent abuse",
        "best_practices": [
            "Use slowapi or API gateway rate limiting",
            "Set appropriate limits per endpoint",
            "Return 429 status on limit exceeded",
            "Log rate limit violations"
        ]
    }
}

# Cloud Security Knowledge
CLOUD_SECURITY_KNOWLEDGE = {
    "AWS": {
        "best_practices": [
            "Enable CloudTrail for auditing",
            "Use IAM least privilege",
            "Block public S3 access",
            "Enable GuardDuty for threat detection",
            "Use AWS Secrets Manager for credentials"
        ]
    },
    "Azure": {
        "best_practices": [
            "Enable Azure Security Center",
            "Use Azure Key Vault for secrets",
            "Enable Network Security Groups",
            "Use Azure Policy for compliance"
        ]
    },
    "GCP": {
        "best_practices": [
            "Enable Cloud Audit Logs",
            "Use Cloud IAM least privilege",
            "Enable Security Command Center",
            "Use Secret Manager for credentials"
        ]
    },
    "IAM": {
        "description": "Identity and Access Management",
        "best_practices": [
            "Apply least privilege principle",
            "Use role-based access control",
            "Enable MFA for all users",
            "Rotate access keys regularly",
            "Remove unused permissions"
        ]
    },
    "S3": {
        "description": "AWS Simple Storage Service",
        "best_practices": [
            "Block all public access",
            "Enable server-side encryption",
            "Use bucket policies for access control",
            "Enable versioning and logging"
        ]
    },
    "CloudTrail": {
        "description": "AWS audit logging service",
        "best_practices": [
            "Enable in all regions",
            "Send logs to S3 with MFA delete",
            "Monitor for suspicious activity",
            "Integrate with SIEM tools"
        ]
    }
}

# GitHub Security Knowledge
GITHUB_SECURITY_KNOWLEDGE = {
    "Secrets": {
        "description": "Never commit secrets to repositories",
        "best_practices": [
            "Use .gitignore for sensitive files",
            "Enable secret scanning",
            "Rotate exposed credentials immediately",
            "Use environment variables or secret managers",
            "Implement pre-commit hooks"
        ]
    },
    "Dependabot": {
        "description": "Automated dependency updates",
        "best_practices": [
            "Enable Dependabot alerts",
            "Review and merge security updates",
            "Configure version update strategy",
            "Set up auto-merge for minor updates"
        ]
    },
    "Branch Protection": {
        "description": "Protect branches from unauthorized changes",
        "best_practices": [
            "Require pull request reviews",
            "Require status checks to pass",
            "Require linear history",
            "Restrict force pushes",
            "Restrict deletions"
        ]
    },
    "Code Scanning": {
        "description": "Automated code analysis for vulnerabilities",
        "best_practices": [
            "Enable CodeQL analysis",
            "Review and fix alerts",
            "Set up custom queries",
            "Integrate with CI/CD pipeline"
        ]
    }
}


def get_knowledge_by_topic(topic: str) -> dict:
    """Get knowledge for a specific topic"""
    topic_lower = topic.lower()
    
    # Check OWASP
    for key, value in OWASP_KNOWLEDGE.items():
        if key.lower() in topic_lower or topic_lower in key.lower():
            return {"type": "OWASP", "data": value}
    
    # Check Secure Coding
    for key, value in SECURE_CODING_KNOWLEDGE.items():
        if key.lower() in topic_lower or topic_lower in key.lower():
            return {"type": "Secure Coding", "data": value}
    
    # Check Cloud Security
    for key, value in CLOUD_SECURITY_KNOWLEDGE.items():
        if key.lower() in topic_lower or topic_lower in key.lower():
            return {"type": "Cloud Security", "data": value}
    
    # Check GitHub Security
    for key, value in GITHUB_SECURITY_KNOWLEDGE.items():
        if key.lower() in topic_lower or topic_lower in key.lower():
            return {"type": "GitHub Security", "data": value}
    
    return None