"""
Schools, their staff and students.
"""
from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Index, UniqueConstraint, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.models.base import Base, CreatedAtMixin, IdMixin, reference, utcnow


class Tenant(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "tenants"
    __table_args__ = (Index("tenants_slug_key", "slug", unique=True),)

    slug: Mapped[str]
    name: Mapped[str]
    region_id: Mapped[str]
    is_active: Mapped[bool] = mapped_column(default=True, server_default=text("true"))


class School(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "schools"

    tenant_id: Mapped[str] = mapped_column(reference("tenants.id"), index=True)
    name: Mapped[str]
    district_id: Mapped[str]
    school_type: Mapped[str] = mapped_column(default="comprehensive", server_default="comprehensive")

    tenant: Mapped[Tenant] = relationship(lazy="raise")


class User(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "users"
    __table_args__ = (Index("users_username_key", "username", unique=True),)

    tenant_id: Mapped[str] = mapped_column(reference("tenants.id"), index=True)
    school_id: Mapped[str | None] = mapped_column(reference("schools.id", ondelete="SET NULL"), index=True)
    username: Mapped[str]
    email: Mapped[str | None]
    hashed_password: Mapped[str]
    full_name: Mapped[str]
    role: Mapped[str] = mapped_column(default="TEACHER", server_default="TEACHER")
    is_active: Mapped[bool] = mapped_column(default=True, server_default=text("true"))
    # Raising this number invalidates every token issued before
    token_version: Mapped[int] = mapped_column(default=0, server_default=text("0"))
    must_change_password: Mapped[bool] = mapped_column(default=False, server_default=text("false"))


class ClassGroup(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "class_groups"

    school_id: Mapped[str] = mapped_column(reference("schools.id"), index=True)
    tenant_id: Mapped[str] = mapped_column(reference("tenants.id"), index=True)
    name: Mapped[str]
    grade_level: Mapped[int]
    shift: Mapped[int] = mapped_column(default=1, server_default=text("1"))
    academic_year: Mapped[str] = mapped_column(default="2026-2027", server_default="2026-2027")
    has_groups: Mapped[bool] = mapped_column(default=True, server_default=text("true"))

    students: Mapped[list[Student]] = relationship(back_populates="class_group", lazy="raise", passive_deletes=True)


class Student(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "students"
    __table_args__ = (Index("students_roster_code_key", "roster_code", unique=True),)

    school_id: Mapped[str] = mapped_column(reference("schools.id"), index=True)
    class_group_id: Mapped[str] = mapped_column(reference("class_groups.id"), index=True)
    tenant_id: Mapped[str] = mapped_column(reference("tenants.id"), index=True)
    roster_code: Mapped[str]
    first_name: Mapped[str]
    last_name: Mapped[str]
    middle_name: Mapped[str | None]
    gender: Mapped[str] = mapped_column(default="M", server_default="M")
    birth_date: Mapped[date]
    status: Mapped[str] = mapped_column(default="ELIGIBLE", server_default="ELIGIBLE")
    group: Mapped[str | None] = mapped_column("group")
    emaktab_id: Mapped[str | None]

    class_group: Mapped[ClassGroup] = relationship(back_populates="students", lazy="raise")
    results: Mapped[list[AssessmentResult]] = relationship(  # noqa: F821
        back_populates="student", lazy="raise", passive_deletes=True
    )


class Subject(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "subjects"
    __table_args__ = (Index("subjects_tenant_id_code_key", "tenant_id", "code", unique=True),)

    tenant_id: Mapped[str] = mapped_column(reference("tenants.id"))
    name: Mapped[str]
    code: Mapped[str]
    description: Mapped[str | None]
    grade_levels: Mapped[str] = mapped_column(default="5,6,7,8,9,10,11", server_default="5,6,7,8,9,10,11")
    is_active: Mapped[bool] = mapped_column(default=True, server_default=text("true"))
    updated_at: Mapped[datetime] = mapped_column(
        default=utcnow, onupdate=utcnow, server_default=func.now(), sort_order=91
    )


class TeacherClass(IdMixin, CreatedAtMixin, Base):
    """Which teacher teaches which class (and subject). Used for per-teacher access."""

    __tablename__ = "teacher_classes"
    __table_args__ = (
        UniqueConstraint("teacher_id", "class_group_id", "subject_id", postgresql_nulls_not_distinct=True),
    )

    teacher_id: Mapped[str] = mapped_column(reference("users.id"))
    class_group_id: Mapped[str] = mapped_column(reference("class_groups.id"), index=True)
    subject_id: Mapped[str | None] = mapped_column(reference("subjects.id"), index=True)


class AuditLog(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "audit_logs"
    __table_args__ = (Index("audit_logs_created_at_idx", "created_at"),)

    tenant_id: Mapped[str | None] = mapped_column(reference("tenants.id", ondelete="SET NULL"), index=True)
    user_id: Mapped[str | None] = mapped_column(reference("users.id", ondelete="SET NULL"), index=True)
    action: Mapped[str]
    details_json: Mapped[str | None]
    ip_address: Mapped[str | None]
