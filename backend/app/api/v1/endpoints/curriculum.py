from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from prisma import Prisma
from backend.app.db.prisma import get_prisma
from backend.app.core.permissions import school_staff, resolve_tenant
from backend.app.schemas.curriculum import CurriculumResourceResponse, AssessmentSolutionResponse

router = APIRouter(prefix="/curriculum", tags=["Curriculum & Materials Hub"])

@router.get("/resources", response_model=list[CurriculumResourceResponse])
async def list_curriculum_resources(
    gradeLevel: Optional[int] = Query(None, description="Sinf darajasi (5-11)"),
    quarter: Optional[int] = Query(None, description="Chorak (1-4)"),
    subjectCode: Optional[str] = Query(None, description="Fan kodi (masalan, 'inf')"),
    resourceType: Optional[str] = Query(None, description="Resurs turi: PRESENTATION, WORKSHEET, WORKBOOK, SOLUTION"),
    tenantSlug: Optional[str] = Query(None, description="Muassasa identifikatori"),
    db: Prisma = Depends(get_prisma),
    current_user=Depends(school_staff),
):
    """
    5–11-sinflar uchun barcha dars taqdimotlari, topshiriqlar, nazorat daftarlari va yechimlar ro'yxati
    """
    tenant = await resolve_tenant(db, current_user, tenantSlug, "Muassasa topilmadi.")

    where_filter: dict = {"tenantId": tenant.id}
    if gradeLevel is not None:
        where_filter["gradeLevel"] = gradeLevel
    if quarter is not None:
        where_filter["quarter"] = quarter
    if subjectCode:
        where_filter["subjectCode"] = subjectCode
    if resourceType:
        where_filter["resourceType"] = resourceType

    resources = await db.curriculumresource.find_many(
        where=where_filter,
        order={"gradeLevel": "asc"},
    )

    return [
        CurriculumResourceResponse(
            id=r.id,
            tenantId=r.tenantId,
            subjectCode=r.subjectCode,
            gradeLevel=r.gradeLevel,
            quarter=r.quarter,
            lessonNumber=r.lessonNumber,
            title=r.title,
            topic=r.topic,
            resourceType=r.resourceType,
            description=r.description,
            contentJson=r.contentJson,
            fileUrl=r.fileUrl,
            downloadCount=r.downloadCount,
            createdAt=r.createdAt.isoformat(),
            updatedAt=r.updatedAt.isoformat(),
        )
        for r in resources
    ]

@router.get("/solutions/{assessmentId}", response_model=list[AssessmentSolutionResponse])
async def get_assessment_solutions(
    assessmentId: str,
    db: Prisma = Depends(get_prisma),
):
    """
    BSB va CHSB savollarining qadamma-qadam batafsil yechimlari va baholash mezonlari
    """
    solutions = await db.assessmentsolution.find_many(
        where={"assessmentId": assessmentId},
        order={"createdAt": "asc"},
    )
    return [
        AssessmentSolutionResponse(
            id=s.id,
            assessmentId=s.assessmentId,
            questionId=s.questionId,
            variantNumber=s.variantNumber,
            stepByStepSolution=s.stepByStepSolution,
            solutionFormulas=s.solutionFormulas,
            rubricCriteriaJson=s.rubricCriteriaJson,
            authorNote=s.authorNote,
            createdAt=s.createdAt.isoformat(),
        )
        for s in solutions
    ]

@router.get("/grades", response_model=list[int])
async def get_available_grades():
    """
    Mavjud barcha sinflar ro'yxati (5-11-sinflar)
    """
    return [5, 6, 7, 8, 9, 10, 11]
