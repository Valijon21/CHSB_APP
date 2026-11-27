import re
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from backend.app.core.dependencies import (
    STAFF_ROLES,
    Actor,
    assert_tenant_ownership,
    require_role,
    resolve_tenant_for_actor,
)
from backend.app.core.security import get_password_hash
from backend.app.db.prisma import get_prisma
from prisma import Prisma

router = APIRouter(prefix="/teachers", tags=["teachers"])
STAFF_ACCESS = require_role(STAFF_ROLES)


class TeacherCreatePayload(BaseModel):
    schoolId: str = Field(default="")
    tenantSlug: str = Field(default="al-xorazmiy")
    fullName: str = Field(..., min_length=3)
    subject: str = Field(default="Informatika va AT")
    qualification: str = Field(default="mutaxassis")
    assignedClassIds: list[str] = Field(default_factory=list)
    phone: str = Field(default="+998900000000")
    email: str | None = None
    username: str | None = None
    password: str | None = None
    status: str = Field(default="active")


class TeacherUpdatePayload(BaseModel):
    fullName: str | None = None
    email: str | None = None
    status: str | None = None
    subject: str | None = None
    qualification: str | None = None
    phone: str | None = None
    assignedClassIds: list[str] | None = None


def _format_teacher(user, tenant_slug: str, school_id: str, class_ids: list[str], class_names: list[str]) -> dict:
    return {
        "id": user.id,
        "schoolId": school_id,
        "tenantSlug": tenant_slug,
        "fullName": user.fullName,
        "username": user.username,
        "email": user.email or f"{user.username}@chsb.uz",
        "phone": "+998901234567",
        "subject": "Informatika va AT",
        "qualification": "oliy",
        "assignedClassIds": class_ids,
        "assignedClassNames": class_names,
        "status": "active" if user.isActive else "inactive",
        "createdAt": user.createdAt.isoformat(),
    }


@router.get("")
async def get_teachers(
    tenantSlug: str = Query("al-xorazmiy"),
    actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    tenant = await resolve_tenant_for_actor(tenantSlug, actor, db)
    school = await db.school.find_first(where={"tenantId": tenant.id})
    school_id = school.id if school else tenant.id

    classes = await db.classgroup.find_many(where={"tenantId": tenant.id}, order={"name": "asc"})
    class_ids = [c.id for c in classes]
    class_names = [c.name for c in classes]

    users = await db.user.find_many(
        where={"tenantId": tenant.id, "role": {"in": ["TEACHER", "SCHOOL_ADMIN"]}},
        order={"fullName": "asc"},
    )
    return [_format_teacher(u, tenant.slug, school_id, class_ids, class_names) for u in users]


@router.post("")
async def create_teacher(
    payload: TeacherCreatePayload,
    actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    tenant = await resolve_tenant_for_actor(payload.tenantSlug, actor, db)
    school = await db.school.find_first(where={"tenantId": tenant.id})
    school_id = payload.schoolId or (school.id if school else tenant.id)

    base_username = payload.username or (
        payload.email.split("@")[0]
        if payload.email and "@" in payload.email
        else re.sub(r"[^a-z0-9_]", "_", payload.fullName.lower()).strip("_")
    )
    base_username = (base_username or "teacher")[:24]
    username = base_username
    if await db.user.find_unique(where={"username": username}):
        username = f"{base_username}_{uuid.uuid4().hex[:4]}"

    pwd_hash = get_password_hash(payload.password or "Teacher123!")
    created = await db.user.create(
        data={
            "tenantId": tenant.id,
            "username": username,
            "email": payload.email or f"{username}@{tenant.slug}.uz",
            "hashedPassword": pwd_hash,
            "fullName": payload.fullName,
            "role": "TEACHER",
            "isActive": payload.status != "inactive",
        }
    )

    rec = _format_teacher(created, tenant.slug, school_id, payload.assignedClassIds, [])
    rec["subject"] = payload.subject
    rec["qualification"] = payload.qualification
    rec["phone"] = payload.phone
    return rec


@router.patch("/{teacher_id}")
@router.put("/{teacher_id}")
async def update_teacher(
    teacher_id: str,
    payload: TeacherUpdatePayload,
    actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    user = await db.user.find_unique(where={"id": teacher_id}, include={"tenant": True})
    if not user:
        raise HTTPException(status_code=404, detail="O'qituvchi topilmadi.")
    assert_tenant_ownership(user.tenantId, actor)

    update_data: dict = {}
    if payload.fullName is not None:
        update_data["fullName"] = payload.fullName
    if payload.email is not None:
        update_data["email"] = payload.email
    if payload.status is not None:
        update_data["isActive"] = payload.status != "inactive"

    updated = await db.user.update(where={"id": teacher_id}, data=update_data)
    school = await db.school.find_first(where={"tenantId": user.tenantId})
    slug = user.tenant.slug if user.tenant else "al-xorazmiy"
    rec = _format_teacher(updated, slug, school.id if school else user.tenantId, payload.assignedClassIds or [], [])
    if payload.subject:
        rec["subject"] = payload.subject
    if payload.qualification:
        rec["qualification"] = payload.qualification
    if payload.phone:
        rec["phone"] = payload.phone
    return rec


@router.delete("/{teacher_id}")
async def delete_teacher(
    teacher_id: str,
    actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    user = await db.user.find_unique(where={"id": teacher_id})
    if not user:
        return {"success": True, "message": "O'qituvchi topilmadi."}
    assert_tenant_ownership(user.tenantId, actor)
    await db.user.delete(where={"id": teacher_id})
    return {"success": True, "message": "O'qituvchi o'chirildi."}

