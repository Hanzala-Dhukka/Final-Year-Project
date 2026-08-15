from dotenv import load_dotenv
from pathlib import Path
import os
from pydantic_settings import BaseSettings

# Load .env from the backend directory regardless of the current working directory
BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=BACKEND_ROOT / ".env", override=True)

# Module-level variables as requested
MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

# Groq AI (primary provider)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")  # kept for backward compat, not used
AI_PROVIDER = os.getenv("AI_PROVIDER", "groq")
AI_MODEL = os.getenv("AI_MODEL", "llama-3.3-70b-versatile")
AI_MODEL_FALLBACK = os.getenv("AI_MODEL_FALLBACK", "llama-3.1-8b-instant")
AI_TEMPERATURE = float(os.getenv("AI_TEMPERATURE", "0.2"))
AI_MAX_TOKENS = int(os.getenv("AI_MAX_TOKENS", "2048"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# OAuth — Google
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID") or ""
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET") or ""
GOOGLE_REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/auth/oauth/google/callback"
)

# OAuth — GitHub
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID") or ""
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET") or ""
GITHUB_REDIRECT_URI = os.getenv(
    "GITHUB_REDIRECT_URI", "http://localhost:8000/api/v1/auth/oauth/github/callback"
)


# Keep Settings class and settings instance for backward compatibility with existing imports
class Settings(BaseSettings):
    APP_NAME: str = "CyberShield"
    APP_ENV: str = "development"
    DEBUG: bool = True

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    DATABASE_URL: str = "sqlite:///./cybershield.db"

    # Map keys to fallback values
    SECRET_KEY: str = os.getenv("JWT_SECRET_KEY") or os.getenv("JWT_SECRET") or "your-secret-key-here"
    ALGORITHM: str = os.getenv("JWT_ALGORITHM") or os.getenv("ALGORITHM") or "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN") or ""
    EMAIL_USER: str = os.getenv("EMAIL_USER") or ""
    EMAIL_PASSWORD: str = os.getenv("EMAIL_PASSWORD") or ""

    # Groq AI (primary provider)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY") or ""
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY") or ""   # kept for compat
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY") or ""
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "groq")
    AI_MODEL: str = os.getenv("AI_MODEL", "llama-3.3-70b-versatile")
    AI_MODEL_FALLBACK: str = os.getenv("AI_MODEL_FALLBACK", "llama-3.1-8b-instant")
    AI_TEMPERATURE: float = float(os.getenv("AI_TEMPERATURE", "0.2"))
    AI_MAX_TOKENS: int = int(os.getenv("AI_MAX_TOKENS", "2048"))

    # Frontend / Backend URLs
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")

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

    model_config = {
        "env_file": str(BACKEND_ROOT / ".env"),
        "extra": "ignore"
    }


settings = Settings()

session_timout = 60