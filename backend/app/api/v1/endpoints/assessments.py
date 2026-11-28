from __future__ import annotations
from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from pydantic import BaseModel, Field
from datetime import datetime, timedelta, timezone
import json
import re
from backend.app.core.dependencies import (
    Actor,
    assert_tenant_ownership,
    get_current_actor,
    require_role,
    resolve_tenant_for_actor,
)
from backend.app.db.prisma import get_prisma
from backend.app.services.grading import calculate_grade5
from prisma import Base64, Prisma

router = APIRouter(tags=["Assessments"])
STAFF_ACCESS = require_role(["TEACHER", "SCHOOL_ADMIN", "REGIONAL_INSPECTOR", "SUPER_ADMIN"])
DRAFT_GRACE_SECONDS = 60


def _as_utc(dt: datetime) -> datetime:
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)


def _parse_answers_json(raw: object) -> dict:
    if isinstance(raw, dict):
        return dict(raw)
    try:
        parsed = json.loads(str(raw or "{}"))
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def _build_timing_fields(started_at: datetime, duration_minutes: int) -> dict:
    started_utc = _as_utc(started_at)
    deadline_utc = started_utc + timedelta(minutes=max(1, duration_minutes))
    remaining = max(0, int((deadline_utc - datetime.now(timezone.utc)).total_seconds()))
    return {
        "durationMinutes": duration_minutes,
        "deadlineAt": deadline_utc.isoformat(),
        "remainingSeconds": remaining,
    }


class CreateAttemptPayload(BaseModel):
    tenantId: str
    assessmentId: str
    rosterRecordId: str

class SaveDraftPayload(BaseModel):
    answers: dict

class SubmitAttemptPayload(BaseModel):
    idempotencyKey: str | None = None
    answers: dict | None = None

class AssessmentCreate(BaseModel):
    title: str = Field(..., min_length=3)
    subject: str = Field(..., min_length=2)
    subjectCode: str | None = None
    gradeLevel: int = Field(default=9, ge=1, le=11)
    quarter: int = Field(default=1, ge=1, le=4)
    academicYear: str = Field(default="2025-2026")
    assessmentType: str = Field(default="CHSB")
    durationMinutes: int = Field(default=40, ge=10, le=180)
    totalQuestions: int = Field(default=15, ge=1, le=100)
    maxScore: float = Field(default=40.0, ge=1.0)
    targetGroup: str = Field(default="all")
    code: str | None = None
    answerKey: dict | str | None = None
    questions: list[dict] | None = None


def _parse_answer_key_map(raw_key: dict | str | None) -> dict[int, str]:
    def _norm(val: object) -> str:
        s = str(val or "A").strip().lower()
        if s.startswith("opt-"):
            return s
        if s in {"a", "b", "c", "d", "e"}:
            return f"opt-{s}"
        return "opt-a"

    out: dict[int, str] = {}
    if isinstance(raw_key, dict):
        for k, v in raw_key.items():
            try:
                out[int(k)] = _norm(v)
            except (TypeError, ValueError):
                continue
    elif isinstance(raw_key, str) and raw_key.strip():
        pairs = re.findall(r"(\d{1,3})\s*[-:. ]\s*([A-Ea-e])\b", raw_key)
        if pairs:
            for num_s, let in pairs:
                out[int(num_s)] = _norm(let)
        else:
            letters = re.findall(r"\b([A-Ea-e])\b", raw_key)
            for idx, let in enumerate(letters, 1):
                out[idx] = _norm(let)
    return out


def _parse_json_value(raw: object, default):
    if raw is None:
        return default
    if isinstance(raw, (dict, list)):
        return raw
    try:
        return json.loads(str(raw))
    except Exception:
        return default


def _format_assessment_summary(a) -> dict:
    has_pdf = bool(getattr(a, "sourcePdfName", None) or getattr(a, "sourcePdfData", None))
    return {
        "id": a.id,
        "code": a.code,
        "title": a.title,
        "subject": a.subject,
        "subjectCode": getattr(a, "subjectCode", None),
        "gradeLevel": a.gradeLevel,
        "quarter": getattr(a, "quarter", 1) or 1,
        "academicYear": getattr(a, "academicYear", "2025-2026") or "2025-2026",
        "assessmentType": getattr(a, "assessmentType", "CHSB") or "CHSB",
        "durationMinutes": a.durationMinutes,
        "totalQuestions": a.totalQuestions,
        "maxScore": a.maxScore,
        "targetGroup": getattr(a, "targetGroup", "all") or "all",
        "hasPdf": has_pdf,
        "sourcePdfName": getattr(a, "sourcePdfName", None),
        "sourcePdfSize": getattr(a, "sourcePdfSize", None),
        "sourcePdfUrl": f"/api/v1/assessments/{a.id}/pdf" if has_pdf else None,
        "status": "published",
    }

@router.get("/assessments")
async def get_assessments(
    tenantId: str | None = None,
    group: str | None = None,
    assessmentType: str | None = None,
    quarter: int | None = None,
    _actor: Actor = Depends(get_current_actor),
    db: Prisma = Depends(get_prisma),
):
    where_clause: dict = {}
    if group and group != "all":
        where_clause["OR"] = [
            {"targetGroup": "all"},
            {"targetGroup": group},
            {"targetGroup": None},
        ]
    if assessmentType:
        where_clause["assessmentType"] = assessmentType.upper()
    if quarter is not None:
        where_clause["quarter"] = quarter
    assessments = await db.assessment.find_many(
        where=where_clause if where_clause else None,
        order={"code": "asc"}
    )
    return [_format_assessment_summary(a) for a in assessments]

@router.post("/assessments")
async def create_assessment(
    payload: AssessmentCreate,
    _actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    asm_type = payload.assessmentType.upper() if payload.assessmentType else "CHSB"
    if asm_type not in {"CHSB", "BSB", "PRACTICAL", "PROJECT"}:
        raise HTTPException(status_code=400, detail="Noto'g'ri baholash turi (CHSB, BSB, PRACTICAL, PROJECT).")

    # Generate unique code if not provided
    code = payload.code
    if not code:
        subject_prefix = (payload.subjectCode or payload.subject)[:3].upper().replace(" ", "")
        code = f"{asm_type}-{subject_prefix}-{payload.gradeLevel}-Q{payload.quarter}-{int(datetime.now().timestamp()) % 10000}"

    existing = await db.assessment.find_unique(where={"code": code})
    if existing:
        return _format_assessment_summary(existing)

    assessment_id = f"asm-{code.lower()}"

    created = await db.assessment.create(
        data={
            "id": assessment_id,
            "code": code,
            "title": payload.title,
            "subject": payload.subject,
            "subjectCode": payload.subjectCode,
            "gradeLevel": payload.gradeLevel,
            "quarter": payload.quarter,
            "academicYear": payload.academicYear,
            "assessmentType": asm_type,
            "durationMinutes": payload.durationMinutes,
            "totalQuestions": payload.totalQuestions if not payload.questions else len(payload.questions),
            "maxScore": payload.maxScore,
            "targetGroup": payload.targetGroup,
        }
    )

    # Seed questions: custom questions if provided, otherwise default template
    points_per_q = round(payload.maxScore / max(1, payload.totalQuestions), 1)
    bloom_cycle = ["KNOWLEDGE", "COMPREHENSION", "APPLICATION", "ANALYSIS"]
    if payload.questions and len(payload.questions) > 0:
        for idx, q_data in enumerate(payload.questions, 1):
            opts = q_data.get("options", [
                {"id": "opt-a", "label": "A", "text": "A variant"},
                {"id": "opt-b", "label": "B", "text": "B variant"},
                {"id": "opt-c", "label": "C", "text": "C variant"},
                {"id": "opt-d", "label": "D", "text": "D variant"},
            ])
            correct_opt = q_data.get("correctOptionId", "opt-a")
            prompt = q_data.get("prompt") or q_data.get("text") or f"{idx}-savol"
            bloom = q_data.get("bloomLevel") or q_data.get("cognitiveLevel") or bloom_cycle[(idx - 1) % len(bloom_cycle)]
            pts = float(q_data.get("points", points_per_q))
            task_type = str(q_data.get("taskType") or ("BSB_OPEN_TASK" if asm_type == "BSB" and not q_data.get("options") else "MCQ_SINGLE"))
            sub_questions = q_data.get("subQuestions")
            rubric = q_data.get("rubric")
            await db.question.create(
                data={
                    "id": f"q-{created.id}-{idx}",
                    "assessmentId": created.id,
                    "questionNumber": idx,
                    "prompt": prompt,
                    "taskType": task_type,
                    "optionsJson": json.dumps(opts),
                    "subQuestionsJson": json.dumps(sub_questions) if sub_questions is not None else "[]",
                    "rubricJson": json.dumps(rubric) if rubric is not None else "[]",
                    "correctOptionId": correct_opt,
                    "bloomLevel": bloom,
                    "difficulty": str(q_data.get("difficulty") or "medium"),
                    "points": pts,
                }
            )
    else:
        key_map = _parse_answer_key_map(payload.answerKey)
        is_open_bsb = asm_type in {"BSB", "PRACTICAL", "PROJECT"}
        for i in range(1, payload.totalQuestions + 1):
            bloom = bloom_cycle[(i - 1) % len(bloom_cycle)]
            if is_open_bsb:
                await db.question.create(
                    data={
                        "id": f"q-{created.id}-{i}",
                        "assessmentId": created.id,
                        "questionNumber": i,
                        "prompt": f"{i}-topshiriq",
                        "taskType": "BSB_OPEN_TASK",
                        "optionsJson": "[]",
                        "subQuestionsJson": "[]",
                        "rubricJson": "[]",
                        "correctOptionId": "",
                        "bloomLevel": bloom,
                        "difficulty": "medium",
                        "points": points_per_q,
                    }
                )
            else:
                options = [
                    {"id": "opt-a", "label": "A", "text": "A"},
                    {"id": "opt-b", "label": "B", "text": "B"},
                    {"id": "opt-c", "label": "C", "text": "C"},
                    {"id": "opt-d", "label": "D", "text": "D"},
                ]
                await db.question.create(
                    data={
                        "id": f"q-{created.id}-{i}",
                        "assessmentId": created.id,
                        "questionNumber": i,
                        "prompt": f"{i}-savol",
                        "taskType": "MCQ_SINGLE",
                        "optionsJson": json.dumps(options),
                        "correctOptionId": key_map.get(i, "opt-a"),
                        "bloomLevel": bloom,
                        "difficulty": "hard" if i > 10 else "medium" if i > 5 else "easy",
                        "points": points_per_q,
                    }
                )

    return _format_assessment_summary(created)


MAX_PDF_BYTES = 15 * 1024 * 1024


@router.post("/assessments/{assessment_id}/pdf")
async def upload_assessment_pdf(
    assessment_id: str,
    file: UploadFile = File(...),
    _actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    assessment = await db.assessment.find_first(
        where={
            "OR": [
                {"id": assessment_id},
                {"code": assessment_id},
                {"code": assessment_id.upper()},
                {"code": assessment_id.lower()},
            ]
        }
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Baholash topilmadi.")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="PDF fayl bo'sh.")
    if len(file_bytes) > MAX_PDF_BYTES:
        raise HTTPException(status_code=400, detail="PDF hajmi 15 MB dan oshmasligi kerak.")
    if b"%PDF-" not in file_bytes[:1024]:
        raise HTTPException(status_code=400, detail="Faqat haqiqiy PDF fayl yuklash mumkin.")

    raw_name = (file.filename or "imtihon.pdf").strip()
    safe_name = re.sub(r"[^A-Za-z0-9._-]+", "_", raw_name) or "imtihon.pdf"
    if not safe_name.lower().endswith(".pdf"):
        safe_name += ".pdf"

    updated = await db.assessment.update(
        where={"id": assessment.id},
        data={
            "sourcePdfData": Base64.encode(file_bytes),
            "sourcePdfName": safe_name,
            "sourcePdfSize": len(file_bytes),
        },
    )
    return _format_assessment_summary(updated)


@router.get("/assessments/{assessment_id}/pdf")
async def get_assessment_pdf(
    assessment_id: str,
    _actor: Actor = Depends(get_current_actor),
    db: Prisma = Depends(get_prisma),
):
    assessment = await db.assessment.find_first(
        where={
            "OR": [
                {"id": assessment_id},
                {"code": assessment_id},
                {"code": assessment_id.upper()},
                {"code": assessment_id.lower()},
            ]
        }
    )
    if not assessment or not getattr(assessment, "sourcePdfData", None):
        raise HTTPException(status_code=404, detail="Ushbu imtihon uchun PDF fayl biriktirilmagan.")

    raw_pdf = assessment.sourcePdfData
    pdf_bytes = raw_pdf.decode() if hasattr(raw_pdf, "decode") else bytes(raw_pdf)
    safe_name = getattr(assessment, "sourcePdfName", None) or f"{assessment.code}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{safe_name}"',
            "Cache-Control": "private, max-age=300",
        },
    )

class QuestionUpdate(BaseModel):
    prompt: str | None = None
    taskType: str | None = None
    options: list[dict] | None = None
    subQuestions: list[dict] | None = None
    rubric: dict | list | None = None
    correctOptionId: str | None = None
    points: float | None = None
    bloomLevel: str | None = None

@router.put("/assessments/{assessment_id}/questions/{question_id}")
async def update_question(
    assessment_id: str,
    question_id: str,
    payload: QuestionUpdate,
    _actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    update_data = {}
    if payload.prompt is not None:
        update_data["prompt"] = payload.prompt
    if payload.taskType is not None:
        update_data["taskType"] = payload.taskType
    if payload.options is not None:
        update_data["optionsJson"] = json.dumps(payload.options)
    if payload.subQuestions is not None:
        update_data["subQuestionsJson"] = json.dumps(payload.subQuestions)
    if payload.rubric is not None:
        update_data["rubricJson"] = json.dumps(payload.rubric)
    if payload.correctOptionId is not None:
        update_data["correctOptionId"] = payload.correctOptionId
    if payload.points is not None:
        update_data["points"] = payload.points
    if payload.bloomLevel is not None:
        update_data["bloomLevel"] = payload.bloomLevel

    updated = await db.question.update(
        where={"id": question_id},
        data=update_data,
    )
    return {"success": True, "id": updated.id, "prompt": updated.prompt}

@router.get("/assessments/{assessment_id}")
async def get_assessment_by_id(
    assessment_id: str,
    actor: Actor = Depends(get_current_actor),
    db: Prisma = Depends(get_prisma),
):
    assessment = await db.assessment.find_first(
        where={
            "OR": [
                {"id": assessment_id},
                {"code": assessment_id},
                {"code": assessment_id.upper()},
                {"code": assessment_id.lower()},
            ]
        },
        include={"questions": True},
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Baholash testi topilmadi.")

    questions = sorted(assessment.questions, key=lambda q: q.questionNumber)
    formatted_questions = []
    for q in questions:
        options = _parse_json_value(q.optionsJson, [])
        sub_questions = _parse_json_value(getattr(q, "subQuestionsJson", None), None)
        rubric = _parse_json_value(getattr(q, "rubricJson", None), None)
        item = {
            "id": q.id,
            "order": q.questionNumber,
            "text": q.prompt,
            "taskType": getattr(q, "taskType", "MCQ_SINGLE") or "MCQ_SINGLE",
            "options": options,
            "points": q.points,
            "cognitiveLevel": q.bloomLevel,
        }
        if sub_questions is not None:
            item["subQuestions"] = sub_questions
        if rubric is not None:
            item["rubric"] = rubric
        # Zero Answer Key Invariant: never expose correctOptionId to students
        if not actor.is_student:
            item["correctOptionId"] = q.correctOptionId
        formatted_questions.append(item)

    has_pdf = bool(getattr(assessment, "sourcePdfName", None) or getattr(assessment, "sourcePdfData", None))
    return {
        "id": assessment.id,
        "code": assessment.code,
        "title": assessment.title,
        "subject": assessment.subject,
        "subjectCode": getattr(assessment, "subjectCode", None),
        "gradeLevel": assessment.gradeLevel,
        "quarter": getattr(assessment, "quarter", 1) or 1,
        "academicYear": getattr(assessment, "academicYear", "2025-2026") or "2025-2026",
        "assessmentType": getattr(assessment, "assessmentType", "CHSB") or "CHSB",
        "durationMinutes": assessment.durationMinutes,
        "totalQuestions": assessment.totalQuestions,
        "maxScore": assessment.maxScore,
        "targetGroup": getattr(assessment, "targetGroup", "all") or "all",
        "hasPdf": has_pdf,
        "sourcePdfName": getattr(assessment, "sourcePdfName", None),
        "sourcePdfSize": getattr(assessment, "sourcePdfSize", None),
        "sourcePdfUrl": f"/api/v1/assessments/{assessment.id}/pdf" if has_pdf else None,
        "questions": formatted_questions,
    }


@router.get("/assessments/{assessment_id}/stats")
async def get_assessment_stats(
    assessment_id: str,
    tenantId: str | None = None,
    actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    assessment = await db.assessment.find_first(
        where={
            "OR": [
                {"id": assessment_id},
                {"code": assessment_id},
                {"code": assessment_id.upper()},
                {"code": assessment_id.lower()},
            ]
        },
        include={"questions": True},
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Baholash testi topilmadi.")

    effective_tenant_id = actor.tenant_id if not actor.is_regional else (tenantId or actor.tenant_id)
    if not actor.is_regional and tenantId:
        t = await resolve_tenant_for_actor(tenantId, actor, db)
        effective_tenant_id = t.id

    eligible_students = await db.student.find_many(
        where={
            "tenantId": effective_tenant_id,
            "status": "ELIGIBLE",
            "classGroup": {"gradeLevel": assessment.gradeLevel},
        },
    )
    target_grp = getattr(assessment, "targetGroup", "all") or "all"
    if target_grp != "all":
        assigned_students = [s for s in eligible_students if s.group == target_grp]
    else:
        assigned_students = eligible_students

    attempts = await db.assessmentattempt.find_many(
        where={
            "assessmentId": assessment.id,
            "status": "submitted",
            "student": {"tenantId": effective_tenant_id},
        },
        include={"result": True},
    )

    scores = [att.result.score for att in attempts if att.result is not None]
    total_assigned = len(assigned_students)
    total_completed = len(attempts)
    completion_rate = round((total_completed / total_assigned) * 100) if total_assigned > 0 else 0
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    bloom_short = {"KNOWLEDGE": "(B)", "COMPREHENSION": "(B)", "APPLICATION": "(Q)", "ANALYSIS": "(M)"}
    mcq_types = {"MCQ_SINGLE", "MULTIPLE_CHOICE", "MCQ"}
    questions = sorted(assessment.questions, key=lambda q: q.questionNumber)
    q_stats = []
    parsed_attempts = [_parse_answers_json(att.answersJson) for att in attempts]

    for q in questions:
        task_type = (getattr(q, "taskType", None) or "MCQ_SINGLE").upper()
        total_q = len(parsed_attempts)
        correct_q = 0
        if task_type in mcq_types and total_q > 0:
            for ans_map in parsed_attempts:
                sel = ans_map.get(q.id) or ans_map.get(str(q.questionNumber))
                if sel == q.correctOptionId:
                    correct_q += 1
        correct_rate = round((correct_q / total_q) * 100, 1) if total_q > 0 else 0.0
        q_stats.append({
            "order": q.questionNumber,
            "cognitiveLevel": bloom_short.get((q.bloomLevel or "KNOWLEDGE").upper(), "(B)"),
            "points": q.points,
            "correctRate": correct_rate,
        })

    return {
        "assessmentId": assessment.id,
        "totalAssigned": total_assigned,
        "totalCompleted": total_completed,
        "completionRate": completion_rate,
        "averageScore": avg_score,
        "questionStats": q_stats,
    }

@router.post("/attempts")
async def create_attempt(
    payload: CreateAttemptPayload,
    actor: Actor = Depends(get_current_actor),
    db: Prisma = Depends(get_prisma),
):
    # Find student by id or rosterRecordId
    student = await db.student.find_first(
        where={
            "OR": [
                {"id": payload.rosterRecordId},
                {"rosterCode": payload.rosterRecordId},
            ]
        }
    )
    if not student:
        raise HTTPException(status_code=404, detail="O'quvchi topilmadi.")
    if actor.is_student and student.id != actor.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Boshqa o'quvchi nomidan imtihon boshlash taqiqlangan.")
    assert_tenant_ownership(student.tenantId, actor)

    # Find assessment (support id or case-insensitive code)
    assessment = await db.assessment.find_first(
        where={
            "OR": [
                {"id": payload.assessmentId},
                {"code": payload.assessmentId},
                {"code": payload.assessmentId.upper()},
                {"code": payload.assessmentId.lower()},
            ]
        }
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Baholash testi topilmadi.")

    # Check targetGroup restriction if set
    target_grp = getattr(assessment, "targetGroup", "all") or "all"
    if target_grp != "all":
        student_grp = getattr(student, "group", None)
        if student_grp and student_grp != target_grp:
            raise HTTPException(
                status_code=403,
                detail=f"Ushbu imtihon faqat {target_grp} uchun mo'ljallangan. Sizning guruhingiz: {student_grp}."
            )

    # Check existing attempt
    existing = await db.assessmentattempt.find_first(
        where={
            "assessmentId": assessment.id,
            "studentId": student.id,
        }
    )
    if existing:
        timing = _build_timing_fields(existing.startedAt, assessment.durationMinutes)
        return {
            "id": existing.id,
            "assessmentId": assessment.id,
            "rosterRecordId": student.id,
            "startedAt": _as_utc(existing.startedAt).isoformat(),
            "status": existing.status,
            "answers": _parse_answers_json(existing.answersJson),
            **timing,
        }

    attempt = await db.assessmentattempt.create(
        data={
            "assessmentId": assessment.id,
            "studentId": student.id,
            "answersJson": json.dumps({}),
            "status": "in_progress",
        }
    )
    timing = _build_timing_fields(attempt.startedAt, assessment.durationMinutes)

    return {
        "id": attempt.id,
        "assessmentId": assessment.id,
        "rosterRecordId": student.id,
        "startedAt": _as_utc(attempt.startedAt).isoformat(),
        "status": attempt.status,
        "answers": {},
        **timing,
    }

@router.get("/attempts/{attempt_id}")
async def get_attempt(
    attempt_id: str,
    actor: Actor = Depends(get_current_actor),
    db: Prisma = Depends(get_prisma),
):
    attempt = await db.assessmentattempt.find_unique(
        where={"id": attempt_id},
        include={"student": True, "assessment": True},
    )
    if not attempt:
        raise HTTPException(status_code=404, detail="Test urinishi topilmadi.")
    if actor.is_student and attempt.studentId != actor.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Boshqa o'quvchi urinishini ko'rish taqiqlangan.")
    if attempt.student:
        assert_tenant_ownership(attempt.student.tenantId, actor)

    answers = _parse_answers_json(attempt.answersJson)
    duration_mins = attempt.assessment.durationMinutes if attempt.assessment else 40
    timing = _build_timing_fields(attempt.startedAt, duration_mins)

    return {
        "id": attempt.id,
        "assessmentId": attempt.assessmentId,
        "rosterRecordId": attempt.studentId,
        "startedAt": _as_utc(attempt.startedAt).isoformat(),
        "submittedAt": _as_utc(attempt.submittedAt).isoformat() if attempt.submittedAt else None,
        "status": attempt.status,
        "answers": answers,
        **timing,
    }

@router.post("/attempts/{attempt_id}/draft")
async def save_draft(
    attempt_id: str,
    payload: SaveDraftPayload,
    actor: Actor = Depends(get_current_actor),
    db: Prisma = Depends(get_prisma),
):
    attempt = await db.assessmentattempt.find_unique(
        where={"id": attempt_id},
        include={"student": True, "assessment": True},
    )
    if not attempt:
        raise HTTPException(status_code=404, detail="Test urinishi topilmadi.")
    if actor.is_student and attempt.studentId != actor.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Boshqa o'quvchi javoblarini o'zgartirish taqiqlangan.")
    if attempt.student:
        assert_tenant_ownership(attempt.student.tenantId, actor)
    if attempt.status == "submitted":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Imtihon allaqachon topshirilgan.")

    duration_mins = attempt.assessment.durationMinutes if attempt.assessment else 40
    deadline_with_grace = _as_utc(attempt.startedAt) + timedelta(minutes=duration_mins, seconds=DRAFT_GRACE_SECONDS)
    if datetime.now(timezone.utc) > deadline_with_grace:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Imtihon vaqti tugagan. Qoralama saqlash yopildi.")

    existing_answers = _parse_answers_json(attempt.answersJson)
    merged_answers = {**existing_answers, **payload.answers}

    await db.assessmentattempt.update(
        where={"id": attempt_id},
        data={"answersJson": json.dumps(merged_answers)},
    )
    return {"success": True, "savedAt": datetime.now(timezone.utc).isoformat(), "answersCount": len(merged_answers)}

@router.post("/attempts/{attempt_id}/submit")
async def submit_attempt(
    attempt_id: str,
    payload: SubmitAttemptPayload | None = None,
    actor: Actor = Depends(get_current_actor),
    db: Prisma = Depends(get_prisma),
):
    attempt = await db.assessmentattempt.find_unique(
        where={"id": attempt_id},
        include={
            "assessment": {"include": {"questions": True}},
            "student": {"include": {"school": True}},
        },
    )
    if not attempt:
        raise HTTPException(status_code=404, detail="Test urinishi topilmadi.")
    if actor.is_student and attempt.studentId != actor.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Boshqa o'quvchi urinishini topshirish taqiqlangan.")
    if attempt.student:
        assert_tenant_ownership(attempt.student.tenantId, actor)

    existing_result = await db.assessmentresult.find_unique(where={"attemptId": attempt_id})
    if attempt.status == "submitted" and existing_result:
        return {
            "attemptId": attempt_id,
            "assessmentId": attempt.assessmentId,
            "studentId": attempt.studentId,
            "receiptNumber": f"RCP-{attempt_id[:8].upper()}",
            "submittedAt": _as_utc(existing_result.submittedAt).isoformat(),
            "score": existing_result.score,
            "maxScore": existing_result.maxScore,
            "percentage": existing_result.percentage,
            "grade": existing_result.grade,
            "alreadySubmitted": True,
        }

    # Merge any offline-queued answers provided on submit with persisted draft answers
    answers = _parse_answers_json(attempt.answersJson)
    if payload and payload.answers:
        answers = {**answers, **payload.answers}

    total_score = 0.0
    has_open_tasks = False
    mcq_types = {"MCQ_SINGLE", "MULTIPLE_CHOICE", "MCQ"}
    for q in attempt.assessment.questions:
        task_type = (getattr(q, "taskType", None) or "MCQ_SINGLE").upper()
        is_mcq = task_type in mcq_types
        parsed_rubric = _parse_json_value(getattr(q, "rubricJson", None), [])
        if (not is_mcq) or (isinstance(parsed_rubric, (list, dict)) and len(parsed_rubric) > 0):
            has_open_tasks = True
        selected_id = answers.get(q.id) or answers.get(str(q.questionNumber))
        if is_mcq and selected_id == q.correctOptionId:
            total_score += q.points

    asm_type = getattr(attempt.assessment, "assessmentType", "CHSB") or "CHSB"
    needs_review = has_open_tasks or asm_type == "BSB"
    result_status = "pending_review" if needs_review else "verified"
    verified_flag = not needs_review

    max_score = attempt.assessment.maxScore
    pct = round((total_score / max_score) * 100, 1) if max_score > 0 else 0
    school_preset = (
        getattr(attempt.student.school, "gradingPreset", None)
        if attempt.student and attempt.student.school
        else None
    ) or "MMTV_STANDARD"
    grade = calculate_grade5(pct, preset=school_preset)

    now = datetime.now(timezone.utc)
    elapsed_seconds = int((now - _as_utc(attempt.startedAt)).total_seconds())
    max_duration_seconds = max(60, attempt.assessment.durationMinutes * 60)
    time_spent = max(0, min(elapsed_seconds, max_duration_seconds))

    await db.assessmentattempt.update(
        where={"id": attempt_id},
        data={
            "answersJson": json.dumps(answers),
            "status": "submitted",
            "submittedAt": now,
            "timeSpentSeconds": time_spent,
        },
    )

    if not existing_result:
        await db.assessmentresult.create(
            data={
                "attemptId": attempt_id,
                "studentId": attempt.studentId,
                "score": total_score,
                "maxScore": max_score,
                "percentage": pct,
                "grade": grade,
                "status": result_status,
                "verifiedByTeacher": verified_flag,
                "submittedAt": now,
            }
        )

    return {
        "attemptId": attempt_id,
        "assessmentId": attempt.assessmentId,
        "studentId": attempt.studentId,
        "receiptNumber": f"RCP-{attempt_id[:8].upper()}",
        "submittedAt": now.isoformat(),
        "score": total_score,
        "maxScore": max_score,
        "percentage": pct,
        "grade": grade,
        "status": result_status,
        "verifiedByTeacher": verified_flag,
        "alreadySubmitted": False,
    }


def _format_result_row(r) -> dict:
    asm = r.attempt.assessment if r.attempt else None
    return {
        "id": r.id,
        "attemptId": r.attemptId,
        "assessmentId": r.attempt.assessmentId if r.attempt else "",
        "assessmentTitle": asm.title if asm else "CHSB Baholash",
        "assessmentType": getattr(asm, "assessmentType", "CHSB") if asm else "CHSB",
        "quarter": getattr(asm, "quarter", 1) if asm else 1,
        "studentId": r.studentId,
        "rosterCode": r.student.rosterCode if r.student else "",
        "studentName": f"{r.student.firstName} {r.student.lastName}",
        "className": r.student.classGroup.name if r.student.classGroup else "",
        "score": r.score,
        "maxScore": r.maxScore,
        "percentage": r.percentage,
        "grade": r.grade,
        "status": r.status,
        "verifiedByTeacher": bool(getattr(r, "verifiedByTeacher", False)),
        "rubricScores": _parse_json_value(getattr(r, "rubricScoresJson", None), {}),
        "answers": _parse_json_value(getattr(r.attempt, "answersJson", None), {}) if r.attempt else {},
        "absenceReason": getattr(r.attempt, "absenceReason", None) if r.attempt else None,
        "teacherFeedback": getattr(r, "teacherFeedback", None) or "",
        "gradedBy": getattr(r, "gradedBy", None),
        "gradedAt": _as_utc(r.gradedAt).isoformat() if getattr(r, "gradedAt", None) else None,
        "submittedAt": _as_utc(r.submittedAt).isoformat(),
    }


class GradeResultPayload(BaseModel):
    score: float = Field(..., ge=0.0)
    rubricScores: dict | None = None
    feedback: str | None = None
    verifiedByTeacher: bool = True


class AbsencePayload(BaseModel):
    reason: str = Field(..., min_length=2)


class ReopenPayload(BaseModel):
    resetTimer: bool = True


@router.get("/results/attempt/{attempt_id}")
async def get_result_by_attempt(
    attempt_id: str,
    actor: Actor = Depends(get_current_actor),
    db: Prisma = Depends(get_prisma),
):
    result = await db.assessmentresult.find_unique(
        where={"attemptId": attempt_id},
        include={
            "student": {"include": {"classGroup": True}},
            "attempt": {"include": {"assessment": True}},
        },
    )
    if not result:
        raise HTTPException(status_code=404, detail="Natija topilmadi.")
    if actor.is_student and result.studentId != actor.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Boshqa o'quvchi natijasini ko'rish taqiqlangan.")
    if result.student:
        assert_tenant_ownership(result.student.tenantId, actor)

    return _format_result_row(result)


@router.get("/results/tenant/{tenant_id}")
async def get_results_by_tenant(
    tenant_id: str,
    actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    tenant = await resolve_tenant_for_actor(tenant_id, actor, db)
    results = await db.assessmentresult.find_many(
        where={"student": {"tenantId": tenant.id}},
        include={
            "student": {"include": {"classGroup": True}},
            "attempt": {"include": {"assessment": True}},
        },
        order={"submittedAt": "desc"},
    )
    return [_format_result_row(r) for r in results]


@router.patch("/assessments/results/{attempt_id}/grade")
async def grade_assessment_result(
    attempt_id: str,
    payload: GradeResultPayload,
    actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    result = await db.assessmentresult.find_unique(
        where={"attemptId": attempt_id},
        include={
            "student": {"include": {"school": True, "classGroup": True}},
            "attempt": {"include": {"assessment": True}},
        },
    )
    if not result:
        raise HTTPException(status_code=404, detail="Baholanadigan natija topilmadi.")
    if result.student:
        assert_tenant_ownership(result.student.tenantId, actor)

    if payload.score > result.maxScore:
        raise HTTPException(status_code=400, detail=f"Ball maksimal balldan ({result.maxScore}) oshib ketdi.")

    pct = round((payload.score / result.maxScore) * 100, 1) if result.maxScore > 0 else 0.0
    school_preset = (
        getattr(result.student.school, "gradingPreset", None)
        if result.student and result.student.school
        else None
    ) or "MMTV_STANDARD"
    grade = calculate_grade5(pct, preset=school_preset)
    now = datetime.now(timezone.utc)

    update_data: dict = {
        "score": round(payload.score, 2),
        "percentage": pct,
        "grade": grade,
        "verifiedByTeacher": payload.verifiedByTeacher,
        "status": "verified" if payload.verifiedByTeacher else "pending_review",
        "gradedBy": actor.id,
        "gradedAt": now,
    }
    if payload.rubricScores is not None:
        update_data["rubricScoresJson"] = json.dumps(payload.rubricScores)
    if payload.feedback is not None:
        update_data["teacherFeedback"] = payload.feedback

    updated = await db.assessmentresult.update(
        where={"id": result.id},
        data=update_data,
        include={
            "student": {"include": {"classGroup": True}},
            "attempt": {"include": {"assessment": True}},
        },
    )
    return _format_result_row(updated)


@router.post("/assessments/attempts/{attempt_id}/absence")
async def mark_attempt_absent(
    attempt_id: str,
    payload: AbsencePayload,
    actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    attempt = await db.assessmentattempt.find_unique(
        where={"id": attempt_id},
        include={"student": True},
    )
    if not attempt:
        raise HTTPException(status_code=404, detail="Urinish topilmadi.")
    if attempt.student:
        assert_tenant_ownership(attempt.student.tenantId, actor)

    reason = payload.reason.upper()
    if reason not in {"EXCUSED", "UNEXCUSED", "ILLNESS"}:
        raise HTTPException(status_code=400, detail="Sabab EXCUSED, UNEXCUSED yoki ILLNESS bo'lishi kerak.")

    updated = await db.assessmentattempt.update(
        where={"id": attempt_id},
        data={
            "status": "absent",
            "absenceReason": reason,
        },
    )
    return {
        "attemptId": updated.id,
        "status": updated.status,
        "absenceReason": updated.absenceReason,
    }


@router.post("/assessments/attempts/{attempt_id}/reopen")
async def reopen_attempt(
    attempt_id: str,
    payload: ReopenPayload | None = None,
    actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    attempt = await db.assessmentattempt.find_unique(
        where={"id": attempt_id},
        include={"student": True},
    )
    if not attempt:
        raise HTTPException(status_code=404, detail="Urinish topilmadi.")
    if attempt.student:
        assert_tenant_ownership(attempt.student.tenantId, actor)

    now = datetime.now(timezone.utc)
    update_data: dict = {
        "status": "in_progress",
        "reopenedBy": actor.id,
        "reopenedAt": now,
        "absenceReason": "none",
        "submittedAt": None,
    }
    if not payload or payload.resetTimer:
        update_data["startedAt"] = now

    updated = await db.assessmentattempt.update(
        where={"id": attempt_id},
        data=update_data,
    )
    return {
        "attemptId": updated.id,
        "status": updated.status,
        "reopenedBy": updated.reopenedBy,
        "reopenedAt": _as_utc(updated.reopenedAt).isoformat() if updated.reopenedAt else None,
        "startedAt": _as_utc(updated.startedAt).isoformat(),
    }

