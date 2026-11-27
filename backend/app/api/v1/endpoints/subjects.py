from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query
from prisma import Prisma
from backend.app.core.dependencies import (
    Actor,
    assert_tenant_ownership,
    require_role,
    resolve_tenant_for_actor,
)
from backend.app.db.prisma import get_prisma
from backend.app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectResponse

router = APIRouter(prefix="/subjects", tags=["Subjects"])

STAFF_ACCESS = require_role(["TEACHER", "SCHOOL_ADMIN", "REGIONAL_INSPECTOR", "SUPER_ADMIN"])

@router.get("", response_model=list[SubjectResponse])
async def list_subjects(
    tenantSlug: str = Query("al-xorazmiy", description="Muassasa identifikatori"),
    actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    tenant = await resolve_tenant_for_actor(tenantSlug, actor, db)

    subjects = await db.subject.find_many(
        where={"tenantId": tenant.id},
        order={"name": "asc"},
    )

    return [
        SubjectResponse(
            id=s.id,
            tenantId=s.tenantId,
            tenantSlug=tenant.slug,
            name=s.name,
            code=s.code,
            gradeLevels=s.gradeLevels,
            description=s.description,
            isActive=s.isActive,
            createdAt=s.createdAt.isoformat(),
            updatedAt=s.updatedAt.isoformat(),
        )
        for s in subjects
    ]

@router.post("", response_model=SubjectResponse, status_code=201)
async def create_subject(
    payload: SubjectCreate,
    actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    tenant = await resolve_tenant_for_actor(payload.tenantSlug, actor, db)

    clean_code = payload.code.strip().upper()
    clean_name = payload.name.strip()

    # Check uniqueness within tenant
    existing = await db.subject.find_first(
        where={
            "tenantId": tenant.id,
            "code": clean_code,
        }
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"'{clean_code}' kodli fan ushbu muassasada allaqachon mavjud ({existing.name}).",
        )

    new_sub = await db.subject.create(
        data={
            "tenantId": tenant.id,
            "name": clean_name,
            "code": clean_code,
            "gradeLevels": payload.gradeLevels.strip(),
            "description": payload.description.strip() if payload.description else None,
            "isActive": payload.isActive,
        }
    )

    return SubjectResponse(
        id=new_sub.id,
        tenantId=new_sub.tenantId,
        tenantSlug=tenant.slug,
        name=new_sub.name,
        code=new_sub.code,
        gradeLevels=new_sub.gradeLevels,
        description=new_sub.description,
        isActive=new_sub.isActive,
        createdAt=new_sub.createdAt.isoformat(),
        updatedAt=new_sub.updatedAt.isoformat(),
    )

@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: str,
    payload: SubjectUpdate,
    actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    subject = await db.subject.find_unique(where={"id": subject_id}, include={"tenant": True})
    if not subject:
        raise HTTPException(status_code=404, detail="Fan topilmadi.")
    assert_tenant_ownership(subject.tenantId, actor)

    update_data = {}
    if payload.name is not None:
        update_data["name"] = payload.name.strip()
    if payload.gradeLevels is not None:
        update_data["gradeLevels"] = payload.gradeLevels.strip()
    if payload.description is not None:
        update_data["description"] = payload.description.strip()
    if payload.isActive is not None:
        update_data["isActive"] = payload.isActive

    updated_sub = await db.subject.update(
        where={"id": subject_id},
        data=update_data,
        include={"tenant": True},
    )

    tenant_slug = updated_sub.tenant.slug if updated_sub.tenant else "al-xorazmiy"

    return SubjectResponse(
        id=updated_sub.id,
        tenantId=updated_sub.tenantId,
        tenantSlug=tenant_slug,
        name=updated_sub.name,
        code=updated_sub.code,
        gradeLevels=updated_sub.gradeLevels,
        description=updated_sub.description,
        isActive=updated_sub.isActive,
        createdAt=updated_sub.createdAt.isoformat(),
        updatedAt=updated_sub.updatedAt.isoformat(),
    )

@router.delete("/{subject_id}")
async def delete_subject(
    subject_id: str,
    actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    subject = await db.subject.find_unique(where={"id": subject_id})
    if not subject:
        raise HTTPException(status_code=404, detail="Fan topilmadi.")
    assert_tenant_ownership(subject.tenantId, actor)

    await db.subject.delete(where={"id": subject_id})
    return {"success": True, "message": f"'{subject.name}' fani muvaffaqiyatli o'chirildi."}
