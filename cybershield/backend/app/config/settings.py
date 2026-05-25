from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "CyberShield"
    APP_ENV: str = "development"
    DEBUG: bool = True

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    DATABASE_URL: str = "sqlite:///./cybershield.db"

    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    GITHUB_TOKEN: str = ""

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }


settings = Settings()

session_timout = 60