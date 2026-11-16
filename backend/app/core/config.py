import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Root directory of the repository
BASE_DIR = Path(__file__).resolve().parents[3]
DEFAULT_DB_FILE = BASE_DIR / "prisma" / "dev.db"

class Settings(BaseSettings):
    PROJECT_NAME: str = "CHSB Assessment Platform API"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    BASE_DIR: Path = BASE_DIR
    FRONTEND_DIST: Path = Path(os.getenv("FRONTEND_DIST", str(BASE_DIR / "frontend" / "dist")))
    
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"file:{DEFAULT_DB_FILE}"
    )
    
    JWT_SECRET: str = os.getenv("JWT_SECRET", "chsb-super-secure-jwt-key-2026-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
