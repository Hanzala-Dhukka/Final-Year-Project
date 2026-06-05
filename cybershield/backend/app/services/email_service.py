import smtplib 
from email.message import EmailMessage 
from app.config.settings import settings

def send_email_alert( 
    recipient, 
    subject, 
    content 
): 
    # Use environment variables for credentials
    email_user = settings.EMAIL_USER
    email_password = settings.EMAIL_PASSWORD

    if not email_user or not email_password:
        print("Email credentials not configured. Skipping email alert.")
        return

    msg = EmailMessage() 

    msg["Subject"] = subject 
    msg["From"] = email_user
    msg["To"] = recipient 

    msg.set_content(content) 

    try:
        with smtplib.SMTP( 
            "smtp.gmail.com", 
            587 
        ) as smtp: 

            smtp.starttls() 

            smtp.login( 
                email_user, 
                email_password 
            ) 

            smtp.send_message(msg)
            print(f"Email alert sent successfully to {recipient}")
    except Exception as e:
        print(f"Failed to send email alert: {e}")
