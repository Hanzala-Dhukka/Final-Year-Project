"""
Risk Engine — Calculates per-finding risk scores, overall security score,
and generates a priority fix queue for the Risk Dashboard.
"""


def calculate_risk_score(findings):
    """Legacy overall risk score (100-based) used by AI report generation."""
    score = 100
    for finding in findings:
        for issue in finding["issues"]:
            severity = issue["severity"]
            if severity == "Critical":
                score -= 15
            elif severity == "High":
                score -= 10
            elif severity == "Medium":
                score -= 5
    return max(score, 0)


# ── H6.5: Per-finding risk scoring ──────────────────────────────────────

SEVERITY_SCORE = {
    "Critical": 100,
    "High": 80,
    "Medium": 50,
    "Low": 20,
}


def calculate_risk(issue):
    """Calculate a 0–100 risk score for a single finding."""
    severity = issue.get("severity", "Low")
    base_score = SEVERITY_SCORE.get(severity, 10)
    score = base_score

    issue_type = issue.get("type", "").lower()

    # Boost dangerous vulnerability types
    if "api key" in issue_type:
        score += 15
    if "password" in issue_type:
        score += 10
    if "eval" in issue_type:
        score += 20
    if "command" in issue_type or "exec" in issue_type:
        score += 18
    if "sql injection" in issue_type:
        score += 20
    if "aws" in issue_type:
        score += 15
    if "jwt" in issue_type:
        score += 12
    if "mongodb" in issue_type or "database" in issue_type:
        score += 10

    return min(score, 100)


def risk_level(score):
    """Map a 0–100 risk score to a human-readable risk level."""
    if score >= 90:
        return "Critical"
    if score >= 70:
        return "High"
    if score >= 40:
        return "Medium"
    return "Low"


def generate_risk_dashboard(findings):
    """
    Generate the full risk dashboard data:
    - Per-finding risk scores and levels
    - Sorted priority queue (highest risk first)
    - Overall security score
    """
    risks = []
    for item in findings:
        score = calculate_risk(item)
        risks.append({
            **item,
            "risk_score": score,
            "risk_level": risk_level(score),
        })

    risks.sort(key=lambda x: x["risk_score"], reverse=True)

    # Count by severity for the distribution chart
    severity_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    for r in risks:
        level = r["risk_level"]
        if level in severity_counts:
            severity_counts[level] += 1

    return {
        "overall_score": calculate_security_score(risks),
        "priority_queue": risks[:10],
        "severity_distribution": severity_counts,
        "total_findings": len(risks),
    }


def calculate_security_score(risks):
    """Derive a 0–100 security score from cumulative risk scores."""
    if not risks:
        return 100

    total = sum(r["risk_score"] for r in risks)
    deduction = min(total // 5, 100)
    return max(100 - deduction, 0)
