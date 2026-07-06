
# Threat rules data for Phase 2 modules
THREAT_RULES = {
    "FastAPI": [
        {
            "id": "TM001",
            "technology": "FastAPI",
            "threat": "Missing Rate Limiting",
            "category": "API Security",
            "severity": "Medium",
            "impact": "Brute-force attacks and API abuse",
            "recommendation": "Implement rate limiting using slowapi or similar libraries"
        },
        {
            "id": "TM002",
            "technology": "FastAPI",
            "threat": "Missing Input Validation",
            "category": "Application",
            "severity": "High",
            "impact": "SQL injection, XSS, and other injection attacks",
            "recommendation": "Use Pydantic models for all input validation"
        },
        {
            "id": "TM003",
            "technology": "FastAPI",
            "threat": "Missing HTTPS",
            "category": "Network",
            "severity": "Critical",
            "impact": "Data interception and man-in-the-middle attacks",
            "recommendation": "Always use HTTPS in production environments"
        },
        {
            "id": "TM004",
            "technology": "FastAPI",
            "threat": "Missing Authentication",
            "category": "Authentication",
            "severity": "Critical",
            "impact": "Unauthorized access to API endpoints",
            "recommendation": "Implement JWT or OAuth2 authentication"
        },
        {
            "id": "TM005",
            "technology": "FastAPI",
            "threat": "Missing Authorization",
            "category": "Authorization",
            "severity": "High",
            "impact": "Privilege escalation and unauthorized data access",
            "recommendation": "Implement role-based access control (RBAC)"
        },
        {
            "id": "TM006",
            "technology": "FastAPI",
            "threat": "Missing CORS Configuration",
            "category": "Configuration",
            "severity": "Medium",
            "impact": "Cross-origin request restrictions",
            "recommendation": "Configure proper CORS policies for your API"
        }
    ],
    "React": [
        {
            "id": "TM007",
            "technology": "React",
            "threat": "Cross-Site Scripting (XSS)",
            "category": "Application",
            "severity": "High",
            "impact": "Execution of malicious scripts in user browsers",
            "recommendation": "Sanitize all user input and avoid dangerouslySetInnerHTML"
        },
        {
            "id": "TM008",
            "technology": "React",
            "threat": "DOM Injection",
            "category": "Application",
            "severity": "Medium",
            "impact": "Modification of DOM by attackers",
            "recommendation": "Use React's built-in XSS protection and sanitize inputs"
        },
        {
            "id": "TM009",
            "technology": "React",
            "threat": "Sensitive Data Exposure",
            "category": "Data Protection",
            "severity": "High",
            "impact": "Leakage of sensitive information",
            "recommendation": "Avoid storing sensitive data in client-side state"
        },
        {
            "id": "TM010",
            "technology": "React",
            "threat": "Unsafe Local Storage",
            "category": "Data Protection",
            "severity": "Medium",
            "impact": "Theft of stored tokens or credentials",
            "recommendation": "Use HTTP-only cookies for authentication tokens"
        },
        {
            "id": "TM011",
            "technology": "React",
            "threat": "Missing Content Security Policy",
            "category": "Configuration",
            "severity": "High",
            "impact": "Increased risk of XSS and other code injection attacks",
            "recommendation": "Implement a strict Content Security Policy (CSP)"
        }
    ],
    "JWT": [
        {
            "id": "TM012",
            "technology": "JWT",
            "threat": "No Token Expiration",
            "category": "Authentication",
            "severity": "Critical",
            "impact": "Compromised tokens remain valid indefinitely",
            "recommendation": "Set appropriate expiration times (exp claim)"
        },
        {
            "id": "TM013",
            "technology": "JWT",
            "threat": "Weak JWT Secret",
            "category": "Authentication",
            "severity": "High",
            "impact": "Token forgery and account takeover",
            "recommendation": "Use a strong, random 256-bit secret key"
        },
        {
            "id": "TM014",
            "technology": "JWT",
            "threat": "Token Replay",
            "category": "Authentication",
            "severity": "Medium",
            "impact": "Reuse of valid tokens by attackers",
            "recommendation": "Implement token revocation and short-lived tokens"
        },
        {
            "id": "TM015",
            "technology": "JWT",
            "threat": "Missing Refresh Token",
            "category": "Authentication",
            "severity": "Medium",
            "impact": "Poor user experience when tokens expire",
            "recommendation": "Implement refresh token mechanism"
        },
        {
            "id": "TM016",
            "technology": "JWT",
            "threat": "Token Theft",
            "category": "Authentication",
            "severity": "Critical",
            "impact": "Full account takeover",
            "recommendation": "Use HTTP-only, secure cookies with SameSite attributes"
        }
    ],
    "MongoDB": [
        {
            "id": "TM017",
            "technology": "MongoDB",
            "threat": "No Authentication",
            "category": "Authentication",
            "severity": "Critical",
            "impact": "Full unauthorized access to database",
            "recommendation": "Enable authentication and create strong credentials"
        },
        {
            "id": "TM018",
            "technology": "MongoDB",
            "threat": "Open Database Port",
            "category": "Network",
            "severity": "Critical",
            "impact": "Database exposed to the public internet",
            "recommendation": "Restrict database access to specific IP addresses"
        },
        {
            "id": "TM019",
            "technology": "MongoDB",
            "threat": "No Encryption",
            "category": "Data Protection",
            "severity": "High",
            "impact": "Data interception and unauthorized access",
            "recommendation": "Enable encryption at rest and in transit (TLS)"
        },
        {
            "id": "TM020",
            "technology": "MongoDB",
            "threat": "Weak Password",
            "category": "Authentication",
            "severity": "High",
            "impact": "Brute-force attacks on database credentials",
            "recommendation": "Use strong, unique passwords for database users"
        },
        {
            "id": "TM021",
            "technology": "MongoDB",
            "threat": "Backup Missing",
            "category": "Configuration",
            "severity": "Medium",
            "impact": "Permanent data loss in case of failure",
            "recommendation": "Implement regular automated backups"
        }
    ],
    "Google Sheets": [
        {
            "id": "TM022",
            "technology": "Google Sheets",
            "threat": "Public Spreadsheet",
            "category": "Configuration",
            "severity": "Critical",
            "impact": "Data accessible to anyone on the internet",
            "recommendation": "Restrict sharing to specific users only"
        },
        {
            "id": "TM023",
            "technology": "Google Sheets",
            "threat": "Exposed Credentials",
            "category": "Authentication",
            "severity": "Critical",
            "impact": "Unauthorized access to Google account",
            "recommendation": "Never hardcode credentials; use environment variables"
        },
        {
            "id": "TM024",
            "technology": "Google Sheets",
            "threat": "Improper Sharing",
            "category": "Authorization",
            "severity": "High",
            "impact": "Data access by unauthorized users",
            "recommendation": "Review sharing settings regularly"
        },
        {
            "id": "TM025",
            "technology": "Google Sheets",
            "threat": "No Backup",
            "category": "Configuration",
            "severity": "Medium",
            "impact": "Data loss if spreadsheet is deleted",
            "recommendation": "Enable version history and regular exports"
        },
        {
            "id": "TM026",
            "technology": "Google Sheets",
            "threat": "Unauthorized Access",
            "category": "Authentication",
            "severity": "High",
            "impact": "Data breach",
            "recommendation": "Use two-factor authentication for Google account"
        }
    ],
    "AWS": [
        {
            "id": "TM027",
            "technology": "AWS",
            "threat": "Public S3 Bucket",
            "category": "Cloud",
            "severity": "Critical",
            "impact": "Data leakage to the public",
            "recommendation": "Ensure all S3 buckets are private"
        },
        {
            "id": "TM028",
            "technology": "AWS",
            "threat": "IAM Misconfiguration",
            "category": "Authorization",
            "severity": "High",
            "impact": "Excessive privileges and unauthorized access",
            "recommendation": "Follow principle of least privilege"
        },
        {
            "id": "TM029",
            "technology": "AWS",
            "threat": "Exposed Access Keys",
            "category": "Authentication",
            "severity": "Critical",
            "impact": "Complete AWS account compromise",
            "recommendation": "Rotate keys regularly and never commit them to code"
        },
        {
            "id": "TM030",
            "technology": "AWS",
            "threat": "Security Group Too Open",
            "category": "Network",
            "severity": "High",
            "impact": "Exposed services to the internet",
            "recommendation": "Restrict security group rules to necessary IPs"
        },
        {
            "id": "TM031",
            "technology": "AWS",
            "threat": "Missing CloudTrail",
            "category": "Configuration",
            "severity": "Medium",
            "impact": "No audit trail of AWS API calls",
            "recommendation": "Enable CloudTrail in all regions"
        }
    ],
    "GitHub API": [
        {
            "id": "TM032",
            "technology": "GitHub API",
            "threat": "API Rate Limit",
            "category": "API Security",
            "severity": "Low",
            "impact": "Service disruption due to rate limiting",
            "recommendation": "Implement rate limiting and caching"
        },
        {
            "id": "TM033",
            "technology": "GitHub API",
            "threat": "Leaked Token",
            "category": "Authentication",
            "severity": "Critical",
            "impact": "Unauthorized access to GitHub account",
            "recommendation": "Store tokens securely in environment variables"
        },
        {
            "id": "TM034",
            "technology": "GitHub API",
            "threat": "Excessive Permissions",
            "category": "Authorization",
            "severity": "High",
            "impact": "Token has more permissions than needed",
            "recommendation": "Use fine-grained personal access tokens"
        }
    ]
}


