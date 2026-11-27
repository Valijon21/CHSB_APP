"""
Signing in and changing passwords.
"""
from __future__ import annotations

from fastapi import HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.ratelimit import SlidingWindowLimiter
from backend.app.core.security import (
    BLOCKED_PASSWORDS,
    MIN_PASSWORD_LENGTH,
    create_access_token,
    get_password_hash,
    verify_password,
)
from backend.app.models import Tenant, User
from backend.app.schemas.auth import UserProfile
from backend.app.services import audit

WINDOW_SECONDS = 5 * 60
# Failed attempts allowed per window
per_user_and_address = SlidingWindowLimiter(5, WINDOW_SECONDS)
per_user = SlidingWindowLimiter(20, WINDOW_SECONDS)
per_address = SlidingWindowLimiter(100, WINDOW_SECONDS)


def reset_login_limits() -> None:
    for limiter in (per_user_and_address, per_user, per_address):
        limiter.clear()


def _limit_keys(request: Request, username: str) -> list[tuple[SlidingWindowLimiter, str]]:
    address = audit.client_ip(request) or "unknown"
    name = username.lower()
    return [(per_user_and_address, f"{name}|{address}"), (per_user, name), (per_address, address)]


def _check_limits(request: Request, username: str) -> None:
    wait = max(limiter.retry_after(key) for limiter, key in _limit_keys(request, username))
    if wait:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Juda ko'p muvaffaqiyatsiz urinish. {wait} soniyadan keyin qayta urinib ko'ring.",
            headers={"Retry-After": str(wait)},
        )


def _count_failure(request: Request, username: str) -> None:
    for limiter, key in _limit_keys(request, username):
        limiter.record(key)


async def build_profile(db: AsyncSession, user: User) -> UserProfile:
    tenant = await db.get(Tenant, user.tenant_id)
    return UserProfile(
        id=user.id,
        tenantId=user.tenant_id,
        tenantSlug=tenant.slug if tenant else None,
        schoolName=tenant.name if tenant else None,
        username=user.username,
        fullName=user.full_name,
        role=user.role,
        email=user.email,
        mustChangePassword=user.must_change_password,
    )


def issue_token(user: User) -> str:
    return create_access_token(
        subject=user.username,
        role=user.role,
        tenant_id=user.tenant_id,
        token_version=user.token_version,
    )


async def authenticate(db: AsyncSession, request: Request, username: str, password: str) -> User:
    _check_limits(request, username)
    user = await db.scalar(select(User).where(User.username == username))

    if not user or not verify_password(password, user.hashed_password):
        _count_failure(request, username)
        audit.record(db, request, "auth.login_failed", user=user, details={"username": username[:100]})
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Foydalanuvchi nomi yoki parol noto'g'ri.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ushbu akkaunt faol emas. Administratorga murojaat qiling.",
        )

    if password in BLOCKED_PASSWORDS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Standart parol bloklangan. Administrator yangi parol o'rnatishi kerak.",
        )

    per_user_and_address.reset(_limit_keys(request, username)[0][1])
    audit.record(db, request, "auth.login", user=user)
    await db.commit()
    return user


def validate_new_password(password: str) -> None:
    if len(password) < MIN_PASSWORD_LENGTH or password in BLOCKED_PASSWORDS:
        raise HTTPException(
            status_code=400,
            detail=f"Yangi parol kamida {MIN_PASSWORD_LENGTH} belgidan iborat, maxfiy bo'lishi kerak.",
        )
    # bcrypt silently ignores everything after 72 bytes
    if len(password.encode("utf-8")) > 72:
        raise HTTPException(status_code=400, detail="Parol juda uzun (ko'pi bilan 72 bayt).")


async def change_password(
    db: AsyncSession, request: Request, user: User, current_password: str, new_password: str
) -> str:
    """Change the password, sign out every other session and return a fresh token."""
    _check_limits(request, user.username)
    if not verify_password(current_password, user.hashed_password):
        _count_failure(request, user.username)
        # Not 401: the session itself is still valid
        raise HTTPException(status_code=400, detail="Joriy parol noto'g'ri.")
    validate_new_password(new_password)
    if new_password == current_password:
        raise HTTPException(status_code=400, detail="Yangi parol joriy paroldan farq qilishi kerak.")

    user.hashed_password = get_password_hash(new_password)
    user.token_version += 1
    user.must_change_password = False
    audit.record(db, request, "auth.password_changed", user=user)
    await db.commit()
    return issue_token(user)
