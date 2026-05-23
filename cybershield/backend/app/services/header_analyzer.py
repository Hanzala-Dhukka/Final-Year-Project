SECURITY_HEADERS = {
    "Content-Security-Policy": {
        "score": 25,
        "severity": "Critical",
        "recommendation": "Add Content-Security-Policy header to prevent XSS attacks.",
        "owasp": "A03:2021 - Injection"
    },
    "Strict-Transport-Security": {
        "score": 25,
        "severity": "Critical",
        "recommendation": "Enable HSTS to force HTTPS connections.",
        "owasp": "A02:2021 - Cryptographic Failures"
    },
    "X-Frame-Options": {
        "score": 20,
        "severity": "High",
        "recommendation": "Add X-Frame-Options to prevent clickjacking.",
        "owasp": "A05:2021 - Security Misconfiguration"
    },
    "X-Content-Type-Options": {
        "score": 15,
        "severity": "Medium",
        "recommendation": "Set X-Content-Type-Options to nosniff.",
        "owasp": "A05:2021 - Security Misconfiguration"
    },
    "Referrer-Policy": {
        "score": 15,
        "severity": "Medium",
        "recommendation": "Add Referrer-Policy to protect user privacy.",
        "owasp": "A01:2021 - Broken Access Control"
    }
}


def analyze_security_headers(headers):
    total_score = 0
    results = []

    for header, config in SECURITY_HEADERS.items():
        exists = header in headers
        earned_score = config["score"] if exists else 0

        if exists:
            total_score += config["score"]

        results.append({
            "header": header,
            "exists": exists,
            "score": earned_score,
            "max_score": config["score"],
            "severity": config["severity"],
            "recommendation": (
                "Properly configured"
                if exists
                else config["recommendation"]
            ),
            "owasp": config["owasp"]
        })

    if total_score >= 80:
        risk_level = "Low"
    elif total_score >= 50:
        risk_level = "Medium"
    else:
        risk_level = "High"

    return {
        "total_score": total_score,
        "risk_level": risk_level,
        "results": results
    }
