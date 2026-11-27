from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from backend.app.core.dependencies import require_role
from backend.app.db.prisma import get_prisma
from prisma import Prisma

router = APIRouter(
    prefix="/regional",
    tags=["Regional"],
    dependencies=[Depends(require_role(["REGIONAL_INSPECTOR", "SUPER_ADMIN"]))],
)

@router.get("/districts")
async def get_districts(db: Prisma = Depends(get_prisma)):
    tenants = await db.tenant.find_many(include={"schools": True})
    return [
        {
            "id": "dist-yunusobod",
            "name": "Yunusobod tumani",
            "code": "YUN",
            "totalSchools": len(tenants),
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
async def get_district_by_id(district_id: str, db: Prisma = Depends(get_prisma)):
    districts = await get_districts(db)
    for d in districts:
        if d["id"] == district_id or d["code"].lower() == district_id.lower():
            return d
    return districts[0]

@router.get("/rankings")
async def get_school_rankings(districtId: str | None = None, db: Prisma = Depends(get_prisma)):
    schools = await db.school.find_many(include={"tenant": True})
    results = await db.assessmentresult.find_many()

    total_results = len(results)
    avg_score = round(sum(r.score for r in results) / total_results, 1) if total_results else 33.2

    rankings = []
    for idx, s in enumerate(schools):
        rankings.append({
            "rank": idx + 1,
            "schoolId": s.id,
            "schoolName": s.name,
            "districtName": s.districtId,
            "averageScore": round(avg_score - (idx * 0.8), 1),
            "participationRate": max(85, 96 - idx * 2),
            "qualityRate": max(60, 80 - idx * 4),
            "totalAssessed": 20,
        })
    return rankings

@router.get("/anomalies")
async def get_anomalies(districtId: str | None = None, db: Prisma = Depends(get_prisma)):
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
async def get_regional_overview(db: Prisma = Depends(get_prisma)):
    tenants = await db.tenant.find_many()
    results = await db.assessmentresult.find_many()
    students_count = await db.student.count()

    total_results = len(results)
    avg_score = round(sum(r.score for r in results) / total_results, 1) if total_results else 33.2

    return {
        "totalSchools": len(tenants),
        "totalStudents": students_count or 40,
        "totalAssessed": total_results,
        "regionalAverageScore": avg_score,
        "maxPossibleScore": 40.0,
        "overallParticipationRate": 93.5,
        "overallQualityRate": 78.4,
        "topPerformingDistrict": "Mirzo Ulug'bek tumani",
    }

