"""
All database models. Importing this package registers every table on Base.metadata.
"""
from backend.app.models.assessment import (
    Assessment,
    AssessmentAttempt,
    AssessmentResult,
    AssessmentSolution,
    AttemptAnswer,
    ExamSession,
    ManualScore,
    Question,
)
from backend.app.models.base import Base
from backend.app.models.curriculum import CurriculumResource
from backend.app.models.organization import (
    AuditLog,
    ClassGroup,
    School,
    Student,
    Subject,
    TeacherClass,
    Tenant,
    User,
)

__all__ = [
    "Assessment",
    "AssessmentAttempt",
    "AssessmentResult",
    "AssessmentSolution",
    "AttemptAnswer",
    "AuditLog",
    "Base",
    "ClassGroup",
    "CurriculumResource",
    "ExamSession",
    "ManualScore",
    "Question",
    "School",
    "Student",
    "Subject",
    "TeacherClass",
    "Tenant",
    "User",
]
