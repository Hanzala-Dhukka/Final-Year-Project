import os
from datetime import datetime
from typing import Dict, Any, List
from app.services.error_log_service import fire_and_forget_log

# Reports directory
REPORTS_DIR = "reports"

# Ensure reports directory exists
os.makedirs(REPORTS_DIR, exist_ok=True)


# Simple risk score calculation for backward compatibility
def calculate_risk_score(findings_list: List[Dict[str, Any]]) -> int:
    """
    Calculate risk score from findings list
    
    Args:
        findings_list: List of findings with issues
        
    Returns:
        Risk score (0-100)
    """
    SEVERITY_WEIGHTS = {
        "Critical": 25,
        "High": 10,
        "Medium": 5,
        "Low": 2
    }
    
    total_points = 0
    for finding in findings_list:
        for issue in finding.get("issues", []):
            severity = issue.get("severity", "Medium")
            total_points += SEVERITY_WEIGHTS.get(severity, 2)
    
    # Normalize to 0-100 scale
    risk_score = min(100, (total_points / 200) * 100)
    return int(risk_score)


def get_security_grade(risk_summary: Dict[str, int]) -> str:
    """Calculate security grade based on risk summary"""
    critical = risk_summary.get("critical", 0)
    high = risk_summary.get("high", 0)
    medium = risk_summary.get("medium", 0)
    low = risk_summary.get("low", 0)
    total = critical + high + medium + low
    
    if total == 0:
        return "A+"
    
    score = (critical * 25 + high * 15 + medium * 5 + low * 1) / total
    
    if score >= 20:
        return "F"
    elif score >= 15:
        return "D"
    elif score >= 10:
        return "C"
    elif score >= 5:
        return "B"
    else:
        return "A"


def generate_html_report(project_data: Dict[str, Any]) -> str:
    """Generate HTML report from project data"""
    
    project = project_data.get("project", "Unknown")
    threats_found = project_data.get("threats_found", 0)
    overall_risk = project_data.get("overall_risk", "Low")
    average_score = project_data.get("average_score", 0)
    risk_summary = project_data.get("risk_summary", {})
    top_risks = project_data.get("top_risks", [])
    threats = project_data.get("threats", [])
    recommendations = project_data.get("recommendations", [])
    security_report = project_data.get("security_report", {})
    
    # Get tech stack from first threat or use defaults
    tech_stack = {
        "Frontend": "React",
        "Backend": "FastAPI",
        "Database": "Google Sheets",
        "Authentication": "JWT",
        "Cloud": "AWS"
    }
    
    # Generate threat summary table rows
    threat_rows = ""
    for threat in threats[:10]:  # Limit to 10 for PDF
        threat_rows += f"""
        <tr>
            <td>{threat.get('threat', '')}</td>
            <td>{threat.get('category', '')}</td>
            <td>{threat.get('severity', '')}</td>
        </tr>
        """
    
    # Generate risk matrix table rows
    risk_rows = ""
    for threat in threats[:10]:
        risk_rows += f"""
        <tr>
            <td>{threat.get('threat', '')}</td>
            <td>{threat.get('likelihood', 0)}</td>
            <td>{threat.get('impact', 0)}</td>
            <td>{threat.get('risk_score', 0)}</td>
            <td>{threat.get('priority', '')}</td>
        </tr>
        """
    
    # Generate top 5 risks
    top_risks_html = ""
    for i, risk in enumerate(top_risks[:5], 1):
        top_risks_html += f"""
        <div class="risk-item">
            <span class="risk-number">{i}.</span>
            <span class="risk-name">{risk.get('threat', '')}</span>
            <span class="risk-score">Score: {risk.get('score', 0)}</span>
        </div>
        """
    
    # Generate recommendations
    rec_html = ""
    for rec in recommendations[:10]:
        steps = "<br>".join([f"• {step}" for step in rec.get("implementation_steps", [])])
        rec_html += f"""
        <div class="recommendation-item">
            <h4>{rec.get('technology', '')} - {rec.get('threat', '')}</h4>
            <p><strong>Recommendation:</strong> {rec.get('recommendation', '')}</p>
            <p><strong>Implementation:</strong> {steps}</p>
        </div>
        """
    
    # Generate implementation checklist
    checklist_items = [
        "Rotate Secrets",
        "Enable HTTPS",
        "Configure CSP",
        "Add Rate Limiting",
        "Encrypt Database",
        "Restrict IAM Roles",
        "Configure Firewall",
        "Enable Logging",
        "Enable MFA",
        "Enable CloudTrail"
    ]
    
    checklist_html = ""
    for item in checklist_items:
        checklist_html += f"""
        <div class="checkbox-item">☐ {item}</div>
        """
    
    # Calculate security metrics
    security_grade = get_security_grade(risk_summary)
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>CyberShield Threat Report</title>
        <style>
            @page {{
                size: A4;
                margin: 2cm;
            }}
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }}
            .cover {{
                text-align: center;
                padding: 100px 0;
                page-break-after: always;
            }}
            .cover h1 {{
                font-size: 36px;
                color: #1a1a1a;
                margin-bottom: 20px;
            }}
            .cover h2 {{
                font-size: 24px;
                color: #4a4a4a;
                margin-bottom: 40px;
            }}
            .section {{
                margin-bottom: 30px;
                page-break-inside: avoid;
            }}
            .section h2 {{
                font-size: 20px;
                color: #1a1a1a;
                border-bottom: 2px solid #3b82f6;
                padding-bottom: 10px;
                margin-bottom: 15px;
            }}
            .summary-box {{
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 20px;
                margin: 15px 0;
            }}
            .metric {{
                display: inline-block;
                text-align: center;
                margin: 10px 20px;
            }}
            .metric-value {{
                font-size: 32px;
                font-weight: bold;
                color: #3b82f6;
            }}
            .metric-label {{
                font-size: 12px;
                color: #666;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
            }}
            th, td {{
                border: 1px solid #ddd;
                padding: 10px;
                text-align: left;
            }}
            th {{
                background: #3b82f6;
                color: white;
            }}
            .risk-item {{
                padding: 10px;
                border-bottom: 1px solid #eee;
            }}
            .risk-number {{
                font-weight: bold;
                margin-right: 10px;
            }}
            .recommendation-item {{
                background: #f8f9fa;
                padding: 15px;
                margin: 10px 0;
                border-left: 4px solid #3b82f6;
            }}
            .checkbox-item {{
                padding: 8px 0;
                font-family: monospace;
            }}
            .footer {{
                text-align: center;
                font-size: 10px;
                color: #666;
                margin-top: 40px;
                page-break-before: always;
            }}
        </style>
    </head>
    <body>
        <!-- Cover Page -->
        <div class="cover">
            <h1>CyberShield</h1>
            <h2>AI Threat Modeling Report</h2>
            <p><strong>Prepared For</strong><br>{project}</p>
            <p><strong>Generated By</strong><br>CyberShield Security Platform</p>
            <p><strong>Date</strong><br>{datetime.now().strftime('%d %B %Y')}</p>
        </div>

        <!-- Executive Summary -->
        <div class="section">
            <h2>Executive Summary</h2>
            <div class="summary-box">
                <p>{security_report.get('executive_summary', '')}</p>
            </div>
            <div style="text-align: center;">
                <div class="metric">
                    <div class="metric-value">{overall_risk}</div>
                    <div class="metric-label">Overall Risk</div>
                </div>
                <div class="metric">
                    <div class="metric-value">{threats_found}</div>
                    <div class="metric-label">Threats Found</div>
                </div>
                <div class="metric">
                    <div class="metric-value">{risk_summary.get('critical', 0)}</div>
                    <div class="metric-label">Critical</div>
                </div>
                <div class="metric">
                    <div class="metric-value">{security_grade}</div>
                    <div class="metric-label">Security Grade</div>
                </div>
            </div>
        </div>

        <!-- Technology Stack -->
        <div class="section">
            <h2>Technology Stack</h2>
            <table>
                <tr><th>Component</th><th>Technology</th></tr>
                <tr><td>Frontend</td><td>{tech_stack.get('Frontend', 'N/A')}</td></tr>
                <tr><td>Backend</td><td>{tech_stack.get('Backend', 'N/A')}</td></tr>
                <tr><td>Database</td><td>{tech_stack.get('Database', 'N/A')}</td></tr>
                <tr><td>Authentication</td><td>{tech_stack.get('Authentication', 'N/A')}</td></tr>
                <tr><td>Cloud</td><td>{tech_stack.get('Cloud', 'N/A')}</td></tr>
            </table>
        </div>

        <!-- Threat Summary -->
        <div class="section">
            <h2>Threat Summary</h2>
            <table>
                <tr><th>Threat</th><th>Category</th><th>Severity</th></tr>
                {threat_rows}
            </table>
        </div>

        <!-- Risk Matrix -->
        <div class="section">
            <h2>Risk Matrix</h2>
            <table>
                <tr><th>Threat</th><th>Likelihood</th><th>Impact</th><th>Score</th><th>Priority</th></tr>
                {risk_rows}
            </table>
        </div>

        <!-- Top Five Risks -->
        <div class="section">
            <h2>Top Five Risks</h2>
            {top_risks_html}
        </div>

        <!-- AI Recommendations -->
        <div class="section">
            <h2>AI Recommendations</h2>
            {rec_html}
        </div>

        <!-- Implementation Checklist -->
        <div class="section">
            <h2>Implementation Checklist</h2>
            {checklist_html}
        </div>

        <!-- Security Metrics -->
        <div class="section">
            <h2>Security Metrics</h2>
            <table>
                <tr><th>Metric</th><th>Value</th></tr>
                <tr><td>Total Threats</td><td>{threats_found}</td></tr>
                <tr><td>Critical</td><td>{risk_summary.get('critical', 0)}</td></tr>
                <tr><td>High</td><td>{risk_summary.get('high', 0)}</td></tr>
                <tr><td>Medium</td><td>{risk_summary.get('medium', 0)}</td></tr>
                <tr><td>Low</td><td>{risk_summary.get('low', 0)}</td></tr>
                <tr><td>Average Score</td><td>{average_score}</td></tr>
                <tr><td>Security Grade</td><td>{security_grade}</td></tr>
            </table>
        </div>

        <!-- Appendix -->
        <div class="section footer">
            <h2>Appendix</h2>
            <p>Project ID: {project_data.get('project_id', 'N/A')}</p>
            <p>Generated: {datetime.now().isoformat()}</p>
            <p>Report Version: 1.0</p>
            <p>References: OWASP Top 10, CWE, MITRE ATT&CK</p>
        </div>
    </body>
    </html>
    """
    
    return html_content


def generate_pdf(project_id: str, project_data: Dict[str, Any]) -> str:
    """
    Generate PDF report for a project
    
    Args:
        project_id: Unique project identifier
        project_data: Complete project data including threats, risk matrix, recommendations
        
    Returns:
        Path to generated PDF file
    """
    # Generate HTML
    html_content = generate_html_report(project_data)
    
    # Try to convert to PDF, fallback to HTML if weasyprint not available
    try:
        from weasyprint import HTML
        
        html = HTML(string=html_content)
        pdf_bytes = html.write_pdf()
        
        # Save PDF
        filename = f"{project_data.get('project', 'report').replace(' ', '_')}_Threat_Report.pdf"
        filepath = os.path.join(REPORTS_DIR, filename)
        
        with open(filepath, 'wb') as f:
            f.write(pdf_bytes)
    except (ImportError, OSError):
        fire_and_forget_log()
        # Fallback: save as HTML
        filename = f"{project_data.get('project', 'report').replace(' ', '_')}_Threat_Report.html"
        filepath = os.path.join(REPORTS_DIR, filename)
        with open(filepath, 'w') as f:
            f.write(html_content)
    
    return filepath


def get_pdf_path(project_id: str, project_name: str) -> str:
    """Get the path to an existing PDF report"""
    filename = f"{project_name.replace(' ', '_')}_Threat_Report.pdf"
    return os.path.join(REPORTS_DIR, filename)


# Keep the old function name for backward compatibility
def generate_pdf_report(report_data: Dict[str, Any], output_path: str) -> None:
    """
    Generate comprehensive PDF report for GitHub scanner.
    Converts scanner data format and delegates to the professional reportlab generator.
    
    Args:
        report_data: Report data dictionary (full scan result)
        output_path: Path to save PDF
    """
    try:
        from app.reports.pdf_generator import generate_report_pdf

        # Map GitHub scanner data to the professional PDF generator format
        scan_summary = report_data.get("scan_summary", {})
        severity_counts = scan_summary.get("severity_counts", {})
        ai_report = report_data.get("ai_report", {})
        repo_info = report_data.get("repository_info", {})
        file_report = report_data.get("file_report", [])
        findings = report_data.get("findings", [])
        dep_findings = report_data.get("dependency_findings", [])

        # Calculate security score from severity counts
        critical = severity_counts.get("Critical", 0)
        high = severity_counts.get("High", 0)
        medium = severity_counts.get("Medium", 0)
        low = severity_counts.get("Low", 0)
        security_score = max(0, 100 - (critical * 25) - (high * 15) - (medium * 8) - (low * 2))

        # Build vulnerabilities list from file_report (more detailed than findings)
        vulnerabilities = []
        for file_entry in file_report:
            file_path = file_entry.get("file", "")
            for issue in file_entry.get("issues", []):
                vulnerabilities.append({
                    "type": issue.get("type", "Unknown"),
                    "severity": issue.get("severity", "Medium"),
                    "file": file_path,
                    "line": issue.get("line", "-"),
                    "column": issue.get("column", "-"),
                    "owasp": issue.get("owasp", "-"),
                    "cwe": issue.get("cwe", "-"),
                    "code": issue.get("locations", [{}])[0].get("snippet", "") if issue.get("locations") else "",
                    "impact": issue.get("impact", ""),
                    "recommendation": issue.get("recommendation", "Review and remediate this issue"),
                    "message": issue.get("message", ""),
                })

        # If no file_report issues, fall back to top-level findings
        if not vulnerabilities and findings:
            for f in findings:
                vulnerabilities.append({
                    "type": f.get("type", f.get("rule", "Unknown")),
                    "severity": f.get("severity", "Medium"),
                    "file": f.get("file", f.get("path", "")),
                    "line": f.get("line", "-"),
                    "column": f.get("column", "-"),
                    "owasp": f.get("owasp", "-"),
                    "cwe": f.get("cwe", "-"),
                    "code": f.get("snippet", f.get("code", "")),
                    "impact": f.get("impact", ""),
                    "recommendation": f.get("recommendation", "Review and remediate this issue"),
                    "message": f.get("message", ""),
                })

        # Build the professional report data structure
        professional_data = {
            "report_id": report_data.get("scan_id", report_data.get("report_id", "N/A")),
            "repository": repo_info.get("repository", repo_info.get("name", report_data.get("repository", "N/A"))),
            "branch": repo_info.get("defaultBranch", repo_info.get("default_branch", "main")),
            "created_at": report_data.get("created_at", datetime.now().isoformat()),
            "report_version": "1.0",
            "scanner_version": "CyberShield Scanner v1.0",
            "security_score": security_score,
            "risk_level": (scan_summary.get("risk_level", "Unknown") or "Unknown").upper(),
            "total_findings": len(vulnerabilities),
            "critical": critical,
            "high": high,
            "medium": medium,
            "low": low,
            "files_total": scan_summary.get("total_files_with_issues", len(file_report)),
            "vulnerabilities": vulnerabilities,
            "ai_report": {
                "executive_summary": ai_report.get("summary", scan_summary.get("summary", "")),
                "recommendations": ai_report.get("recommendations", scan_summary.get("recommendations", [])),
                "risk_level": ai_report.get("risk_level", scan_summary.get("risk_level", "")),
                "business_impact": ai_report.get("business_impact", []),
                "dependency_analysis": ai_report.get("dependency_analysis", ""),
            },
            # Additional metadata for the appendix
            "repo_url": repo_info.get("html_url", repo_info.get("url", "")),
            "scan_config": {
                "Owner": repo_info.get("owner", "N/A"),
                "Stars": str(repo_info.get("stars", 0)),
                "Forks": str(repo_info.get("forks", 0)),
                "Language": repo_info.get("language", "N/A"),
                "Visibility": repo_info.get("visibility", "N/A"),
                "License": repo_info.get("license", "N/A"),
                "Open Issues": str(repo_info.get("issues", 0)),
            },
        }

        generate_report_pdf(professional_data, output_path)

    except Exception as e:
        fire_and_forget_log()
        print(f"Professional PDF generation failed, falling back to simple HTML: {e}")
        # Fallback: simple HTML report
        _generate_simple_html_report(report_data, output_path)


def _generate_simple_html_report(report_data: Dict[str, Any], output_path: str) -> None:
    """Fallback: generate a comprehensive HTML report and try to convert to PDF."""
    scan_summary = report_data.get("scan_summary", {})
    severity_counts = scan_summary.get("severity_counts", {})
    ai_report = report_data.get("ai_report", {})
    repo_info = report_data.get("repository_info", {})
    file_report = report_data.get("file_report", [])
    dep_findings = report_data.get("dependency_findings", [])

    # Build findings rows
    findings_html = ""
    row_idx = 0
    for file_entry in file_report:
        for issue in file_entry.get("issues", []):
            row_idx += 1
            sev = issue.get("severity", "Medium")
            sev_class = sev.lower()
            findings_html += f"""
            <tr>
                <td>{row_idx}</td>
                <td><span class="severity-badge severity-{sev_class}">{sev}</span></td>
                <td>{issue.get('type', 'N/A')}</td>
                <td>{file_entry.get('file', 'N/A')}</td>
                <td>{issue.get('line', '-')}</td>
                <td>{issue.get('recommendation', 'Review and remediate')}</td>
            </tr>"""

    # Dependency findings rows
    dep_html = ""
    for dep in dep_findings:
        sev = dep.get("severity", "Low")
        dep_html += f"""
        <tr>
            <td>{dep.get('package', 'N/A')}</td>
            <td>{dep.get('version', 'N/A')}</td>
            <td>{dep.get('status', 'N/A')}</td>
            <td><span class="severity-badge severity-{sev.lower()}">{sev}</span></td>
        </tr>"""

    # Recommendations
    recs = ai_report.get("recommendations", scan_summary.get("recommendations", []))
    recs_html = ""
    for i, rec in enumerate(recs, 1):
        if isinstance(rec, dict):
            recs_html += f"<li><strong>{rec.get('title', f'Recommendation {i}')}:</strong> {rec.get('description', rec.get('detail', ''))}</li>"
        else:
            recs_html += f"<li>{rec}</li>"

    critical = severity_counts.get("Critical", 0)
    high = severity_counts.get("High", 0)
    medium = severity_counts.get("Medium", 0)
    low = severity_counts.get("Low", 0)
    security_score = max(0, 100 - (critical * 25) - (high * 15) - (medium * 8) - (low * 2))

    html_content = f"""<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>CyberShield Security Report</title>
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{ font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; background: #fff; }}
            .cover {{ background: linear-gradient(135deg, #0f172a, #1e293b); color: white; padding: 60px 40px; text-align: center; min-height: 400px; display: flex; flex-direction: column; justify-content: center; }}
            .cover h1 {{ font-size: 36px; letter-spacing: 4px; margin-bottom: 8px; }}
            .cover h2 {{ font-size: 18px; color: #94a3b8; font-weight: 400; margin-bottom: 30px; }}
            .cover .meta {{ color: #cbd5e1; font-size: 13px; line-height: 2; }}
            .cover .meta b {{ color: #60a5fa; }}
            .cover .confidential {{ margin-top: 30px; color: #94a3b8; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; }}
            .section {{ padding: 30px 40px; page-break-inside: avoid; }}
            .section h2 {{ font-size: 20px; color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 8px; margin-bottom: 16px; }}
            .section h3 {{ font-size: 15px; color: #1e40af; margin: 16px 0 8px; }}
            .summary-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }}
            .summary-card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }}
            .summary-card .value {{ font-size: 28px; font-weight: 700; }}
            .summary-card .label {{ font-size: 12px; color: #64748b; margin-top: 4px; }}
            .score-circle {{ width: 100px; height: 100px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; color: white; margin: 10px 0; }}
            table {{ width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }}
            th {{ background: #1e293b; color: white; padding: 10px 12px; text-align: left; font-weight: 600; }}
            td {{ padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }}
            tr:nth-child(even) {{ background: #f8fafc; }}
            .severity-badge {{ padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; color: white; }}
            .severity-critical {{ background: #dc2626; }}
            .severity-high {{ background: #f97316; }}
            .severity-medium {{ background: #eab308; color: #1f2937; }}
            .severity-low {{ background: #22c55e; }}
            .rec-list {{ margin: 10px 0; padding-left: 20px; }}
            .rec-list li {{ margin: 6px 0; line-height: 1.6; }}
            .footer {{ text-align: center; padding: 20px; color: #94a3b8; font-size: 11px; border-top: 1px solid #e2e8f0; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="cover">
            <h1>CYBERSHIELD</h1>
            <h2>Security Scan Report</h2>
            <div class="meta">
                <b>Repository:</b> {repo_info.get('repository', 'N/A')}<br>
                <b>Branch:</b> {repo_info.get('defaultBranch', 'main')}<br>
                <b>Owner:</b> {repo_info.get('owner', 'N/A')}<br>
                <b>Language:</b> {repo_info.get('language', 'N/A')}<br>
                <b>Risk Level:</b> {scan_summary.get('risk_level', 'Unknown')}<br>
                <b>Generated:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            </div>
            <div class="confidential">Confidential &mdash; For Authorized Personnel Only</div>
        </div>

        <div class="section">
            <h2>1. Executive Summary</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="value" style="color: {'#22c55e' if security_score >= 80 else '#eab308' if security_score >= 60 else '#ef4444'}">{security_score}</div>
                    <div class="label">Security Score</div>
                </div>
                <div class="summary-card">
                    <div class="value" style="color: #dc2626">{critical}</div>
                    <div class="label">Critical</div>
                </div>
                <div class="summary-card">
                    <div class="value" style="color: #f97316">{high}</div>
                    <div class="label">High</div>
                </div>
                <div class="summary-card">
                    <div class="value" style="color: #eab308">{medium}</div>
                    <div class="label">Medium</div>
                </div>
            </div>
            <p><strong>Summary:</strong> {scan_summary.get('summary', 'No summary available')}</p>
            <p style="margin-top:8px"><strong>Risk Level:</strong> <span class="severity-badge severity-{scan_summary.get('risk_level', 'low').lower()}">{scan_summary.get('risk_level', 'Unknown')}</span></p>
            {f'<p style="margin-top:8px"><strong>AI Analysis:</strong> {ai_report.get("summary", "")}</p>' if ai_report.get('summary') else ''}
        </div>

        <div class="section">
            <h2>2. Repository Information</h2>
            <table>
                <tr><td><strong>Repository</strong></td><td>{repo_info.get('repository', 'N/A')}</td></tr>
                <tr><td><strong>Owner</strong></td><td>{repo_info.get('owner', 'N/A')}</td></tr>
                <tr><td><strong>Description</strong></td><td>{repo_info.get('description', 'N/A')}</td></tr>
                <tr><td><strong>Language</strong></td><td>{repo_info.get('language', 'N/A')}</td></tr>
                <tr><td><strong>Stars</strong></td><td>{repo_info.get('stars', 0)}</td></tr>
                <tr><td><strong>Forks</strong></td><td>{repo_info.get('forks', 0)}</td></tr>
                <tr><td><strong>Visibility</strong></td><td>{repo_info.get('visibility', 'N/A')}</td></tr>
                <tr><td><strong>License</strong></td><td>{repo_info.get('license', 'N/A')}</td></tr>
            </table>
        </div>

        <div class="section">
            <h2>3. Severity Breakdown</h2>
            <table>
                <thead><tr><th>Severity</th><th>Count</th></tr></thead>
                <tbody>
                    <tr><td><span class="severity-badge severity-critical">Critical</span></td><td>{critical}</td></tr>
                    <tr><td><span class="severity-badge severity-high">High</span></td><td>{high}</td></tr>
                    <tr><td><span class="severity-badge severity-medium">Medium</span></td><td>{medium}</td></tr>
                    <tr><td><span class="severity-badge severity-low">Low</span></td><td>{low}</td></tr>
                    <tr><td><strong>Total</strong></td><td><strong>{critical + high + medium + low}</strong></td></tr>
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>4. Detailed Findings</h2>
            {'<table><thead><tr><th>#</th><th>Severity</th><th>Type</th><th>File</th><th>Line</th><th>Recommendation</th></tr></thead><tbody>' + findings_html + '</tbody></table>' if findings_html else '<p>No vulnerabilities found.</p>'}
        </div>

        {"<div class='section'><h2>5. Dependency Analysis</h2><table><thead><tr><th>Package</th><th>Version</th><th>Status</th><th>Severity</th></tr></thead><tbody>" + dep_html + "</tbody></table></div>" if dep_html else ""}

        {"<div class='section'><h2>6. Recommendations</h2><ol class='rec-list'>" + recs_html + "</ol></div>" if recs_html else ""}

        <div class="footer">
            CyberShield Security Report &bull; Generated {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} &bull; Confidential
        </div>
    </body>
    </html>"""

    try:
        from weasyprint import HTML
        html = HTML(string=html_content)
        pdf_bytes = html.write_pdf()
        with open(output_path, 'wb') as f:
            f.write(pdf_bytes)
    except (ImportError, OSError):
        fire_and_forget_log()
        with open(output_path.replace('.pdf', '.html'), 'w', encoding='utf-8') as f:
            f.write(html_content)
