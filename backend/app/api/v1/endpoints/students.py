from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from datetime import datetime
from backend.app.db.prisma import get_prisma
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

@router.get("")
async def get_students(
    tenantSlug: str = Query("al-xorazmiy"),
    classGroupId: str | None = None,
    db: Prisma = Depends(get_prisma),
):
    tenant = await db.tenant.find_unique(where={"slug": tenantSlug})
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
            "availableAssessmentIds": ["chsb-inf-11-q1"],
            "createdAt": s.createdAt.isoformat(),
        }
        for s in students
    ]

@router.post("")
async def create_student(payload: StudentCreate, db: Prisma = Depends(get_prisma)):
    tenant = await db.tenant.find_unique(where={"slug": payload.tenantSlug})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant topilmadi.")

    roster_code = payload.rosterCode
    if not roster_code:
        count = await db.student.count(where={"tenantId": tenant.id})
        roster_code = f"STU-{1100 + count + 1}"

    created = await db.student.create(
        data={
            "tenantId": tenant.id,
            "schoolId": payload.schoolId,
            "classGroupId": payload.classGroupId,
            "rosterCode": roster_code,
            "firstName": payload.firstName,
            "lastName": payload.lastName,
            "middleName": payload.middleName,
            "gender": payload.gender,
            "birthDate": datetime.strptime(payload.birthDate, "%Y-%m-%d"),
            "status": "ELIGIBLE" if payload.status == "eligible" else "INACTIVE",
        },
        include={"classGroup": True},
    )

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
        "status": created.status.lower(),
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

