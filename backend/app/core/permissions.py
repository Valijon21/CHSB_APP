"""
Roles and tenant isolation.

Every protected route declares which roles may call it, and every object that
belongs to a school is checked against the tenant of the signed-in user. A user
asking for another tenant's data gets 404, so its existence is not revealed.
"""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import require_role
from backend.app.models import Tenant, User

SUPER_ADMIN = "SUPER_ADMIN"
SCHOOL_ADMIN = "SCHOOL_ADMIN"
TEACHER = "TEACHER"
REGIONAL_INSPECTOR = "REGIONAL_INSPECTOR"

# Teaching staff of a school: read school data, manage assessments
school_staff = require_role([TEACHER, SCHOOL_ADMIN, SUPER_ADMIN])
# School administration: manage classes, students and subjects
school_admin = require_role([SCHOOL_ADMIN, SUPER_ADMIN])
# Cross-school oversight
regional_viewer = require_role([REGIONAL_INSPECTOR, SUPER_ADMIN])

StaffUser = Annotated[User, Depends(school_staff)]
AdminUser = Annotated[User, Depends(school_admin)]


def can_access_tenant(user: User, tenant_id: str) -> bool:
    return user.role == SUPER_ADMIN or user.tenant_id == tenant_id


def ensure_tenant_access(user: User, tenant_id: str, detail: str = "Ma'lumot topilmadi.") -> None:
    if not can_access_tenant(user, tenant_id):
        raise HTTPException(status_code=404, detail=detail)


async def find_tenant(db: AsyncSession, ref: str) -> Tenant | None:
    """Find a tenant by slug or id."""
    return await db.scalar(select(Tenant).where(or_(Tenant.slug == ref, Tenant.id == ref)))


async def resolve_tenant(
    db: AsyncSession, user: User, ref: str | None = None, detail: str = "Tenant topilmadi."
) -> Tenant:
    """The tenant named by `ref` (default: the user's own), if the user may access it."""
    tenant = await find_tenant(db, ref or user.tenant_id)
    if not tenant or not can_access_tenant(user, tenant.id):
        raise HTTPException(status_code=404, detail=detail)
    return tenant
