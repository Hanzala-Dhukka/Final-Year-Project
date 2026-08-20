"""
Report Email Service — Module D5

Sends CyberShield-branded security report emails via Gmail SMTP (SSL/465)
with optional PDF attachment. Logs every attempt to the email_logs collection.
"""

import smtplib
import ssl
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime, timezone
from typing import Optional

from app.config.settings import settings
from app.database.db import database
from app.services.error_log_service import fire_and_forget_log

EMAIL_LOGS = "email_logs"

SEVERITY_COLORS = {
    "critical": "#b71c1c",
    "high": "#e65100",
    "medium": "#f9a825",
    "low": "#2e7d32",
}


def _build_html_body(report_data: dict) -> str:
    """Build a branded HTML email body from report data."""
    score = report_data.get("security_score", 0)
    risk_level = report_data.get("risk_level", "UNKNOWN")
    repository = report_data.get("repository", "Unknown")
    report_id = report_data.get("report_id", "")
    critical = report_data.get("critical", 0)
    high = report_data.get("high", 0)
    medium = report_data.get("medium", 0)
    low = report_data.get("low", 0)
    total = report_data.get("total_findings", 0)
    created = report_data.get("created_at", "")

    risk_color = SEVERITY_COLORS.get(risk_level.lower(), "#546e7a")
    if score >= 85:
        score_color = "#2e7d32"
    elif score >= 65:
        score_color = "#f9a825"
    elif score >= 40:
        score_color = "#e65100"
    else:
        score_color = "#b71c1c"

    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;">
        <tr><td align="center" style="padding:32px 16px;">
          <table width="600" cellpadding="0" cellspacing="0"
                 style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

            <!-- Header -->
            <tr>
              <td style="background:#1a237e;padding:24px 32px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:1px;">
                  &#x1f6e1;&#xfe0f; CyberShield Security Report
                </h1>
                <p style="margin:6px 0 0;color:#b3b3ff;font-size:13px;">
                  Professional Security Analysis
                </p>
              </td>
            </tr>

            <!-- Repository -->
            <tr>
              <td style="padding:24px 32px 0;">
                <p style="margin:0;color:#555;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">
                  Repository
                </p>
                <h2 style="margin:4px 0 0;color:#1a237e;font-size:18px;">{repository}</h2>
                <p style="margin:4px 0 0;color:#999;font-size:12px;">Report ID: {report_id}</p>
              </td>
            </tr>

            <!-- Score Card -->
            <tr>
              <td style="padding:24px 32px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50%" style="vertical-align:top;">
                      <div style="background:#f8f9fa;border-radius:8px;padding:16px;text-align:center;">
                        <p style="margin:0;color:#888;font-size:12px;text-transform:uppercase;">Security Score</p>
                        <p style="margin:4px 0 0;font-size:36px;font-weight:bold;color:{score_color};">
                          {score}
                        </p>
                        <p style="margin:2px 0 0;font-size:14px;color:{risk_color};font-weight:bold;">
                          {risk_level}
                        </p>
                      </div>
                    </td>
                    <td width="10"></td>
                    <td width="50%" style="vertical-align:top;">
                      <div style="background:#f8f9fa;border-radius:8px;padding:16px;">
                        <p style="margin:0;color:#888;font-size:12px;text-transform:uppercase;">
                          Vulnerability Summary
                        </p>
                        <table width="100%" cellpadding="4" cellspacing="0" style="margin-top:8px;">
                          <tr>
                            <td style="color:{SEVERITY_COLORS['critical']};font-weight:bold;">Critical</td>
                            <td style="text-align:right;font-weight:bold;">{critical}</td>
                          </tr>
                          <tr>
                            <td style="color:{SEVERITY_COLORS['high']};font-weight:bold;">High</td>
                            <td style="text-align:right;font-weight:bold;">{high}</td>
                          </tr>
                          <tr>
                            <td style="color:{SEVERITY_COLORS['medium']};font-weight:bold;">Medium</td>
                            <td style="text-align:right;font-weight:bold;">{medium}</td>
                          </tr>
                          <tr>
                            <td style="color:{SEVERITY_COLORS['low']};font-weight:bold;">Low</td>
                            <td style="text-align:right;font-weight:bold;">{low}</td>
                          </tr>
                          <tr>
                            <td colspan="2" style="border-top:1px solid #ddd;padding-top:6px;font-weight:bold;">
                              Total: {total}
                            </td>
                          </tr>
                        </table>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td style="padding:0 32px 24px;text-align:center;">
                <a href="http://localhost:3000/reports/{report_id}"
                   style="display:inline-block;background:#1a237e;color:#ffffff;
                          padding:12px 28px;border-radius:6px;text-decoration:none;
                          font-weight:bold;font-size:14px;">
                  View Full Report
                </a>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f4f6f9;padding:16px 32px;text-align:center;">
                <p style="margin:0;color:#999;font-size:11px;">
                  Generated on {created} &middot; CyberShield Scanner v1.0
                </p>
                <p style="margin:4px 0 0;color:#bbb;font-size:10px;">
                  This is an automated security report. Do not reply to this email.
                </p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """


async def _log_email(to_email: str, subject: str, success: bool,
                     error: Optional[str] = None, category: str = "report") -> None:
    """Log email delivery attempt to the email_logs collection."""
    try:
        await database[EMAIL_LOGS].insert_one({
            "to": to_email,
            "subject": subject,
            "category": category,
            "success": success,
            "error": error,
            "created_at": datetime.now(timezone.utc),
        })
    except Exception:
        fire_and_forget_log()
        pass


async def send_report_email(
    to_email: str,
    report_data: dict,
    pdf_path: Optional[str] = None,
) -> bool:
    """
    Send a branded security report email via Gmail SMTP with optional PDF.

    Gracefully returns True (no-op) when SMTP credentials are not configured
    so the caller is never blocked by missing email settings.

    Args:
        to_email:   Recipient email address.
        report_data: Full report dict (security_score, vulnerabilities, …).
        pdf_path:   Optional filesystem path to a PDF to attach.

    Returns:
        True on success (or graceful skip), False on SMTP failure.
    """
    user = settings.EMAIL_USER
    pwd = settings.EMAIL_PASSWORD

    subject = (
        f"CyberShield Report — {report_data.get('repository', 'Unknown')} "
        f"(Score: {report_data.get('security_score', 0)}/100)"
    )

    # Graceful no-op when credentials are missing
    if not user or not pwd:
        await _log_email(
            to_email, subject, True,
            error="SMTP credentials not configured; skipped",
            category="report",
        )
        return True

    # Build MIME message
    msg = MIMEMultipart()
    msg["Subject"] = subject
    msg["From"] = user
    msg["To"] = to_email

    # HTML body
    html_body = _build_html_body(report_data)
    msg.attach(MIMEText(html_body, "html"))

    # Optional PDF attachment
    if pdf_path and os.path.isfile(pdf_path):
        try:
            filename = os.path.basename(pdf_path)
            with open(pdf_path, "rb") as f:
                part = MIMEBase("application", "pdf")
                part.set_payload(f.read())
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f'attachment; filename="{filename}"',
            )
            msg.attach(part)
        except Exception:
            fire_and_forget_log()
            pass  # Attach best-effort; still send the email body

    # Send
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
            server.login(user, pwd)
            server.sendmail(user, to_email, msg.as_string())
        await _log_email(to_email, subject, True, category="report")
        return True
    except Exception as e:
        fire_and_forget_log()
        await _log_email(to_email, subject, False, error=str(e), category="report")
        return False
