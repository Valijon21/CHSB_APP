from __future__ import annotations

from pydantic import BaseModel, Field


class StudentCreate(BaseModel):
    tenantSlug: str
    schoolId: str | None = None
    classGroupId: str | None = None
    className: str | None = None
    firstName: str = Field(..., min_length=1, max_length=100)
    lastName: str = Field(..., min_length=1, max_length=100)
    middleName: str | None = Field(default=None, max_length=100)
    gender: str = "M"
    birthDate: str = "2008-05-15"
    rosterCode: str | None = Field(default=None, max_length=50)
    status: str = "eligible"
    group: str | None = None
    emaktabId: str | None = Field(default=None, max_length=50)


class BulkDeleteRequest(BaseModel):
    studentIds: list[str]
