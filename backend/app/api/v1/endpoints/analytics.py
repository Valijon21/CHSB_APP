from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.app.core.dependencies import DbSession
from backend.app.core.permissions import StaffUser, resolve_tenant
from backend.app.models import ClassGroup, Student

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/{tenant_slug}")
async def get_tenant_analytics(tenant_slug: str, db: DbSession, current_user: StaffUser):
    tenant = await resolve_tenant(db, current_user, tenant_slug)
    classes = list(await db.scalars(
        select(ClassGroup)
        .options(selectinload(ClassGroup.students).selectinload(Student.results))
        .where(ClassGroup.tenant_id == tenant.id)
        .order_by(ClassGroup.name)
    ))
    all_results = [r for c in classes for s in c.students for r in s.results]

    total = len(all_results)
    average = round(sum(r.score for r in all_results) / total, 1) if total else 0
    grades = {grade: sum(1 for r in all_results if r.grade == grade) for grade in "5432"}

    comparisons = []
    for c in classes:
        results = [r for s in c.students for r in s.results]
        comparisons.append({
            "className": c.name,
            "averageScore": round(sum(r.score for r in results) / len(results), 1) if results else 0,
            "maxPossibleScore": 40,
            "studentCount": len(c.students),
            "participationRate": round((len(results) / len(c.students)) * 100) if c.students else 0,
        })

    return {
        "tenantSlug": tenant.slug,
        "schoolName": tenant.name,
        "totalStudents": sum(len(c.students) for c in classes),
        "totalAssessed": total,
        "averageScore": average,
        "maxScore": 40,
        "passingRate": 100 if total else 0,
        "qualityRate": round(((grades["5"] + grades["4"]) / total) * 100) if total else 0,
        "classComparisons": comparisons,
        "scoreDistribution": {
            "excellent": grades["5"],
            "good": grades["4"],
            "satisfactory": grades["3"],
            "unsatisfactory": grades["2"],
            "total": total,
        },
        # Placeholder values, to be computed from answers in phase 3 of the rebuild plan
        "cognitiveBreakdown": {"knowledge": 92, "comprehension": 84, "application": 76, "analysis": 68},
        "questionStats": [
            {"order": 1, "cognitiveLevel": "(B)", "points": 2.5, "correctRate": 95},
            {"order": 2, "cognitiveLevel": "(B)", "points": 2.5, "correctRate": 90},
            {"order": 3, "cognitiveLevel": "(Q)", "points": 2.5, "correctRate": 78},
            {"order": 4, "cognitiveLevel": "(B)", "points": 2.5, "correctRate": 92},
            {"order": 5, "cognitiveLevel": "(Q)", "points": 2.5, "correctRate": 74},
            {"order": 6, "cognitiveLevel": "(T)", "points": 2.5, "correctRate": 68},
        ],
    }
