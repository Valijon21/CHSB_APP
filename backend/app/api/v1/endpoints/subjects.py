from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query
from prisma import Prisma
from backend.app.db.prisma import get_prisma
from backend.app.core.permissions import school_staff, school_admin, resolve_tenant, ensure_tenant_access
from backend.app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectResponse

router = APIRouter(prefix="/subjects", tags=["Subjects"])

@router.get("", response_model=list[SubjectResponse])
async def list_subjects(
    tenantSlug: str | None = Query(None, description="Muassasa identifikatori"),
    db: Prisma = Depends(get_prisma),
    current_user=Depends(school_staff),
):
    tenant = await resolve_tenant(db, current_user, tenantSlug, "Muassasa topilmadi.")

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
    db: Prisma = Depends(get_prisma),
    current_user=Depends(school_admin),
):
    tenant = await resolve_tenant(db, current_user, payload.tenantSlug, "Muassasa topilmadi.")

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
    db: Prisma = Depends(get_prisma),
    current_user=Depends(school_admin),
):
    subject = await db.subject.find_unique(where={"id": subject_id}, include={"tenant": True})
    if not subject:
        raise HTTPException(status_code=404, detail="Fan topilmadi.")
    ensure_tenant_access(current_user, subject.tenantId, "Fan topilmadi.")

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
    db: Prisma = Depends(get_prisma),
    current_user=Depends(school_admin),
):
    subject = await db.subject.find_unique(where={"id": subject_id})
    if not subject:
        raise HTTPException(status_code=404, detail="Fan topilmadi.")
    ensure_tenant_access(current_user, subject.tenantId, "Fan topilmadi.")

    await db.subject.delete(where={"id": subject_id})
    return {"success": True, "message": f"'{subject.name}' fani muvaffaqiyatli o'chirildi."}
