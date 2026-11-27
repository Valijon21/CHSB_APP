import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Root directory of the repository
BASE_DIR = Path(__file__).resolve().parents[3]
DEFAULT_DB_FILE = BASE_DIR / "prisma" / "dev.db"


def _parse_cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    return [o.strip() for o in raw.split(",") if o.strip()]


class Settings(BaseSettings):
    PROJECT_NAME: str = "CHSB Assessment Platform API"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    BASE_DIR: Path = BASE_DIR
    FRONTEND_DIST: Path = Path(os.getenv("FRONTEND_DIST", str(BASE_DIR / "frontend" / "dist")))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("1", "true", "yes")
    LOG_DIR: Path = BASE_DIR / "logs"

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"file:{DEFAULT_DB_FILE}",
    )

    JWT_SECRET: str = os.getenv("JWT_SECRET", "chsb-super-secure-jwt-key-2026-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    CORS_ORIGINS: list[str] = _parse_cors_origins()

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
