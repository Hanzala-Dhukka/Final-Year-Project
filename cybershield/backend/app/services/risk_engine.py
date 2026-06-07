def calculate_risk_score(findings):

    score = 100

    for finding in findings:

        # Handle both flat list of issues and nested structure
        issues = finding.get("issues", [finding])

        for issue in issues:
            if not isinstance(issue, dict):
                continue
                
            severity = issue.get("severity", "Low")

            if severity == "Critical":
                score -= 10

            elif severity == "High":
                score -= 5

            elif severity == "Medium":
                score -= 3

            elif severity == "Low":
                score -= 1

    return max(score, 0)
