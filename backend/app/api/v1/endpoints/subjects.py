from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request
from sqlalchemy import delete, select

from backend.app.core.dependencies import DbSession
from backend.app.core.permissions import AdminUser, StaffUser, ensure_tenant_access, resolve_tenant
from backend.app.models import Subject, Tenant
from backend.app.schemas.subject import SubjectCreate, SubjectResponse, SubjectUpdate
from backend.app.services import audit

router = APIRouter(prefix="/subjects", tags=["Subjects"])


def serialize(subject: Subject, tenant_slug: str) -> SubjectResponse:
    return SubjectResponse(
        id=subject.id,
        tenantId=subject.tenant_id,
        tenantSlug=tenant_slug,
        name=subject.name,
        code=subject.code,
        gradeLevels=subject.grade_levels,
        description=subject.description,
        isActive=subject.is_active,
        createdAt=subject.created_at.isoformat(),
        updatedAt=subject.updated_at.isoformat(),
    )


async def get_owned_subject(db: DbSession, user, subject_id: str) -> Subject:
    subject = await db.get(Subject, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Fan topilmadi.")
    ensure_tenant_access(user, subject.tenant_id, "Fan topilmadi.")
    return subject


@router.get("", response_model=list[SubjectResponse])
async def list_subjects(
    db: DbSession,
    current_user: StaffUser,
    tenantSlug: str | None = Query(None, description="Muassasa identifikatori"),
):
    tenant = await resolve_tenant(db, current_user, tenantSlug, "Muassasa topilmadi.")
    subjects = await db.scalars(select(Subject).where(Subject.tenant_id == tenant.id).order_by(Subject.name))
    return [serialize(s, tenant.slug) for s in subjects]


@router.post("", response_model=SubjectResponse, status_code=201)
async def create_subject(payload: SubjectCreate, request: Request, db: DbSession, current_user: AdminUser):
    tenant = await resolve_tenant(db, current_user, payload.tenantSlug, "Muassasa topilmadi.")
    code = payload.code.strip().upper()

    existing = await db.scalar(select(Subject).where(Subject.tenant_id == tenant.id, Subject.code == code))
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"'{code}' kodli fan ushbu muassasada allaqachon mavjud ({existing.name}).",
        )

    subject = Subject(
        tenant_id=tenant.id,
        name=payload.name.strip(),
        code=code,
        grade_levels=payload.gradeLevels.strip(),
        description=payload.description.strip() if payload.description else None,
        is_active=payload.isActive,
    )
    db.add(subject)
    await db.flush()
    audit.record(db, request, "subject.created", user=current_user, tenant_id=tenant.id, details={"code": code})
    await db.commit()
    return serialize(subject, tenant.slug)


@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: str, payload: SubjectUpdate, request: Request, db: DbSession, current_user: AdminUser
):
    subject = await get_owned_subject(db, current_user, subject_id)
    if payload.name is not None:
        subject.name = payload.name.strip()
    if payload.gradeLevels is not None:
        subject.grade_levels = payload.gradeLevels.strip()
    if payload.description is not None:
        subject.description = payload.description.strip()
    if payload.isActive is not None:
        subject.is_active = payload.isActive
    audit.record(
        db, request, "subject.updated", user=current_user, tenant_id=subject.tenant_id, details={"id": subject_id}
    )
    await db.commit()
    tenant = await db.get(Tenant, subject.tenant_id)
    return serialize(subject, tenant.slug)


@router.delete("/{subject_id}")
async def delete_subject(subject_id: str, request: Request, db: DbSession, current_user: AdminUser):
    subject = await get_owned_subject(db, current_user, subject_id)
    name = subject.name
    await db.execute(delete(Subject).where(Subject.id == subject_id))
    audit.record(
        db, request, "subject.deleted", user=current_user, tenant_id=subject.tenant_id, details={"id": subject_id}
    )
    await db.commit()
    return {"success": True, "message": f"'{name}' fani muvaffaqiyatli o'chirildi."}
