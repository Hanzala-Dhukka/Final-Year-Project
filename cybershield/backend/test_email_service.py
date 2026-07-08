import os
import sys
import asyncio

# Add the current directory to sys.path to allow imports from 'app'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from app.core.config import settings as core_settings
from app.services.email_service import email_service


def test_email():
    print("Starting Email Service Test...")

    recipient = "hanzalahatimtai8@gmail.com"
    user_name = "Hanzala"

    print(f"Configured MAIL_USERNAME: {core_settings.MAIL_USERNAME}")
    # Don't print the actual password for security, just check if it's set
    has_password = "Yes" if core_settings.MAIL_PASSWORD and core_settings.MAIL_PASSWORD != "your_app_password_here" else "No (using placeholder or empty)"
    print(f"Configured MAIL_PASSWORD set: {has_password}")

    if has_password == "No (using placeholder or empty)":
        print("\n⚠️ WARNING: You are using placeholder credentials in your .env file.")
        print("Please update MAIL_USERNAME and MAIL_PASSWORD in .env with your real Gmail credentials before running this test.")
        return

    print(f"Attempting to send welcome email to {recipient}...")
    asyncio.run(email_service.send_welcome_email(recipient, user_name))


if __name__ == "__main__":
    test_email()