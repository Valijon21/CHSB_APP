from __future__ import annotations
from datetime import datetime, timedelta, timezone
from typing import Any, Union
import bcrypt
import jwt
from backend.app.core.config import settings

# Default passwords that were published in the repository
BLOCKED_PASSWORDS = frozenset({"Secret123!"})
MIN_PASSWORD_LENGTH = 10

STAFF_TOKEN = "staff"
STUDENT_TOKEN = "student"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt(10)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def create_access_token(
    subject: Union[str, Any],
    role: str,
    tenant_id: str,
    expires_delta: timedelta | None = None,
    token_type: str = STAFF_TOKEN,
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "tenant_id": tenant_id,
        "type": token_type,
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)
    return encoded_jwt
