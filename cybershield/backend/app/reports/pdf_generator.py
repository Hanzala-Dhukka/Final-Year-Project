"""
PDF Report Generator — Module D5

Generates professional multi-page PDF security reports using reportlab.
Includes cover page, executive summary, vulnerability details, compliance mapping, and more.
"""

import os
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

# ── Brand colours ──────────────────────────────────────────────────────────────
PRIMARY = colors.HexColor("#1565c0")
PRIMARY_DARK = colors.HexColor("#0d47a1")
PRIMARY_LIGHT = colors.HexColor("#1e88e5")
SECONDARY = colors.HexColor("#1a237e")
BG_LIGHT = colors.HexColor("#e3f2fd")
BG_WHITE = colors.white
TEXT_DARK = colors.HexColor("#212121")
TEXT_MID = colors.HexColor("#616161")
TEXT_LIGHT = colors.white
GRID_COLOR = colors.HexColor("#e0e0e0")

SEVERITY_COLORS = {
    "Critical": colors.HexColor("#dc2626"),
    "High": colors.HexColor("#f97316"),
    "Medium": colors.HexColor("#eab308"),
    "Low": colors.HexColor("#22c55e"),
}

RISK_COLORS = {
    "CRITICAL": colors.HexColor("#dc2626"),
    "HIGH": colors.HexColor("#f97316"),
    "MEDIUM": colors.HexColor("#eab308"),
    "LOW": colors.HexColor("#22c55e"),
}

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 54  # ~0.75 inch


# ── Styles ─────────────────────────────────────────────────────────────────────
def _build_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name="CoverTitle",
        fontName="Helvetica-Bold",
        fontSize=32,
        leading=38,
        textColor=TEXT_LIGHT,
        alignment=TA_CENTER,
        spaceAfter=12,
    ))
    styles.add(ParagraphStyle(
        name="CoverSub",
        fontName="Helvetica",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#bbdefb"),
        alignment=TA_CENTER,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="SectionTitle",
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=PRIMARY_DARK,
        spaceBefore=20,
        spaceAfter=10,
        borderPadding=(0, 0, 4, 0),
    ))
    styles.add(ParagraphStyle(
        name="SubSectionTitle",
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=PRIMARY,
        spaceBefore=12,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="BodyText2",
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=TEXT_DARK,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="BodyBold",
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=14,
        textColor=TEXT_DARK,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="SmallText",
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=TEXT_MID,
    ))
    styles.add(ParagraphStyle(
        name="TableHeader",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=TEXT_LIGHT,
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        name="TableCell",
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=TEXT_DARK,
    ))
    styles.add(ParagraphStyle(
        name="ScoreBig",
        fontName="Helvetica-Bold",
        fontSize=48,
        leading=54,
        alignment=TA_CENTER,
        textColor=PRIMARY_DARK,
    ))
    styles.add(ParagraphStyle(
        name="CenterText",
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=TEXT_DARK,
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        name="FooterText",
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=TEXT_MID,
        alignment=TA_CENTER,
    ))
    return styles


# ── Page templates ─────────────────────────────────────────────────────────────

def _cover_page_bg(canvas, doc):
    """Draw a full-page dark background for the cover page."""
    canvas.saveState()
    # Dark gradient-like background
    canvas.setFillColor(PRIMARY_DARK)
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    # Accent bar at top
    canvas.setFillColor(PRIMARY_LIGHT)
    canvas.rect(0, PAGE_HEIGHT - 8, PAGE_WIDTH, 8, fill=1, stroke=0)
    # Accent bar at bottom
    canvas.rect(0, 0, PAGE_WIDTH, 8, fill=1, stroke=0)
    # Subtle decorative element
    canvas.setFillColor(colors.HexColor("#0d47a1"))
    canvas.rect(0, PAGE_HEIGHT * 0.35, PAGE_WIDTH, 2, fill=1, stroke=0)
    canvas.rect(0, PAGE_HEIGHT * 0.33, PAGE_WIDTH, 2, fill=1, stroke=0)
    canvas.restoreState()


def _normal_page(canvas, doc):
    """Header and footer for normal content pages."""
    canvas.saveState()

    # Header line
    canvas.setStrokeColor(PRIMARY)
    canvas.setLineWidth(1.5)
    canvas.line(MARGIN, PAGE_HEIGHT - 36, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 36)

    # Header text
    canvas.setFont("Helvetica-Bold", 8)
    canvas.setFillColor(PRIMARY)
    canvas.drawString(MARGIN, PAGE_HEIGHT - 30, "CyberShield")
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(TEXT_MID)
    canvas.drawRightString(PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 30, "Professional Security Report")

    # Footer line
    canvas.setStrokeColor(GRID_COLOR)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, 36, PAGE_WIDTH - MARGIN, 36)

    # Footer text
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(TEXT_MID)
    canvas.drawString(MARGIN, 22, "CyberShield Security Reporting System")
    canvas.drawCentredString(PAGE_WIDTH / 2, 22, f"Page {doc.page}")
    canvas.drawRightString(
        PAGE_WIDTH - MARGIN, 22,
        datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
    )

    canvas.restoreState()


# ── Helpers ────────────────────────────────────────────────────────────────────

def _score_color(score: int) -> colors.Color:
    if score >= 85:
        return colors.HexColor("#22c55e")
    if score >= 65:
        return colors.HexColor("#eab308")
    if score >= 40:
        return colors.HexColor("#f97316")
    return colors.HexColor("#dc2626")


def _make_table(headers, rows, col_widths=None):
    """Utility to build a styled table."""
    styles = _build_styles()
    header_cells = [Paragraph(h, styles["TableHeader"]) for h in headers]
    data = [header_cells]
    for row in rows:
        data.append([Paragraph(str(c), styles["TableCell"]) for c in row])

    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), TEXT_LIGHT),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, GRID_COLOR),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [BG_WHITE, BG_LIGHT]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]
    t.setStyle(TableStyle(style_cmds))
    return t


def _severity_badge(severity: str) -> str:
    """Return HTML-ish string for a severity badge inside a Paragraph."""
    color = SEVERITY_COLORS.get(severity, TEXT_MID)
    hex_color = color.hexval() if hasattr(color, "hexval") else "#616161"
    return (
        f'<font color="{hex_color}"><b>\u25cf {severity}</b></font>'
    )


# ── Main generator ─────────────────────────────────────────────────────────────

def generate_report_pdf(report_data: dict, output_path: str) -> str:
    """
    Generate a professional multi-page PDF report from report_data.

    Returns the output_path on success.
    """
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    styles = _build_styles()

    # ── Document setup with two page templates ─────────────────────────────────
    doc = BaseDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=50,
        bottomMargin=56,
        title=f"CyberShield Report — {report_data.get('report_id', '')}",
        author="CyberShield Scanner",
    )

    cover_frame = Frame(
        MARGIN, MARGIN, PAGE_WIDTH - 2 * MARGIN, PAGE_HEIGHT - 2 * MARGIN,
        id="cover",
    )
    content_frame = Frame(
        MARGIN, 56, PAGE_WIDTH - 2 * MARGIN, PAGE_HEIGHT - 106,
        id="content",
    )

    doc.addPageTemplates([
        PageTemplate(id="Cover", frames=[cover_frame], onPage=_cover_page_bg),
        PageTemplate(id="Normal", frames=[content_frame], onPage=_normal_page),
    ])

    # ── Build story ────────────────────────────────────────────────────────────
    story = []

    # ===== 1. COVER PAGE =====
    story.append(Spacer(1, PAGE_HEIGHT * 0.25))
    story.append(Paragraph("CYBERSHIELD", styles["CoverTitle"]))
    story.append(Paragraph("Professional Security Report", styles["CoverSub"]))
    story.append(Spacer(1, 30))

    cover_info = [
        f'<font color="#90caf9"><b>Report ID:</b></font>  {report_data.get("report_id", "N/A")}',
        f'<font color="#90caf9"><b>Repository:</b></font>  {report_data.get("repository", "N/A")}',
        f'<font color="#90caf9"><b>Branch:</b></font>  {report_data.get("branch", "N/A")}',
        f'<font color="#90caf9"><b>Date:</b></font>  {report_data.get("created_at", datetime.now(timezone.utc).isoformat())}',
        f'<font color="#90caf9"><b>Report Version:</b></font>  {report_data.get("report_version", "1.0")}',
        f'<font color="#90caf9"><b>Scanner Version:</b></font>  {report_data.get("scanner_version", "CyberShield Scanner v1.0")}',
    ]
    for line in cover_info:
        story.append(Paragraph(line, styles["CoverSub"]))

    story.append(Spacer(1, 40))
    story.append(Paragraph(
        '<font color="#bbdefb">Confidential — For Authorized Personnel Only</font>',
        styles["CoverSub"],
    ))

    # Switch to normal template after cover
    story.append(NextPageTemplate("Normal"))
    story.append(PageBreak())

    # ===== 2. EXECUTIVE SUMMARY =====
    story.append(Paragraph("1. Executive Summary", styles["SectionTitle"]))
    story.append(Spacer(1, 6))

    score = report_data.get("security_score", 0)
    risk_level = report_data.get("risk_level", "UNKNOWN")
    risk_color = RISK_COLORS.get(risk_level, TEXT_MID)
    risk_hex = risk_color.hexval() if hasattr(risk_color, "hexval") else "#616161"

    exec_data = [
        ["Security Score", f"{score}/100"],
        ["Risk Level", risk_level],
        ["Total Findings", str(report_data.get("total_findings", 0))],
        ["Critical", str(report_data.get("critical", 0))],
        ["High", str(report_data.get("high", 0))],
        ["Medium", str(report_data.get("medium", 0))],
        ["Low", str(report_data.get("low", 0))],
    ]
    exec_table = Table(exec_data, colWidths=[200, 200])
    exec_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("TEXTCOLOR", (0, 0), (-1, -1), TEXT_DARK),
        ("TEXTCOLOR", (1, 1), (1, 1), risk_color),
        ("FONTNAME", (1, 1), (1, 1), "Helvetica-Bold"),
        ("ALIGN", (1, 0), (1, -1), "LEFT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, GRID_COLOR),
        ("LINEBELOW", (0, -1), (-1, -1), 1, PRIMARY),
    ]))
    story.append(exec_table)
    story.append(Spacer(1, 12))

    # AI executive summary text if available
    ai_report = report_data.get("ai_report", {})
    executive_summary = ai_report.get("executive_summary", "")
    if executive_summary:
        story.append(Paragraph("AI-Generated Executive Summary", styles["SubSectionTitle"]))
        # Wrap long text
        for para_text in executive_summary.split("\n"):
            if para_text.strip():
                story.append(Paragraph(para_text.strip(), styles["BodyText2"]))

    # ===== 3. REPOSITORY INFORMATION =====
    story.append(Paragraph("2. Repository Information", styles["SectionTitle"]))

    repo_url = report_data.get("repo_url", "N/A")
    files_total = report_data.get("files_total", 0)
    scan_config = report_data.get("scan_config", {})

    repo_rows = [
        ["Repository", report_data.get("repository", "N/A")],
        ["URL", repo_url],
        ["Branch", report_data.get("branch", "main")],
        ["Files Scanned", str(files_total)],
    ]
    if scan_config:
        for key, value in scan_config.items():
            repo_rows.append([key.replace("_", " ").title(), str(value)])

    repo_table = Table(repo_rows, colWidths=[160, 300])
    repo_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, -1), PRIMARY),
        ("TEXTCOLOR", (1, 0), (1, -1), TEXT_DARK),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, GRID_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(repo_table)

    # ===== 4. SECURITY SCORE =====
    story.append(Paragraph("3. Security Score", styles["SectionTitle"]))

    sc_color = _score_color(score)
    sc_hex = sc_color.hexval() if hasattr(sc_color, "hexval") else "#616161"

    story.append(Spacer(1, 10))
    story.append(Paragraph(
        f'<font color="{sc_hex}"><b>{score}</b></font>',
        styles["ScoreBig"],
    ))
    story.append(Paragraph(f"out of 100", styles["CenterText"]))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        f'Risk Level: <font color="{risk_hex}"><b>{risk_level}</b></font>',
        styles["CenterText"],
    ))
    story.append(Spacer(1, 10))

    # Score breakdown explanation
    breakdown_text = (
        f"Scoring formula: 100 - (Critical \u00d7 10) - (High \u00d7 5) "
        f"- (Medium \u00d7 2) - (Low \u00d7 1) = {score}"
    )
    story.append(Paragraph(breakdown_text, styles["SmallText"]))

    # ===== 5. VULNERABILITY BREAKDOWN =====
    story.append(PageBreak())
    story.append(Paragraph("4. Vulnerability Breakdown", styles["SectionTitle"]))

    vulns = report_data.get("vulnerabilities", [])

    # Severity summary table
    sev_headers = ["Severity", "Count", "Percentage"]
    total = report_data.get("total_findings", len(vulns)) or 1
    sev_rows = []
    for sev in ["Critical", "High", "Medium", "Low"]:
        count = report_data.get(sev.lower(), 0)
        pct = f"{(count / total * 100):.1f}%" if total else "0%"
        sev_rows.append([_severity_badge(sev), str(count), pct])
    sev_rows.append(["Total", str(report_data.get("total_findings", 0)), "100%"])

    sev_table = _make_table(sev_headers, sev_rows, col_widths=[160, 100, 100])
    story.append(sev_table)
    story.append(Spacer(1, 16))

    # Full vulnerability table
    if vulns:
        story.append(Paragraph("All Vulnerability Findings", styles["SubSectionTitle"]))
        vuln_headers = ["#", "Severity", "Type", "File", "Line", "OWASP"]
        vuln_rows = []
        for idx, v in enumerate(vulns, 1):
            vuln_rows.append([
                str(idx),
                v.get("severity", "Medium"),
                v.get("type", "N/A"),
                _truncate(v.get("file", "N/A"), 40),
                str(v.get("line", "-")),
                v.get("owasp", "-"),
            ])
        vuln_table = _make_table(
            vuln_headers, vuln_rows,
            col_widths=[30, 70, 110, 140, 40, 80],
        )
        story.append(vuln_table)

    # ===== 6. AI RECOMMENDATIONS =====
    story.append(PageBreak())
    story.append(Paragraph("5. AI Recommendations", styles["SectionTitle"]))

    ai_report = report_data.get("ai_report", {})
    recommendations = ai_report.get("recommendations", [])
    if recommendations:
        for idx, rec in enumerate(recommendations, 1):
            if isinstance(rec, dict):
                title = rec.get("title", f"Recommendation {idx}")
                desc = rec.get("description", rec.get("detail", ""))
                priority = rec.get("priority", "Medium")
                story.append(Paragraph(
                    f'<b>{idx}. {title}</b> '
                    f'<font color="#616161">[Priority: {priority}]</font>',
                    styles["BodyBold"],
                ))
                if desc:
                    story.append(Paragraph(desc, styles["BodyText2"]))
                story.append(Spacer(1, 6))
            elif isinstance(rec, str):
                story.append(Paragraph(f"<b>{idx}.</b> {rec}", styles["BodyText2"]))
                story.append(Spacer(1, 4))
    else:
        # Fall back to top vulnerability recommendations
        story.append(Paragraph(
            "Review the detailed findings below for specific recommendations "
            "on each identified vulnerability.",
            styles["BodyText2"],
        ))

    # ===== 7. DETAILED FINDINGS =====
    story.append(PageBreak())
    story.append(Paragraph("6. Detailed Findings", styles["SectionTitle"]))

    if vulns:
        for idx, v in enumerate(vulns, 1):
            sev = v.get("severity", "Medium")
            sev_color_obj = SEVERITY_COLORS.get(sev, TEXT_MID)
            sev_hex = sev_color_obj.hexval() if hasattr(sev_color_obj, "hexval") else "#616161"

            # Finding header
            story.append(Paragraph(
                f'<font color="{sev_hex}"><b>\u25cf Finding #{idx}</b></font>'
                f'  \u2014  <b>{v.get("type", "Unknown")}</b>'
                f'  <font color="#616161">[{sev}]</font>',
                styles["SubSectionTitle"],
            ))

            detail_rows = [
                ["File", v.get("file", "N/A")],
                ["Line", str(v.get("line", "-"))],
                ["Type", v.get("type", "N/A")],
                ["OWASP", v.get("owasp", "-")],
                ["CWE", v.get("cwe", "-")],
            ]
            detail_table = Table(detail_rows, colWidths=[80, 380])
            detail_table.setStyle(TableStyle([
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("TEXTCOLOR", (0, 0), (0, -1), PRIMARY),
                ("TEXTCOLOR", (1, 0), (1, -1), TEXT_DARK),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("LINEBELOW", (0, 0), (-1, -1), 0.25, GRID_COLOR),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]))
            story.append(detail_table)
            story.append(Spacer(1, 4))

            # Code snippet
            code = v.get("code", "")
            if code:
                story.append(Paragraph("<b>Code Snippet:</b>", styles["BodyBold"]))
                # Use a preformatted style for code
                code_style = ParagraphStyle(
                    name=f"Code_{idx}",
                    fontName="Courier",
                    fontSize=8,
                    leading=10,
                    textColor=colors.HexColor("#c62828"),
                    backColor=colors.HexColor("#fafafa"),
                    borderWidth=0.5,
                    borderColor=GRID_COLOR,
                    borderPadding=6,
                    spaceBefore=2,
                    spaceAfter=6,
                )
                safe_code = code.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                story.append(Paragraph(safe_code, code_style))

            # Impact
            impact = v.get("impact", "")
            if impact:
                story.append(Paragraph(f"<b>Impact:</b> {impact}", styles["BodyText2"]))

            # Recommendation
            rec = v.get("recommendation", "")
            if rec:
                story.append(Paragraph(f"<b>Recommendation:</b> {rec}", styles["BodyText2"]))

            story.append(Spacer(1, 10))
            # Separator line
            sep_data = [[""]]
            sep_table = Table(sep_data, colWidths=[PAGE_WIDTH - 2 * MARGIN])
            sep_table.setStyle(TableStyle([
                ("LINEBELOW", (0, 0), (-1, -1), 1, PRIMARY_LIGHT),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            story.append(sep_table)
    else:
        story.append(Paragraph(
            "No vulnerabilities were identified in this scan.",
            styles["BodyText2"],
        ))

    # ===== 8. COMPLIANCE MAPPING =====
    story.append(PageBreak())
    story.append(Paragraph("7. Compliance Mapping", styles["SectionTitle"]))

    # OWASP Top 10 references
    owasp_refs = {}
    cwe_refs = {}
    for v in vulns:
        owasp = v.get("owasp", "")
        cwe = v.get("cwe", "")
        if owasp:
            owasp_refs.setdefault(owasp, []).append(v.get("type", "Unknown"))
        if cwe:
            cwe_refs.setdefault(cwe, []).append(v.get("type", "Unknown"))

    if owasp_refs:
        story.append(Paragraph("OWASP Top 10 References", styles["SubSectionTitle"]))
        owasp_headers = ["OWASP Reference", "Finding Types", "Count"]
        owasp_rows = []
        for ref, types in sorted(owasp_refs.items()):
            owasp_rows.append([ref, ", ".join(set(types)), str(len(types))])
        owasp_table = _make_table(owasp_headers, owasp_rows, col_widths=[180, 220, 70])
        story.append(owasp_table)
        story.append(Spacer(1, 12))

    if cwe_refs:
        story.append(Paragraph("CWE References", styles["SubSectionTitle"]))
        cwe_headers = ["CWE ID", "Finding Types", "Count"]
        cwe_rows = []
        for ref, types in sorted(cwe_refs.items()):
            cwe_rows.append([ref, ", ".join(set(types)), str(len(types))])
        cwe_table = _make_table(cwe_headers, cwe_rows, col_widths=[180, 220, 70])
        story.append(cwe_table)
        story.append(Spacer(1, 12))

    if not owasp_refs and not cwe_refs:
        story.append(Paragraph(
            "No OWASP or CWE mappings available for the findings in this report.",
            styles["BodyText2"],
        ))

    # ===== 9. APPENDIX =====
    story.append(PageBreak())
    story.append(Paragraph("8. Appendix", styles["SectionTitle"]))

    story.append(Paragraph("Report Metadata", styles["SubSectionTitle"]))
    meta_rows = [
        ["Report ID", report_data.get("report_id", "N/A")],
        ["Scan ID", report_data.get("scan_id", "N/A")],
        ["Repository", report_data.get("repository", "N/A")],
        ["Branch", report_data.get("branch", "N/A")],
        ["Report Version", report_data.get("report_version", "1.0")],
        ["Scanner Version", report_data.get("scanner_version", "CyberShield Scanner v1.0")],
        ["Security Score", f"{report_data.get('security_score', 0)}/100"],
        ["Risk Level", report_data.get("risk_level", "UNKNOWN")],
        ["Total Findings", str(report_data.get("total_findings", 0))],
        ["Files Scanned", str(report_data.get("files_total", 0))],
        ["Generated At", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")],
        ["Integrity Hash", report_data.get("integrity_hash", "N/A")],
    ]
    meta_table = Table(meta_rows, colWidths=[160, 320])
    meta_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), PRIMARY),
        ("TEXTCOLOR", (1, 0), (1, -1), TEXT_DARK),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, GRID_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 20))

    story.append(Paragraph("Integrity Verification", styles["SubSectionTitle"]))
    story.append(Paragraph(
        f"Report integrity hash (SHA-256): <font name='Courier' size='8'>"
        f"{report_data.get('integrity_hash', 'N/A')}</font>",
        styles["BodyText2"],
    ))
    story.append(Spacer(1, 12))
    story.append(Paragraph(
        "This report was generated by the CyberShield Professional Security Reporting System. "
        "The integrity hash can be used to verify that the report has not been tampered with.",
        styles["SmallText"],
    ))

    # ── Build PDF ──────────────────────────────────────────────────────────────
    doc.build(story)
    return output_path


# ── Internal helpers ───────────────────────────────────────────────────────────

def _truncate(text: str, max_len: int = 40) -> str:
    if len(text) <= max_len:
        return text
    return text[: max_len - 3] + "..."
