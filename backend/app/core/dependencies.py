"""
Request dependencies: the database session and the signed-in user.
"""
from __future__ import annotations

from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.core.security import STAFF_TOKEN
from backend.app.db.session import get_session
from backend.app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

DbSession = Annotated[AsyncSession, Depends(get_session)]


async def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)],
    db: DbSession,
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Autentifikatsiyadan o'tilmagan yoki token eskirgan.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
    except jwt.PyJWTError:
        raise credentials_exception from None

    username = payload.get("sub")
    # Student exam tokens are signed with the same key and must never open staff routes
    if username is None or payload.get("type") != STAFF_TOKEN:
        raise credentials_exception

    user = await db.scalar(select(User).where(User.username == username))
    if user is None or not user.is_active or payload.get("ver") != user.token_version:
        raise credentials_exception
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_role(allowed_roles: list[str]):
    async def role_checker(current_user: CurrentUser) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sizda bu amalni bajarish uchun ruxsat yo'q.",
            )
        return current_user

    return role_checker
