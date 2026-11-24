from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
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
    group: str | None = "1-guruh"
    emaktabId: str | None = None

@router.get("")
async def get_students(
    tenantSlug: str = Query("al-xorazmiy"),
    classGroupId: str | None = None,
    group: str | None = None,
    db: Prisma = Depends(get_prisma),
):
    tenant = await db.tenant.find_first(
        where={"OR": [{"slug": tenantSlug}, {"id": tenantSlug}]}
    )
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant topilmadi.")

    where_clause: dict = {"tenantId": tenant.id}
    if classGroupId:
        where_clause["classGroupId"] = classGroupId
    if group and group != "ALL":
        where_clause["group"] = group

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
            "group": s.group or "1-guruh",
            "emaktabId": s.emaktabId,
            "availableAssessmentIds": ["chsb-inf-11-q1"],
            "createdAt": s.createdAt.isoformat(),
        }
        for s in students
    ]

@router.post("")
async def create_student(payload: StudentCreate, db: Prisma = Depends(get_prisma)):
    tenant = await db.tenant.find_first(
        where={"OR": [{"slug": payload.tenantSlug}, {"id": payload.tenantSlug}]}
    )
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
            "group": payload.group or "1-guruh",
            "emaktabId": payload.emaktabId,
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
        "group": created.group or "1-guruh",
        "emaktabId": created.emaktabId,
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

@router.post("/parse-file")
async def parse_student_roster_file(
    file: UploadFile = File(...),
    group: str | None = Form(None)
):
    from backend.app.services.excel_parser import parse_excel_or_csv_file
    file_bytes = await file.read()
    file_name = file.filename or "roster.xlsx"
    result = parse_excel_or_csv_file(file_name=file_name, file_bytes=file_bytes, group_override=group)
    return result

