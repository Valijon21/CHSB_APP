from fastapi import APIRouter
from backend.app.api.v1.endpoints import auth, classes, students, analytics, ai, tenants, assessments, regional, subjects

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(classes.router)
api_router.include_router(students.router)
api_router.include_router(analytics.router)
api_router.include_router(ai.router)
api_router.include_router(tenants.router)
api_router.include_router(assessments.router)
api_router.include_router(regional.router)
api_router.include_router(subjects.router)
