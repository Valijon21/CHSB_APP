from __future__ import annotations
from dataclasses import dataclass
from typing import Annotated, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from backend.app.core.config import settings
from backend.app.db.prisma import get_prisma
from prisma import Prisma

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False,
)

REGIONAL_ROLES = frozenset({"REGIONAL_INSPECTOR", "SUPER_ADMIN"})
STAFF_ROLES = frozenset({"TEACHER", "SCHOOL_ADMIN", "REGIONAL_INSPECTOR", "SUPER_ADMIN"})


@dataclass
class Actor:
    id: str
    role: str
    tenant_id: str
    subject: str
    is_student: bool = False
    user: Any | None = None
    student: Any | None = None

    @property
    def is_regional(self) -> bool:
        return self.role in REGIONAL_ROLES


def _expand_roles(allowed_roles: list[str]) -> set[str]:
    expanded = set(allowed_roles)
    if expanded & REGIONAL_ROLES:
        expanded |= REGIONAL_ROLES
    return expanded


async def get_current_actor(
    token: Annotated[str | None, Depends(oauth2_scheme)],
    db: Annotated[Prisma, Depends(get_prisma)],
) -> Actor:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Autentifikatsiyadan o'tilmagan yoki token eskirgan.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
        subject: str | None = payload.get("sub")
        role: str | None = payload.get("role")
        tenant_id: str | None = payload.get("tenant_id")
        if not subject or not role or not tenant_id:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    if role == "STUDENT":
        student = await db.student.find_first(
            where={"rosterCode": subject, "tenantId": tenant_id}
        )
        if student is None or student.status != "ELIGIBLE":
            raise credentials_exception
        return Actor(
            id=student.id,
            role="STUDENT",
            tenant_id=student.tenantId,
            subject=student.rosterCode,
            is_student=True,
            student=student,
        )

    user = await db.user.find_unique(where={"username": subject})
    if user is None or not user.isActive:
        raise credentials_exception
    return Actor(
        id=user.id,
        role=user.role,
        tenant_id=user.tenantId,
        subject=user.username,
        is_student=False,
        user=user,
    )


async def get_current_user(actor: Annotated[Actor, Depends(get_current_actor)]):
    if actor.is_student or actor.user is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faqat xodimlar uchun ruxsat berilgan.",
        )
    return actor.user


def require_role(allowed_roles: list[str]):
    expanded = _expand_roles(allowed_roles)

    async def role_checker(actor: Annotated[Actor, Depends(get_current_actor)]) -> Actor:
        if actor.role not in expanded:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Ushbu amalni bajarish uchun '{actor.role}' roliga ruxsat berilmagan.",
            )
        return actor

    return role_checker


async def resolve_tenant_for_actor(tenant_slug_or_id: str, actor: Actor, db: Prisma):
    tenant = await db.tenant.find_first(
        where={"OR": [{"slug": tenant_slug_or_id}, {"id": tenant_slug_or_id}]}
    )
    if not tenant:
        raise HTTPException(status_code=404, detail="Muassasa (Tenant) topilmadi.")
    if not actor.is_regional and actor.tenant_id != tenant.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Boshqa ta'lim muassasasi ma'lumotlariga kirish taqiqlangan.",
        )
    return tenant


def assert_tenant_ownership(target_tenant_id: str, actor: Actor) -> None:
    if not actor.is_regional and actor.tenant_id != target_tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Boshqa ta'lim muassasasi ma'lumotlariga kirish taqiqlangan.",
        )
