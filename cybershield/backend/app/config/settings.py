from dotenv import load_dotenv
import os
from pydantic_settings import BaseSettings

load_dotenv(override=True)

# Module-level variables as requested
MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")


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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN") or ""
    EMAIL_USER: str = os.getenv("EMAIL_USER") or ""
    EMAIL_PASSWORD: str = os.getenv("EMAIL_PASSWORD") or ""

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }


settings = Settings()

session_timout = 60