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

# Groq AI
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
AI_PROVIDER = os.getenv("AI_PROVIDER", "groq")
AI_MODEL = os.getenv("AI_MODEL", "llama-3.3-70b-versatile")
AI_TEMPERATURE = float(os.getenv("AI_TEMPERATURE", "0.2"))
AI_MAX_TOKENS = int(os.getenv("AI_MAX_TOKENS", "2048"))


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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN") or ""
    EMAIL_USER: str = os.getenv("EMAIL_USER") or ""
    EMAIL_PASSWORD: str = os.getenv("EMAIL_PASSWORD") or ""

    # Groq AI
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY") or ""
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "groq")
    AI_MODEL: str = os.getenv("AI_MODEL", "llama-3.3-70b-versatile")
    AI_TEMPERATURE: float = float(os.getenv("AI_TEMPERATURE", "0.2"))
    AI_MAX_TOKENS: int = int(os.getenv("AI_MAX_TOKENS", "2048"))

    model_config = {
        "env_file": str(BACKEND_ROOT / ".env"),
        "extra": "ignore"
    }


settings = Settings()

session_timout = 60