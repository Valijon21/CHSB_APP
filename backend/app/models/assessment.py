"""
Assessments, exam sessions, attempts and results.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Double, Index, UniqueConstraint, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.models.base import Base, CreatedAtMixin, IdMixin, reference, utcnow
from backend.app.models.organization import Student


class Assessment(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "assessments"
    __table_args__ = (Index("assessments_code_key", "code", unique=True),)

    tenant_id: Mapped[str] = mapped_column(reference("tenants.id"), index=True)
    created_by: Mapped[str | None] = mapped_column(reference("users.id", ondelete="SET NULL"), index=True)
    code: Mapped[str]
    title: Mapped[str]
    subject: Mapped[str]
    grade_level: Mapped[int]
    target_group: Mapped[str | None] = mapped_column(default="all", server_default="all")
    duration_minutes: Mapped[int] = mapped_column(default=45, server_default=text("45"))
    total_questions: Mapped[int] = mapped_column(default=15, server_default=text("15"))
    max_score: Mapped[float] = mapped_column(Double, default=40.0, server_default=text("40.0"))
    status: Mapped[str] = mapped_column(default="published", server_default="published")

    questions: Mapped[list[Question]] = relationship(
        back_populates="assessment", lazy="raise", passive_deletes=True, order_by="Question.question_number"
    )


class Question(IdMixin, Base):
    __tablename__ = "questions"

    assessment_id: Mapped[str] = mapped_column(reference("assessments.id"), index=True)
    question_number: Mapped[int]
    prompt: Mapped[str]
    options_json: Mapped[str]
    correct_option_id: Mapped[str]
    bloom_level: Mapped[str] = mapped_column(default="KNOWLEDGE", server_default="KNOWLEDGE")
    difficulty: Mapped[str] = mapped_column(default="medium", server_default="medium")
    points: Mapped[float] = mapped_column(Double, default=2.5, server_default=text("2.5"))

    assessment: Mapped[Assessment] = relationship(back_populates="questions", lazy="raise")


class ExamSession(IdMixin, CreatedAtMixin, Base):
    """A sitting of an assessment for one class, opened by a teacher."""

    __tablename__ = "exam_sessions"

    assessment_id: Mapped[str] = mapped_column(reference("assessments.id"), index=True)
    class_group_id: Mapped[str] = mapped_column(reference("class_groups.id"), index=True)
    group: Mapped[str | None] = mapped_column("group")
    access_code: Mapped[str]
    starts_at: Mapped[datetime]
    ends_at: Mapped[datetime]
    closed_at: Mapped[datetime | None]
    created_by: Mapped[str | None] = mapped_column(reference("users.id", ondelete="SET NULL"), index=True)


class AssessmentAttempt(IdMixin, Base):
    __tablename__ = "assessment_attempts"
    __table_args__ = (UniqueConstraint("session_id", "student_id"),)

    assessment_id: Mapped[str] = mapped_column(reference("assessments.id"), index=True)
    student_id: Mapped[str] = mapped_column(reference("students.id"), index=True)
    session_id: Mapped[str | None] = mapped_column(reference("exam_sessions.id", ondelete="SET NULL"))
    started_at: Mapped[datetime] = mapped_column(default=utcnow, server_default=func.now())
    submitted_at: Mapped[datetime | None]
    deadline_at: Mapped[datetime | None]
    # Answers of earlier versions. Kept for reference; attempt_answers is authoritative.
    answers_json: Mapped[str] = mapped_column(default="{}", server_default="{}")
    time_spent_seconds: Mapped[int] = mapped_column(default=0, server_default=text("0"))
    status: Mapped[str] = mapped_column(default="in_progress", server_default="in_progress")

    assessment: Mapped[Assessment] = relationship(lazy="raise")
    student: Mapped[Student] = relationship(lazy="raise")


class AttemptAnswer(IdMixin, Base):
    __tablename__ = "attempt_answers"
    __table_args__ = (UniqueConstraint("attempt_id", "question_id"),)

    attempt_id: Mapped[str] = mapped_column(reference("assessment_attempts.id"))
    question_id: Mapped[str] = mapped_column(reference("questions.id"), index=True)
    option_id: Mapped[str]
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow, server_default=func.now())


class AssessmentResult(IdMixin, Base):
    __tablename__ = "assessment_results"
    __table_args__ = (Index("assessment_results_attempt_id_key", "attempt_id", unique=True),)

    attempt_id: Mapped[str] = mapped_column(reference("assessment_attempts.id"))
    student_id: Mapped[str] = mapped_column(reference("students.id"), index=True)
    score: Mapped[float] = mapped_column(Double)
    max_score: Mapped[float] = mapped_column(Double)
    percentage: Mapped[float] = mapped_column(Double)
    grade: Mapped[str]
    status: Mapped[str] = mapped_column(default="verified", server_default="verified")
    submitted_at: Mapped[datetime] = mapped_column(default=utcnow, server_default=func.now())

    attempt: Mapped[AssessmentAttempt] = relationship(lazy="raise")
    student: Mapped[Student] = relationship(back_populates="results", lazy="raise")


class ManualScore(IdMixin, Base):
    """A teacher's score for written work, one row per rubric criterion."""

    __tablename__ = "manual_scores"

    attempt_id: Mapped[str] = mapped_column(reference("assessment_attempts.id"), index=True)
    question_id: Mapped[str | None] = mapped_column(reference("questions.id", ondelete="SET NULL"), index=True)
    criterion: Mapped[str]
    points: Mapped[float] = mapped_column(Double)
    max_points: Mapped[float] = mapped_column(Double)
    comment: Mapped[str | None]
    graded_by: Mapped[str | None] = mapped_column(reference("users.id", ondelete="SET NULL"), index=True)
    graded_at: Mapped[datetime] = mapped_column(default=utcnow, server_default=func.now())


class AssessmentSolution(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "assessment_solutions"
    __table_args__ = (Index("assessment_solutions_assessment_id_question_id_idx", "assessment_id", "question_id"),)

    # No foreign keys: solutions can describe material that is not in the database
    assessment_id: Mapped[str]
    question_id: Mapped[str]
    variant_number: Mapped[int] = mapped_column(default=1, server_default=text("1"))
    step_by_step_solution: Mapped[str]
    solution_formulas: Mapped[str | None]
    rubric_criteria_json: Mapped[str] = mapped_column(default="[]", server_default="[]")
    author_note: Mapped[str | None]
