from fastapi import APIRouter, Depends, HTTPException, status
from backend.app.core.security import (
    verify_password,
    create_access_token,
    BLOCKED_PASSWORDS,
    STUDENT_TOKEN,
)
from backend.app.core.permissions import school_staff, resolve_tenant
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

def build_user_profile(user, tenant) -> UserProfile:
    return UserProfile(
        id=user.id,
        tenantId=user.tenantId,
        tenantSlug=tenant.slug if tenant else None,
        schoolName=tenant.name if tenant else None,
        username=user.username,
        fullName=user.fullName,
        role=user.role,
        email=user.email,
    )

@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, db: Prisma = Depends(get_prisma)):
    user = await db.user.find_unique(where={"username": payload.username})
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

    if payload.password in BLOCKED_PASSWORDS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Standart parol bloklangan. Administrator yangi parol o'rnatishi kerak.",
        )

    tenant = await db.tenant.find_unique(where={"id": user.tenantId})

    access_token = create_access_token(
        subject=user.username,
        role=user.role,
        tenant_id=user.tenantId,
    )

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=build_user_profile(user, tenant),
    )

@router.get("/me", response_model=UserProfile)
async def get_me(current_user=Depends(get_current_user), db: Prisma = Depends(get_prisma)):
    tenant = await db.tenant.find_unique(where={"id": current_user.tenantId})
    return build_user_profile(current_user, tenant)

@router.post("/admission/verify", response_model=AdmissionVerifyResponse)
async def verify_admission(
    payload: AdmissionVerifyRequest,
    db: Prisma = Depends(get_prisma),
    current_user=Depends(school_staff),
):
    # Student self-admission is switched off until exam sessions with access codes exist.
    # A roster code alone is guessable, so only school staff may call this.
    # 1. Lookup tenant
    tenant = await db.tenant.find_unique(where={"slug": payload.tenantSlug})
    if not tenant or (current_user.role != "SUPER_ADMIN" and tenant.id != current_user.tenantId):
        return AdmissionVerifyResponse(
            success=False,
            message="Bunday ta'lim muassasasi topilmadi.",
        )

    # 2. Lookup student by roster code in this tenant
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

    # Generate session token for exam attempt
    exam_session_token = create_access_token(
        subject=student.rosterCode,
        role="STUDENT",
        tenant_id=tenant.id,
        token_type=STUDENT_TOKEN,
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
            ]
        }
    )
    assessment_ids = [a.code.lower() for a in assessments] if assessments else ["chsb-inf-11-q1"]

    return AdmissionVerifyResponse(
        success=True,
        sessionToken=exam_session_token,
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

@router.post("/logout", dependencies=[Depends(get_current_user)])
async def logout():
    return {"success": True, "message": "Tizimdan muvaffaqiyatli chiqildi."}

