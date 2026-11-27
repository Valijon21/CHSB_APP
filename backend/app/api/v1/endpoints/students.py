from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from backend.app.core.dependencies import DbSession
from backend.app.core.permissions import (
    SUPER_ADMIN,
    AdminUser,
    StaffUser,
    can_access_tenant,
    ensure_tenant_access,
    find_tenant,
    resolve_tenant,
    school_admin,
)
from backend.app.models import ClassGroup, Student
from backend.app.schemas.student import BulkDeleteRequest, StudentCreate
from backend.app.services import audit
from backend.app.services import students as service

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("")
async def get_students(
    db: DbSession,
    current_user: StaffUser,
    tenantSlug: str | None = Query(None),
    classGroupId: str | None = None,
    group: str | None = None,
):
    tenant = await resolve_tenant(db, current_user, tenantSlug)
    query = (
        select(Student)
        .options(joinedload(Student.class_group))
        .where(Student.tenant_id == tenant.id)
        .order_by(Student.last_name, Student.first_name, Student.id)
    )
    if classGroupId:
        query = query.where(Student.class_group_id == classGroupId)
    if group and group != "ALL":
        query = query.where(Student.group.is_(None) if group == "NONE" else Student.group == group)

    students = await db.scalars(query)
    return [service.serialize_student(s, tenant.slug, s.class_group.name) for s in students]


@router.post("")
async def create_student(payload: StudentCreate, request: Request, db: DbSession, current_user: AdminUser):
    tenant = await resolve_tenant(db, current_user, payload.tenantSlug)
    student, class_group = await service.create_student(db, tenant, payload)
    audit.record(db, request, "student.created", user=current_user, tenant_id=tenant.id, details={"id": student.id})
    await db.commit()
    return service.serialize_student(student, tenant.slug, class_group.name)


@router.post("/bulk")
async def bulk_create_students(
    inputs: list[StudentCreate], request: Request, db: DbSession, current_user: AdminUser
):
    if not inputs:
        return []

    # Reject the whole batch before writing anything if any row targets a foreign tenant
    tenants = {}
    for ref in {item.tenantSlug for item in inputs}:
        tenant = await find_tenant(db, ref)
        if not tenant or not can_access_tenant(current_user, tenant.id):
            raise HTTPException(status_code=404, detail="Tenant topilmadi.")
        tenants[ref] = tenant

    created = await service.bulk_create_students(db, tenants, inputs)
    for tenant in {t.id: t for t in tenants.values()}.values():
        count = sum(1 for _, owner, _ in created if owner.id == tenant.id)
        audit.record(
            db, request, "student.imported", user=current_user, tenant_id=tenant.id,
            details={"created": count, "submitted": len(inputs)},
        )
    await db.commit()
    return [service.serialize_student(s, tenant.slug, cls.name) for s, tenant, cls in created]


@router.delete("")
async def delete_all_students(
    request: Request,
    db: DbSession,
    current_user: AdminUser,
    tenantSlug: str = Query(..., min_length=1),
    classGroupId: str | None = Query(None),
):
    tenant = await resolve_tenant(db, current_user, tenantSlug)
    conditions = [Student.tenant_id == tenant.id]

    if classGroupId:
        target = await db.get(ClassGroup, classGroupId)
        if not target or target.tenant_id != tenant.id:
            raise HTTPException(status_code=404, detail="Sinf topilmadi.")
        conditions.append(Student.class_group_id == classGroupId)

    deleted = await service.delete_students(db, *conditions)
    audit.record(
        db, request, "student.deleted_many", user=current_user, tenant_id=tenant.id,
        details={"count": deleted, "classGroupId": classGroupId},
    )
    await db.commit()

    message = (
        f"Sinfdagi {deleted} nafar o'quvchi ma'lumotlari to'liq o'chirildi."
        if classGroupId
        else f"{deleted} nafar o'quvchi ma'lumotlari to'liq o'chirildi."
    )
    return {"success": True, "deletedCount": deleted, "message": message}


@router.post("/bulk-delete")
async def bulk_delete_students(
    payload: BulkDeleteRequest, request: Request, db: DbSession, current_user: AdminUser
):
    if not payload.studentIds:
        return {"success": True, "deletedCount": 0, "message": "O'quvchilar tanlanmagan."}

    conditions = [Student.id.in_(payload.studentIds)]
    if current_user.role != SUPER_ADMIN:
        conditions.append(Student.tenant_id == current_user.tenant_id)

    ids = list(await db.scalars(select(Student.id).where(*conditions)))
    if not ids:
        return {"success": True, "deletedCount": 0, "message": "O'quvchilar topilmadi."}

    deleted = await service.delete_students(db, Student.id.in_(ids))
    audit.record(db, request, "student.deleted_many", user=current_user, details={"count": deleted, "ids": ids})
    await db.commit()
    return {
        "success": True,
        "deletedCount": deleted,
        "message": f"{deleted} nafar o'quvchi muvaffaqiyatli o'chirildi.",
    }


@router.delete("/{student_id}")
async def delete_student(student_id: str, request: Request, db: DbSession, current_user: AdminUser):
    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="O'quvchi topilmadi.")
    ensure_tenant_access(current_user, student.tenant_id, "O'quvchi topilmadi.")

    await service.delete_students(db, Student.id == student_id)
    audit.record(
        db, request, "student.deleted", user=current_user, tenant_id=student.tenant_id, details={"id": student_id}
    )
    await db.commit()
    return {"success": True, "message": "O'quvchi muvaffaqiyatli o'chirildi."}


@router.post("/parse-file", dependencies=[Depends(school_admin)])
async def parse_student_roster_file(file: UploadFile = File(...), group: str | None = Form(None)):
    from backend.app.services.excel_parser import parse_excel_or_csv_file

    file_bytes = await file.read()
    return parse_excel_or_csv_file(
        file_name=file.filename or "roster.xlsx", file_bytes=file_bytes, group_override=group
    )
