"""
Seed script: populates threat_reports + reports collections
so the Threat Reports frontend page shows data from both sources.

Usage:
    cd cybershield/backend
    python seed_reports.py
"""

import os
import sys
import uuid
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DATABASE_NAME", "CyberShieldDB")


def main():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]

    # ---- Find the first user in the DB ----
    user = db["users"].find_one()
    if not user:
        print("ERROR: No users found in the database.")
        print("Run 'python create_test_user.py' first, then re-run this script.")
        sys.exit(1)

    user_id = user["_id"]
    print(f"Using user_id: {user_id}")

    now = datetime.now(timezone.utc)

    # ===================================================================
    # 1. Threat Model Reports → "threat_reports" collection
    #    Read by: GET /api/v1/threat-dashboard/reports
    # ===================================================================
    threat_reports = [
        {
            "user_id": user_id,
            "project_name": "E-Commerce API Gateway",
            "description": "RESTful API gateway handling payment processing and user authentication",
            "risk_level": "Critical",
            "security_score": 38,
            "created_at": now - timedelta(days=1),
            "threats_found": 4,
            "threats": [
                {"name": "SQL Injection in search endpoint", "severity": "Critical", "score": 95},
                {"name": "Broken JWT validation", "severity": "High", "score": 82},
                {"name": "Missing rate limiting on login", "severity": "Medium", "score": 60},
                {"name": "Verbose error messages exposing stack traces", "severity": "Low", "score": 35},
            ],
        },
        {
            "user_id": user_id,
            "project_name": "React Admin Dashboard",
            "description": "Internal admin panel built with React and Node.js backend",
            "risk_level": "High",
            "security_score": 55,
            "created_at": now - timedelta(days=3),
            "threats_found": 3,
            "threats": [
                {"name": "XSS in user profile editor via dangerouslySetInnerHTML", "severity": "High", "score": 78},
                {"name": "CSRF on state-changing API endpoints", "severity": "High", "score": 75},
                {"name": "Insecure deserialization of user input", "severity": "Medium", "score": 62},
            ],
        },
        {
            "user_id": user_id,
            "project_name": "Mobile Banking Backend",
            "description": "Microservices backend for a mobile banking application",
            "risk_level": "Critical",
            "security_score": 29,
            "created_at": now - timedelta(days=5),
            "threats_found": 5,
            "threats": [
                {"name": "Insecure direct object reference on account endpoints", "severity": "Critical", "score": 92},
                {"name": "Hardcoded AWS keys in source code", "severity": "Critical", "score": 90},
                {"name": "Missing mTLS between internal microservices", "severity": "High", "score": 80},
                {"name": "Weak AES encryption on stored PII data", "severity": "Critical", "score": 88},
                {"name": "No audit logging for financial transactions", "severity": "Medium", "score": 55},
            ],
        },
        {
            "user_id": user_id,
            "project_name": "Blog CMS Platform",
            "description": "Content management system with user-generated content and markdown support",
            "risk_level": "Medium",
            "security_score": 68,
            "created_at": now - timedelta(days=7),
            "threats_found": 3,
            "threats": [
                {"name": "Stored XSS in markdown comment rendering", "severity": "Medium", "score": 58},
                {"name": "Open redirect via return URL parameter", "severity": "Low", "score": 40},
                {"name": "Content injection through unsanitized HTML embeds", "severity": "Medium", "score": 52},
            ],
        },
        {
            "user_id": user_id,
            "project_name": "IoT Sensor Hub",
            "description": "Data aggregation service for IoT sensor telemetry",
            "risk_level": "Low",
            "security_score": 85,
            "created_at": now - timedelta(days=10),
            "threats_found": 2,
            "threats": [
                {"name": "Unencrypted MQTT message transport", "severity": "Low", "score": 30},
                {"name": "Default credentials on admin panel", "severity": "Medium", "score": 45},
            ],
        },
        {
            "user_id": user_id,
            "project_name": "CI/CD Pipeline Manager",
            "description": "Internal tool for managing deployment pipelines and secrets",
            "risk_level": "High",
            "security_score": 48,
            "created_at": now - timedelta(days=12),
            "threats_found": 4,
            "threats": [
                {"name": "Privilege escalation via webhook callback", "severity": "High", "score": 85},
                {"name": "Secrets exposed in build log output", "severity": "High", "score": 80},
                {"name": "SSRF through repository URL input field", "severity": "Medium", "score": 65},
                {"name": "Unrestricted Docker image pulls from public registries", "severity": "Medium", "score": 55},
            ],
        },
        {
            "user_id": user_id,
            "project_name": "Patient Records Portal",
            "description": "HIPAA-compliant portal for managing patient health records",
            "risk_level": "Critical",
            "security_score": 32,
            "created_at": now - timedelta(days=14),
            "threats_found": 5,
            "threats": [
                {"name": "Unencrypted PHI data at rest in MongoDB", "severity": "Critical", "score": 96},
                {"name": "Missing RBAC on patient records API", "severity": "Critical", "score": 93},
                {"name": "Session fixation in authentication flow", "severity": "High", "score": 79},
                {"name": "Insufficient backup encryption for compliance data", "severity": "High", "score": 76},
                {"name": "Missing audit trail for data access events", "severity": "Critical", "score": 91},
            ],
        },
    ]

    # ===================================================================
    # 2. GitHub Scan Reports → "reports" collection
    #    Read by: GET /api/v1/reports/history
    #    (Uses same schema as professional scan reports)
    # ===================================================================
    scan_reports = [
        {
            "user_id": str(user_id),
            "report_id": f"CSR-20260805-{uuid.uuid4().hex[:6].upper()}",
            "scan_id": f"scan-{uuid.uuid4().hex[:8]}",
            "title": "GitHub Scan: cyber-security-toolkit",
            "repository": "cyber-security-toolkit",
            "repo_url": "https://github.com/user/cyber-security-toolkit",
            "branch": "main",
            "security_score": 42,
            "risk_level": "High",
            "critical": 3,
            "high": 7,
            "medium": 4,
            "low": 2,
            "summary": "3 critical and 7 high-severity vulnerabilities in dependency chain. Critical: outdated OpenSSL, hardcoded credentials in CI config, SSRF in webhook handler.",
            "created_at": (now - timedelta(hours=6)).isoformat(),
        },
        {
            "user_id": str(user_id),
            "report_id": f"CSR-20260803-{uuid.uuid4().hex[:6].upper()}",
            "scan_id": f"scan-{uuid.uuid4().hex[:8]}",
            "title": "GitHub Scan: react-admin-pro",
            "repository": "react-admin-pro",
            "repo_url": "https://github.com/user/react-admin-pro",
            "branch": "main",
            "security_score": 62,
            "risk_level": "Medium",
            "critical": 0,
            "high": 2,
            "medium": 5,
            "low": 3,
            "summary": "2 medium-severity issues: outdated lodash prototype pollution, missing Content-Security-Policy headers on admin routes.",
            "created_at": (now - timedelta(days=2)).isoformat(),
        },
        {
            "user_id": str(user_id),
            "report_id": f"CSR-20260801-{uuid.uuid4().hex[:6].upper()}",
            "scan_id": f"scan-{uuid.uuid4().hex[:8]}",
            "title": "GitHub Scan: payment-gateway-sdk",
            "repository": "payment-gateway-sdk",
            "repo_url": "https://github.com/user/payment-gateway-sdk",
            "branch": "main",
            "security_score": 18,
            "risk_level": "Critical",
            "critical": 4,
            "high": 5,
            "medium": 3,
            "low": 1,
            "summary": "Critical: Hardcoded Stripe secret key in config.js. 4 additional critical issues in crypto module including weak IV generation and insecure key exchange.",
            "created_at": (now - timedelta(days=4)).isoformat(),
        },
        {
            "user_id": str(user_id),
            "report_id": f"CSR-20260729-{uuid.uuid4().hex[:6].upper()}",
            "scan_id": f"scan-{uuid.uuid4().hex[:8]}",
            "title": "GitHub Scan: iot-data-pipeline",
            "repository": "iot-data-pipeline",
            "repo_url": "https://github.com/user/iot-data-pipeline",
            "branch": "main",
            "security_score": 82,
            "risk_level": "Low",
            "critical": 0,
            "high": 0,
            "medium": 2,
            "low": 5,
            "summary": "Minor code quality issues. 2 medium: missing input validation on sensor endpoint, deprecated crypto library usage. No critical security findings.",
            "created_at": (now - timedelta(days=6)).isoformat(),
        },
        {
            "user_id": str(user_id),
            "report_id": f"CSR-20260727-{uuid.uuid4().hex[:6].upper()}",
            "scan_id": f"scan-{uuid.uuid4().hex[:8]}",
            "title": "GitHub Scan: patient-portal-api",
            "repository": "patient-portal-api",
            "repo_url": "https://github.com/user/patient-portal-api",
            "branch": "main",
            "security_score": 22,
            "risk_level": "Critical",
            "critical": 5,
            "high": 4,
            "medium": 3,
            "low": 2,
            "summary": "HIPAA compliance violations: unencrypted PII storage, missing audit logs, weak password hashing (MD5), IDOR on patient records, exposed debug endpoints.",
            "created_at": (now - timedelta(days=8)).isoformat(),
        },
    ]

    # ===================================================================
    # Insert (idempotent — skips if data already exists for this user)
    # ===================================================================

    # Threat model reports
    existing_threats = db["threat_reports"].count_documents({"user_id": user_id})
    if existing_threats == 0:
        result = db["threat_reports"].insert_many(threat_reports)
        print(f"Inserted {len(result.inserted_ids)} threat model reports into 'threat_reports'")
    else:
        print(f"Threat reports already exist ({existing_threats}), skipping")

    # Scan reports (in "reports" collection, read by /reports/history)
    existing_scans = db["reports"].count_documents({"user_id": str(user_id)})
    if existing_scans == 0:
        result = db["reports"].insert_many(scan_reports)
        print(f"Inserted {len(result.inserted_ids)} scan reports into 'reports'")
    else:
        print(f"Scan reports already exist ({existing_scans}), skipping")

    print("\nDone! Refresh the Threat Reports page in the browser.")
    print(f"  - Threat model reports: {db['threat_reports'].count_documents({'user_id': user_id})}")
    print(f"  - Scan reports:        {db['reports'].count_documents({'user_id': str(user_id)})}")
    client.close()


if __name__ == "__main__":
    main()
