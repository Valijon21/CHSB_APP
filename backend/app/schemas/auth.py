from pydantic import BaseModel, Field

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=4)

class UserProfile(BaseModel):
    id: str
    tenantId: str
    username: str
    fullName: str
    role: str
    email: str | None = None

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

class AdmissionVerifyRequest(BaseModel):
    tenantSlug: str
    rosterCode: str

class AdmissionVerifyResponse(BaseModel):
    success: bool
    sessionToken: str | None = None
    student: dict | None = None
    availableAssessmentIds: list[str] = []
    message: str | None = None

