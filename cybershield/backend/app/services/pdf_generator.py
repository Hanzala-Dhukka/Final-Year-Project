import os
from datetime import datetime
from typing import Dict, Any, List

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
        from weasyprint.fonts import FontConfiguration
        
        font_config = FontConfiguration()
        html = HTML(string=html_content)
        pdf_bytes = html.write_pdf(font_config=font_config)
        
        # Save PDF
        filename = f"{project_data.get('project', 'report').replace(' ', '_')}_Threat_Report.pdf"
        filepath = os.path.join(REPORTS_DIR, filename)
        
        with open(filepath, 'wb') as f:
            f.write(pdf_bytes)
    except (ImportError, OSError):
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
    Generate PDF report (legacy function for GitHub scanner compatibility)
    
    Args:
        report_data: Report data dictionary
        output_path: Path to save PDF
    """
    # Create a simple HTML report
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Security Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; padding: 20px; }}
            h1 {{ color: #333; }}
            .summary {{ background: #f5f5f5; padding: 15px; border-radius: 5px; }}
        </style>
    </head>
    <body>
        <h1>Security Report</h1>
        <div class="summary">
            <p><strong>Summary:</strong> {report_data.get('summary', 'No summary available')}</p>
            <p><strong>Risk Level:</strong> {report_data.get('risk_level', 'Unknown')}</p>
        </div>
    </body>
    </html>
    """
    
    try:
        from weasyprint import HTML
        from weasyprint.fonts import FontConfiguration
        
        font_config = FontConfiguration()
        html = HTML(string=html_content)
        pdf_bytes = html.write_pdf(font_config=font_config)
        
        with open(output_path, 'wb') as f:
            f.write(pdf_bytes)
    except (ImportError, OSError):
        # Fallback: save as HTML
        with open(output_path.replace('.pdf', '.html'), 'w') as f:
            f.write(html_content)