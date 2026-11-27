from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from backend.app.db.prisma import get_prisma
from prisma import Prisma
from backend.app.core.permissions import school_staff, school_admin, resolve_tenant, ensure_tenant_access

router = APIRouter(prefix="/classes", tags=["Classes"])

class ClassGroupCreate(BaseModel):
    schoolId: str
    tenantSlug: str
    name: str = Field(..., min_length=2)
    gradeLevel: int = Field(..., ge=1, le=11)
    shift: int = Field(default=1, ge=1, le=2)
    academicYear: str = "2026-2027"

@router.get("")
async def get_classes(
    tenantSlug: str | None = Query(None),
    db: Prisma = Depends(get_prisma),
    current_user=Depends(school_staff),
):
    tenant = await resolve_tenant(db, current_user, tenantSlug)

    classes = await db.classgroup.find_many(
        where={"tenantId": tenant.id},
        include={"students": True},
        order={"name": "asc"},
    )

    res_classes = []
    for c in classes:
        g_counts: dict[str, int] = {}
        for s in c.students:
            grp = s.group or "Umumiy sinf"
            g_counts[grp] = g_counts.get(grp, 0) + 1

        res_classes.append({
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
            "hasGroups": c.hasGroups,
            "groupCounts": g_counts,
            "createdAt": c.createdAt.isoformat(),
        })

    return res_classes

@router.post("")
async def create_class(
    payload: ClassGroupCreate,
    db: Prisma = Depends(get_prisma),
    current_user=Depends(school_admin),
):
    tenant = await resolve_tenant(db, current_user, payload.tenantSlug)

    # Safely resolve valid schoolId within this tenant
    school = await db.school.find_first(
        where={"id": payload.schoolId, "tenantId": tenant.id}
    )
    if not school:
        school = await db.school.find_first(where={"tenantId": tenant.id})
    if not school:
        raise HTTPException(status_code=400, detail="Muassasada maktab topilmadi.")
    school_id = school.id

    # Return existing class if already present in this tenant
    existing = await db.classgroup.find_first(
        where={"tenantId": tenant.id, "name": payload.name}
    )
    if existing:
        return {
            "id": existing.id,
            "schoolId": existing.schoolId,
            "tenantId": tenant.id,
            "tenantSlug": tenant.slug,
            "name": existing.name,
            "grade": existing.gradeLevel,
            "gradeLevel": existing.gradeLevel,
            "shift": existing.shift,
            "academicYear": existing.academicYear,
            "studentCount": existing.studentCount,
            "hasGroups": existing.hasGroups,
            "groupCounts": {},
            "createdAt": existing.createdAt.isoformat(),
        }

    new_class = await db.classgroup.create(
        data={
            "schoolId": school_id,
            "tenantId": tenant.id,
            "name": payload.name,
            "gradeLevel": payload.gradeLevel,
            "shift": payload.shift,
            "academicYear": payload.academicYear,
            "studentCount": 0,
            "hasGroups": True,
        }
    )

    return {
        "id": new_class.id,
        "schoolId": new_class.schoolId,
        "tenantId": tenant.id,
        "tenantSlug": tenant.slug,
        "name": new_class.name,
        "grade": new_class.gradeLevel,
        "gradeLevel": new_class.gradeLevel,
        "shift": new_class.shift,
        "academicYear": new_class.academicYear,
        "studentCount": 0,
        "hasGroups": new_class.hasGroups,
        "groupCounts": {},
        "createdAt": new_class.createdAt.isoformat(),
    }

@router.get("/{class_id}")
async def get_class_detail(
    class_id: str,
    group: str | None = None,
    db: Prisma = Depends(get_prisma),
    current_user=Depends(school_staff),
):
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
    ensure_tenant_access(current_user, class_group.tenantId, "Sinf guruhi topilmadi.")

    total_group_counts: dict[str, int] = {}
    for s in class_group.students:
        grp = s.group or "Umumiy sinf"
        total_group_counts[grp] = total_group_counts.get(grp, 0) + 1

    students_list = []
    results_list = []

    for s in class_group.students:
        if group and group != "ALL":
            if group in ["Guruhsiz", "Umumiy sinf", "NONE"]:
                if s.group is not None:
                    continue
            elif s.group != group:
                continue

        students_list.append({
            "id": s.id,
            "tenantId": s.tenantId,
            "schoolId": s.schoolId,
            "classGroupId": s.classGroupId,
            "rosterCode": s.rosterCode,
            "firstName": s.firstName,
            "lastName": s.lastName,
            "middleName": s.middleName,
            "gender": s.gender,
            "group": s.group,
            "emaktabId": s.emaktabId,
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
                "group": s.group,
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
            "hasGroups": class_group.hasGroups,
            "groupCounts": total_group_counts,
        },
        "students": students_list,
        "results": results_list,
        "averageScore": average_score,
        "participationRate": participation_rate,
    }

@router.delete("/{class_id}")
async def delete_class(
    class_id: str,
    db: Prisma = Depends(get_prisma),
    current_user=Depends(school_admin),
):
    cls = await db.classgroup.find_unique(where={"id": class_id})
    if not cls:
        raise HTTPException(status_code=404, detail="Sinf topilmadi.")
    ensure_tenant_access(current_user, cls.tenantId, "Sinf topilmadi.")

    # Delete students in this class first to preserve FK constraints
    students = await db.student.find_many(where={"classGroupId": class_id})
    student_ids = [s.id for s in students]
    if student_ids:
        await db.assessmentresult.delete_many(where={"studentId": {"in": student_ids}})
        await db.assessmentattempt.delete_many(where={"studentId": {"in": student_ids}})
        await db.student.delete_many(where={"id": {"in": student_ids}})

    await db.classgroup.delete(where={"id": class_id})
    return {"success": True, "message": f"'{cls.name}' sinfi muvaffaqiyatli o'chirildi."}

@router.delete("")
async def delete_classes(
    tenantSlug: str = Query(..., min_length=1),
    onlyEmpty: bool = Query(False),
    db: Prisma = Depends(get_prisma),
    current_user=Depends(school_admin),
):
    tenant = await resolve_tenant(db, current_user, tenantSlug)
    where_clause: dict = {"tenantId": tenant.id}

    if onlyEmpty:
        # Find classes with 0 students
        classes = await db.classgroup.find_many(where=where_clause, include={"students": True})
        empty_ids = [c.id for c in classes if len(c.students) == 0]
        deleted_count = 0
        if empty_ids:
            deleted_count = await db.classgroup.delete_many(where={"id": {"in": empty_ids}})
        return {"success": True, "deletedCount": deleted_count, "message": f"{deleted_count} ta bo'sh sinf o'chirildi."}

    # Delete all classes (and their students if any)
    classes = await db.classgroup.find_many(where=where_clause)
    class_ids = [c.id for c in classes]
    if class_ids:
        students = await db.student.find_many(where={"classGroupId": {"in": class_ids}})
        student_ids = [s.id for s in students]
        if student_ids:
            await db.assessmentresult.delete_many(where={"studentId": {"in": student_ids}})
            await db.assessmentattempt.delete_many(where={"studentId": {"in": student_ids}})
            await db.student.delete_many(where={"id": {"in": student_ids}})
        deleted_count = await db.classgroup.delete_many(where={"id": {"in": class_ids}})
    else:
        deleted_count = 0

    return {"success": True, "deletedCount": deleted_count, "message": f"{deleted_count} ta sinf o'chirildi."}


