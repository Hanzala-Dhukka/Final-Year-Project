"""
Configuration module for CyberShield application.
Loads environment variables and provides reusable settings.
"""
from dotenv import load_dotenv
from pathlib import Path
import os
from pydantic_settings import BaseSettings

# Load .env from the backend directory regardless of the current working directory
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=_BACKEND_ROOT / ".env", override=True)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "CyberShield"
    APP_ENV: str = "development"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # MongoDB
    MONGODB_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "cybershield786_db_user")
    
    # Security
    SECRET_KEY: str = os.getenv("JWT_SECRET_KEY") or os.getenv("JWT_SECRET") or "your-secret-key-here"
    ALGORITHM: str = os.getenv("JWT_ALGORITHM") or os.getenv("ALGORITHM") or "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour — gives the refresh flow time to kick in
    
    # GitHub
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN") or ""
    
    # Email
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "")
    MAIL_FROM: str = os.getenv("MAIL_FROM") or "noreply@example.com"
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", "465"))
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_STARTTLS: bool = os.getenv("MAIL_STARTTLS", "False").lower() in ("true", "1")
    MAIL_SSL_TLS: bool = os.getenv("MAIL_SSL_TLS", "True").lower() in ("true", "1")
    USE_CREDENTIALS: bool = True
    VALIDATE_CERTS: bool = True

    # Email via Resend API (HTTPS, works on Render where Gmail SMTP is blocked)
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    RESEND_FROM: str = os.getenv("RESEND_FROM", "CyberShield <onboarding@resend.dev>")

    # Email via Brevo API (HTTPS) — primary provider; sends to any recipient.
    BREVO_API_KEY: str = os.getenv("BREVO_API_KEY", "")
    BREVO_SENDER: str = os.getenv("BREVO_SENDER", "cybershield786@gmail.com")

    # Frontend
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Backend base URL (used to build OAuth redirect URIs in production)
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")

    # Refresh tokens
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    # OAuth — Google
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv(
        "GOOGLE_REDIRECT_URI",
        "http://localhost:8000/api/v1/auth/oauth/google/callback",
    )

    # OAuth — GitHub
    GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_CLIENT_SECRET", "")
    GITHUB_REDIRECT_URI: str = os.getenv(
        "GITHUB_REDIRECT_URI",
        "http://localhost:8000/api/v1/auth/oauth/github/callback",
    )
    
    # Groq AI (primary provider)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY") or ""
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY") or ""   # kept for backward compat
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY") or ""
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "groq")
    AI_MODEL: str = os.getenv("AI_MODEL", "llama-3.3-70b-versatile")
    AI_TEMPERATURE: float = float(os.getenv("AI_TEMPERATURE", "0.2"))
    AI_MAX_TOKENS: int = int(os.getenv("AI_MAX_TOKENS", "2048"))
    
    model_config = {
        "env_file": str(_BACKEND_ROOT / ".env"),
        "extra": "ignore"
    }


# Create a global settings instance
settings = Settings()

# Module-level variables for easy access
MONGO_URI = settings.MONGODB_URI
DATABASE_NAME = settings.DATABASE_NAME