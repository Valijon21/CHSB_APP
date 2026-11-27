from __future__ import annotations
from fastapi import APIRouter, Depends
from backend.app.core.dependencies import REGIONAL_ROLES, require_role
from backend.app.db.prisma import get_prisma
from prisma import Prisma

router = APIRouter(
    prefix="/regional",
    tags=["Regional"],
    dependencies=[Depends(require_role(REGIONAL_ROLES))],
)


def _district_display_name(district_id: str) -> str:
    mapping = {
        "yunusobod": "Yunusobod tumani",
        "chilonzor": "Chilonzor tumani",
        "mirzo-ulugbek": "Mirzo Ulug'bek tumani",
        "olmazor": "Olmazor tumani",
        "shayxontohur": "Shayxontohur tumani",
    }
    clean = (district_id or "boshqa").lower().strip()
    return mapping.get(clean, f"{clean.replace('-', ' ').title()} tumani")


@router.get("/districts")
async def get_districts(db: Prisma = Depends(get_prisma)):
    schools = await db.school.find_many(include={"tenant": True, "students": {"include": {"results": True}}})

    grouped: dict[str, dict] = {}
    for s in schools:
        d_id = s.districtId or "yunusobod"
        bucket = grouped.setdefault(
            d_id,
            {
                "id": d_id,
                "name": _district_display_name(d_id),
                "code": d_id[:3].upper(),
                "totalSchools": 0,
                "totalStudents": 0,
                "assessedStudentIds": set(),
                "scores": [],
            },
        )
        bucket["totalSchools"] += 1
        bucket["totalStudents"] += len(s.students or [])
        for stu in s.students or []:
            for r in stu.results or []:
                bucket["assessedStudentIds"].add(stu.id)
                bucket["scores"].append(float(r.score))

    districts_out = []
    for bucket in grouped.values():
        total_stu = bucket["totalStudents"]
        scores = bucket["scores"]
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
        part_rate = round((len(bucket["assessedStudentIds"]) / total_stu) * 100, 1) if total_stu > 0 else 0.0
        districts_out.append({
            "id": bucket["id"],
            "name": bucket["name"],
            "code": bucket["code"],
            "totalSchools": bucket["totalSchools"],
            "totalStudents": total_stu,
            "averageScore": avg_score,
            "participationRate": part_rate,
        })

    return sorted(districts_out, key=lambda d: d["averageScore"], reverse=True)


@router.get("/districts/{district_id}")
async def get_district_by_id(district_id: str, db: Prisma = Depends(get_prisma)):
    districts = await get_districts(db)
    for d in districts:
        if d["id"] == district_id or d["code"].lower() == district_id.lower():
            return d
    return districts[0] if districts else {
        "id": district_id,
        "name": _district_display_name(district_id),
        "code": district_id[:3].upper(),
        "totalSchools": 0,
        "totalStudents": 0,
        "averageScore": 0.0,
        "participationRate": 0.0,
    }


@router.get("/rankings")
async def get_school_rankings(districtId: str | None = None, db: Prisma = Depends(get_prisma)):
    where_clause = {"districtId": districtId} if districtId else None
    schools = await db.school.find_many(
        where=where_clause,
        include={"tenant": True, "students": {"include": {"results": True}}},
    )

    items = []
    for s in schools:
        students = s.students or []
        results = [r for stu in students for r in (stu.results or [])]
        total_students = len(students)
        total_assessed = len({r.studentId for r in results})
        avg_score = round(sum(r.score for r in results) / len(results), 1) if results else 0.0
        part_rate = round((total_assessed / total_students) * 100, 1) if total_students > 0 else 0.0
        quality_count = sum(1 for r in results if r.grade in {"4", "5"})
        quality_rate = round((quality_count / len(results)) * 100, 1) if results else 0.0

        items.append({
            "schoolId": s.id,
            "schoolName": s.name,
            "districtName": s.districtId,
            "averageScore": avg_score,
            "participationRate": part_rate,
            "qualityRate": quality_rate,
            "totalAssessed": total_assessed,
        })

    items.sort(key=lambda x: (x["averageScore"], x["qualityRate"]), reverse=True)
    for idx, item in enumerate(items, 1):
        item["rank"] = idx
    return items


@router.get("/anomalies")
async def get_anomalies(districtId: str | None = None, db: Prisma = Depends(get_prisma)):
    anomalies = []

    # 1. Rapid completion (< 120 seconds on submitted assessment)
    att_where: dict = {"status": "submitted", "timeSpentSeconds": {"gt": 0, "lt": 120}}
    if districtId:
        att_where["student"] = {"school": {"districtId": districtId}}
    rapid_attempts = await db.assessmentattempt.find_many(
        where=att_where,
        include={"student": {"include": {"school": True}}, "assessment": True},
        take=20,
        order={"submittedAt": "desc"},
    )
    by_school_rapid: dict[str, dict] = {}
    for att in rapid_attempts:
        sch = att.student.school if att.student else None
        if not sch:
            continue
        entry = by_school_rapid.setdefault(
            sch.id,
            {"school": sch, "count": 0, "latestAt": att.submittedAt},
        )
        entry["count"] += 1

    for sch_id, info in by_school_rapid.items():
        sch = info["school"]
        anomalies.append({
            "id": f"anom-rapid-{sch_id}",
            "schoolId": sch.id,
            "schoolName": sch.name,
            "type": "rapid_completion",
            "severity": "medium" if info["count"] >= 3 else "low",
            "description": f"{info['count']} nafar o'quvchi testni 2 daqiqadan kam vaqtda yakunladi",
            "detectedAt": info["latestAt"].isoformat() if info["latestAt"] else "",
            "status": "investigating",
        })

    # 2. High-severity proctor events
    proctor_events = await db.proctorevent.find_many(
        where={"severity": {"in": ["high", "critical"]}},
        include={"attempt": {"include": {"student": {"include": {"school": True}}}}},
        take=20,
        order={"createdAt": "desc"},
    )
    for ev in proctor_events:
        sch = ev.attempt.student.school if (ev.attempt and ev.attempt.student) else None
        if not sch or (districtId and sch.districtId != districtId):
            continue
        anomalies.append({
            "id": f"anom-proctor-{ev.id}",
            "schoolId": sch.id,
            "schoolName": sch.name,
            "type": ev.eventType,
            "severity": ev.severity,
            "description": ev.message or f"Proctoring hodisasi: {ev.eventType}",
            "detectedAt": ev.createdAt.isoformat(),
            "status": "open",
        })

    return anomalies


@router.get("/overview")
async def get_regional_overview(db: Prisma = Depends(get_prisma)):
    schools_count = await db.school.count()
    students_count = await db.student.count()
    results = await db.assessmentresult.find_many()
    districts = await get_districts(db)

    total_results = len(results)
    avg_score = round(sum(r.score for r in results) / total_results, 1) if total_results else 0.0
    unique_assessed = len({r.studentId for r in results})
    overall_part = round((unique_assessed / students_count) * 100, 1) if students_count > 0 else 0.0
    quality_count = sum(1 for r in results if r.grade in {"4", "5"})
    overall_quality = round((quality_count / total_results) * 100, 1) if total_results > 0 else 0.0

    top_district = districts[0]["name"] if districts else "Aniqlanmagan"

    return {
        "totalSchools": schools_count,
        "totalStudents": students_count,
        "totalAssessed": total_results,
        "regionalAverageScore": avg_score,
        "maxPossibleScore": 40.0,
        "overallParticipationRate": overall_part,
        "overallQualityRate": overall_quality,
        "topPerformingDistrict": top_district,
    }
