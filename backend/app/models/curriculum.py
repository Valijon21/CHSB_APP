from __future__ import annotations

from datetime import datetime

from sqlalchemy import Index, func, text
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.models.base import Base, CreatedAtMixin, IdMixin, reference, utcnow


class CurriculumResource(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "curriculum_resources"
    __table_args__ = (
        Index("curriculum_resources_scope_idx", "tenant_id", "subject_code", "grade_level", "quarter"),
    )

    tenant_id: Mapped[str] = mapped_column(reference("tenants.id"))
    subject_code: Mapped[str]
    grade_level: Mapped[int]
    quarter: Mapped[int] = mapped_column(default=1, server_default=text("1"))
    lesson_number: Mapped[int] = mapped_column(default=1, server_default=text("1"))
    title: Mapped[str]
    topic: Mapped[str]
    resource_type: Mapped[str]  # PRESENTATION, WORKSHEET, WORKBOOK, SOLUTION
    description: Mapped[str | None]
    content_json: Mapped[str] = mapped_column(default="{}", server_default="{}")
    file_url: Mapped[str | None]
    download_count: Mapped[int] = mapped_column(default=0, server_default=text("0"))
    updated_at: Mapped[datetime] = mapped_column(
        default=utcnow, onupdate=utcnow, server_default=func.now(), sort_order=91
    )
