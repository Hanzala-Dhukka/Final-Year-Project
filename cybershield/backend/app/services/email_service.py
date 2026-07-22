"""
Email service for sending password reset emails.
"""
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
from app.core.config import settings as core_settings


# Email configuration
mail_config = ConnectionConfig(
    MAIL_USERNAME=core_settings.MAIL_USERNAME,
    MAIL_PASSWORD=core_settings.MAIL_PASSWORD,
    MAIL_FROM=core_settings.MAIL_FROM,
    MAIL_PORT=core_settings.MAIL_PORT,
    MAIL_SERVER=core_settings.MAIL_SERVER,
    MAIL_STARTTLS=core_settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=core_settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=core_settings.USE_CREDENTIALS,
    VALIDATE_CERTS=core_settings.VALIDATE_CERTS
)


class EmailService:
    """Service for sending emails."""
    
    @staticmethod
    async def send_verification_email(email: EmailStr, verification_token: str, user_name: str):
        """
        Send email verification email.
        
        Args:
            email: User's email address
            verification_token: Email verification token
            user_name: User's name
        """
        try:
            # Create verification link
            verification_link = f"{core_settings.FRONTEND_URL}/verify-email?token={verification_token}"
            
            # Email content
            subject = "CyberShield - Verify Your Email"
            body = f"""
            Hello {user_name},
            
            Thank you for registering with CyberShield!
            
            Please verify your email address by clicking the link below:
            {verification_link}
            
            This link will expire in 24 hours for security reasons.
            
            If you did not create this account, please ignore this email.
            
            Best regards,
            CyberShield Team
            """
            
            # Create message
            message = MessageSchema(
                subject=subject,
                recipients=[email],
                body=body,
                subtype="plain"
            )
            
            # Send email
            fm = FastMail(mail_config)
            await fm.send_message(message)
            
            print(f"Verification email sent to {email}")
            return True
            
        except Exception as e:
            print(f"Error sending verification email: {e}")
            return False

    @staticmethod
    async def send_password_reset_email(email: EmailStr, reset_token: str, user_name: str):
        """
        Send password reset email.
        
        Args:
            email: User's email address
            reset_token: Password reset token
            user_name: User's name
        """
        try:
            # Create reset link
            reset_link = f"{core_settings.FRONTEND_URL}/reset-password/{reset_token}"
            
            # Email content
            subject = "CyberShield - Password Reset Request"
            body = f"""
            Hello {user_name},
            
            You have requested to reset your password for your CyberShield account.
            
            Click the link below to reset your password:
            {reset_link}
            
            This link will expire in 15 minutes for security reasons.
            
            If you did not request this password reset, please ignore this email.
            
            Best regards,
            CyberShield Team
            """
            
            # Create message
            message = MessageSchema(
                subject=subject,
                recipients=[email],
                body=body,
                subtype="plain"
            )
            
            # Send email
            fm = FastMail(mail_config)
            await fm.send_message(message)
            
            print(f"Password reset email sent to {email}")
            return True
            
        except Exception as e:
            print(f"Error sending password reset email: {e}")
            return False
    
    @staticmethod
    async def send_welcome_email(email: EmailStr, user_name: str):
        """
        Send welcome email to new user.
        
        Args:
            email: User's email address
            user_name: User's name
        """
        try:
            subject = "Welcome to CyberShield!"
            body = f"""
            Hello {user_name},
            
            Welcome to CyberShield - Your Cybersecurity Learning Platform!
            
            We're excited to have you on board. Start your journey to becoming a cybersecurity expert today.
            
            Best regards,
            CyberShield Team
            """
            
            message = MessageSchema(
                subject=subject,
                recipients=[email],
                body=body,
                subtype="plain"
            )
            
            fm = FastMail(mail_config)
            await fm.send_message(message)
            
            print(f"Welcome email sent to {email}")
            return True
            
        except Exception as e:
            print(f"Error sending welcome email: {e}")
            return False


# Create singleton instance
email_service = EmailService()


# ─────────────────────────────────────────────────────────────────────────────
# Module 6.5 — Security alert & scheduled report emails
# A lightweight SMTP sender (logs everything to the `email_logs` collection).
# ─────────────────────────────────────────────────────────────────────────────
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Optional

from app.config.settings import settings
from app.database.db import database

EMAIL_LOGS = "email_logs"


def _log_email(to_email: str, subject: str, ok: bool, error: Optional[str] = None,
               category: str = "alert") -> None:
    """Persist an email send attempt to the email_logs collection."""
    try:
        database[EMAIL_LOGS].insert_one({
            "to": to_email,
            "subject": subject,
            "category": category,
            "success": ok,
            "error": error,
            "created_at": datetime.utcnow(),
        })
    except Exception:
        pass


def send_security_alert(to_email: str, title: str, message: str,
                        risk_score: Optional[int] = None) -> bool:
    """Send a branded CyberShield security alert email (SMTP)."""
    if not to_email:
        return False
    risk_line = f"<p><strong>Current Risk Score:</strong> {risk_score}</p>" if risk_score is not None else ""
    body = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
      <h2 style="color:#b71c1c;">CyberShield Security Alert</h2>
      <p><strong>{title}</strong></p>
      <p>{message}</p>
      {risk_line}
      <p style="margin-top:24px;">
        <a href="http://localhost:3000/dashboard"
           style="background:#1565c0;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">
          Click to review
        </a>
      </p>
      <hr/>
      <small style="color:#888;">This is an automated message from CyberShield.</small>
    </div>
    """
    return _send_smtp(to_email, "CyberShield Security Alert", body, category="alert")


def send_report_email(to_email: str, subject: str, message: str,
                      report_type: str = "report") -> bool:
    """Send a scheduled report (weekly / monthly / executive)."""
    if not to_email:
        return False
    body = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
      <h2 style="color:#1565c0;">{subject}</h2>
      <p>{message}</p>
      <p style="margin-top:24px;">
        <a href="http://localhost:3000/dashboard"
           style="background:#1565c0;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">
          Open CyberShield
        </a>
      </p>
    </div>
    """
    return _send_smtp(to_email, subject, body, category=report_type)


def _send_smtp(to_email: str, subject: str, body: str, category: str = "alert") -> bool:
    """Low-level SMTP send with graceful no-credential fallback."""
    user = settings.EMAIL_USER
    pwd = settings.EMAIL_PASSWORD
    if not user or not pwd:
        _log_email(to_email, subject, True, error="SMTP not configured; skipped send",
                   category=category)
        return True
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = user
        msg["To"] = to_email
        msg.attach(MIMEText(body, "html"))
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
            server.login(user, pwd)
            server.sendmail(user, to_email, msg.as_string())
        _log_email(to_email, subject, True, category=category)
        return True
    except Exception as e:
        _log_email(to_email, subject, False, error=str(e), category=category)
        return False
