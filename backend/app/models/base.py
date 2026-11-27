from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, MetaData, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# Same constraint names as the tables created by earlier versions of the project
NAMING_CONVENTION = {
    "pk": "%(table_name)s_pkey",
    "uq": "%(table_name)s_%(column_0_N_name)s_key",
    "fk": "%(table_name)s_%(column_0_name)s_fkey",
    "ix": "%(table_name)s_%(column_0_N_name)s_idx",
}


def new_id() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(UTC)


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)
    type_annotation_map = {str: Text, datetime: DateTime(timezone=True)}


class IdMixin:
    id: Mapped[str] = mapped_column(primary_key=True, default=new_id, sort_order=-10)


class CreatedAtMixin:
    created_at: Mapped[datetime] = mapped_column(default=utcnow, server_default=func.now(), sort_order=90)


def reference(target: str, *, ondelete: str = "CASCADE") -> ForeignKey:
    return ForeignKey(target, ondelete=ondelete, onupdate="CASCADE")
