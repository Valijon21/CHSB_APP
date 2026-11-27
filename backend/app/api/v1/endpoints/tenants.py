from fastapi import APIRouter, Depends, HTTPException
from backend.app.db.prisma import get_prisma
from prisma import Prisma
from backend.app.core.dependencies import get_current_user
from backend.app.core.permissions import can_access_tenant, REGIONAL_INSPECTOR, SUPER_ADMIN

router = APIRouter(prefix="/tenants", tags=["Tenants"])

@router.get("")
async def get_tenants(db: Prisma = Depends(get_prisma), current_user=Depends(get_current_user)):
    sees_all = current_user.role in (SUPER_ADMIN, REGIONAL_INSPECTOR)
    tenants = await db.tenant.find_many(
        where=None if sees_all else {"id": current_user.tenantId},
        order={"name": "asc"},
    )
    return [
        {
            "id": t.id,
            "slug": t.slug,
            "name": t.name,
            "code": t.slug.upper(),
            "region": t.regionId,
            "activeYear": "2026-2027",
            "createdAt": t.createdAt.isoformat(),
        }
        for t in tenants
    ]

@router.get("/{slug}/context")
async def get_tenant_public_context(slug: str, db: Prisma = Depends(get_prisma)):
    tenant = await db.tenant.find_unique(
        where={"slug": slug},
        include={"schools": True},
    )
    if not tenant:
        raise HTTPException(status_code=404, detail="Maktab/Tashkilot topilmadi.")

    primary_school = tenant.schools[0] if tenant.schools else None

    return {
        "tenantId": tenant.id,
        "tenantSlug": tenant.slug,
        "schoolName": tenant.name,
        "schoolCode": tenant.slug.upper(),
        "region": tenant.regionId,
        "district": primary_school.districtId if primary_school else "Toshkent shahar",
        "activeAcademicYear": "2026-2027",
        "branding": {
            "title": f"{tenant.name} - CHSB Platformasi",
            "tagline": "Choraklik Baholash Tizimi",
        },
    }

@router.get("/{id}")
async def get_tenant_by_id(
    id: str,
    db: Prisma = Depends(get_prisma),
    current_user=Depends(get_current_user),
):
    tenant = await db.tenant.find_unique(where={"id": id})
    allowed = tenant is not None and (
        current_user.role == REGIONAL_INSPECTOR or can_access_tenant(current_user, tenant.id)
    )
    if not allowed:
        raise HTTPException(status_code=404, detail="Tenant topilmadi.")
    return {
        "id": tenant.id,
        "slug": tenant.slug,
        "name": tenant.name,
        "code": tenant.slug.upper(),
        "region": tenant.regionId,
        "activeYear": "2026-2027",
        "createdAt": tenant.createdAt.isoformat(),
    }
