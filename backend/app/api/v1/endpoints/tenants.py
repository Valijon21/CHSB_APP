from __future__ import annotations

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from backend.app.core.dependencies import CurrentUser, DbSession
from backend.app.core.permissions import REGIONAL_INSPECTOR, SUPER_ADMIN, can_access_tenant
from backend.app.models import School, Tenant

router = APIRouter(prefix="/tenants", tags=["Tenants"])


def serialize_tenant(t: Tenant) -> dict:
    return {
        "id": t.id,
        "slug": t.slug,
        "name": t.name,
        "code": t.slug.upper(),
        "region": t.region_id,
        "activeYear": "2026-2027",
        "createdAt": t.created_at.isoformat(),
    }


@router.get("")
async def get_tenants(db: DbSession, current_user: CurrentUser):
    query = select(Tenant).order_by(Tenant.name)
    if current_user.role not in (SUPER_ADMIN, REGIONAL_INSPECTOR):
        query = query.where(Tenant.id == current_user.tenant_id)
    return [serialize_tenant(t) for t in await db.scalars(query)]


@router.get("/{slug}/context")
async def get_tenant_public_context(slug: str, db: DbSession):
    tenant = await db.scalar(select(Tenant).where(Tenant.slug == slug))
    if not tenant:
        raise HTTPException(status_code=404, detail="Maktab/Tashkilot topilmadi.")
    school = await db.scalar(
        select(School).where(School.tenant_id == tenant.id).order_by(School.created_at, School.id).limit(1)
    )
    return {
        "tenantId": tenant.id,
        "tenantSlug": tenant.slug,
        "schoolName": tenant.name,
        "schoolCode": tenant.slug.upper(),
        "region": tenant.region_id,
        "district": school.district_id if school else "Toshkent shahar",
        "activeAcademicYear": "2026-2027",
        "branding": {
            "title": f"{tenant.name} - CHSB Platformasi",
            "tagline": "Choraklik Baholash Tizimi",
        },
    }


@router.get("/{id}")
async def get_tenant_by_id(id: str, db: DbSession, current_user: CurrentUser):
    tenant = await db.get(Tenant, id)
    allowed = tenant is not None and (
        current_user.role == REGIONAL_INSPECTOR or can_access_tenant(current_user, tenant.id)
    )
    if not allowed:
        raise HTTPException(status_code=404, detail="Tenant topilmadi.")
    return serialize_tenant(tenant)
