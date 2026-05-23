SECURITY_HEADERS = {
    "Content-Security-Policy": 25,
    "Strict-Transport-Security": 25,
    "X-Frame-Options": 20,
    "X-Content-Type-Options": 15,
    "Referrer-Policy": 15,
}


def analyze_security_headers(headers):
    score = 0
    results = []

    for header, points in SECURITY_HEADERS.items():
        exists = header in headers

        if exists:
            score += points

        results.append({
            "header": header,
            "exists": exists,
            "score": points if exists else 0
        })

    if score >= 80:
        risk = "Low"
    elif score >= 50:
        risk = "Medium"
    else:
        risk = "High"

    return {
        "total_score": score,
        "risk_level": risk,
        "results": results
    }
