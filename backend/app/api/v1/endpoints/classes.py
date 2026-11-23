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
    teacherId: str | None = None
    teacherName: str | None = None

class AssignTeacherPayload(BaseModel):
    teacherId: str | None = None
    teacherName: str | None = None

@router.get("")
async def get_classes(
    tenantSlug: str = Query("al-xorazmiy"),
    teacherId: str | None = Query(None),
    db: Prisma = Depends(get_prisma),
):
    tenant = await db.tenant.find_unique(where={"slug": tenantSlug})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant topilmadi.")

    where_filter: dict = {"tenantId": tenant.id}
    if teacherId:
        where_filter["teacherId"] = teacherId

    classes = await db.classgroup.find_many(
        where=where_filter,
        include={"students": True, "teacher": True},
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
            "teacherId": c.teacherId,
            "teacherName": c.teacherName or (c.teacher.fullName if c.teacher else None),
            "createdAt": c.createdAt.isoformat(),
        }
        for c in classes
    ]

@router.post("")
async def create_class(payload: ClassGroupCreate, db: Prisma = Depends(get_prisma)):
    tenant = await db.tenant.find_unique(where={"slug": payload.tenantSlug})
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

    teacher_name = payload.teacherName
    if payload.teacherId and not teacher_name:
        teacher = await db.user.find_unique(where={"id": payload.teacherId})
        if teacher:
            teacher_name = teacher.fullName

    new_class = await db.classgroup.create(
        data={
            "schoolId": school_id,
            "tenantId": tenant.id,
            "name": payload.name,
            "gradeLevel": payload.gradeLevel,
            "shift": payload.shift,
            "academicYear": payload.academicYear,
            "studentCount": 0,
            "teacherId": payload.teacherId,
            "teacherName": teacher_name,
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
        "teacherId": new_class.teacherId,
        "teacherName": new_class.teacherName,
        "createdAt": new_class.createdAt.isoformat(),
    }

@router.patch("/{class_id}/teacher")
async def assign_teacher(
    class_id: str,
    payload: AssignTeacherPayload,
    db: Prisma = Depends(get_prisma),
):
    class_group = await db.classgroup.find_unique(where={"id": class_id})
    if not class_group:
        raise HTTPException(status_code=404, detail="Sinf guruhi topilmadi.")

    teacher_name = payload.teacherName
    if payload.teacherId and not teacher_name:
        teacher = await db.user.find_unique(where={"id": payload.teacherId})
        if teacher:
            teacher_name = teacher.fullName

    updated = await db.classgroup.update(
        where={"id": class_id},
        data={
            "teacherId": payload.teacherId,
            "teacherName": teacher_name,
        },
    )

    return {
        "id": updated.id,
        "name": updated.name,
        "teacherId": updated.teacherId,
        "teacherName": updated.teacherName,
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
            "emaktabId": s.emaktabId,
            "groupName": s.groupName,
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
            "teacherId": class_group.teacherId,
            "teacherName": class_group.teacherName,
        },
        "students": students_list,
        "results": results_list,
        "averageScore": average_score,
        "participationRate": participation_rate,
    }

