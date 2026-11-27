import os
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Secrets that were published in the repository and must never be used again
PUBLIC_JWT_SECRETS = {
    "chsb-super-secure-jwt-key-2026-production",
    "chsb-super-secure-production-jwt-token-2026",
    "super-secret-jwt-key-change-this-in-production",
    "chsb-super-secret-production-2026",
    "chsb-jwt-secret-production-key-2026",
    "chsb-super-production-jwt-secret-key-2026",
    "chsb-super-production-jwt-key-2026",
}
MIN_JWT_SECRET_LENGTH = 32

# Root directory of the repository
BASE_DIR = Path(__file__).resolve().parents[3]

class Settings(BaseSettings):
    PROJECT_NAME: str = "CHSB Assessment Platform API"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    BASE_DIR: Path = BASE_DIR
    FRONTEND_DIST: Path = Path(os.getenv("FRONTEND_DIST", str(BASE_DIR / "frontend" / "dist")))

    # Required: a PostgreSQL connection string
    DATABASE_URL: str
    DB_POOL_SIZE: int = 5
    LOG_LEVEL: str = "INFO"

    # Required: the application refuses to start without a private secret
    JWT_SECRET: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    GEMINI_API_KEY: str = ""

    # Comma separated list of browser origins allowed to call the API cross-origin.
    # The bundled production build is same-origin and needs no entry here.
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Password for the bootstrap accounts. Without it no accounts are created.
    SEED_PASSWORD: str = ""

    @field_validator("JWT_SECRET")
    @classmethod
    def jwt_secret_must_be_private(cls, value: str) -> str:
        if value in PUBLIC_JWT_SECRETS or len(value) < MIN_JWT_SECRET_LENGTH:
            raise ValueError(
                f"JWT_SECRET must be a private random string of at least {MIN_JWT_SECRET_LENGTH} characters. "
                'Generate one with: python -c "import secrets; print(secrets.token_urlsafe(48))"'
            )
        return value

    @field_validator("DATABASE_URL")
    @classmethod
    def database_must_be_postgres(cls, value: str) -> str:
        if not value.startswith(("postgresql://", "postgres://", "postgresql+asyncpg://")):
            raise ValueError("DATABASE_URL must be a PostgreSQL connection string (postgresql://...)")
        return value

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip() and o.strip() != "*"]

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        hide_input_in_errors=True,
        extra="ignore"
    )

settings = Settings()
