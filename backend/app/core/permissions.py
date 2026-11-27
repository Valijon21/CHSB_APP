"""
Roles and tenant isolation.

Every protected route declares which roles may call it, and every object that
belongs to a school is checked against the tenant of the signed-in user. A user
asking for another tenant's data gets 404, so its existence is not revealed.
"""
from __future__ import annotations

from fastapi import HTTPException
from backend.app.core.dependencies import require_role

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


def can_access_tenant(user, tenant_id: str) -> bool:
    return user.role == SUPER_ADMIN or user.tenantId == tenant_id


def ensure_tenant_access(user, tenant_id: str, detail: str = "Ma'lumot topilmadi.") -> None:
    if not can_access_tenant(user, tenant_id):
        raise HTTPException(status_code=404, detail=detail)


async def resolve_tenant(db, user, tenant_ref: str | None = None, detail: str = "Tenant topilmadi."):
    """Find a tenant by slug or id (default: the user's own) and check access to it."""
    if tenant_ref:
        tenant = await db.tenant.find_first(
            where={"OR": [{"slug": tenant_ref}, {"id": tenant_ref}]}
        )
    else:
        tenant = await db.tenant.find_unique(where={"id": user.tenantId})
    if not tenant or not can_access_tenant(user, tenant.id):
        raise HTTPException(status_code=404, detail=detail)
    return tenant
