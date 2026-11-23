from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from datetime import datetime
from backend.app.db.prisma import get_prisma, find_tenant_resilient
from prisma import Prisma

router = APIRouter(prefix="/students", tags=["Students"])

class StudentCreate(BaseModel):
    tenantSlug: str
    schoolId: str
    classGroupId: str
    firstName: str = Field(..., min_length=2)
    lastName: str = Field(..., min_length=2)
    middleName: str | None = None
    gender: str = "M"
    birthDate: str = "2008-05-15"
    rosterCode: str | None = None
    status: str = "eligible"
    emaktabId: str | None = None
    groupName: str | None = None

@router.get("")
async def get_students(
    tenantSlug: str = Query("al-xorazmiy"),
    classGroupId: str | None = None,
    db: Prisma = Depends(get_prisma),
):
    tenant = await find_tenant_resilient(tenantSlug, db)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant topilmadi.")

    where_clause = {"tenantId": tenant.id}
    if classGroupId:
        where_clause["classGroupId"] = classGroupId

    students = await db.student.find_many(
        where=where_clause,
        include={"classGroup": True},
        order={"lastName": "asc"},
    )

    return [
        {
            "id": s.id,
            "tenantId": s.tenantId,
            "tenantSlug": tenant.slug,
            "schoolId": s.schoolId,
            "classGroupId": s.classGroupId,
            "className": s.classGroup.name if s.classGroup else "",
            "rosterCode": s.rosterCode,
            "firstName": s.firstName,
            "lastName": s.lastName,
            "middleName": s.middleName,
            "fullName": f"{s.lastName} {s.firstName} {s.middleName or ''}".strip(),
            "gender": s.gender,
            "birthDate": s.birthDate.strftime("%Y-%m-%d"),
            "status": s.status.lower(),
            "emaktabId": s.emaktabId,
            "groupName": s.groupName,
            "availableAssessmentIds": ["chsb-inf-11-q1"],
            "createdAt": s.createdAt.isoformat(),
        }
        for s in students
    ]

@router.post("")
async def create_student(payload: StudentCreate, db: Prisma = Depends(get_prisma)):
    tenant = await find_tenant_resilient(payload.tenantSlug, db)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant topilmadi.")

    school = await db.school.find_unique(where={"id": payload.schoolId})
    school_id = payload.schoolId
    if not school:
        default_school = await db.school.find_first(where={"tenantId": tenant.id})
        if default_school:
            school_id = default_school.id
        else:
            raise HTTPException(status_code=400, detail="Tenantga tegishli maktab topilmadi.")

    class_group = await db.classgroup.find_unique(where={"id": payload.classGroupId})
    class_group_id = payload.classGroupId
    if not class_group:
        default_class = await db.classgroup.find_first(where={"tenantId": tenant.id})
        if default_class:
            class_group_id = default_class.id
        else:
            new_cls = await db.classgroup.create(
                data={
                    "tenantId": tenant.id,
                    "schoolId": school_id,
                    "name": "10-A sinf",
                    "gradeLevel": 10,
                    "academicYear": "2026-2027",
                }
            )
            class_group_id = new_cls.id

    roster_code = payload.rosterCode
    if not roster_code:
        count = await db.student.count(where={"tenantId": tenant.id})
        roster_code = f"STU-{1100 + count + 1}"

    existing = await db.student.find_unique(where={"rosterCode": roster_code})
    if existing:
        import uuid
        roster_code = f"STU-{uuid.uuid4().hex[:6].upper()}"

    birth_dt = datetime.strptime("2009-01-01", "%Y-%m-%d")
    if payload.birthDate:
        try:
            birth_dt = datetime.strptime(payload.birthDate, "%Y-%m-%d")
        except ValueError:
            pass

    created = await db.student.create(
        data={
            "tenantId": tenant.id,
            "schoolId": school_id,
            "classGroupId": class_group_id,
            "rosterCode": roster_code,
            "firstName": payload.firstName,
            "lastName": payload.lastName,
            "middleName": payload.middleName,
            "gender": payload.gender,
            "birthDate": birth_dt,
            "status": "ELIGIBLE" if payload.status == "eligible" else "INACTIVE",
            "emaktabId": payload.emaktabId,
            "groupName": payload.groupName,
        },
        include={"classGroup": True},
    )

    try:
        await db.classgroup.update(
            where={"id": class_group_id},
            data={"studentCount": {"increment": 1}},
        )
        await db.school.update(
            where={"id": school_id},
            data={"studentCount": {"increment": 1}},
        )
    except Exception:
        pass

    return {
        "id": created.id,
        "tenantId": created.tenantId,
        "tenantSlug": tenant.slug,
        "schoolId": created.schoolId,
        "classGroupId": created.classGroupId,
        "className": created.classGroup.name if created.classGroup else "",
        "rosterCode": created.rosterCode,
        "firstName": created.firstName,
        "lastName": created.lastName,
        "middleName": created.middleName,
        "fullName": f"{created.lastName} {created.firstName} {created.middleName or ''}".strip(),
        "gender": created.gender,
        "birthDate": created.birthDate.strftime("%Y-%m-%d"),
        "status": created.status.lower(),
        "emaktabId": created.emaktabId,
        "groupName": created.groupName,
        "availableAssessmentIds": ["chsb-inf-11-q1"],
        "createdAt": created.createdAt.isoformat(),
    }

@router.post("/bulk")
async def bulk_create_students(inputs: list[StudentCreate], db: Prisma = Depends(get_prisma)):
    results = []
    for item in inputs:
        res = await create_student(item, db)
        results.append(res)
    return results

@router.delete("/{student_id}")
async def delete_student(student_id: str, db: Prisma = Depends(get_prisma)):
    await db.student.delete(where={"id": student_id})
    return {"success": True, "message": "O'quvchi muvaffaqiyatli o'chirildi."}

