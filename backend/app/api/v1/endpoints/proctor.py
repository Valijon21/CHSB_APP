import json
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from backend.app.core.dependencies import (
    STAFF_ROLES,
    Actor,
    assert_tenant_ownership,
    get_current_actor,
    require_role,
    resolve_tenant_for_actor,
)
from backend.app.db.prisma import get_prisma
from backend.app.services.grading import calculate_grade5
from prisma import Prisma

router = APIRouter(prefix="/proctor", tags=["Proctoring"])
STAFF_ACCESS = require_role(STAFF_ROLES)


def _as_utc(dt: datetime) -> datetime:
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)


def _parse_json(raw: object, default):
    if isinstance(raw, (dict, list)):
        return raw
    try:
        return json.loads(str(raw or "{}"))
    except Exception:
        return default


class ProctorEventPayload(BaseModel):
    eventType: str = Field(..., min_length=2)
    severity: str = Field(default="info")
    message: str | None = None
    currentQuestion: int | None = None
    answeredCount: int | None = None


class ProctorActionInput(BaseModel):
    action: str = Field(..., pattern="^(grant_time|send_warning|force_submit)$")
    extraSeconds: int | None = Field(default=None, ge=60, le=3600)
    warningMessage: str | None = None
    reason: str = Field(default="Nazoratchi qarori")


@router.post("/attempts/{attempt_id}/event")
async def record_proctor_event(
    attempt_id: str,
    payload: ProctorEventPayload,
    actor: Actor = Depends(get_current_actor),
    db: Prisma = Depends(get_prisma),
):
    attempt = await db.assessmentattempt.find_unique(
        where={"id": attempt_id},
        include={"student": True},
    )
    if not attempt:
        raise HTTPException(status_code=404, detail="Test urinishi topilmadi.")
    if actor.is_student and attempt.studentId != actor.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Boshqa o'quvchi urinishi uchun hodisa yuborib bo'lmaydi.")
    if attempt.student:
        assert_tenant_ownership(attempt.student.tenantId, actor)

    extra = {}
    if payload.currentQuestion is not None:
        extra["currentQuestion"] = payload.currentQuestion
    if payload.answeredCount is not None:
        extra["answeredCount"] = payload.answeredCount

    saved = await db.proctorevent.create(
        data={
            "attemptId": attempt_id,
            "studentId": attempt.studentId,
            "eventType": payload.eventType,
            "severity": payload.severity,
            "message": payload.message,
            "extraData": json.dumps(extra) if extra else None,
        }
    )

    recent_teacher_actions = await db.proctorevent.find_many(
        where={
            "attemptId": attempt_id,
            "eventType": {"in": ["teacher_send_warning", "teacher_grant_time", "teacher_force_submit"]},
        },
        order={"createdAt": "desc"},
        take=5,
    )

    return {
        "ok": True,
        "eventId": saved.id,
        "status": attempt.status,
        "pendingActions": [
            {
                "id": ev.id,
                "action": ev.eventType.replace("teacher_", ""),
                "message": ev.message,
                "extra": _parse_json(ev.extraData, {}),
                "createdAt": _as_utc(ev.createdAt).isoformat(),
            }
            for ev in recent_teacher_actions
        ],
    }


@router.get("/assessments/{assessment_id}/live-sessions")
async def get_live_sessions(
    assessment_id: str,
    tenantId: str | None = Query(default=None),
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
        }
    )
    if not assessment:
        return {"sessions": [], "events": []}

    effective_tenant_id = actor.tenant_id
    if tenantId:
        t = await resolve_tenant_for_actor(tenantId, actor, db)
        effective_tenant_id = t.id

    attempts = await db.assessmentattempt.find_many(
        where={
            "assessmentId": assessment.id,
            "student": {"tenantId": effective_tenant_id},
        },
        include={
            "student": {"include": {"classGroup": True}},
            "proctorEvents": {"orderBy": {"createdAt": "desc"}, "take": 30},
        },
        order={"startedAt": "desc"},
    )

    now = datetime.now(timezone.utc)
    sessions = []
    events = []
    violation_types = {"tab_hidden", "window_blur", "fullscreen_exit", "violation"}

    for att in attempts:
        stu = att.student
        if not stu:
            continue
        answers = _parse_json(att.answersJson, {})
        ev_list = att.proctorEvents or []
        violations = sum(1 for e in ev_list if e.eventType in violation_types)

        last_ev = ev_list[0] if ev_list else None
        last_extra = _parse_json(last_ev.extraData, {}) if last_ev else {}
        last_active = _as_utc(last_ev.createdAt) if last_ev else _as_utc(att.startedAt)

        deadline = _as_utc(att.startedAt) + timedelta(minutes=max(1, assessment.durationMinutes))
        remaining = max(0, int((deadline - now).total_seconds())) if att.status == "in_progress" else 0

        seconds_since_active = (now - last_active).total_seconds()
        if att.status == "submitted":
            live_status = "submitted"
        elif seconds_since_active > 120:
            live_status = "offline"
        elif violations > 0:
            live_status = "warning"
        elif seconds_since_active > 45:
            live_status = "idle"
        else:
            live_status = "active"

        student_name = f"{stu.firstName} {stu.lastName}"
        sessions.append({
            "attemptId": att.id,
            "rosterRecordId": stu.id,
            "studentName": student_name,
            "className": stu.classGroup.name if stu.classGroup else "",
            "currentQuestion": int(last_extra.get("currentQuestion") or max(1, len(answers))),
            "totalQuestions": assessment.totalQuestions,
            "answeredCount": len(answers),
            "remainingSeconds": remaining,
            "status": live_status,
            "violationsCount": violations,
            "lastActiveAt": last_active.isoformat(),
        })

        for ev in ev_list:
            if ev.eventType == "heartbeat":
                continue
            ev_type = "warning" if ev.eventType in violation_types or ev.eventType == "teacher_send_warning" else "action"
            sev = "danger" if ev.eventType == "teacher_force_submit" else "warning" if ev_type == "warning" else "info"
            events.append({
                "id": ev.id,
                "studentName": student_name,
                "type": ev_type,
                "message": ev.message or ev.eventType,
                "severity": sev,
                "timestamp": _as_utc(ev.createdAt).isoformat(),
            })

    events.sort(key=lambda x: x["timestamp"], reverse=True)
    return {"sessions": sessions, "events": events[:50]}


@router.post("/attempts/{attempt_id}/action")
async def perform_proctor_action(
    attempt_id: str,
    payload: ProctorActionInput,
    actor: Actor = Depends(STAFF_ACCESS),
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
    if attempt.student:
        assert_tenant_ownership(attempt.student.tenantId, actor)

    now = datetime.now(timezone.utc)
    extra = {
        "reason": payload.reason,
        "extraSeconds": payload.extraSeconds,
        "warningMessage": payload.warningMessage,
        "actorId": actor.id,
    }

    if payload.action == "grant_time":
        extra_sec = payload.extraSeconds or 300
        new_started = _as_utc(attempt.startedAt) + timedelta(seconds=extra_sec)
        await db.assessmentattempt.update(
            where={"id": attempt_id},
            data={"startedAt": min(now, new_started)},
        )
        msg = f"O'qituvchi tomonidan +{round(extra_sec / 60)} daqiqa vaqt qo'shildi ({payload.reason})"
        sev = "info"

    elif payload.action == "send_warning":
        warn_text = payload.warningMessage or payload.reason
        msg = f'O\'qituvchi ogohlantirish yubordi: "{warn_text}"'
        sev = "warning"

    else:  # force_submit
        answers = _parse_json(attempt.answersJson, {})
        total_score = 0.0
        mcq_types = {"MCQ_SINGLE", "MULTIPLE_CHOICE", "MCQ"}
        if attempt.assessment and attempt.assessment.questions:
            for q in attempt.assessment.questions:
                task_type = (getattr(q, "taskType", None) or "MCQ_SINGLE").upper()
                selected = answers.get(q.id) or answers.get(str(q.questionNumber))
                if task_type in mcq_types and selected == q.correctOptionId:
                    total_score += q.points

        max_score = attempt.assessment.maxScore if attempt.assessment else 40.0
        pct = round((total_score / max_score) * 100, 1) if max_score > 0 else 0.0
        preset = (
            getattr(attempt.student.school, "gradingPreset", None)
            if attempt.student and attempt.student.school
            else None
        ) or "MMTV_STANDARD"
        grade = calculate_grade5(pct, preset=preset)

        await db.assessmentattempt.update(
            where={"id": attempt_id},
            data={"status": "submitted", "submittedAt": now},
        )
        existing_res = await db.assessmentresult.find_unique(where={"attemptId": attempt_id})
        if not existing_res:
            await db.assessmentresult.create(
                data={
                    "attemptId": attempt_id,
                    "studentId": attempt.studentId,
                    "score": total_score,
                    "maxScore": max_score,
                    "percentage": pct,
                    "grade": grade,
                    "status": "verified",
                    "verifiedByTeacher": True,
                    "submittedAt": now,
                }
            )
        msg = f"Imtihon majburiy yakunlandi: {payload.reason}"
        sev = "high"

    ev = await db.proctorevent.create(
        data={
            "attemptId": attempt_id,
            "studentId": attempt.studentId,
            "eventType": f"teacher_{payload.action}",
            "severity": sev,
            "message": msg,
            "extraData": json.dumps(extra),
        }
    )

    return {
        "ok": True,
        "eventId": ev.id,
        "action": payload.action,
        "attemptId": attempt_id,
        "message": msg,
    }
