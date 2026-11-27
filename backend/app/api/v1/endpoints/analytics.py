import json
from fastapi import APIRouter, Depends, HTTPException, Query
from backend.app.core.dependencies import (
    Actor,
    STAFF_ROLES,
    assert_tenant_ownership,
    require_role,
    resolve_tenant_for_actor,
)
from backend.app.db.prisma import get_prisma
from backend.app.services.mastery import analyze_student_mastery
from prisma import Prisma

router = APIRouter(prefix="/analytics", tags=["Analytics"])
STAFF_ACCESS = require_role(STAFF_ROLES)


def _parse_answers(raw: object) -> dict:
    if isinstance(raw, dict):
        return raw
    try:
        parsed = json.loads(str(raw or "{}"))
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


@router.get("/{tenant_slug}")
async def get_tenant_analytics(
    tenant_slug: str,
    actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    tenant = await resolve_tenant_for_actor(tenant_slug, actor, db)

    classes = await db.classgroup.find_many(
        where={"tenantId": tenant.id},
        include={"students": {"include": {"results": True}}},
    )

    all_results = await db.assessmentresult.find_many(
        where={"student": {"tenantId": tenant.id}},
        include={"student": True},
    )

    total_results = len(all_results)
    avg_score = (
        round(sum(r.score for r in all_results) / total_results, 1)
        if total_results > 0
        else 0.0
    )

    # Grade distribution & passing/quality rates
    g5 = sum(1 for r in all_results if r.grade == "5")
    g4 = sum(1 for r in all_results if r.grade == "4")
    g3 = sum(1 for r in all_results if r.grade == "3")
    g2 = sum(1 for r in all_results if r.grade == "2")
    passed_count = g5 + g4 + g3
    passing_rate = round((passed_count / total_results) * 100, 1) if total_results > 0 else 0.0
    quality_rate = round(((g5 + g4) / total_results) * 100, 1) if total_results > 0 else 0.0

    class_comparisons = []
    for c in classes:
        c_results = [r for s in c.students for r in s.results]
        unique_assessed_students = len({r.studentId for r in c_results})
        c_avg = (
            round(sum(r.score for r in c_results) / len(c_results), 1)
            if c_results
            else 0.0
        )
        c_max = (
            round(sum(r.maxScore for r in c_results) / len(c_results), 1)
            if c_results
            else 40.0
        )
        c_part = (
            round((unique_assessed_students / len(c.students)) * 100)
            if c.students
            else 0
        )
        class_comparisons.append({
            "className": c.name,
            "averageScore": c_avg,
            "maxPossibleScore": c_max,
            "studentCount": len(c.students),
            "participationRate": c_part,
        })

    # Real Bloom & Question-level stats aggregated from submitted attempts
    submitted_attempts = await db.assessmentattempt.find_many(
        where={"student": {"tenantId": tenant.id}, "status": "submitted"},
        include={"assessment": {"include": {"questions": True}}},
    )

    bloom_totals: dict[str, list[int]] = {
        "KNOWLEDGE": [0, 0],
        "COMPREHENSION": [0, 0],
        "APPLICATION": [0, 0],
        "ANALYSIS": [0, 0],
    }
    question_agg: dict[tuple[int, str, float], list[int]] = {}
    mcq_types = {"MCQ_SINGLE", "MULTIPLE_CHOICE", "MCQ"}

    for att in submitted_attempts:
        if not att.assessment or not att.assessment.questions:
            continue
        answers = _parse_answers(att.answersJson)
        for q in att.assessment.questions:
            task_type = (getattr(q, "taskType", None) or "MCQ_SINGLE").upper()
            if task_type not in mcq_types:
                continue
            selected = answers.get(q.id) or answers.get(str(q.questionNumber))
            is_correct = selected == q.correctOptionId

            bloom_key = (q.bloomLevel or "KNOWLEDGE").upper()
            if bloom_key not in bloom_totals:
                bloom_key = "APPLICATION" if "APP" in bloom_key else "ANALYSIS" if "ANA" in bloom_key else "COMPREHENSION" if "COMP" in bloom_key else "KNOWLEDGE"
            bloom_totals[bloom_key][1] += 1
            if is_correct:
                bloom_totals[bloom_key][0] += 1

            q_key = (q.questionNumber, q.bloomLevel or "B", float(q.points))
            entry = question_agg.setdefault(q_key, [0, 0])
            entry[1] += 1
            if is_correct:
                entry[0] += 1

    def _pct(pair: list[int]) -> float:
        return round((pair[0] / pair[1]) * 100, 1) if pair[1] > 0 else 0.0

    bloom_short = {"KNOWLEDGE": "(B)", "COMPREHENSION": "(B)", "APPLICATION": "(Q)", "ANALYSIS": "(M)"}
    question_stats = [
        {
            "order": order_num,
            "cognitiveLevel": bloom_short.get(level.upper(), f"({level[:1].upper()})"),
            "points": pts,
            "correctRate": _pct(counts),
        }
        for (order_num, level, pts), counts in sorted(question_agg.items(), key=lambda x: x[0][0])
    ]

    return {
        "tenantSlug": tenant.slug,
        "schoolName": tenant.name,
        "totalStudents": sum(len(c.students) for c in classes),
        "totalAssessed": total_results,
        "averageScore": avg_score,
        "maxScore": 40,
        "passingRate": passing_rate,
        "qualityRate": quality_rate,
        "classComparisons": class_comparisons,
        "scoreDistribution": {
            "excellent": g5,
            "good": g4,
            "satisfactory": g3,
            "unsatisfactory": g2,
            "total": total_results,
        },
        "cognitiveBreakdown": {
            "knowledge": _pct(bloom_totals["KNOWLEDGE"]),
            "comprehension": _pct(bloom_totals["COMPREHENSION"]),
            "application": _pct(bloom_totals["APPLICATION"]),
            "analysis": _pct(bloom_totals["ANALYSIS"]),
        },
        "questionStats": question_stats,
    }


@router.get("/{tenant_slug}/students-mastery")
async def get_students_mastery(
    tenant_slug: str,
    classGroupId: str | None = None,
    quarter: int = Query(default=1, ge=1, le=4),
    academicYear: str = Query(default="2026-2027"),
    actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    tenant = await resolve_tenant_for_actor(tenant_slug, actor, db)
    where_clause: dict = {"tenantId": tenant.id}
    if classGroupId and classGroupId != "all":
        where_clause["classGroupId"] = classGroupId

    students = await db.student.find_many(
        where=where_clause,
        include={
            "school": True,
            "classGroup": True,
            "formativeScores": True,
            "results": {"include": {"attempt": {"include": {"assessment": True}}}},
            "attempts": {"include": {"assessment": {"include": {"questions": True}}}},
        },
        order=[{"lastName": "asc"}, {"firstName": "asc"}],
    )

    rows = []
    tier_counts = {"excellent": 0, "proficient": 0, "developing": 0, "at_risk": 0}
    for stu in students:
        row, _ = analyze_student_mastery(stu, quarter=quarter, academic_year=academicYear)
        tier_counts[row["tier"]] = tier_counts.get(row["tier"], 0) + 1
        rows.append(row)

    rows.sort(key=lambda r: (r["averagePercentage"], r["quarterTotal100"]), reverse=True)
    return {
        "tenantSlug": tenant.slug,
        "quarter": quarter,
        "academicYear": academicYear,
        "totalStudents": len(rows),
        "summary": {
            "excellentCount": tier_counts["excellent"],
            "proficientCount": tier_counts["proficient"],
            "developingCount": tier_counts["developing"],
            "atRiskCount": tier_counts["at_risk"],
            "engine": "deterministic-pedagogical-engine",
        },
        "students": rows,
    }


@router.get("/{tenant_slug}/students/{student_id}/mastery")
async def get_single_student_mastery(
    tenant_slug: str,
    student_id: str,
    quarter: int = Query(default=1, ge=1, le=4),
    academicYear: str = Query(default="2026-2027"),
    actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    tenant = await resolve_tenant_for_actor(tenant_slug, actor, db)
    stu = await db.student.find_first(
        where={
            "tenantId": tenant.id,
            "OR": [{"id": student_id}, {"rosterCode": student_id}],
        },
        include={
            "school": True,
            "classGroup": True,
            "formativeScores": True,
            "results": {"include": {"attempt": {"include": {"assessment": True}}}},
            "attempts": {"include": {"assessment": {"include": {"questions": True}}}},
        },
    )
    if not stu:
        raise HTTPException(status_code=404, detail="O'quvchi topilmadi.")
    assert_tenant_ownership(stu.tenantId, actor)

    _, detail = analyze_student_mastery(stu, quarter=quarter, academic_year=academicYear)
    return detail
