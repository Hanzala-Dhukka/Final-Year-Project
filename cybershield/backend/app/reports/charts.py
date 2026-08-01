"""
Charts — Module D5

Chart data preparation functions for the frontend Recharts library.
All functions return plain lists of dicts ready for Recharts consumption.
"""

from collections import Counter


# ── Colour constants (severity) ────────────────────────────────────────────────
SEVERITY_COLORS = {
    "Critical": "#dc2626",
    "High": "#f97316",
    "Medium": "#eab308",
    "Low": "#22c55e",
}


def get_severity_pie_data(report_data: dict) -> list:
    """
    Return data formatted for Recharts PieChart.

    Output: [{"name": "Critical", "value": 3, "color": "#dc2626"}, ...]
    Only includes severities with count > 0.
    """
    data = []
    for severity in ["Critical", "High", "Medium", "Low"]:
        count = report_data.get(severity.lower(), 0)
        if count > 0:
            data.append({
                "name": severity,
                "value": count,
                "color": SEVERITY_COLORS[severity],
            })
    return data


def get_score_trend_data(score_history: list) -> list:
    """
    Return data formatted for Recharts LineChart showing score over time.

    Input:  [{"repository": "...", "score": 72, "scan_date": "2025-01-15T..."}, ...]
    Output: [{"date": "2025-01-15", "score": 72}, ...]
    """
    data = []
    for entry in score_history:
        scan_date = entry.get("scan_date", "")
        if isinstance(scan_date, str) and len(scan_date) >= 10:
            date_str = scan_date[:10]  # Extract YYYY-MM-DD
        else:
            date_str = str(scan_date)
        data.append({
            "date": date_str,
            "score": entry.get("score", 0),
        })
    return data


def get_comparison_bar_data(comparison: dict) -> list:
    """
    Return data formatted for Recharts BarChart comparing old vs new scan.

    Input:  Output of report_service.compare_scans()
    Output: [{"metric": "Critical", "previous": 5, "current": 2}, ...]
    """
    old_sev = comparison.get("old_severities", {})
    new_sev = comparison.get("new_severities", {})

    data = []
    for severity in ["Critical", "High", "Medium", "Low"]:
        data.append({
            "metric": severity,
            "previous": old_sev.get(severity, 0),
            "current": new_sev.get(severity, 0),
        })

    # Also include overall score comparison
    data.append({
        "metric": "Score",
        "previous": comparison.get("old_score", 0),
        "current": comparison.get("new_score", 0),
    })

    return data


def get_vulnerability_type_data(report_data: dict) -> list:
    """
    Return vulnerability counts by type for a BarChart.

    Output: [{"type": "SQL Injection", "count": 3, "severity": "Critical"}, ...]
    Sorted by count descending.
    """
    vulnerabilities = report_data.get("vulnerabilities", [])

    # Count occurrences of each type
    type_counter: Counter = Counter()
    type_severity_map: dict = {}

    # Priority order for severity when a type appears with multiple severities
    severity_priority = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}

    for vuln in vulnerabilities:
        v_type = vuln.get("type", "Unknown")
        severity = vuln.get("severity", "Medium")

        type_counter[v_type] += 1

        # Keep track of the highest severity for each type
        if v_type not in type_severity_map:
            type_severity_map[v_type] = severity
        else:
            current_priority = severity_priority.get(
                type_severity_map[v_type], 2
            )
            new_priority = severity_priority.get(severity, 2)
            if new_priority < current_priority:
                type_severity_map[v_type] = severity

    data = []
    for v_type, count in type_counter.most_common():
        data.append({
            "type": v_type,
            "count": count,
            "severity": type_severity_map.get(v_type, "Medium"),
        })

    return data
