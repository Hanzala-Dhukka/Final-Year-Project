"""
CSV Report Generator — Module D5

Exports vulnerability findings as a CSV file for spreadsheet analysis.
"""

import csv
import os


def generate_report_csv(report_data: dict, output_path: str) -> str:
    """
    Generate a CSV report of vulnerabilities.

    Columns: Severity, Type, File, Line, OWASP, CWE, Impact, Recommendation, Status

    Returns the output_path on success.
    """
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    headers = [
        "Severity",
        "Type",
        "File",
        "Line",
        "OWASP",
        "CWE",
        "Impact",
        "Recommendation",
        "Status",
    ]

    vulnerabilities = report_data.get("vulnerabilities", [])

    with open(output_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(headers)

        for vuln in vulnerabilities:
            writer.writerow([
                vuln.get("severity", "Medium"),
                vuln.get("type", ""),
                vuln.get("file", ""),
                vuln.get("line", ""),
                vuln.get("owasp", ""),
                vuln.get("cwe", ""),
                vuln.get("impact", ""),
                vuln.get("recommendation", ""),
                "Open",
            ])

    return output_path
