"""
Assessments, attempts, answers and grading.
"""
from __future__ import annotations

import json
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.core.permissions import TEACHER, ensure_tenant_access
from backend.app.models import Assessment, AssessmentAttempt, AssessmentResult, AttemptAnswer, Question, Student, User
from backend.app.models.base import utcnow  # re-exported for the router
from backend.app.schemas.assessment import AssessmentCreate, QuestionUpdate

BLOOM_CYCLE = ["KNOWLEDGE", "COMPREHENSION", "APPLICATION", "ANALYSIS"]
DEFAULT_OPTIONS = [{"id": f"opt-{x.lower()}", "label": x, "text": f"{x} variant"} for x in "ABCD"]


def serialize_summary(a: Assessment) -> dict:
    return {
        "id": a.id,
        "code": a.code,
        "title": a.title,
        "subject": a.subject,
        "gradeLevel": a.grade_level,
        "durationMinutes": a.duration_minutes,
        "totalQuestions": a.total_questions,
        "maxScore": a.max_score,
        "targetGroup": a.target_group or "all",
        "status": a.status,
    }


async def find_assessment(db: AsyncSession, ref: str, *, with_questions: bool = False) -> Assessment | None:
    """Find by id or code (codes are matched regardless of case)."""
    query = (
        select(Assessment)
        .where(or_(Assessment.id == ref, func.lower(Assessment.code) == ref.lower()))
        .order_by((Assessment.id == ref).desc())
        .limit(1)
    )
    if with_questions:
        query = query.options(selectinload(Assessment.questions))
    return await db.scalar(query)


def _template_questions(payload: AssessmentCreate, points: float) -> list[dict]:
    items = []
    for number in range(1, payload.totalQuestions + 1):
        items.append({
            "prompt": f"{number}-savol: {payload.subject} {payload.gradeLevel}-sinf uchun test topshirig'i.",
            "options": [
                {"id": "opt-a", "label": "A", "text": f"{payload.subject} fani bo'yicha to'g'ri javob varianti"},
                {"id": "opt-b", "label": "B", "text": "Noto'g'ri chalg'ituvchi variant 1"},
                {"id": "opt-c", "label": "C", "text": "Noto'g'ri chalg'ituvchi variant 2"},
                {"id": "opt-d", "label": "D", "text": "Noto'g'ri chalg'ituvchi variant 3"},
            ],
            "difficulty": "hard" if number > 10 else "medium" if number > 5 else "easy",
            "points": points,
        })
    return items


async def create_assessment(db: AsyncSession, user: User, payload: AssessmentCreate) -> tuple[Assessment, bool]:
    """Create an assessment for the user's school. Returns (assessment, was_created)."""
    code = payload.code
    if not code:
        prefix = payload.subject[:3].upper().replace(" ", "")
        code = f"CHSB-{prefix}-{payload.gradeLevel}-Q{payload.quarter}-{int(datetime.now().timestamp()) % 10000}"

    existing = await db.scalar(select(Assessment).where(Assessment.code == code))
    if existing:
        if existing.tenant_id != user.tenant_id:
            raise HTTPException(status_code=409, detail="Bu kod band. Boshqa kod tanlang.")
        return existing, False

    custom = payload.questions or []
    assessment = Assessment(
        id=f"asm-{code.lower()}",
        tenant_id=user.tenant_id,
        created_by=user.id,
        code=code,
        title=payload.title,
        subject=payload.subject,
        grade_level=payload.gradeLevel,
        duration_minutes=payload.durationMinutes,
        total_questions=len(custom) or payload.totalQuestions,
        max_score=payload.maxScore,
        target_group=payload.targetGroup,
    )
    db.add(assessment)
    await db.flush()

    points = round(payload.maxScore / max(1, payload.totalQuestions), 1)
    for number, data in enumerate(custom or _template_questions(payload, points), 1):
        try:
            question_points = float(data.get("points", points))
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail=f"{number}-savol balli noto'g'ri.") from None
        db.add(Question(
            id=f"q-{assessment.id}-{number}",
            assessment_id=assessment.id,
            question_number=number,
            prompt=data.get("prompt") or data.get("text") or f"{number}-savol",
            options_json=json.dumps(data.get("options") or DEFAULT_OPTIONS),
            correct_option_id=data.get("correctOptionId") or "opt-a",
            bloom_level=data.get("bloomLevel") or data.get("cognitiveLevel") or BLOOM_CYCLE[(number - 1) % 4],
            difficulty=data.get("difficulty") or "medium",
            points=question_points,
        ))
    await db.flush()
    return assessment, True


async def update_question(
    db: AsyncSession, user: User, assessment_ref: str, question_id: str, payload: QuestionUpdate
) -> Question:
    question = await db.get(Question, question_id)
    assessment = await db.get(Assessment, question.assessment_id) if question else None
    if not assessment or assessment_ref.lower() not in (assessment.id.lower(), assessment.code.lower()):
        raise HTTPException(status_code=404, detail="Savol topilmadi.")
    ensure_tenant_access(user, assessment.tenant_id, "Savol topilmadi.")
    if user.role == TEACHER and assessment.created_by != user.id:
        raise HTTPException(status_code=403, detail="Faqat o'zingiz yaratgan testni tahrirlashingiz mumkin.")

    changes = {
        "prompt": payload.prompt,
        "options_json": json.dumps(payload.options) if payload.options is not None else None,
        "correct_option_id": payload.correctOptionId,
        "points": payload.points,
        "bloom_level": payload.bloomLevel,
    }
    for field, value in changes.items():
        if value is not None:
            setattr(question, field, value)
    return question


async def get_owned_attempt(db: AsyncSession, user: User, attempt_id: str, *, lock: bool = False) -> AssessmentAttempt:
    """Load an attempt, hiding attempts of students from other tenants."""
    query = select(AssessmentAttempt).where(AssessmentAttempt.id == attempt_id)
    if lock:
        # Serialises concurrent saves and submits of one attempt
        query = query.with_for_update()
    attempt = await db.scalar(query)
    student = await db.get(Student, attempt.student_id) if attempt else None
    if not attempt or not student:
        raise HTTPException(status_code=404, detail="Test urinishi topilmadi.")
    ensure_tenant_access(user, student.tenant_id, "Test urinishi topilmadi.")
    return attempt


async def load_answers(db: AsyncSession, attempt_id: str) -> dict[str, str]:
    rows = await db.execute(
        select(AttemptAnswer.question_id, AttemptAnswer.option_id).where(AttemptAnswer.attempt_id == attempt_id)
    )
    return dict(rows.all())


async def serialize_attempt(db: AsyncSession, attempt: AssessmentAttempt) -> dict:
    return {
        "id": attempt.id,
        "assessmentId": attempt.assessment_id,
        "rosterRecordId": attempt.student_id,
        "startedAt": attempt.started_at.isoformat(),
        "submittedAt": attempt.submitted_at.isoformat() if attempt.submitted_at else None,
        "status": attempt.status,
        "answers": await load_answers(db, attempt.id),
    }


async def save_answers(db: AsyncSession, attempt: AssessmentAttempt, answers: dict) -> None:
    """Add or change the given answers. Answers that are not mentioned stay as they are."""
    if attempt.status != "in_progress":
        raise HTTPException(status_code=409, detail="Topshirilgan imtihon javoblarini o'zgartirib bo'lmaydi.")

    rows = await db.execute(
        select(Question.id, Question.question_number).where(Question.assessment_id == attempt.assessment_id)
    )
    lookup: dict[str, str] = {}
    ids = []
    for question_id, number in rows:
        lookup[str(number)] = question_id
        ids.append(question_id)
    lookup.update({question_id: question_id for question_id in ids})

    values = {}
    for key, option in answers.items():
        question_id = lookup.get(str(key))
        if question_id and isinstance(option, str) and 0 < len(option) <= 100:
            values[question_id] = option
    if not values:
        return

    statement = insert(AttemptAnswer).values(
        [{"attempt_id": attempt.id, "question_id": q, "option_id": o} for q, o in values.items()]
    )
    await db.execute(
        statement.on_conflict_do_update(
            index_elements=["attempt_id", "question_id"],
            set_={"option_id": statement.excluded.option_id, "updated_at": utcnow()},
        )
    )


def grade_for(percentage: float) -> str:
    if percentage >= 86:
        return "5"
    if percentage >= 71:
        return "4"
    if percentage >= 56:
        return "3"
    return "2"


async def submit(db: AsyncSession, attempt: AssessmentAttempt) -> AssessmentResult:
    """Grade and lock the attempt. Submitting again returns the first result unchanged."""
    result = await db.scalar(select(AssessmentResult).where(AssessmentResult.attempt_id == attempt.id))
    if result:
        return result

    assessment = await db.scalar(
        select(Assessment).options(selectinload(Assessment.questions)).where(Assessment.id == attempt.assessment_id)
    )
    answers = await load_answers(db, attempt.id)
    score = sum(q.points for q in assessment.questions if answers.get(q.id) == q.correct_option_id)
    percentage = round((score / assessment.max_score) * 100, 1) if assessment.max_score > 0 else 0

    now = utcnow()
    attempt.status = "submitted"
    attempt.submitted_at = now
    result = AssessmentResult(
        attempt_id=attempt.id,
        student_id=attempt.student_id,
        score=score,
        max_score=assessment.max_score,
        percentage=percentage,
        grade=grade_for(percentage),
        status="verified",
        submitted_at=now,
    )
    db.add(result)
    await db.flush()
    return result
