from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from datetime import datetime, timedelta, timezone
import json
from backend.app.core.dependencies import (
    Actor,
    assert_tenant_ownership,
    get_current_actor,
    require_role,
    resolve_tenant_for_actor,
)
from backend.app.db.prisma import get_prisma
from prisma import Prisma

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
    gradeLevel: int = Field(default=9, ge=1, le=11)
    quarter: int = Field(default=1, ge=1, le=4)
    durationMinutes: int = Field(default=40, ge=10, le=180)
    totalQuestions: int = Field(default=15, ge=1, le=100)
    maxScore: float = Field(default=40.0, ge=1.0)
    targetGroup: str = Field(default="all")
    code: str | None = None
    questions: list[dict] | None = None

@router.get("/assessments")
async def get_assessments(
    tenantId: str | None = None,
    group: str | None = None,
    _actor: Actor = Depends(get_current_actor),
    db: Prisma = Depends(get_prisma),
):
    where_clause = {}
    if group and group != "all":
        where_clause = {
            "OR": [
                {"targetGroup": "all"},
                {"targetGroup": group},
                {"targetGroup": None},
            ]
        }
    assessments = await db.assessment.find_many(
        where=where_clause if where_clause else None,
        order={"code": "asc"}
    )
    return [
        {
            "id": a.id,
            "code": a.code,
            "title": a.title,
            "subject": a.subject,
            "gradeLevel": a.gradeLevel,
            "durationMinutes": a.durationMinutes,
            "totalQuestions": a.totalQuestions,
            "maxScore": a.maxScore,
            "targetGroup": getattr(a, "targetGroup", "all") or "all",
            "status": "published",
        }
        for a in assessments
    ]

@router.post("/assessments")
async def create_assessment(
    payload: AssessmentCreate,
    _actor: Actor = Depends(STAFF_ACCESS),
    db: Prisma = Depends(get_prisma),
):
    # Generate unique code if not provided
    code = payload.code
    if not code:
        subject_prefix = payload.subject[:3].upper().replace(" ", "")
        code = f"CHSB-{subject_prefix}-{payload.gradeLevel}-Q{payload.quarter}-{int(datetime.now().timestamp()) % 10000}"

    existing = await db.assessment.find_unique(where={"code": code})
    if existing:
        return {
            "id": existing.id,
            "code": existing.code,
            "title": existing.title,
            "subject": existing.subject,
            "gradeLevel": existing.gradeLevel,
            "durationMinutes": existing.durationMinutes,
            "totalQuestions": existing.totalQuestions,
            "maxScore": existing.maxScore,
            "targetGroup": getattr(existing, "targetGroup", "all") or "all",
            "status": "published",
        }

    assessment_id = f"asm-{code.lower()}"

    created = await db.assessment.create(
        data={
            "id": assessment_id,
            "code": code,
            "title": payload.title,
            "subject": payload.subject,
            "gradeLevel": payload.gradeLevel,
            "durationMinutes": payload.durationMinutes,
            "totalQuestions": payload.totalQuestions,
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
            await db.question.create(
                data={
                    "id": f"q-{created.id}-{idx}",
                    "assessmentId": created.id,
                    "questionNumber": idx,
                    "prompt": prompt,
                    "optionsJson": json.dumps(opts),
                    "correctOptionId": correct_opt,
                    "bloomLevel": bloom,
                    "difficulty": "medium",
                    "points": pts,
                }
            )
    else:
        for i in range(1, payload.totalQuestions + 1):
            bloom = bloom_cycle[(i - 1) % len(bloom_cycle)]
            options = [
                {"id": "opt-a", "label": "A", "text": f"{payload.subject} fani bo'yicha to'g'ri javob varianti"},
                {"id": "opt-b", "label": "B", "text": "Noto'g'ri chalg'ituvchi variant 1"},
                {"id": "opt-c", "label": "C", "text": "Noto'g'ri chalg'ituvchi variant 2"},
                {"id": "opt-d", "label": "D", "text": "Noto'g'ri chalg'ituvchi variant 3"},
            ]
            await db.question.create(
                data={
                    "id": f"q-{created.id}-{i}",
                    "assessmentId": created.id,
                    "questionNumber": i,
                    "prompt": f"{i}-savol: {payload.subject} {payload.gradeLevel}-sinf uchun test topshirig'i.",
                    "optionsJson": json.dumps(options),
                    "correctOptionId": "opt-a",
                    "bloomLevel": bloom,
                    "difficulty": "hard" if i > 10 else "medium" if i > 5 else "easy",
                    "points": points_per_q,
                }
            )

    return {
        "id": created.id,
        "code": created.code,
        "title": created.title,
        "subject": created.subject,
        "gradeLevel": created.gradeLevel,
        "durationMinutes": created.durationMinutes,
        "totalQuestions": payload.totalQuestions if not payload.questions else len(payload.questions),
        "maxScore": created.maxScore,
        "status": "published",
    }

class QuestionUpdate(BaseModel):
    prompt: str | None = None
    options: list[dict] | None = None
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
    if payload.options is not None:
        update_data["optionsJson"] = json.dumps(payload.options)
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
        options = q.optionsJson if isinstance(q.optionsJson, list) else json.loads(str(q.optionsJson or "[]"))
        item = {
            "id": q.id,
            "order": q.questionNumber,
            "text": q.prompt,
            "options": options,
            "points": q.points,
            "cognitiveLevel": q.bloomLevel,
        }
        # Zero Answer Key Invariant: never expose correctOptionId to students
        if not actor.is_student:
            item["correctOptionId"] = q.correctOptionId
        formatted_questions.append(item)

    return {
        "id": assessment.id,
        "code": assessment.code,
        "title": assessment.title,
        "subject": assessment.subject,
        "gradeLevel": assessment.gradeLevel,
        "durationMinutes": assessment.durationMinutes,
        "totalQuestions": assessment.totalQuestions,
        "maxScore": assessment.maxScore,
        "targetGroup": getattr(assessment, "targetGroup", "all") or "all",
        "questions": formatted_questions,
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
        include={"assessment": {"include": {"questions": True}}, "student": True},
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
    for q in attempt.assessment.questions:
        selected_id = answers.get(q.id) or answers.get(str(q.questionNumber))
        if selected_id == q.correctOptionId:
            total_score += q.points

    max_score = attempt.assessment.maxScore
    pct = round((total_score / max_score) * 100, 1) if max_score > 0 else 0
    grade = "5" if pct >= 86 else ("4" if pct >= 71 else ("3" if pct >= 56 else "2"))

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
                "status": "verified",
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
        "alreadySubmitted": False,
    }

@router.get("/results/attempt/{attempt_id}")
async def get_result_by_attempt(
    attempt_id: str,
    actor: Actor = Depends(get_current_actor),
    db: Prisma = Depends(get_prisma),
):
    result = await db.assessmentresult.find_unique(
        where={"attemptId": attempt_id},
        include={"student": {"include": {"classGroup": True}}},
    )
    if not result:
        raise HTTPException(status_code=404, detail="Natija topilmadi.")
    if actor.is_student and result.studentId != actor.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Boshqa o'quvchi natijasini ko'rish taqiqlangan.")
    if result.student:
        assert_tenant_ownership(result.student.tenantId, actor)

    return {
        "id": result.id,
        "attemptId": result.attemptId,
        "studentId": result.studentId,
        "studentName": f"{result.student.firstName} {result.student.lastName}",
        "className": result.student.classGroup.name if result.student.classGroup else "",
        "score": result.score,
        "maxScore": result.maxScore,
        "percentage": result.percentage,
        "grade": result.grade,
        "status": result.status,
        "submittedAt": result.submittedAt.isoformat(),
    }

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
    return [
        {
            "id": r.id,
            "attemptId": r.attemptId,
            "assessmentId": r.attempt.assessmentId if r.attempt else "",
            "assessmentTitle": r.attempt.assessment.title if (r.attempt and r.attempt.assessment) else "CHSB Baholash",
            "studentId": r.studentId,
            "studentName": f"{r.student.firstName} {r.student.lastName}",
            "className": r.student.classGroup.name if r.student.classGroup else "",
            "score": r.score,
            "maxScore": r.maxScore,
            "percentage": r.percentage,
            "grade": r.grade,
            "status": r.status,
            "submittedAt": r.submittedAt.isoformat(),
        }
        for r in results
    ]

