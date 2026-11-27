from __future__ import annotations

from fastapi import APIRouter, Query
from sqlalchemy import select

from backend.app.core.dependencies import DbSession
from backend.app.core.permissions import StaffUser, resolve_tenant
from backend.app.models import AssessmentSolution, CurriculumResource
from backend.app.schemas.curriculum import AssessmentSolutionResponse, CurriculumResourceResponse

router = APIRouter(prefix="/curriculum", tags=["Curriculum & Materials Hub"])


@router.get("/resources", response_model=list[CurriculumResourceResponse])
async def list_curriculum_resources(
    db: DbSession,
    current_user: StaffUser,
    gradeLevel: int | None = Query(None, description="Sinf darajasi (5-11)"),
    quarter: int | None = Query(None, description="Chorak (1-4)"),
    subjectCode: str | None = Query(None, description="Fan kodi (masalan, 'inf')"),
    resourceType: str | None = Query(
        None, description="Resurs turi: PRESENTATION, WORKSHEET, WORKBOOK, SOLUTION"
    ),
    tenantSlug: str | None = Query(None, description="Muassasa identifikatori"),
):
    """
    5–11-sinflar uchun barcha dars taqdimotlari, topshiriqlar, nazorat daftarlari va yechimlar ro'yxati
    """
    tenant = await resolve_tenant(db, current_user, tenantSlug, "Muassasa topilmadi.")
    query = select(CurriculumResource).where(CurriculumResource.tenant_id == tenant.id)
    if gradeLevel is not None:
        query = query.where(CurriculumResource.grade_level == gradeLevel)
    if quarter is not None:
        query = query.where(CurriculumResource.quarter == quarter)
    if subjectCode:
        query = query.where(CurriculumResource.subject_code == subjectCode)
    if resourceType:
        query = query.where(CurriculumResource.resource_type == resourceType)

    resources = await db.scalars(query.order_by(CurriculumResource.grade_level, CurriculumResource.id))
    return [
        CurriculumResourceResponse(
            id=r.id,
            tenantId=r.tenant_id,
            subjectCode=r.subject_code,
            gradeLevel=r.grade_level,
            quarter=r.quarter,
            lessonNumber=r.lesson_number,
            title=r.title,
            topic=r.topic,
            resourceType=r.resource_type,
            description=r.description,
            contentJson=r.content_json,
            fileUrl=r.file_url,
            downloadCount=r.download_count,
            createdAt=r.created_at.isoformat(),
            updatedAt=r.updated_at.isoformat(),
        )
        for r in resources
    ]


@router.get("/solutions/{assessmentId}", response_model=list[AssessmentSolutionResponse])
async def get_assessment_solutions(assessmentId: str, db: DbSession):
    """
    BSB va CHSB savollarining qadamma-qadam batafsil yechimlari va baholash mezonlari
    """
    solutions = await db.scalars(
        select(AssessmentSolution)
        .where(AssessmentSolution.assessment_id == assessmentId)
        .order_by(AssessmentSolution.created_at, AssessmentSolution.id)
    )
    return [
        AssessmentSolutionResponse(
            id=s.id,
            assessmentId=s.assessment_id,
            questionId=s.question_id,
            variantNumber=s.variant_number,
            stepByStepSolution=s.step_by_step_solution,
            solutionFormulas=s.solution_formulas,
            rubricCriteriaJson=s.rubric_criteria_json,
            authorNote=s.author_note,
            createdAt=s.created_at.isoformat(),
        )
        for s in solutions
    ]


@router.get("/grades", response_model=list[int])
async def get_available_grades():
    """
    Mavjud barcha sinflar ro'yxati (5-11-sinflar)
    """
    return [5, 6, 7, 8, 9, 10, 11]
