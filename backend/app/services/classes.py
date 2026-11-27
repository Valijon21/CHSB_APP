"""
Class groups and their statistics.
"""
from __future__ import annotations

from collections import defaultdict

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.models import ClassGroup, Student, Tenant

UNGROUPED = "Umumiy sinf"


def serialize_class(class_group: ClassGroup, tenant: Tenant, group_counts: dict[str, int]) -> dict:
    return {
        "id": class_group.id,
        "schoolId": class_group.school_id,
        "tenantId": tenant.id,
        "tenantSlug": tenant.slug,
        "name": class_group.name,
        "grade": class_group.grade_level,
        "gradeLevel": class_group.grade_level,
        "shift": class_group.shift,
        "academicYear": class_group.academic_year,
        "studentCount": sum(group_counts.values()),
        "hasGroups": class_group.has_groups,
        "groupCounts": group_counts,
        "createdAt": class_group.created_at.isoformat(),
    }


async def group_counts(db: AsyncSession, *conditions) -> dict[str, dict[str, int]]:
    """Number of students per class and study group, counted in the database."""
    rows = await db.execute(
        select(Student.class_group_id, Student.group, func.count())
        .where(*conditions)
        .group_by(Student.class_group_id, Student.group)
    )
    counts: dict[str, dict[str, int]] = defaultdict(dict)
    for class_id, group, number in rows:
        key = group or UNGROUPED
        counts[class_id][key] = counts[class_id].get(key, 0) + number
    return counts


async def class_detail(db: AsyncSession, class_id: str, group: str | None) -> dict | None:
    class_group = await db.scalar(
        select(ClassGroup)
        .options(selectinload(ClassGroup.students).selectinload(Student.results))
        .where(ClassGroup.id == class_id)
    )
    if not class_group:
        return None

    totals: dict[str, int] = {}
    for s in class_group.students:
        key = s.group or UNGROUPED
        totals[key] = totals.get(key, 0) + 1

    students_list = []
    results_list = []
    for s in sorted(class_group.students, key=lambda s: (s.last_name, s.first_name, s.id)):
        if group and group != "ALL":
            if group in ("Guruhsiz", UNGROUPED, "NONE"):
                if s.group is not None:
                    continue
            elif s.group != group:
                continue

        students_list.append({
            "id": s.id,
            "tenantId": s.tenant_id,
            "schoolId": s.school_id,
            "classGroupId": s.class_group_id,
            "rosterCode": s.roster_code,
            "firstName": s.first_name,
            "lastName": s.last_name,
            "middleName": s.middle_name,
            "gender": s.gender,
            "group": s.group,
            "emaktabId": s.emaktab_id,
            "status": s.status.lower(),
            "availableAssessmentIds": ["chsb-inf-11-q1"],
        })
        for r in s.results:
            results_list.append({
                "attemptId": r.attempt_id,
                "tenantId": s.tenant_id,
                "assessmentId": "chsb-inf-11-q1",
                "rosterRecordId": s.id,
                "studentName": f"{s.first_name} {s.last_name}",
                "className": class_group.name,
                "group": s.group,
                "totalQuestions": 15,
                "answeredQuestions": 15,
                "score": r.score,
                "maxScore": r.max_score,
                "percentage": r.percentage,
                "status": r.status,
                "submittedAt": r.submitted_at.isoformat(),
            })

    total = len(results_list)
    average = round(sum(r["score"] for r in results_list) / total, 1) if total else 0
    participation = round((total / len(students_list)) * 100) if students_list else 0

    return {
        "classGroup": {
            "id": class_group.id,
            "tenantId": class_group.tenant_id,
            "schoolId": class_group.school_id,
            "name": class_group.name,
            "grade": class_group.grade_level,
            "academicYear": class_group.academic_year,
            "studentCount": len(students_list),
            "hasGroups": class_group.has_groups,
            "groupCounts": totals,
        },
        "students": students_list,
        "results": results_list,
        "averageScore": average,
        "participationRate": participation,
    }
