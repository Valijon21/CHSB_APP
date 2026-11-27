from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request
from sqlalchemy import delete, exists, select

from backend.app.core.dependencies import DbSession
from backend.app.core.permissions import AdminUser, StaffUser, ensure_tenant_access, resolve_tenant
from backend.app.models import ClassGroup, School, Student
from backend.app.schemas.class_group import ClassGroupCreate
from backend.app.services import audit
from backend.app.services import classes as service

router = APIRouter(prefix="/classes", tags=["Classes"])


@router.get("")
async def get_classes(db: DbSession, current_user: StaffUser, tenantSlug: str | None = Query(None)):
    tenant = await resolve_tenant(db, current_user, tenantSlug)
    classes = await db.scalars(
        select(ClassGroup).where(ClassGroup.tenant_id == tenant.id).order_by(ClassGroup.name, ClassGroup.id)
    )
    counts = await service.group_counts(db, Student.tenant_id == tenant.id)
    return [service.serialize_class(c, tenant, counts.get(c.id, {})) for c in classes]


@router.post("")
async def create_class(payload: ClassGroupCreate, request: Request, db: DbSession, current_user: AdminUser):
    tenant = await resolve_tenant(db, current_user, payload.tenantSlug)

    school = await db.get(School, payload.schoolId)
    if not school or school.tenant_id != tenant.id:
        school = await db.scalar(
            select(School).where(School.tenant_id == tenant.id).order_by(School.created_at, School.id).limit(1)
        )
    if not school:
        raise HTTPException(status_code=400, detail="Muassasada maktab topilmadi.")

    # Return the existing class if this tenant already has one with the name
    existing = await db.scalar(
        select(ClassGroup).where(ClassGroup.tenant_id == tenant.id, ClassGroup.name == payload.name).limit(1)
    )
    if existing:
        counts = await service.group_counts(db, Student.class_group_id == existing.id)
        return service.serialize_class(existing, tenant, counts.get(existing.id, {}))

    class_group = ClassGroup(
        school_id=school.id,
        tenant_id=tenant.id,
        name=payload.name,
        grade_level=payload.gradeLevel,
        shift=payload.shift,
        academic_year=payload.academicYear,
        has_groups=True,
    )
    db.add(class_group)
    await db.flush()
    audit.record(
        db, request, "class.created", user=current_user, tenant_id=tenant.id,
        details={"id": class_group.id, "name": class_group.name},
    )
    await db.commit()
    return service.serialize_class(class_group, tenant, {})


@router.get("/{class_id}")
async def get_class_detail(class_id: str, db: DbSession, current_user: StaffUser, group: str | None = None):
    class_group = await db.get(ClassGroup, class_id)
    if not class_group:
        raise HTTPException(status_code=404, detail="Sinf guruhi topilmadi.")
    ensure_tenant_access(current_user, class_group.tenant_id, "Sinf guruhi topilmadi.")
    return await service.class_detail(db, class_id, group)


@router.delete("/{class_id}")
async def delete_class(class_id: str, request: Request, db: DbSession, current_user: AdminUser):
    class_group = await db.get(ClassGroup, class_id)
    if not class_group:
        raise HTTPException(status_code=404, detail="Sinf topilmadi.")
    ensure_tenant_access(current_user, class_group.tenant_id, "Sinf topilmadi.")

    # Students, their attempts and results are removed by the database cascade
    await db.execute(delete(ClassGroup).where(ClassGroup.id == class_id))
    audit.record(
        db, request, "class.deleted", user=current_user, tenant_id=class_group.tenant_id,
        details={"id": class_id, "name": class_group.name},
    )
    await db.commit()
    return {"success": True, "message": f"'{class_group.name}' sinfi muvaffaqiyatli o'chirildi."}


@router.delete("")
async def delete_classes(
    request: Request,
    db: DbSession,
    current_user: AdminUser,
    tenantSlug: str = Query(..., min_length=1),
    onlyEmpty: bool = Query(False),
):
    tenant = await resolve_tenant(db, current_user, tenantSlug)
    conditions = [ClassGroup.tenant_id == tenant.id]
    if onlyEmpty:
        conditions.append(~exists().where(Student.class_group_id == ClassGroup.id))

    deleted = (await db.execute(delete(ClassGroup).where(*conditions))).rowcount
    audit.record(
        db, request, "class.deleted_many", user=current_user, tenant_id=tenant.id,
        details={"count": deleted, "onlyEmpty": onlyEmpty},
    )
    await db.commit()
    label = "bo'sh sinf" if onlyEmpty else "sinf"
    return {"success": True, "deletedCount": deleted, "message": f"{deleted} ta {label} o'chirildi."}
