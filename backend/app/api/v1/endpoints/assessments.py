from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from datetime import datetime
import json
from backend.app.db.prisma import get_prisma
from prisma import Prisma

router = APIRouter(tags=["Assessments"])

class CreateAttemptPayload(BaseModel):
    tenantId: str
    assessmentId: str
    rosterRecordId: str

class SaveDraftPayload(BaseModel):
    answers: dict

class SubmitAttemptPayload(BaseModel):
    idempotencyKey: str | None = None

@router.get("/assessments")
async def get_assessments(tenantId: str | None = None, db: Prisma = Depends(get_prisma)):
    assessments = await db.assessment.find_many(
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
            "status": "published",
        }
        for a in assessments
    ]

@router.get("/assessments/{assessment_id}")
async def get_assessment_by_id(assessment_id: str, db: Prisma = Depends(get_prisma)):
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
        formatted_questions.append({
            "id": q.id,
            "order": q.questionNumber,
            "text": q.prompt,
            "options": options,
            "points": q.points,
            "cognitiveLevel": q.bloomLevel,
            "correctOptionId": q.correctOptionId,
        })

    return {
        "id": assessment.id,
        "code": assessment.code,
        "title": assessment.title,
        "subject": assessment.subject,
        "gradeLevel": assessment.gradeLevel,
        "durationMinutes": assessment.durationMinutes,
        "totalQuestions": assessment.totalQuestions,
        "maxScore": assessment.maxScore,
        "questions": formatted_questions,
    }

@router.post("/attempts")
async def create_attempt(payload: CreateAttemptPayload, db: Prisma = Depends(get_prisma)):
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

    # Find assessment
    assessment = await db.assessment.find_first(
        where={
            "OR": [
                {"id": payload.assessmentId},
                {"code": payload.assessmentId},
            ]
        }
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Baholash testi topilmadi.")

    # Check existing attempt
    existing = await db.assessmentattempt.find_first(
        where={
            "assessmentId": assessment.id,
            "studentId": student.id,
        }
    )
    if existing:
        return {
            "id": existing.id,
            "assessmentId": assessment.id,
            "rosterRecordId": student.id,
            "startedAt": existing.startedAt.isoformat(),
            "status": existing.status,
            "answers": existing.answersJson if isinstance(existing.answersJson, dict) else json.loads(str(existing.answersJson or "{}")),
        }

    attempt = await db.assessmentattempt.create(
        data={
            "assessmentId": assessment.id,
            "studentId": student.id,
            "answersJson": json.dumps({}),
            "status": "in_progress",
        }
    )

    return {
        "id": attempt.id,
        "assessmentId": assessment.id,
        "rosterRecordId": student.id,
        "startedAt": attempt.startedAt.isoformat(),
        "status": attempt.status,
        "answers": {},
    }

@router.get("/attempts/{attempt_id}")
async def get_attempt(attempt_id: str, db: Prisma = Depends(get_prisma)):
    attempt = await db.assessmentattempt.find_unique(where={"id": attempt_id})
    if not attempt:
        raise HTTPException(status_code=404, detail="Test urinishi topilmadi.")

    answers = attempt.answersJson if isinstance(attempt.answersJson, dict) else json.loads(str(attempt.answersJson or "{}"))

    return {
        "id": attempt.id,
        "assessmentId": attempt.assessmentId,
        "rosterRecordId": attempt.studentId,
        "startedAt": attempt.startedAt.isoformat(),
        "submittedAt": attempt.submittedAt.isoformat() if attempt.submittedAt else None,
        "status": attempt.status,
        "answers": answers,
    }

@router.post("/attempts/{attempt_id}/draft")
async def save_draft(attempt_id: str, payload: SaveDraftPayload, db: Prisma = Depends(get_prisma)):
    attempt = await db.assessmentattempt.find_unique(where={"id": attempt_id})
    if not attempt:
        raise HTTPException(status_code=404, detail="Test urinishi topilmadi.")

    await db.assessmentattempt.update(
        where={"id": attempt_id},
        data={"answersJson": json.dumps(payload.answers)},
    )
    return {"success": True, "savedAt": datetime.now().isoformat()}

@router.post("/attempts/{attempt_id}/submit")
async def submit_attempt(attempt_id: str, payload: SubmitAttemptPayload | None = None, db: Prisma = Depends(get_prisma)):
    attempt = await db.assessmentattempt.find_unique(
        where={"id": attempt_id},
        include={"assessment": {"include": {"questions": True}}, "student": True},
    )
    if not attempt:
        raise HTTPException(status_code=404, detail="Test urinishi topilmadi.")

    # Calculate score
    answers = attempt.answersJson if isinstance(attempt.answersJson, dict) else json.loads(str(attempt.answersJson or "{}"))
    total_score = 0.0
    for q in attempt.assessment.questions:
        selected_id = answers.get(q.id) or answers.get(str(q.questionNumber))
        if selected_id == q.correctOptionId:
            total_score += q.points

    max_score = attempt.assessment.maxScore
    pct = round((total_score / max_score) * 100, 1) if max_score > 0 else 0
    grade = "5" if pct >= 86 else ("4" if pct >= 71 else ("3" if pct >= 56 else "2"))

    # Update attempt
    now = datetime.now()
    await db.assessmentattempt.update(
        where={"id": attempt_id},
        data={"status": "submitted", "submittedAt": now},
    )

    # Upsert result
    existing_result = await db.assessmentresult.find_unique(where={"attemptId": attempt_id})
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
        "receiptNumber": f"RCP-{attempt_id[:8].upper()}",
        "submittedAt": now.isoformat(),
        "score": total_score,
        "maxScore": max_score,
        "percentage": pct,
        "grade": grade,
    }

@router.get("/results/attempt/{attempt_id}")
async def get_result_by_attempt(attempt_id: str, db: Prisma = Depends(get_prisma)):
    result = await db.assessmentresult.find_unique(
        where={"attemptId": attempt_id},
        include={"student": {"include": {"classGroup": True}}},
    )
    if not result:
        raise HTTPException(status_code=404, detail="Natija topilmadi.")

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
async def get_results_by_tenant(tenant_id: str, db: Prisma = Depends(get_prisma)):
    results = await db.assessmentresult.find_many(
        where={
            "OR": [
                {"student": {"tenantId": tenant_id}},
                {"student": {"tenant": {"slug": tenant_id}}},
            ]
        },
        include={"student": {"include": {"classGroup": True}}},
        order={"submittedAt": "desc"},
    )
    return [
        {
            "id": r.id,
            "attemptId": r.attemptId,
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
