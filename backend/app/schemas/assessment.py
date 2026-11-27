from __future__ import annotations

from pydantic import BaseModel, Field


class CreateAttemptPayload(BaseModel):
    tenantId: str
    assessmentId: str
    rosterRecordId: str


class SaveDraftPayload(BaseModel):
    answers: dict


class SubmitAttemptPayload(BaseModel):
    idempotencyKey: str | None = None


class AssessmentCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=300)
    subject: str = Field(..., min_length=2, max_length=100)
    gradeLevel: int = Field(default=9, ge=1, le=11)
    quarter: int = Field(default=1, ge=1, le=4)
    durationMinutes: int = Field(default=40, ge=10, le=180)
    totalQuestions: int = Field(default=15, ge=1, le=100)
    maxScore: float = Field(default=40.0, ge=1.0)
    targetGroup: str = Field(default="all")
    code: str | None = Field(default=None, max_length=60)
    questions: list[dict] | None = Field(default=None, max_length=100)


class QuestionUpdate(BaseModel):
    prompt: str | None = None
    options: list[dict] | None = None
    correctOptionId: str | None = None
    points: float | None = Field(default=None, ge=0)
    bloomLevel: str | None = None
