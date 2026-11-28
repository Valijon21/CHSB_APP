from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from backend.app.core.dependencies import (
    STAFF_ROLES,
    Actor,
    assert_tenant_ownership,
    require_role,
    resolve_tenant_for_actor,
)
from backend.app.db.prisma import get_prisma
from backend.app.services.grading import (
    calculate_annual_grade,
    calculate_quarter_total,
    normalize_bsb_total,
    normalize_chsb_score,
)
from prisma import Prisma

router = APIRouter()
STAFF_ACCESS = require_role(STAFF_ROLES)


class FormativeScorePayload(BaseModel):
    studentId: str
    subjectCode: str = Field(default="ALL", min_length=1)
    quarter: int = Field(default=1, ge=1, le=4)
    academicYear: str = Field(default="2026-2027")
    classwork: float = Field(default=0.0, ge=0.0, le=6.0)
    homework: float = Field(default=0.0, ge=0.0, le=4.0)
    note: str | None = None


def _matches_subject(assessment, subject_code: str | None) -> bool:
    if not subject_code or subject_code.upper() == "ALL":
        return True
    target = subject_code.strip().lower()
    asm_code = (getattr(assessment, "subjectCode", None) or "").strip().lower()
    asm_subject = (getattr(assessment, "subject", None) or "").strip().lower()
    return asm_code == target or target in asm_subject or asm_subject.startswith(target[:3])


@router.post("/gradebook/formative")
async def upsert_formative_score(
    payload: FormativeScorePayload,
    actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    student = await db.student.find_unique(where={"id": payload.studentId})
    if not student:
        raise HTTPException(status_code=404, detail="O'quvchi topilmadi.")
    assert_tenant_ownership(student.tenantId, actor)

    subject_code = payload.subjectCode.strip().upper()
    total_score = round(min(10.0, payload.classwork + payload.homework), 1)

    existing = await db.formativescore.find_first(
        where={
            "tenantId": student.tenantId,
            "studentId": student.id,
            "subjectCode": subject_code,
            "quarter": payload.quarter,
            "academicYear": payload.academicYear,
        }
    )

    if existing:
        saved = await db.formativescore.update(
            where={"id": existing.id},
            data={
                "classwork": round(payload.classwork, 1),
                "homework": round(payload.homework, 1),
                "totalScore": total_score,
                "recordedBy": actor.id,
                "note": payload.note,
            },
        )
    else:
        saved = await db.formativescore.create(
            data={
                "tenantId": student.tenantId,
                "studentId": student.id,
                "subjectCode": subject_code,
                "quarter": payload.quarter,
                "academicYear": payload.academicYear,
                "classwork": round(payload.classwork, 1),
                "homework": round(payload.homework, 1),
                "totalScore": total_score,
                "recordedBy": actor.id,
                "note": payload.note,
            }
        )

    return {
        "id": saved.id,
        "studentId": saved.studentId,
        "subjectCode": saved.subjectCode,
        "quarter": saved.quarter,
        "academicYear": saved.academicYear,
        "classwork": saved.classwork,
        "homework": saved.homework,
        "totalScore": saved.totalScore,
        "note": saved.note,
    }


@router.get("/gradebook/quarter")
async def get_quarter_gradebook(
    tenantId: str = Query(...),
    classGroupId: str | None = None,
    subjectCode: str | None = None,
    quarter: int = Query(default=1, ge=1, le=4),
    academicYear: str = Query(default="2026-2027"),
    actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    tenant = await resolve_tenant_for_actor(tenantId, actor, db)

    student_where: dict = {"tenantId": tenant.id}
    if classGroupId and classGroupId != "all":
        student_where["classGroupId"] = classGroupId

    students = await db.student.find_many(
        where=student_where,
        include={
            "classGroup": True,
            "school": True,
            "results": {"include": {"attempt": {"include": {"assessment": True}}}},
        },
        order=[{"lastName": "asc"}, {"firstName": "asc"}],
    )

    fb_where: dict = {
        "tenantId": tenant.id,
        "academicYear": academicYear,
    }
    formative_rows = await db.formativescore.find_many(where=fb_where)
    fb_by_student_quarter: dict[tuple[str, int], list] = {}
    for fb in formative_rows:
        fb_by_student_quarter.setdefault((fb.studentId, fb.quarter), []).append(fb)

    default_preset = "MMTV_STANDARD"
    rows = []

    for stu in students:
        school_preset = (
            getattr(stu.school, "gradingPreset", None) if stu.school else None
        ) or "MMTV_STANDARD"
        default_preset = school_preset

        def _compute_for_q(q_num: int) -> tuple[dict, float, float, bool]:
            fb_candidates = fb_by_student_quarter.get((stu.id, q_num), [])
            matched_fb = None
            if subjectCode and subjectCode.upper() != "ALL":
                target = subjectCode.strip().upper()
                matched_fb = next((f for f in fb_candidates if f.subjectCode.upper() == target), None)
            elif fb_candidates:
                matched_fb = fb_candidates[0]

            cw = matched_fb.classwork if matched_fb else 0.0
            hw = matched_fb.homework if matched_fb else 0.0
            fb_total = matched_fb.totalScore if matched_fb else 0.0

            bsb_entries: list[tuple[float, float]] = []
            chsb_scores: list[float] = []
            for res in stu.results or []:
                asm = res.attempt.assessment if res.attempt else None
                if not asm:
                    continue
                asm_q = getattr(asm, "quarter", 1) or 1
                if asm_q != q_num or not _matches_subject(asm, subjectCode):
                    continue
                asm_type = (getattr(asm, "assessmentType", "CHSB") or "CHSB").upper()
                if asm_type in {"BSB", "PRACTICAL", "PROJECT"}:
                    bsb_entries.append((res.score, res.maxScore))
                else:
                    chsb_scores.append(normalize_chsb_score(res.score, res.maxScore))

            bsb_total = normalize_bsb_total(bsb_entries)
            chsb_total = max(chsb_scores) if chsb_scores else 0.0
            has_activity = bool(matched_fb is not None or bsb_entries or chsb_scores)
            summary = calculate_quarter_total(fb_total, bsb_total, chsb_total, preset=school_preset)
            return summary, cw, hw, has_activity

        q_summary, classwork, homework, _ = _compute_for_q(quarter)

        # Collect totals across quarters where student has recorded assessments or scores
        available_quarter_totals: list[float] = []
        for q_idx in range(1, 5):
            s_q, _, _, has_act = _compute_for_q(q_idx)
            if has_act or q_idx == quarter:
                available_quarter_totals.append(s_q["totalScore100"])
        annual = calculate_annual_grade(available_quarter_totals, preset=school_preset)

        rows.append(
            {
                "studentId": stu.id,
                "rosterCode": stu.rosterCode,
                "studentName": f"{stu.firstName} {stu.lastName}",
                "classGroupId": stu.classGroupId,
                "className": stu.classGroup.name if stu.classGroup else "",
                "classwork": classwork,
                "homework": homework,
                "formativeScore": q_summary["formativeScore"],
                "bsbScore": q_summary["bsbScore"],
                "chsbScore": q_summary["chsbScore"],
                "totalScore100": q_summary["totalScore100"],
                "grade5": q_summary["grade5"],
                "preset": q_summary["preset"],
                "annualScore100": annual["annualScore100"],
                "annualGrade5": annual["annualGrade5"],
            }
        )

    return {
        "tenantId": tenant.id,
        "quarter": quarter,
        "academicYear": academicYear,
        "subjectCode": subjectCode or "ALL",
        "preset": default_preset,
        "rows": rows,
    }
