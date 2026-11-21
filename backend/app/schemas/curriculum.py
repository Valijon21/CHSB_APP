from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field

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
    description: Optional[str] = None
    contentJson: str
    fileUrl: Optional[str] = None
    downloadCount: int = 0
    createdAt: str
    updatedAt: str

class AssessmentSolutionResponse(BaseModel):
    id: str
    assessmentId: str
    questionId: str
    variantNumber: int = 1
    stepByStepSolution: str
    solutionFormulas: Optional[str] = None
    rubricCriteriaJson: str = "[]"
    authorNote: Optional[str] = None
    createdAt: str
