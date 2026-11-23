from fastapi import APIRouter, Depends, HTTPException
from backend.app.db.prisma import get_prisma, find_tenant_resilient
from prisma import Prisma

router = APIRouter(prefix="/tenants", tags=["Tenants"])

@router.get("")
async def get_tenants(db: Prisma = Depends(get_prisma)):
    tenants = await db.tenant.find_many(order={"name": "asc"})
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
    tenant = await find_tenant_resilient(slug, db)
    if tenant:
        # Load schools relation
        tenant = await db.tenant.find_unique(where={"id": tenant.id}, include={"schools": True})
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
async def get_tenant_by_id(id: str, db: Prisma = Depends(get_prisma)):
    tenant = await db.tenant.find_unique(where={"id": id})
    if not tenant:
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
