"""
Lightweight runtime schema synchronization for PostgreSQL and SQLite.

Ensures columns and tables added after initial deployment exist without spawning
heavy Node.js Prisma CLI processes (`prisma db push`) inside memory-constrained
containers.
"""
from __future__ import annotations

from prisma import Prisma
from backend.app.core.config import settings

# (table_name, column_name, pg_definition, sqlite_definition)
_REQUIRED_COLUMNS: list[tuple[str, str, str, str]] = [
    ("class_groups", "has_groups", "BOOLEAN NOT NULL DEFAULT true", "INTEGER NOT NULL DEFAULT 1"),
    ("students", "group", "TEXT DEFAULT '1-guruh'", "TEXT DEFAULT '1-guruh'"),
    ("students", "emaktab_id", "TEXT", "TEXT"),
    ("assessments", "target_group", "TEXT DEFAULT 'all'", "TEXT DEFAULT 'all'"),
]


async def _ensure_sqlite_column(db: Prisma, table: str, column: str, definition: str) -> None:
    rows = await db.query_raw(f'PRAGMA table_info("{table}")')
    existing_cols = {row.get("name") for row in rows}
    if existing_cols and column not in existing_cols:
        await db.execute_raw(f'ALTER TABLE "{table}" ADD COLUMN "{column}" {definition}')


async def ensure_schema_synced(db: Prisma) -> None:
    """Apply idempotent DDL statements so runtime schema matches prisma/schema.prisma."""
    is_postgres = settings.DATABASE_URL.startswith(("postgres://", "postgresql://"))

    for table, column, pg_def, sqlite_def in _REQUIRED_COLUMNS:
        try:
            if is_postgres:
                await db.execute_raw(
                    f'ALTER TABLE "{table}" ADD COLUMN IF NOT EXISTS "{column}" {pg_def}'
                )
            else:
                await _ensure_sqlite_column(db, table, column, sqlite_def)
        except Exception as e:
            print(f"⚠️ Could not add column {column} to {table}: {e}")

    ts_type = "TIMESTAMP(3)" if is_postgres else "DATETIME"
    id_col = '"id" TEXT NOT NULL' if is_postgres else '"id" TEXT NOT NULL PRIMARY KEY'
    cr_pk = ',\n                CONSTRAINT "curriculum_resources_pkey" PRIMARY KEY ("id")' if is_postgres else ""
    as_pk = ',\n                CONSTRAINT "assessment_solutions_pkey" PRIMARY KEY ("id")' if is_postgres else ""

    try:
        await db.execute_raw(
            f"""
            CREATE TABLE IF NOT EXISTS "curriculum_resources" (
                {id_col},
                "tenant_id" TEXT NOT NULL,
                "subject_code" TEXT NOT NULL,
                "grade_level" INTEGER NOT NULL,
                "quarter" INTEGER NOT NULL DEFAULT 1,
                "lesson_number" INTEGER NOT NULL DEFAULT 1,
                "title" TEXT NOT NULL,
                "topic" TEXT NOT NULL,
                "resource_type" TEXT NOT NULL,
                "description" TEXT,
                "content_json" TEXT NOT NULL DEFAULT '{{}}',
                "file_url" TEXT,
                "download_count" INTEGER NOT NULL DEFAULT 0,
                "created_at" {ts_type} NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" {ts_type} NOT NULL DEFAULT CURRENT_TIMESTAMP{cr_pk},
                CONSTRAINT "curriculum_resources_tenant_id_fkey"
                    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
                    ON DELETE CASCADE ON UPDATE CASCADE
            )
            """
        )
        await db.execute_raw(
            """
            CREATE INDEX IF NOT EXISTS "curriculum_resources_tenant_id_subject_code_grade_level_quarter_idx"
                ON "curriculum_resources"("tenant_id", "subject_code", "grade_level", "quarter")
            """
        )
    except Exception as e:
        print(f"⚠️ Could not create curriculum_resources table/index: {e}")

    try:
        await db.execute_raw(
            f"""
            CREATE TABLE IF NOT EXISTS "assessment_solutions" (
                {id_col},
                "assessment_id" TEXT NOT NULL,
                "question_id" TEXT NOT NULL,
                "variant_number" INTEGER NOT NULL DEFAULT 1,
                "step_by_step_solution" TEXT NOT NULL,
                "solution_formulas" TEXT,
                "rubric_criteria_json" TEXT NOT NULL DEFAULT '[]',
                "author_note" TEXT,
                "created_at" {ts_type} NOT NULL DEFAULT CURRENT_TIMESTAMP{as_pk}
            )
            """
        )
        await db.execute_raw(
            """
            CREATE INDEX IF NOT EXISTS "assessment_solutions_assessment_id_question_id_idx"
                ON "assessment_solutions"("assessment_id", "question_id")
            """
        )
    except Exception as e:
        print(f"⚠️ Could not create assessment_solutions table/index: {e}")
