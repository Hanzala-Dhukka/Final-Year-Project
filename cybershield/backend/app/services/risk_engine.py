def calculate_risk_score(findings):

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
