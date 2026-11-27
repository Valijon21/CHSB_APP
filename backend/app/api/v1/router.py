from fastapi import APIRouter, Depends

from backend.app.api.v1.endpoints import (
    ai,
    analytics,
    assessments,
    auth,
    classes,
    curriculum,
    regional,
    students,
    subjects,
    tenants,
)
from backend.app.core.permissions import regional_viewer, school_staff

api_router = APIRouter()

# auth and tenants contain the only public routes, so they guard each route themselves
api_router.include_router(auth.router)
api_router.include_router(tenants.router)

# Everything below requires a signed-in user with a suitable role.
# Individual write routes tighten this further.
for module in (classes, students, analytics, ai, assessments, subjects, curriculum):
    api_router.include_router(module.router, dependencies=[Depends(school_staff)])
api_router.include_router(regional.router, dependencies=[Depends(regional_viewer)])
