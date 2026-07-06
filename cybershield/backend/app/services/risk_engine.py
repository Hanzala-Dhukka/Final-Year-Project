
"""Risk Engine - Calculates all security metrics and dashboard data"""


def calculate_risk_score(findings, dependency_report, secret_summary, file_report):
    """Calculate dynamic risk score using weighted severity points"""
    # Severity point values
    SEVERITY_WEIGHTS = {
        "Critical": 25,
        "High": 10,
        "Medium": 5,
        "Low": 2
    }

    total_points = 0

    # 1. Process source code findings (from scan_dangerous_code/scan_file_content)
    for finding in findings:
        for issue in finding.get("issues", []):
            severity = issue.get("severity", "Medium")
            total_points += SEVERITY_WEIGHTS.get(severity, 2)

    # 2. Process dependency findings
    if dependency_report:
        total_points += (dependency_report.get("risky", 0) * 15)
        total_points += (dependency_report.get("outdated", 0) * 5)

    # 3. Process secret findings
    if secret_summary:
        total_points += (secret_summary.get("critical", 0) * SEVERITY_WEIGHTS["Critical"])
        total_points += (secret_summary.get("high", 0) * SEVERITY_WEIGHTS["High"])
        total_points += (secret_summary.get("medium", 0) * SEVERITY_WEIGHTS["Medium"])

    # Convert to 100-point scale and clamp
    # Normalize total_points (max theoretical 200 → cap at 100)
    risk_score = min(100, (total_points / 200) * 100)
    risk_score = round(risk_score, 2)

    return risk_score


def get_risk_level(risk_score):
    """Determine risk level from score"""
    if risk_score <= 20:
        return "Low"
    elif risk_score <= 40:
        return "Moderate"
    elif risk_score <= 60:
        return "High"
    elif risk_score <= 80:
        return "Very High"
    else:
        return "Critical"


def get_security_grade(risk_score):
    """Convert score to letter grade"""
    if risk_score <= 20:
        return "A"
    elif risk_score <= 40:
        return "B"
    elif risk_score <= 60:
        return "C"
    elif risk_score <= 80:
        return "D"
    else:
        return "F"


def get_severity_summary(findings, dependency_report, secret_summary, advanced_secrets):
    """Aggregate severities from all modules"""
    summary = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0
    }

    # 1. Source code findings
    for finding in findings:
        for issue in finding.get("issues", []):
            sev = issue.get("severity", "Medium").lower()
            if sev in summary:
                summary[sev] += 1

    # 2. Dependencies
    if dependency_report:
        # Assume risky packages are High, outdated are Low
        summary["high"] += dependency_report.get("risky", 0)
        summary["low"] += dependency_report.get("outdated", 0)

    # 3. Secrets
    if secret_summary:
        summary["critical"] += secret_summary.get("critical", 0)
        summary["high"] += secret_summary.get("high", 0)
        summary["medium"] += secret_summary.get("medium", 0)

    return summary


def get_category_summary(findings, dependency_report, secret_summary, advanced_secrets):
    """Get summary by issue category"""
    categories = {
        "Secrets": 0,
        "Dependencies": 0,
        "Code Vulnerabilities": 0,
        "Configuration": 0
    }

    # Secrets
    if secret_summary:
        categories["Secrets"] = (
            secret_summary.get("critical", 0) +
            secret_summary.get("high", 0) +
            secret_summary.get("medium", 0) +
            secret_summary.get("low", 0)
        )

    # Dependencies
    if dependency_report:
        categories["Dependencies"] = dependency_report.get("risky", 0) + dependency_report.get("outdated", 0)

    # Code Vulnerabilities
    for finding in findings:
        categories["Code Vulnerabilities"] += len(finding.get("issues", []))

    return categories


def get_distribution(severity_summary):
    """Calculate percentage distribution of severities"""
    total = sum(severity_summary.values())
    if total == 0:
        return {
            "Critical": "0%",
            "High": "0%",
            "Medium": "0%",
            "Low": "0%"
        }
    return {
        "Critical": f"{round((severity_summary['critical'] / total) * 100)}%",
        "High": f"{round((severity_summary['high'] / total) * 100)}%",
        "Medium": f"{round((severity_summary['medium'] / total) * 100)}%",
        "Low": f"{round((severity_summary['low'] / total) * 100)}%"
    }


def get_repository_health(risk_score, severity_summary, secret_summary, dependency_report):
    """Calculate repository health scores"""
    health = {
        "overall": "Good",
        "maintainability": "Good",
        "security": "Good",
        "dependency_health": "Good",
        "secret_management": "Good"
    }

    # Overall based on risk score
    if risk_score > 80:
        health["overall"] = "Critical"
    elif risk_score > 60:
        health["overall"] = "Poor"
    elif risk_score > 40:
        health["overall"] = "Moderate"

    # Security
    critical_count = severity_summary.get("critical", 0)
    high_count = severity_summary.get("high", 0)
    if critical_count > 0:
        health["security"] = "Critical"
    elif high_count > 5:
        health["security"] = "Poor"
    elif high_count > 0:
        health["security"] = "Moderate"

    # Dependency health
    if dependency_report:
        if dependency_report.get("risky", 0) > 0:
            health["dependency_health"] = "Poor"
        elif dependency_report.get("outdated", 0) > 5:
            health["dependency_health"] = "Moderate"

    # Secret management
    if secret_summary and secret_summary.get("critical", 0) > 0:
        health["secret_management"] = "Critical"
    elif secret_summary and (secret_summary.get("high", 0) > 0 or secret_summary.get("medium", 0) > 0):
        health["secret_management"] = "Poor"

    return health


def get_top_risks(advanced_secrets, findings, dependency_findings):
    """Get 5 highest-priority risks"""
    risks = []

    # Add secrets first (highest priority)
    for secret in advanced_secrets:
        risks.append({
            "title": secret["type"],
            "severity": secret["severity"],
            "file": secret["file"],
            "recommendation": secret["recommendation"]
        })

    # Add dangerous code findings
    for finding in findings:
        for issue in finding.get("issues", []):
            risks.append({
                "title": issue["type"],
                "severity": issue["severity"],
                "file": finding["file"],
                "recommendation": "Review and fix this vulnerability"
            })

    # Add risky dependencies
    for dep in dependency_findings:
        risks.append({
            "title": f"Risky Dependency: {dep.get('name', 'unknown')}",
            "severity": "High",
            "file": dep.get("file", "package.json/requirements.txt"),
            "recommendation": "Update or replace this dependency"
        })

    # Sort by severity and take top 5
    SEVERITY_ORDER = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    risks.sort(key=lambda x: SEVERITY_ORDER.get(x.get("severity", "Low"), 4))

    return risks[:5]


def get_prioritized_recommendations(advanced_secrets, findings, dependency_report, ai_report):
    """Merge and prioritize recommendations"""
    recommendations = []
    seen = set()

    # Add recommendations from AI first, if available
    if ai_report and ai_report.get("recommendations"):
        for rec in ai_report["recommendations"]:
            if rec not in seen:
                seen.add(rec)
                recommendations.append({
                    "priority": len(recommendations) + 1,
                    "recommendation": rec
                })

    # Add secrets recommendations
    for secret in advanced_secrets:
        rec = secret["recommendation"]
        if rec not in seen:
            seen.add(rec)
            recommendations.append({
                "priority": len(recommendations) + 1,
                "recommendation": rec
            })

    # Add dependency recommendations
    if dependency_report:
        if dependency_report.get("outdated", 0) > 0 and "Update outdated dependencies" not in seen:
            seen.add("Update outdated dependencies")
            recommendations.append({
                "priority": len(recommendations) + 1,
                "recommendation": "Update outdated dependencies to reduce security risk"
            })
        if dependency_report.get("unpinned", 0) > 0 and "Pin dependency versions" not in seen:
            seen.add("Pin dependency versions")
            recommendations.append({
                "priority": len(recommendations) + 1,
                "recommendation": "Pin dependency versions for reproducible builds"
            })

    # Add GitHub secret scanning
    if "Enable GitHub Secret Scanning" not in seen:
        seen.add("Enable GitHub Secret Scanning")
        recommendations.append({
            "priority": len(recommendations) + 1,
            "recommendation": "Enable GitHub Secret Scanning to detect new secrets"
        })

    return recommendations[:10]  # Keep top 10


def get_score_card(risk_score, severity_summary, secret_summary, dependency_report):
    """Calculate category-specific scores"""
    total_secrets = (
        secret_summary.get("critical", 0) +
        secret_summary.get("high", 0) +
        secret_summary.get("medium", 0)
    )
    # Secrets score (0-100: 0 is best, 100 is worst)
    secrets_score = 100 - min(100, total_secrets * 10)

    # Dependencies score
    dep_issues = (dependency_report.get("risky", 0) * 20) + (dependency_report.get("outdated", 0) * 10)
    dependencies_score = max(0, 100 - dep_issues)

    # Source code score
    code_issues = (severity_summary.get("critical", 0) * 25) + (severity_summary.get("high", 0) * 10)
    source_code_score = max(0, 100 - code_issues)

    return {
        "Secrets": f"{max(0, secrets_score)}/100",
        "Dependencies": f"{max(0, dependencies_score)}/100",
        "Source Code": f"{max(0, source_code_score)}/100",
        "Configuration": "90/100"  # Placeholder for now
    }


def get_executive_summary(repository_info, technologies, file_report, severity_summary, security_grade, risk_dashboard):
    """Generate concise executive summary"""
    total_files = len(file_report)
    total_issues = sum(severity_summary.values())
    critical_issues = severity_summary.get("critical", 0)

    # Get detected technologies list
    tech_list = []
    if technologies.get("language"):
        tech_list.extend(technologies["language"])
    if technologies.get("frontend"):
        tech_list.extend(technologies["frontend"])
    if technologies.get("backend"):
        tech_list.extend(technologies["backend"])
    if technologies.get("database"):
        tech_list.extend(technologies["database"])
    tech_text = ", ".join(tech_list[:5]) if tech_list else "None detected"

    summary = f"Repository scanned successfully.\n\n"
    summary += f"Total Files Scanned: {total_files}\n"
    summary += f"Technologies Detected: {tech_text}\n"
    summary += f"Security Issues Found: {total_issues}\n"
    summary += f"Critical Issues: {critical_issues}\n"
    summary += f"Overall Security Grade: {security_grade}\n\n"

    if critical_issues > 0:
        summary += "Immediate attention is recommended due to exposed secrets and/or unsafe code execution."
    elif total_issues > 0:
        summary += "Moderate attention recommended to address identified security issues."
    else:
        summary += "Repository appears to have good security posture."

    return summary


def calculate_risk(findings, dependency_report, secret_summary, repository_info, technologies,
                   file_report, advanced_secrets, dependency_findings, ai_report, files_scanned):
    """Main function to calculate complete risk dashboard"""
    # Calculate base risk score
    risk_score = calculate_risk_score(findings, dependency_report, secret_summary, file_report)

    # Risk level and grade
    risk_level = get_risk_level(risk_score)
    security_grade = get_security_grade(risk_score)

    # Severity summary
    severity_summary = get_severity_summary(findings, dependency_report, secret_summary, advanced_secrets)

    # Category breakdown
    category_summary = get_category_summary(findings, dependency_report, secret_summary, advanced_secrets)

    # Distribution
    distribution = get_distribution(severity_summary)

    # Repository health
    repository_health = get_repository_health(risk_score, severity_summary, secret_summary, dependency_report)

    # Top risks
    top_risks = get_top_risks(advanced_secrets, findings, dependency_findings)

    # Prioritized recommendations
    recommendations = get_prioritized_recommendations(advanced_secrets, findings, dependency_report, ai_report)

    # Score card
    score_card = get_score_card(risk_score, severity_summary, secret_summary, dependency_report)

    # Executive summary
    executive_summary = get_executive_summary(repository_info, technologies, file_report,
                                              severity_summary, security_grade, {})

    return {
        "risk_dashboard": {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "security_grade": security_grade,
            "files_scanned": files_scanned
        },
        "severity_summary": severity_summary,
        "category_summary": category_summary,
        "distribution": distribution,
        "repository_health": repository_health,
        "top_risks": top_risks,
        "recommendations": recommendations,
        "score_card": score_card,
        "executive_summary": executive_summary
    }
