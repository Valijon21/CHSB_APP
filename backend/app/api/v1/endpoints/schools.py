import re
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from backend.app.core.dependencies import (
    REGIONAL_ROLES,
    STAFF_ROLES,
    Actor,
    assert_tenant_ownership,
    require_role,
)
from backend.app.db.prisma import get_prisma
from prisma import Prisma

router = APIRouter(prefix="/schools", tags=["schools"])
STAFF_ACCESS = require_role(STAFF_ROLES)
REGIONAL_ACCESS = require_role(REGIONAL_ROLES)


class SchoolCreatePayload(BaseModel):
    name: str = Field(..., min_length=3)
    code: str = Field(default="SCH-01", min_length=2)
    slug: str = Field(..., min_length=3)
    districtId: str = Field(default="yunusobod")
    districtName: str = Field(default="Yunusobod tumani")
    type: str = Field(default="general")
    gradingPreset: str | None = None
    directorName: str = Field(default="Direktor")
    contactPhone: str = Field(default="+998711234567")
    email: str | None = None
    status: str = Field(default="active")
    regionId: str = Field(default="tashkent-city")


class SchoolUpdatePayload(BaseModel):
    name: str | None = None
    districtId: str | None = None
    type: str | None = None
    gradingPreset: str | None = None


def _format_school_record(school, tenant, teacher_count: int = 0) -> dict:
    return {
        "id": school.id,
        "slug": tenant.slug if tenant else school.id,
        "name": school.name,
        "code": (tenant.slug[:6].upper() if tenant else "SCH"),
        "type": getattr(school, "schoolType", "general") or "general",
        "gradingPreset": getattr(school, "gradingPreset", "MMTV_STANDARD") or "MMTV_STANDARD",
        "status": "active" if (not tenant or tenant.isActive) else "inactive",
        "districtId": school.districtId,
        "districtName": school.districtId.replace("-", " ").title(),
        "directorName": "Maktab direktori",
        "contactPhone": "+998711234567",
        "studentCount": school.studentCount,
        "teacherCount": teacher_count,
        "createdAt": school.createdAt.isoformat(),
    }


@router.get("")
async def get_schools(
    actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    where_clause = {} if actor.is_regional else {"tenantId": actor.tenant_id}
    schools = await db.school.find_many(
        where=where_clause or None,
        include={"tenant": True},
        order={"name": "asc"},
    )
    users = await db.user.find_many(
        where={"role": "TEACHER"} if actor.is_regional else {"role": "TEACHER", "tenantId": actor.tenant_id}
    )
    teacher_counts_by_tenant: dict[str, int] = {}
    for u in users:
        teacher_counts_by_tenant[u.tenantId] = teacher_counts_by_tenant.get(u.tenantId, 0) + 1

    return [
        _format_school_record(s, s.tenant, teacher_counts_by_tenant.get(s.tenantId, 0))
        for s in schools
    ]


@router.post("")
async def create_school(
    payload: SchoolCreatePayload,
    _actor: Actor = Depends(REGIONAL_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    clean_slug = re.sub(r"[^a-z0-9-]", "-", payload.slug.lower().strip()).strip("-")
    if len(clean_slug) < 3:
        raise HTTPException(status_code=400, detail="Maktab slug kamida 3 ta belgidan iborat bo'lishi kerak.")

    existing_tenant = await db.tenant.find_unique(where={"slug": clean_slug})
    if existing_tenant:
        raise HTTPException(status_code=409, detail=f"'{clean_slug}' slugli maktab allaqachon mavjud.")

    preset = payload.gradingPreset or (
        "SPECIALIZED" if payload.type in {"specialized", "lyceum"} else "MMTV_STANDARD"
    )
    if preset not in {"MMTV_STANDARD", "SPECIALIZED"}:
        raise HTTPException(status_code=400, detail="Noto'g'ri gradingPreset qiymati.")

    tenant = await db.tenant.create(
        data={
            "id": f"tenant-{clean_slug}",
            "slug": clean_slug,
            "name": payload.name,
            "regionId": payload.regionId,
            "isActive": payload.status != "inactive",
        }
    )
    school = await db.school.create(
        data={
            "id": f"school-{clean_slug}",
            "tenantId": tenant.id,
            "name": payload.name,
            "districtId": payload.districtId,
            "schoolType": payload.type,
            "gradingPreset": preset,
            "studentCount": 0,
        }
    )
    rec = _format_school_record(school, tenant, 0)
    rec["code"] = payload.code
    rec["districtName"] = payload.districtName
    rec["directorName"] = payload.directorName
    rec["contactPhone"] = payload.contactPhone
    return rec


@router.patch("/{school_id}")
async def update_school(
    school_id: str,
    payload: SchoolUpdatePayload,
    actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    school = await db.school.find_unique(where={"id": school_id}, include={"tenant": True})
    if not school:
        raise HTTPException(status_code=404, detail="Maktab topilmadi.")
    assert_tenant_ownership(school.tenantId, actor)

    update_data: dict = {}
    if payload.name is not None:
        update_data["name"] = payload.name
    if payload.districtId is not None:
        update_data["districtId"] = payload.districtId
    if payload.type is not None:
        update_data["schoolType"] = payload.type
    if payload.gradingPreset is not None:
        if payload.gradingPreset not in {"MMTV_STANDARD", "SPECIALIZED"}:
            raise HTTPException(status_code=400, detail="Noto'g'ri gradingPreset (MMTV_STANDARD | SPECIALIZED).")
        update_data["gradingPreset"] = payload.gradingPreset

    updated = await db.school.update(where={"id": school_id}, data=update_data, include={"tenant": True})
    return _format_school_record(updated, updated.tenant, 0)
