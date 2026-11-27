from __future__ import annotations

from pydantic import BaseModel, Field


class SubjectCreate(BaseModel):
    tenantSlug: str = Field(default="al-xorazmiy")
    name: str = Field(..., min_length=2, max_length=100, description="Fan nomi (masalan: Matematika)")
    code: str = Field(..., min_length=2, max_length=20, description="Fan kodi (masalan: MATH)")
    gradeLevels: str = Field(default="5,6,7,8,9,10,11", description="Qaysi sinflar uchun (masalan: 5,6,7,8,9,10,11)")
    description: str | None = Field(default=None, description="Fan tavsifi")
    isActive: bool = Field(default=True, description="Fan faollik holati")

class SubjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    gradeLevels: str | None = Field(default=None)
    description: str | None = Field(default=None)
    isActive: bool | None = Field(default=None)

class SubjectResponse(BaseModel):
    id: str
    tenantId: str
    tenantSlug: str
    name: str
    code: str
    gradeLevels: str
    description: str | None = None
    isActive: bool = True
    createdAt: str
    updatedAt: str
