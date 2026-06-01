def generate_security_report(data):
    """
    Generates a summarized security report from scan findings.
    """
    findings = data.get("findings", [])
    
    total_files_with_issues = len(findings)
    severity_counts = {
        "Critical": 0,
        "High": 0,
        "Medium": 0,
        "Low": 0
    }
    
    for finding in findings:
        for issue in finding.get("issues", []):
            severity = issue.get("severity", "Low")
            if severity in severity_counts:
                severity_counts[severity] += 1
            else:
                severity_counts["Low"] += 1
                
    summary = f"Scan completed. Found {total_files_with_issues} files with potential security issues."
    
    # Determine overall risk level
    if severity_counts["Critical"] > 0:
        risk_level = "Critical"
    elif severity_counts["High"] > 0:
        risk_level = "High"
    elif severity_counts["Medium"] > 0:
        risk_level = "Medium"
    elif severity_counts["Low"] > 0:
        risk_level = "Low"
    else:
        risk_level = "Safe"
        
    return {
        "summary": summary,
        "total_files_with_issues": total_files_with_issues,
        "severity_counts": severity_counts,
        "risk_level": risk_level,
        "recommendation": "Review the findings and rotate any leaked secrets immediately if necessary.",
        "recommendations": [
            "Review the findings and rotate any leaked secrets immediately if necessary."
        ]
    }
