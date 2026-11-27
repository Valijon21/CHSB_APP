from __future__ import annotations

from pydantic import BaseModel, Field


class ClassGroupCreate(BaseModel):
    schoolId: str
    tenantSlug: str
    name: str = Field(..., min_length=2, max_length=50)
    gradeLevel: int = Field(..., ge=1, le=11)
    shift: int = Field(default=1, ge=1, le=2)
    academicYear: str = "2026-2027"
