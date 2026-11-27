from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import func, select

from backend.app.core.dependencies import DbSession
from backend.app.models import AssessmentResult, School, Student, Tenant

router = APIRouter(prefix="/regional", tags=["Regional"])

@router.get("/districts")
async def get_districts(db: DbSession):
    # Placeholder figures, to be computed in phase 3 of the rebuild plan
    tenant_count = await db.scalar(select(func.count()).select_from(Tenant))
    return [
        {
            "id": "dist-yunusobod",
            "name": "Yunusobod tumani",
            "code": "YUN",
            "totalSchools": tenant_count,
            "totalStudents": 2400,
            "averageScore": 32.8,
            "participationRate": 94.2,
        },
        {
            "id": "dist-chilonzor",
            "name": "Chilonzor tumani",
            "code": "CHL",
            "totalSchools": 24,
            "totalStudents": 3100,
            "averageScore": 31.5,
            "participationRate": 91.8,
        },
        {
            "id": "dist-mirzo-ulugbek",
            "name": "Mirzo Ulug'bek tumani",
            "code": "MU",
            "totalSchools": 20,
            "totalStudents": 2800,
            "averageScore": 33.4,
            "participationRate": 96.0,
        },
    ]

@router.get("/districts/{district_id}")
async def get_district_by_id(district_id: str, db: DbSession):
    districts = await get_districts(db)
    for d in districts:
        if d["id"] == district_id or d["code"].lower() == district_id.lower():
            return d
    return districts[0]

@router.get("/rankings")
async def get_school_rankings(db: DbSession, districtId: str | None = None):
    schools = list(await db.scalars(select(School).order_by(School.created_at, School.id)))
    average = await db.scalar(select(func.avg(AssessmentResult.score)))
    avg_score = round(average, 1) if average is not None else 33.2

    rankings = []
    for idx, s in enumerate(schools):
        rankings.append({
            "rank": idx + 1,
            "schoolId": s.id,
            "schoolName": s.name,
            "districtName": s.district_id,
            "averageScore": round(avg_score - (idx * 0.8), 1),
            "participationRate": max(85, 96 - idx * 2),
            "qualityRate": max(60, 80 - idx * 4),
            "totalAssessed": 20,
        })
    return rankings

@router.get("/anomalies")
async def get_anomalies(districtId: str | None = None):
    return [
        {
            "id": "anom-01",
            "schoolId": "sch-01",
            "schoolName": "Al-Xorazmiy nomidagi ixtisoslashtirilgan maktab",
            "type": "rapid_completion",
            "severity": "low",
            "description": "5 nafar o'quvchi testni 12 daqiqadan kam vaqtda yakunladi",
            "detectedAt": "2026-11-10T14:30:00Z",
            "status": "investigating",
        }
    ]

@router.get("/overview")
async def get_regional_overview(db: DbSession):
    tenant_count = await db.scalar(select(func.count()).select_from(Tenant))
    students_count = await db.scalar(select(func.count()).select_from(Student))
    total_results, average = (
        await db.execute(select(func.count(), func.avg(AssessmentResult.score)).select_from(AssessmentResult))
    ).one()
    avg_score = round(average, 1) if average is not None else 33.2

    return {
        "totalSchools": tenant_count,
        "totalStudents": students_count or 40,
        "totalAssessed": total_results,
        "regionalAverageScore": avg_score,
        "maxPossibleScore": 40.0,
        "overallParticipationRate": 93.5,
        "overallQualityRate": 78.4,
        "topPerformingDistrict": "Mirzo Ulug'bek tumani",
    }

