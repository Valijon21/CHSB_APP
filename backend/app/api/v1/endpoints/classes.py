from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from backend.app.db.prisma import get_prisma
from prisma import Prisma

router = APIRouter(prefix="/classes", tags=["Classes"])

class ClassGroupCreate(BaseModel):
    schoolId: str
    tenantSlug: str
    name: str = Field(..., min_length=2)
    gradeLevel: int = Field(..., ge=1, le=11)
    shift: int = Field(default=1, ge=1, le=2)
    academicYear: str = "2026-2027"

@router.get("")
async def get_classes(tenantSlug: str = Query("al-xorazmiy"), db: Prisma = Depends(get_prisma)):
    tenant = await db.tenant.find_first(
        where={"OR": [{"slug": tenantSlug}, {"id": tenantSlug}]}
    )
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant topilmadi.")

    classes = await db.classgroup.find_many(
        where={"tenantId": tenant.id},
        include={"students": True},
        order={"name": "asc"},
    )

    return [
        {
            "id": c.id,
            "schoolId": c.schoolId,
            "tenantId": tenant.id,
            "tenantSlug": tenant.slug,
            "name": c.name,
            "grade": c.gradeLevel,
            "gradeLevel": c.gradeLevel,
            "shift": c.shift,
            "academicYear": c.academicYear,
            "studentCount": len(c.students),
            "createdAt": c.createdAt.isoformat(),
        }
        for c in classes
    ]

@router.post("")
async def create_class(payload: ClassGroupCreate, db: Prisma = Depends(get_prisma)):
    tenant = await db.tenant.find_first(
        where={"OR": [{"slug": payload.tenantSlug}, {"id": payload.tenantSlug}]}
    )
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant topilmadi.")

    new_class = await db.classgroup.create(
        data={
            "schoolId": payload.schoolId,
            "tenantId": tenant.id,
            "name": payload.name,
            "gradeLevel": payload.gradeLevel,
            "shift": payload.shift,
            "academicYear": payload.academicYear,
            "studentCount": 0,
        }
    )

    return {
        "id": new_class.id,
        "schoolId": new_class.schoolId,
        "tenantId": tenant.id,
        "tenantSlug": tenant.slug,
        "name": new_class.name,
        "gradeLevel": new_class.gradeLevel,
        "shift": new_class.shift,
        "academicYear": new_class.academicYear,
        "studentCount": 0,
        "createdAt": new_class.createdAt.isoformat(),
    }

@router.get("/{class_id}")
async def get_class_detail(class_id: str, db: Prisma = Depends(get_prisma)):
    class_group = await db.classgroup.find_unique(
        where={"id": class_id},
        include={
            "students": {
                "include": {
                    "results": True,
                }
            },
            "school": True,
            "tenant": True,
        },
    )

    if not class_group:
        raise HTTPException(status_code=404, detail="Sinf guruhi topilmadi.")

    students_list = []
    results_list = []

    for s in class_group.students:
        students_list.append({
            "id": s.id,
            "tenantId": s.tenantId,
            "schoolId": s.schoolId,
            "classGroupId": s.classGroupId,
            "rosterCode": s.rosterCode,
            "firstName": s.firstName,
            "lastName": s.lastName,
            "middleName": s.middleName,
            "status": s.status.lower(),
            "availableAssessmentIds": ["chsb-inf-11-q1"],
        })
        for r in s.results:
            results_list.append({
                "attemptId": r.attemptId,
                "tenantId": s.tenantId,
                "assessmentId": "chsb-inf-11-q1",
                "rosterRecordId": s.id,
                "studentName": f"{s.firstName} {s.lastName}",
                "className": class_group.name,
                "totalQuestions": 15,
                "answeredQuestions": 15,
                "score": r.score,
                "maxScore": r.maxScore,
                "percentage": r.percentage,
                "status": r.status,
                "submittedAt": r.submittedAt.isoformat(),
            })

    total_results = len(results_list)
    average_score = (
        round(sum(r["score"] for r in results_list) / total_results, 1)
        if total_results > 0
        else 0
    )
    participation_rate = (
        round((total_results / len(students_list)) * 100)
        if len(students_list) > 0
        else 0
    )

    return {
        "classGroup": {
            "id": class_group.id,
            "tenantId": class_group.tenantId,
            "schoolId": class_group.schoolId,
            "name": class_group.name,
            "grade": class_group.gradeLevel,
            "academicYear": class_group.academicYear,
            "studentCount": len(students_list),
        },
        "students": students_list,
        "results": results_list,
        "averageScore": average_score,
        "participationRate": participation_rate,
    }

