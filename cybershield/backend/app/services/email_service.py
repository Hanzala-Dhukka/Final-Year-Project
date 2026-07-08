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