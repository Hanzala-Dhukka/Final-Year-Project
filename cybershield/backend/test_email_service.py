import os
import sys

# Add the current directory to sys.path to allow imports from 'app'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from app.services.email_service import send_email_alert
from app.config.settings import settings

def test_email():
    print("Starting Email Service Test...")
    
    recipient = "hanzalahatimtai8@gmail.com"
    subject = "Test Alert"
    content = "Security Alert"
    
    print(f"Configured EMAIL_USER: {settings.EMAIL_USER}")
    # Don't print the actual password for security, just check if it's set
    has_password = "Yes" if settings.EMAIL_PASSWORD and settings.EMAIL_PASSWORD != "your_app_password_here" else "No (using placeholder or empty)"
    print(f"Configured EMAIL_PASSWORD set: {has_password}")

    if has_password == "No (using placeholder or empty)":
        print("\n⚠️ WARNING: You are using placeholder credentials in your .env file.")
        print("Please update EMAIL_USER and EMAIL_PASSWORD in .env with your real Gmail credentials before running this test.")
        return

    print(f"Attempting to send email to {recipient}...")
    send_email_alert(recipient, subject, content)

if __name__ == "__main__":
    test_email()
