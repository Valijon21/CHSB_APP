from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import or_, select
from sqlalchemy.orm import joinedload

from backend.app.core.dependencies import DbSession
from backend.app.core.permissions import StaffUser, ensure_tenant_access, resolve_tenant
from backend.app.models import Assessment, AssessmentAttempt, AssessmentResult, Student
from backend.app.schemas.assessment import (
    AssessmentCreate,
    CreateAttemptPayload,
    QuestionUpdate,
    SaveDraftPayload,
    SubmitAttemptPayload,
)
from backend.app.services import assessments as service
from backend.app.services import audit

router = APIRouter(tags=["Assessments"])


@router.get("/assessments")
async def get_assessments(
    db: DbSession, current_user: StaffUser, tenantId: str | None = None, group: str | None = None
):
    tenant = await resolve_tenant(db, current_user, tenantId)
    query = select(Assessment).where(Assessment.tenant_id == tenant.id).order_by(Assessment.code)
    if group and group != "all":
        query = query.where(or_(Assessment.target_group.in_(["all", group]), Assessment.target_group.is_(None)))
    return [service.serialize_summary(a) for a in await db.scalars(query)]


@router.post("/assessments")
async def create_assessment(payload: AssessmentCreate, request: Request, db: DbSession, current_user: StaffUser):
    assessment, created = await service.create_assessment(db, current_user, payload)
    if created:
        audit.record(db, request, "assessment.created", user=current_user, details={"code": assessment.code})
        await db.commit()
    return service.serialize_summary(assessment)


@router.put("/assessments/{assessment_id}/questions/{question_id}")
async def update_question(
    assessment_id: str,
    question_id: str,
    payload: QuestionUpdate,
    request: Request,
    db: DbSession,
    current_user: StaffUser,
):
    question = await service.update_question(db, current_user, assessment_id, question_id, payload)
    audit.record(
        db, request, "assessment.question_updated", user=current_user,
        details={"questionId": question.id, "fields": sorted(payload.model_dump(exclude_none=True))},
    )
    await db.commit()
    return {"success": True, "id": question.id, "prompt": question.prompt}


@router.get("/assessments/{assessment_id}")
async def get_assessment_by_id(assessment_id: str, db: DbSession, current_user: StaffUser):
    assessment = await service.find_assessment(db, assessment_id, with_questions=True)
    if not assessment:
        raise HTTPException(status_code=404, detail="Baholash testi topilmadi.")
    ensure_tenant_access(current_user, assessment.tenant_id, "Baholash testi topilmadi.")

    return {
        **service.serialize_summary(assessment),
        "questions": [
            {
                "id": q.id,
                "order": q.question_number,
                "text": q.prompt,
                "options": json.loads(q.options_json or "[]"),
                "points": q.points,
                "cognitiveLevel": q.bloom_level,
                "correctOptionId": q.correct_option_id,
            }
            for q in assessment.questions
        ],
    }


@router.post("/attempts")
async def create_attempt(payload: CreateAttemptPayload, db: DbSession, current_user: StaffUser):
    reference = payload.rosterRecordId
    student = await db.scalar(
        select(Student)
        .where(or_(Student.id == reference, Student.roster_code == reference))
        # Locking the student prevents two parallel requests from creating two attempts
        .with_for_update()
        .limit(1)
    )
    if not student:
        raise HTTPException(status_code=404, detail="O'quvchi topilmadi.")
    ensure_tenant_access(current_user, student.tenant_id, "O'quvchi topilmadi.")

    assessment = await service.find_assessment(db, payload.assessmentId)
    if not assessment or assessment.tenant_id != student.tenant_id:
        raise HTTPException(status_code=404, detail="Baholash testi topilmadi.")

    target = assessment.target_group or "all"
    if target != "all" and student.group and student.group != target:
        raise HTTPException(
            status_code=403,
            detail=f"Ushbu imtihon faqat {target} uchun mo'ljallangan. Sizning guruhingiz: {student.group}.",
        )

    attempt = await db.scalar(
        select(AssessmentAttempt)
        .where(AssessmentAttempt.assessment_id == assessment.id, AssessmentAttempt.student_id == student.id)
        .order_by(AssessmentAttempt.started_at)
        .limit(1)
    )
    if not attempt:
        attempt = AssessmentAttempt(assessment_id=assessment.id, student_id=student.id, status="in_progress")
        db.add(attempt)
        await db.commit()
    return await service.serialize_attempt(db, attempt)


@router.get("/attempts/{attempt_id}")
async def get_attempt(attempt_id: str, db: DbSession, current_user: StaffUser):
    attempt = await service.get_owned_attempt(db, current_user, attempt_id)
    return await service.serialize_attempt(db, attempt)


@router.post("/attempts/{attempt_id}/draft")
async def save_draft(attempt_id: str, payload: SaveDraftPayload, db: DbSession, current_user: StaffUser):
    attempt = await service.get_owned_attempt(db, current_user, attempt_id, lock=True)
    await service.save_answers(db, attempt, payload.answers)
    await db.commit()
    return {"success": True, "savedAt": service.utcnow().isoformat()}


@router.post("/attempts/{attempt_id}/submit")
async def submit_attempt(
    attempt_id: str,
    request: Request,
    db: DbSession,
    current_user: StaffUser,
    payload: SubmitAttemptPayload | None = None,
):
    attempt = await service.get_owned_attempt(db, current_user, attempt_id, lock=True)
    first_time = attempt.status == "in_progress"
    result = await service.submit(db, attempt)
    if first_time:
        audit.record(db, request, "attempt.submitted", user=current_user, details={"attemptId": attempt_id})
    await db.commit()
    return {
        "attemptId": attempt_id,
        "receiptNumber": f"RCP-{attempt_id[:8].upper()}",
        "submittedAt": result.submitted_at.isoformat(),
        "score": result.score,
        "maxScore": result.max_score,
        "percentage": result.percentage,
        "grade": result.grade,
    }


def serialize_result(result: AssessmentResult) -> dict:
    student = result.student
    return {
        "id": result.id,
        "attemptId": result.attempt_id,
        "studentId": result.student_id,
        "studentName": f"{student.first_name} {student.last_name}",
        "className": student.class_group.name,
        "score": result.score,
        "maxScore": result.max_score,
        "percentage": result.percentage,
        "grade": result.grade,
        "status": result.status,
        "submittedAt": result.submitted_at.isoformat(),
    }


@router.get("/results/attempt/{attempt_id}")
async def get_result_by_attempt(attempt_id: str, db: DbSession, current_user: StaffUser):
    result = await db.scalar(
        select(AssessmentResult)
        .options(joinedload(AssessmentResult.student).joinedload(Student.class_group))
        .where(AssessmentResult.attempt_id == attempt_id)
    )
    if not result:
        raise HTTPException(status_code=404, detail="Natija topilmadi.")
    ensure_tenant_access(current_user, result.student.tenant_id, "Natija topilmadi.")
    return serialize_result(result)


@router.get("/results/tenant/{tenant_id}")
async def get_results_by_tenant(tenant_id: str, db: DbSession, current_user: StaffUser):
    tenant = await resolve_tenant(db, current_user, tenant_id)
    results = await db.scalars(
        select(AssessmentResult)
        .join(AssessmentResult.student)
        .options(
            joinedload(AssessmentResult.student).joinedload(Student.class_group),
            joinedload(AssessmentResult.attempt).joinedload(AssessmentAttempt.assessment),
        )
        .where(Student.tenant_id == tenant.id)
        .order_by(AssessmentResult.submitted_at.desc())
    )
    return [
        {
            **serialize_result(r),
            "assessmentId": r.attempt.assessment_id,
            "assessmentTitle": r.attempt.assessment.title,
        }
        for r in results
    ]
