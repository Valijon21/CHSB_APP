from fastapi import APIRouter, Depends, HTTPException, status
from backend.app.core.security import verify_password, create_access_token
from backend.app.core.dependencies import get_current_user
from backend.app.db.prisma import get_prisma
from backend.app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    UserProfile,
    AdmissionVerifyRequest,
    AdmissionVerifyResponse,
)
from prisma import Prisma

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, db: Prisma = Depends(get_prisma)):
    user = await db.user.find_first(
        where={
            "OR": [
                {"username": payload.username},
                {"email": payload.username},
            ]
        },
        include={"tenant": True},
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Foydalanuvchi nomi yoki parol noto'g'ri.",
        )

    if not verify_password(payload.password, user.hashedPassword):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Foydalanuvchi nomi yoki parol noto'g'ri.",
        )

    if not user.isActive:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ushbu akkaunt faol emas. Administratorga murojaat qiling.",
        )

    access_token = create_access_token(
        subject=user.username,
        role=user.role,
        tenant_id=user.tenantId,
    )

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserProfile(
            id=user.id,
            tenantId=user.tenantId,
            tenantSlug=user.tenant.slug if user.tenant else None,
            schoolName=user.tenant.name if user.tenant else None,
            username=user.username,
            fullName=user.fullName,
            role=user.role,
            email=user.email,
        ),
    )


@router.get("/me", response_model=UserProfile)
async def get_me(
    current_user=Depends(get_current_user),
    db: Prisma = Depends(get_prisma),
):
    tenant = await db.tenant.find_unique(where={"id": current_user.tenantId})
    return UserProfile(
        id=current_user.id,
        tenantId=current_user.tenantId,
        tenantSlug=tenant.slug if tenant else None,
        schoolName=tenant.name if tenant else None,
        username=current_user.username,
        fullName=current_user.fullName,
        role=current_user.role,
        email=current_user.email,
    )


@router.post("/admission/verify", response_model=AdmissionVerifyResponse)
async def verify_admission(payload: AdmissionVerifyRequest, db: Prisma = Depends(get_prisma)):
    tenant = await db.tenant.find_unique(where={"slug": payload.tenantSlug})
    if not tenant:
        return AdmissionVerifyResponse(
            success=False,
            message="Bunday ta'lim muassasasi topilmadi.",
        )

    student = await db.student.find_first(
        where={
            "tenantId": tenant.id,
            "rosterCode": payload.rosterCode.upper().strip(),
        },
        include={"classGroup": True},
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

    exam_session_token = create_access_token(
        subject=student.rosterCode,
        role="STUDENT",
        tenant_id=tenant.id,
    )

    student_group = student.group
    class_display = (
        f"{student.classGroup.name} ({student_group})"
        if student.classGroup and student_group
        else (student.classGroup.name if student.classGroup else "Noma'lum sinf")
    )

    grade = student.classGroup.gradeLevel if student.classGroup else 11
    assessments = await db.assessment.find_many(
        where={
            "gradeLevel": grade,
            "OR": [
                {"targetGroup": "all"},
                {"targetGroup": student_group},
                {"targetGroup": None},
            ],
        }
    )
    assessment_ids = [a.code.lower() for a in assessments] if assessments else ["chsb-inf-11-q1"]

    return AdmissionVerifyResponse(
        success=True,
        sessionToken=exam_session_token,
        schoolName=tenant.name,
        student={
            "id": student.id,
            "rosterCode": student.rosterCode,
            "firstName": student.firstName,
            "lastName": student.lastName,
            "middleName": student.middleName,
            "className": class_display,
            "classGroupId": student.classGroupId,
            "group": student_group,
            "emaktabId": student.emaktabId,
            "status": "eligible",
        },
        availableAssessmentIds=assessment_ids,
        message="O'quvchi muvaffaqiyatli tasdiqlandi. Imtihon zali tayyor.",
    )


@router.post("/logout")
async def logout():
    return {"success": True, "message": "Tizimdan muvaffaqiyatli chiqildi."}
