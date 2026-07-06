from typing import List, Dict, Any

# Threat to fix mapping
THREAT_FIX_MAP = {
    # JWT Threats
    "Weak JWT Secret": {
        "recommendation": "Use a 256-bit cryptographically secure secret stored in environment variables",
        "implementation_steps": [
            "Generate secure secret using: openssl rand -hex 32",
            "Store secret in .env file: SECRET_KEY=your_generated_secret",
            "Load secret in FastAPI: SECRET_KEY = os.getenv('SECRET_KEY')",
            "Restart server to apply changes",
            "Implement key rotation policy every 30-90 days"
        ],
        "code_example": "SECRET_KEY = os.getenv('SECRET_KEY')\nALGORITHM = 'HS256'\n\ndef create_access_token(data: dict):\n    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)"
    },
    "No Token Expiration": {
        "recommendation": "Set token expiry (15-60 minutes) and implement refresh tokens",
        "implementation_steps": [
            "Add exp claim to JWT payload: {'exp': datetime.utcnow() + timedelta(minutes=30)}",
            "Implement refresh token endpoint",
            "Store refresh tokens securely in database",
            "Set refresh token expiry to 7-30 days"
        ],
        "code_example": "from datetime import datetime, timedelta\n\ntoken_data = {\n    'exp': datetime.utcnow() + timedelta(minutes=30),\n    'user_id': user.id\n}"
    },
    "Token Replay": {
        "recommendation": "Implement token revocation and use short-lived tokens",
        "implementation_steps": [
            "Add token blacklist in Redis or database",
            "Check token against blacklist on each request",
            "Implement token refresh before expiry",
            "Add jti (JWT ID) claim for unique identification"
        ],
        "code_example": "import redis\nr = redis.Redis()\n\ndef is_token_revoked(jti: str) -> bool:\n    return r.exists(f'blacklist:{jti}')"
    },
    "Missing Refresh Token": {
        "recommendation": "Implement refresh token mechanism for better security",
        "implementation_steps": [
            "Create refresh token endpoint: /auth/refresh",
            "Generate and store refresh tokens",
            "Return new access token when refresh is valid",
            "Implement refresh token rotation"
        ],
        "code_example": "@app.post('/auth/refresh')\nasync def refresh_token(refresh_token: str):\n    # Validate refresh token and issue new access token"
    },
    "Token Theft": {
        "recommendation": "Use refresh tokens + secure HTTP-only cookies with SameSite",
        "implementation_steps": [
            "Set cookies with HttpOnly, Secure, and SameSite=Strict flags",
            "Store tokens in cookies instead of localStorage",
            "Implement CSRF protection",
            "Add token binding to client fingerprint"
        ],
        "code_example": "response.set_cookie(\n    key='access_token',\n    value=token,\n    httponly=True,\n    secure=True,\n    samesite='strict'\n)"
    },
    
    # AWS Threats
    "Public S3 Bucket": {
        "recommendation": "Enable bucket policies and block all public access",
        "implementation_steps": [
            "Go to S3 bucket → Permissions tab",
            "Uncheck 'Block all public access' and enable it",
            "Remove any public bucket policies",
            "Add IAM policy to restrict access to specific roles",
            "Enable S3 server access logging"
        ],
        "code_example": "aws s3api put-bucket-policy --bucket my-bucket --policy file://policy.json"
    },
    "IAM Misconfiguration": {
        "recommendation": "Apply least privilege IAM roles and remove excessive permissions",
        "implementation_steps": [
            "Review all IAM policies in AWS Console",
            "Remove AdministratorAccess from non-admin users",
            "Create specific policies for each service",
            "Enable IAM Access Analyzer",
            "Set up IAM password policy"
        ],
        "code_example": "{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [\n    {\"Effect\": \"Allow\", \"Action\": [\"s3:GetObject\"], \"Resource\": [\"arn:aws:s3:::my-bucket/*\"]}\n  ]\n}"
    },
    "Exposed Access Keys": {
        "recommendation": "Rotate keys immediately and store in AWS Secrets Manager",
        "implementation_steps": [
            "Deactivate exposed keys immediately in AWS Console",
            "Generate new access keys",
            "Store in AWS Secrets Manager or Parameter Store",
            "Update applications to use new keys",
            "Enable key rotation automation"
        ],
        "code_example": "import boto3\nclient = boto3.client('secretsmanager')\nsecret = client.get_secret_value(SecretId='my-api-key')"
    },
    "Security Group Too Open": {
        "recommendation": "Restrict security group rules to necessary IPs and ports only",
        "implementation_steps": [
            "Review all security groups in AWS Console",
            "Remove 0.0.0.0/0 rules for SSH, RDP, and database ports",
            "Add specific IP ranges for admin access",
            "Use VPN or AWS Systems Manager Session Manager",
            "Enable VPC Flow Logs for monitoring"
        ],
        "code_example": "aws ec2 authorize-security-group-ingress \\\n    --group-id sg-12345678 \\\n    --protocol tcp --port 22 --cidr 10.0.0.0/8"
    },
    "Missing CloudTrail": {
        "recommendation": "Enable CloudTrail in all regions for audit logging",
        "implementation_steps": [
            "Go to CloudTrail in AWS Console",
            "Create trail for all regions",
            "Send logs to S3 bucket",
            "Enable log file validation",
            "Set up CloudWatch alarms for critical events"
        ],
        "code_example": "aws cloudtrail create-trail --name my-trail --s3-bucket-name my-logs-bucket"
    },
    
    # React Threats
    "Cross-Site Scripting (XSS)": {
        "recommendation": "Sanitize all user input using DOMPurify and avoid dangerouslySetInnerHTML",
        "implementation_steps": [
            "Install DOMPurify: npm install dompurify",
            "Sanitize all user inputs before rendering",
            "Use textContent instead of innerHTML",
            "Implement Content Security Policy headers",
            "Enable React's built-in XSS protection"
        ],
        "code_example": "import DOMPurify from 'dompurify'\n\nconst clean = DOMPurify.sanitize(userInput)\nreturn <div>{clean}</div>"
    },
    "DOM Injection": {
        "recommendation": "Use React's built-in XSS protection and sanitize all inputs",
        "implementation_steps": [
            "Avoid direct DOM manipulation",
            "Use React state for dynamic content",
            "Sanitize inputs with DOMPurify",
            "Validate input on server side as well"
        ],
        "code_example": "const [content, setContent] = useState('')\nsetContent(DOMPurify.sanitize(input))"
    },
    "Sensitive Data Exposure": {
        "recommendation": "Avoid storing sensitive data in client-side state and use secure APIs",
        "implementation_steps": [
            "Never store passwords, tokens, or PII in frontend state",
            "Use secure API endpoints for sensitive data",
            "Implement proper data masking in UI",
            "Use environment variables for config"
        ],
        "code_example": "// Bad: localStorage.setItem('password', password)\n// Good: Use secure HTTP-only cookies"
    },
    "Unsafe Local Storage": {
        "recommendation": "Use HTTP-only cookies instead of localStorage for authentication tokens",
        "implementation_steps": [
            "Remove token storage from localStorage",
            "Set up HTTP-only, Secure cookies on backend",
            "Use SameSite=Strict attribute",
            "Implement CSRF protection"
        ],
        "code_example": "axios.defaults.withCredentials = true\n// Backend sets cookie: Set-Cookie: token=xxx; HttpOnly; Secure; SameSite=Strict"
    },
    "Missing Content Security Policy": {
        "recommendation": "Add Content Security Policy headers to prevent XSS and code injection",
        "implementation_steps": [
            "Add CSP header in HTTP responses",
            "Restrict script sources to trusted domains",
            "Disable inline scripts: script-src 'self'",
            "Enable CSP reporting endpoint"
        ],
        "code_example": "Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none'"
    },
    
    # FastAPI Threats
    "Missing Rate Limiting": {
        "recommendation": "Add slowapi or API gateway rate limiting to prevent abuse",
        "implementation_steps": [
            "Install slowapi: pip install slowapi",
            "Add rate limiter to FastAPI app",
            "Configure limits per endpoint",
            "Return 429 status on rate limit exceeded"
        ],
        "code_example": "from slowapi import Limiter\nfrom slowapi.util import get_remote_address\n\nlimiter = Limiter(key_func=get_remote_address)\n\n@app.get('/api/endpoint')\n@limiter.limit('100/hour')\nasync def endpoint(request: Request): ..."
    },
    "Missing Input Validation": {
        "recommendation": "Use Pydantic models for all input validation",
        "implementation_steps": [
            "Create Pydantic models for all request bodies",
            "Add validators for email, URL, and custom fields",
            "Use Field() for constraints (min_length, max_length)",
            "Return 422 validation errors automatically"
        ],
        "code_example": "from pydantic import BaseModel, EmailStr\n\nclass UserCreate(BaseModel):\n    email: EmailStr\n    password: str = Field(..., min_length=8)"
    },
    "Missing HTTPS": {
        "recommendation": "Always use HTTPS in production with proper SSL certificates",
        "implementation_steps": [
            "Get SSL certificate from Let's Encrypt or AWS ACM",
            "Configure reverse proxy (nginx) for HTTPS",
            "Redirect all HTTP to HTTPS",
            "Enable HSTS header"
        ],
        "code_example": "add_middleware(\n    HTTPSRedirectMiddleware\n)  # For development\n# Use nginx for production HTTPS"
    },
    "Missing Authentication": {
        "recommendation": "Implement JWT or OAuth2 authentication for all protected endpoints",
        "implementation_steps": [
            "Add OAuth2PasswordBearer or JWT authentication",
            "Create protected route dependencies",
            "Add authentication middleware",
            "Return 401 for unauthenticated requests"
        ],
        "code_example": "from fastapi.security import OAuth2PasswordBearer\n\noauth2_scheme = OAuth2PasswordBearer(tokenUrl='token')\n\ndef get_current_user(token: str = Depends(oauth2_scheme)):"
    },
    "Missing Authorization": {
        "recommendation": "Implement role-based access control (RBAC) for authorization",
        "implementation_steps": [
            "Add role field to user model",
            "Create role-based dependencies",
            "Check permissions before each operation",
            "Log unauthorized access attempts"
        ],
        "code_example": "def require_role(role: str):\n    def role_checker(user = Depends(get_current_user)):\n        if user.role != role:\n            raise HTTPException(status_code=403)\n    return role_checker"
    },
    "Missing CORS Configuration": {
        "recommendation": "Configure proper CORS policies to restrict cross-origin requests",
        "implementation_steps": [
            "Set specific allowed origins",
            "Limit allowed methods (GET, POST, etc.)",
            "Add allowed headers",
            "Enable credentials only for trusted origins"
        ],
        "code_example": "app.add_middleware(\n    CORSMiddleware,\n    allow_origins=['https://yourdomain.com'],\n    allow_methods=['GET', 'POST'],\n    allow_headers=['*']\n)"
    },
    
    # MongoDB Threats
    "No Authentication": {
        "recommendation": "Enable MongoDB authentication and create strong credentials",
        "implementation_steps": [
            "Enable auth in mongod.conf: auth=true",
            "Create admin user: db.createUser({user: 'admin', pwd: 'strongPassword', roles: ['root']})",
            "Restart MongoDB with authentication",
            "Update connection string with credentials"
        ],
        "code_example": "mongodb://username:password@localhost:27017/mydb?authSource=admin"
    },
    "Open Database Port": {
        "recommendation": "Restrict MongoDB access via firewall to specific IPs only",
        "implementation_steps": [
            "Bind MongoDB to localhost only (bindIp: 127.0.0.1)",
            "Use firewall rules to restrict port 27017",
            "Use VPN for remote access",
            "Enable MongoDB audit logging"
        ],
        "code_example": "# mongod.conf\nnet:\n  bindIp: 127.0.0.1\n  port: 27017"
    },
    "No Encryption": {
        "recommendation": "Enable encryption at rest and in transit (TLS)",
        "implementation_steps": [
            "Enable TLS/SSL for MongoDB connections",
            "Use encrypted storage for sensitive fields",
            "Enable MongoDB encryption at rest",
            "Use field-level encryption for PII"
        ],
        "code_example": "mongodb://localhost:27017/?ssl=true&ssl_ca_certs=/path/to/ca.pem"
    },
    "Weak Password": {
        "recommendation": "Use strong, unique passwords for database users",
        "implementation_steps": [
            "Generate strong passwords (16+ characters)",
            "Use password manager for storage",
            "Rotate passwords every 90 days",
            "Implement password complexity requirements"
        ],
        "code_example": "import secrets\npassword = secrets.token_urlsafe(24)  # 32 character strong password"
    },
    "Backup Missing": {
        "recommendation": "Implement regular automated backups with retention policy",
        "implementation_steps": [
            "Set up MongoDB backup script",
            "Schedule daily backups with cron",
            "Store backups in secure location",
            "Test restore procedure monthly"
        ],
        "code_example": "mongodump --uri='mongodb://...' --out=/backup/$(date +%Y%m%d)"
    },
    
    # Google Sheets Threats
    "Public Spreadsheet": {
        "recommendation": "Restrict sharing to specific users only and disable public access",
        "implementation_steps": [
            "Open Google Sheet → Share button",
            "Remove 'Anyone with link' access",
            "Add specific email addresses with appropriate permissions",
            "Enable 2FA for all users with access"
        ],
        "code_example": "# Use Google Sheets API with service account credentials\n# Never make sheets public"
    },
    "Exposed Credentials": {
        "recommendation": "Never hardcode credentials; use environment variables and secure storage",
        "implementation_steps": [
            "Remove hardcoded credentials from code",
            "Use environment variables: GOOGLE_CREDS_PATH",
            "Store credentials in secure vault (AWS Secrets Manager)",
            "Rotate exposed credentials immediately"
        ],
        "code_example": "import os\ncreds_path = os.getenv('GOOGLE_CREDS_PATH', 'credentials.json')"
    },
    "Improper Sharing": {
        "recommendation": "Review sharing settings regularly and audit access",
        "implementation_steps": [
            "Monthly review of sheet sharing settings",
            "Remove access for former employees",
            "Use Google Workspace groups for team access",
            "Enable audit logging"
        ],
        "code_example": "# Use Google Admin Console to audit sharing\n# Set up alerts for external sharing"
    },
    "No Backup": {
        "recommendation": "Enable version history and regular exports for data protection",
        "implementation_steps": [
            "Enable Google Sheets version history",
            "Set up automated weekly exports",
            "Store backups in secure location",
            "Test restore procedure quarterly"
        ],
        "code_example": "# File → Version History → See version history\n# Set up Google Apps Script for automated backups"
    },
    "Unauthorized Access": {
        "recommendation": "Use two-factor authentication and review access logs",
        "implementation_steps": [
            "Enable 2FA for all Google accounts",
            "Review access logs in Google Admin Console",
            "Set up alerts for suspicious activity",
            "Use security key for admin accounts"
        ],
        "code_example": "# Google Admin Console → Security → 2-step verification"
    },
    
    # GitHub API Threats
    "API Rate Limit": {
        "recommendation": "Implement rate limiting and caching to avoid hitting API limits",
        "implementation_steps": [
            "Cache API responses for 5-10 minutes",
            "Use conditional requests (ETag)",
            "Implement exponential backoff",
            "Monitor rate limit headers"
        ],
        "code_example": "import time\nif response.status_code == 403:\n    time.sleep(int(response.headers.get('X-RateLimit-Reset', 60)))"
    },
    "Leaked Token": {
        "recommendation": "Store tokens securely in environment variables and rotate immediately",
        "implementation_steps": [
            "Remove token from code and commit history",
            "Generate new token in GitHub Settings",
            "Store in secure vault (not in .env file)",
            "Enable token expiration"
        ],
        "code_example": "GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')  # From secure vault"
    },
    "Excessive Permissions": {
        "recommendation": "Use fine-grained personal access tokens with minimal permissions",
        "implementation_steps": [
            "Create new fine-grained PAT in GitHub",
            "Grant only necessary repository permissions",
            "Set expiration date (30-90 days)",
            "Revoke old tokens with broad permissions"
        ],
        "code_example": "# GitHub Settings → Developer settings → Fine-grained tokens\n# Select only required repositories and permissions"
    }
}


def generate_recommendations(threats: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Generate AI-powered recommendations for threats
    
    Args:
        threats: List of threat dictionaries with risk matrix data
        
    Returns:
        List of recommendations with implementation steps and code examples
    """
    recommendations = []
    
    for threat in threats:
        threat_name = threat.get("threat", "")
        fix_data = THREAT_FIX_MAP.get(threat_name, {
            "recommendation": "Review and address this security issue",
            "implementation_steps": ["Conduct security review", "Implement appropriate controls"],
            "code_example": "# Add security controls for: " + threat_name
        })
        
        # Enhance recommendation based on severity
        severity = threat.get("severity", "Low")
        if severity == "Critical":
            fix_data["implementation_steps"] = ["URGENT: " + step for step in fix_data["implementation_steps"]]
        
        recommendation = {
            "threat_id": threat.get("id", ""),
            "technology": threat.get("technology", ""),
            "threat": threat_name,
            "severity": severity,
            "fix_priority": threat.get("priority", "P4"),
            "recommendation": fix_data["recommendation"],
            "implementation_steps": fix_data["implementation_steps"],
            "code_example": fix_data["code_example"]
        }
        
        recommendations.append(recommendation)
    
    return recommendations


def generate_fix_plan(threats: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Generate prioritized fix plan
    
    Args:
        threats: List of threat dictionaries
        
    Returns:
        List of fix actions sorted by priority
    """
    fix_plan = []
    
    for threat in threats:
        fix_plan.append({
            "priority": threat.get("priority", "P4"),
            "threat": threat.get("threat", ""),
            "action": f"Fix {threat.get('threat', '')} in {threat.get('technology', '')}"
        })
    
    # Sort by priority (P1 first)
    priority_order = {"P1": 1, "P2": 2, "P3": 3, "P4": 4}
    fix_plan.sort(key=lambda x: priority_order.get(x["priority"], 4))
    
    return fix_plan


def generate_security_report(project: str, threats: List[Dict[str, Any]], risk_summary: Dict[str, int]) -> Dict[str, Any]:
    """
    Generate comprehensive security report
    
    Args:
        project: Project name
        threats: List of threat dictionaries
        risk_summary: Risk summary dictionary
        
    Returns:
        Security report with executive summary and recommendations
    """
    total_threats = len(threats)
    critical_count = risk_summary.get("critical", 0)
    
    # Generate executive summary
    if critical_count > 0:
        executive_summary = f"Project '{project}' has {total_threats} vulnerabilities with {critical_count} critical risks requiring immediate attention."
    else:
        executive_summary = f"Project '{project}' has {total_threats} vulnerabilities. No critical risks identified."
    
    # Get top risks
    top_risks = [t.get("threat", "") for t in sorted(threats, key=lambda x: x.get("risk_score", 0), reverse=True)[:3]]
    
    return {
        "executive_summary": executive_summary,
        "top_risks": top_risks,
        "total_vulnerabilities": total_threats,
        "critical_risks": critical_count
    }