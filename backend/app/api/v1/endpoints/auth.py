from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy import or_, select
from sqlalchemy.orm import joinedload

from backend.app.core.dependencies import CurrentUser, DbSession, get_current_user
from backend.app.core.permissions import StaffUser, can_access_tenant
from backend.app.core.security import STUDENT_TOKEN, create_access_token
from backend.app.models import Assessment, Student, Tenant
from backend.app.schemas.auth import (
    AdmissionVerifyRequest,
    AdmissionVerifyResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    LoginRequest,
    LoginResponse,
    UserProfile,
)
from backend.app.services import auth as service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, request: Request, db: DbSession):
    user = await service.authenticate(db, request, payload.username, payload.password)
    return LoginResponse(
        access_token=service.issue_token(user),
        token_type="bearer",
        user=await service.build_profile(db, user),
    )


@router.get("/me", response_model=UserProfile)
async def get_me(db: DbSession, current_user: CurrentUser):
    return await service.build_profile(db, current_user)


@router.post("/change-password", response_model=ChangePasswordResponse)
async def change_password(
    payload: ChangePasswordRequest, request: Request, db: DbSession, current_user: CurrentUser
):
    token = await service.change_password(
        db, request, current_user, payload.currentPassword, payload.newPassword
    )
    return ChangePasswordResponse(access_token=token)


@router.post("/admission/verify", response_model=AdmissionVerifyResponse)
async def verify_admission(payload: AdmissionVerifyRequest, db: DbSession, current_user: StaffUser):
    # Student self-admission is switched off until exam sessions with access codes exist.
    # A roster code alone is guessable, so only school staff may call this.
    tenant = await db.scalar(select(Tenant).where(Tenant.slug == payload.tenantSlug))
    if not tenant or not can_access_tenant(current_user, tenant.id):
        return AdmissionVerifyResponse(success=False, message="Bunday ta'lim muassasasi topilmadi.")

    student = await db.scalar(
        select(Student)
        .options(joinedload(Student.class_group))
        .where(Student.tenant_id == tenant.id, Student.roster_code == payload.rosterCode.upper().strip())
    )
    if not student:
        return AdmissionVerifyResponse(
            success=False,
            message=f"'{payload.rosterCode}' kodli o'quvchi ushbu maktab ro'yxatida topilmadi.",
        )
    if student.status != "ELIGIBLE":
        return AdmissionVerifyResponse(
            success=False,
            message="O'quvchiga imtihonga kirish uchun ruxsat berilmagan (Holati: nofaol).",
        )

    session_token = create_access_token(
        subject=student.roster_code, role="STUDENT", tenant_id=tenant.id, token_type=STUDENT_TOKEN
    )
    class_name = student.class_group.name
    assessments = await db.scalars(
        select(Assessment).where(
            Assessment.tenant_id == tenant.id,
            Assessment.grade_level == student.class_group.grade_level,
            or_(
                Assessment.target_group.in_(["all", student.group] if student.group else ["all"]),
                Assessment.target_group.is_(None),
            ),
        )
    )
    assessment_ids = [a.code.lower() for a in assessments] or ["chsb-inf-11-q1"]

    return AdmissionVerifyResponse(
        success=True,
        sessionToken=session_token,
        student={
            "id": student.id,
            "rosterCode": student.roster_code,
            "firstName": student.first_name,
            "lastName": student.last_name,
            "middleName": student.middle_name,
            "className": f"{class_name} ({student.group})" if student.group else class_name,
            "classGroupId": student.class_group_id,
            "group": student.group,
            "emaktabId": student.emaktab_id,
            "status": "eligible",
        },
        availableAssessmentIds=assessment_ids,
        message="O'quvchi muvaffaqiyatli tasdiqlandi. Imtihon zali tayyor.",
    )


@router.post("/logout", dependencies=[Depends(get_current_user)])
async def logout():
    return {"success": True, "message": "Tizimdan muvaffaqiyatli chiqildi."}
