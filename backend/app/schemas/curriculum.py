from __future__ import annotations

from pydantic import BaseModel


class CurriculumResourceResponse(BaseModel):
    id: str
    tenantId: str
    subjectCode: str
    gradeLevel: int
    quarter: int
    lessonNumber: int
    title: str
    topic: str
    resourceType: str
    description: str | None = None
    contentJson: str
    fileUrl: str | None = None
    downloadCount: int = 0
    createdAt: str
    updatedAt: str

class AssessmentSolutionResponse(BaseModel):
    id: str
    assessmentId: str
    questionId: str
    variantNumber: int = 1
    stepByStepSolution: str
    solutionFormulas: str | None = None
    rubricCriteriaJson: str = "[]"
    authorNote: str | None = None
    createdAt: str
