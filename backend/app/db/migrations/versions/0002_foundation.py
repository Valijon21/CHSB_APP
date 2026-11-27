"""Foundation: tenant-owned assessments, per-question answers, exam sessions,
timezone aware timestamps and indexes.

Existing data is preserved. Take a backup before running it on a live database.

Revision ID: 0002
"""
from __future__ import annotations

import json
import logging
import uuid

import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

log = logging.getLogger("alembic.runtime.migration")

TIMESTAMP_COLUMNS = {
    "tenants": ["created_at"],
    "schools": ["created_at"],
    "users": ["created_at"],
    "class_groups": ["created_at"],
    "students": ["created_at"],
    "assessments": ["created_at"],
    "assessment_attempts": ["started_at", "submitted_at"],
    "assessment_results": ["submitted_at"],
    "audit_logs": ["created_at"],
    "subjects": ["created_at", "updated_at"],
    "curriculum_resources": ["created_at", "updated_at"],
    "assessment_solutions": ["created_at"],
}

# Enforced for new and changed rows only, so unexpected legacy values do not block the upgrade
CHECKS = (
    ("users", "role", "role IN ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'REGIONAL_INSPECTOR', 'TEACHER', 'STUDENT')"),
    ("students", "status", "status IN ('ELIGIBLE', 'INACTIVE')"),
    ("assessments", "status", "status IN ('draft', 'published', 'closed')"),
    ("assessment_attempts", "status", "status IN ('in_progress', 'submitted')"),
    ("class_groups", "grade_level", "grade_level BETWEEN 1 AND 11"),
    ("class_groups", "shift", "shift IN (1, 2)"),
    ("exam_sessions", "period", "ends_at > starts_at"),
    ("manual_scores", "points", "points >= 0 AND points <= max_points"),
)


def _timestamptz(name: str, *, nullable: bool = False, default: bool = False) -> sa.Column:
    return sa.Column(
        name,
        sa.DateTime(timezone=True),
        nullable=nullable,
        server_default=sa.func.now() if default else None,
    )


def _reference(table: str, column: str, target: str, ondelete: str = "CASCADE") -> sa.ForeignKeyConstraint:
    return sa.ForeignKeyConstraint(
        [column], [f"{target}.id"], name=f"{table}_{column}_fkey", ondelete=ondelete, onupdate="CASCADE"
    )


def _create_new_tables() -> None:
    op.create_table(
        "exam_sessions",
        sa.Column("id", sa.Text, primary_key=True),
        sa.Column("assessment_id", sa.Text, nullable=False),
        sa.Column("class_group_id", sa.Text, nullable=False),
        sa.Column("group", sa.Text),
        sa.Column("access_code", sa.Text, nullable=False),
        _timestamptz("starts_at"),
        _timestamptz("ends_at"),
        _timestamptz("closed_at", nullable=True),
        sa.Column("created_by", sa.Text),
        _timestamptz("created_at", default=True),
        _reference("exam_sessions", "assessment_id", "assessments"),
        _reference("exam_sessions", "class_group_id", "class_groups"),
        _reference("exam_sessions", "created_by", "users", "SET NULL"),
    )
    op.create_table(
        "attempt_answers",
        sa.Column("id", sa.Text, primary_key=True),
        sa.Column("attempt_id", sa.Text, nullable=False),
        sa.Column("question_id", sa.Text, nullable=False),
        sa.Column("option_id", sa.Text, nullable=False),
        _timestamptz("updated_at", default=True),
        _reference("attempt_answers", "attempt_id", "assessment_attempts"),
        _reference("attempt_answers", "question_id", "questions"),
        sa.UniqueConstraint("attempt_id", "question_id", name="attempt_answers_attempt_id_question_id_key"),
    )
    op.create_table(
        "manual_scores",
        sa.Column("id", sa.Text, primary_key=True),
        sa.Column("attempt_id", sa.Text, nullable=False),
        sa.Column("question_id", sa.Text),
        sa.Column("criterion", sa.Text, nullable=False),
        sa.Column("points", sa.Double, nullable=False),
        sa.Column("max_points", sa.Double, nullable=False),
        sa.Column("comment", sa.Text),
        sa.Column("graded_by", sa.Text),
        _timestamptz("graded_at", default=True),
        _reference("manual_scores", "attempt_id", "assessment_attempts"),
        _reference("manual_scores", "question_id", "questions", "SET NULL"),
        _reference("manual_scores", "graded_by", "users", "SET NULL"),
    )
    op.create_table(
        "teacher_classes",
        sa.Column("id", sa.Text, primary_key=True),
        sa.Column("teacher_id", sa.Text, nullable=False),
        sa.Column("class_group_id", sa.Text, nullable=False),
        sa.Column("subject_id", sa.Text),
        _timestamptz("created_at", default=True),
        _reference("teacher_classes", "teacher_id", "users"),
        _reference("teacher_classes", "class_group_id", "class_groups"),
        _reference("teacher_classes", "subject_id", "subjects"),
        sa.UniqueConstraint(
            "teacher_id",
            "class_group_id",
            "subject_id",
            name="teacher_classes_teacher_id_class_group_id_subject_id_key",
            postgresql_nulls_not_distinct=True,
        ),
    )


def _add_columns() -> None:
    op.add_column("users", sa.Column("school_id", sa.Text))
    op.add_column("users", sa.Column("token_version", sa.Integer, nullable=False, server_default=sa.text("0")))
    op.add_column(
        "users", sa.Column("must_change_password", sa.Boolean, nullable=False, server_default=sa.text("false"))
    )
    op.create_foreign_key(
        "users_school_id_fkey", "users", "schools", ["school_id"], ["id"], ondelete="SET NULL", onupdate="CASCADE"
    )

    op.add_column("assessments", sa.Column("tenant_id", sa.Text))
    op.add_column("assessments", sa.Column("created_by", sa.Text))
    op.add_column("assessments", sa.Column("status", sa.Text, nullable=False, server_default="published"))
    op.create_foreign_key(
        "assessments_tenant_id_fkey", "assessments", "tenants", ["tenant_id"], ["id"],
        ondelete="CASCADE", onupdate="CASCADE",
    )
    op.create_foreign_key(
        "assessments_created_by_fkey", "assessments", "users", ["created_by"], ["id"],
        ondelete="SET NULL", onupdate="CASCADE",
    )

    op.add_column("assessment_attempts", sa.Column("session_id", sa.Text))
    op.add_column("assessment_attempts", _timestamptz("deadline_at", nullable=True))
    op.create_foreign_key(
        "assessment_attempts_session_id_fkey", "assessment_attempts", "exam_sessions", ["session_id"], ["id"],
        ondelete="SET NULL", onupdate="CASCADE",
    )
    op.create_unique_constraint(
        "assessment_attempts_session_id_student_id_key", "assessment_attempts", ["session_id", "student_id"]
    )

    op.add_column("audit_logs", sa.Column("tenant_id", sa.Text))
    op.create_foreign_key(
        "audit_logs_tenant_id_fkey", "audit_logs", "tenants", ["tenant_id"], ["id"],
        ondelete="SET NULL", onupdate="CASCADE",
    )


def _assign_assessments_to_tenants() -> None:
    """An assessment belongs to the school whose students took it, else to the largest school."""
    db = op.get_bind()
    db.execute(sa.text(
        """
        UPDATE assessments a SET tenant_id = used.tenant_id
        FROM (
            SELECT att.assessment_id, MIN(s.tenant_id) AS tenant_id
            FROM assessment_attempts att JOIN students s ON s.id = att.student_id
            GROUP BY att.assessment_id
            HAVING COUNT(DISTINCT s.tenant_id) = 1
        ) used
        WHERE used.assessment_id = a.id
        """
    ))
    orphans = db.execute(sa.text("SELECT code FROM assessments WHERE tenant_id IS NULL ORDER BY code")).scalars().all()
    if not orphans:
        return
    fallback = db.execute(sa.text(
        """
        SELECT t.id, t.slug FROM tenants t
        LEFT JOIN students s ON s.tenant_id = t.id
        GROUP BY t.id, t.slug, t.created_at
        ORDER BY COUNT(s.id) DESC, t.created_at, t.id
        LIMIT 1
        """
    )).first()
    if fallback is None:
        raise RuntimeError("Assessments exist but there is no tenant to own them.")
    db.execute(sa.text("UPDATE assessments SET tenant_id = :tenant WHERE tenant_id IS NULL"), {"tenant": fallback.id})
    log.warning("Assigned %d assessment(s) without a clear owner to '%s': %s", len(orphans), fallback.slug, ", ".join(orphans))


def _copy_answers() -> None:
    """Move answers_json (keyed by question id or question number) into attempt_answers."""
    db = op.get_bind()
    questions: dict[str, dict[str, str]] = {}
    for row in db.execute(sa.text("SELECT id, assessment_id, question_number FROM questions")):
        lookup = questions.setdefault(row.assessment_id, {})
        lookup.setdefault(str(row.question_number), row.id)
        lookup[row.id] = row.id

    insert = sa.text(
        "INSERT INTO attempt_answers (id, attempt_id, question_id, option_id) "
        "VALUES (:id, :attempt, :question, :option) ON CONFLICT (attempt_id, question_id) DO NOTHING"
    )
    skipped = 0
    attempts = db.execute(sa.text("SELECT id, assessment_id, answers_json FROM assessment_attempts")).all()
    for attempt in attempts:
        try:
            answers = json.loads(attempt.answers_json or "{}")
            if not isinstance(answers, dict):
                raise ValueError
        except ValueError:
            skipped += 1
            continue
        lookup = questions.get(attempt.assessment_id, {})
        # Keys that are question ids win over keys that are question numbers
        for key, option in sorted(answers.items(), key=lambda item: item[0] not in lookup or lookup[item[0]] != item[0]):
            question_id = lookup.get(str(key))
            if question_id is None or not isinstance(option, str):
                skipped += 1
                continue
            db.execute(insert, {"id": str(uuid.uuid4()), "attempt": attempt.id, "question": question_id, "option": option})
    if skipped:
        log.warning("%d unreadable answer entries remain only in assessment_attempts.answers_json", skipped)


def upgrade() -> None:
    for table, columns in TIMESTAMP_COLUMNS.items():
        for column in columns:
            # Earlier versions stored UTC without a time zone
            op.execute(f'ALTER TABLE "{table}" ALTER COLUMN "{column}" TYPE TIMESTAMPTZ USING "{column}" AT TIME ZONE \'UTC\'')
    op.execute('ALTER TABLE "students" ALTER COLUMN "birth_date" TYPE DATE USING "birth_date"::date')
    op.execute('ALTER TABLE "students" ALTER COLUMN "group" DROP DEFAULT')

    _create_new_tables()
    _add_columns()
    _assign_assessments_to_tenants()
    op.alter_column("assessments", "tenant_id", nullable=False)
    op.execute(
        "UPDATE users u SET school_id = (SELECT s.id FROM schools s WHERE s.tenant_id = u.tenant_id "
        "ORDER BY s.created_at, s.id LIMIT 1)"
    )
    _copy_answers()

    # Counted from the students table now, so they can no longer drift
    op.drop_column("schools", "student_count")
    op.drop_column("class_groups", "student_count")

    # Earlier versions named this index in two different ways
    for name in (
        "curriculum_resources_tenant_id_subject_code_grade_level_qua_idx",
        "curriculum_resources_tenant_id_subject_code_grade_level_quarter",
    ):
        op.execute(f'DROP INDEX IF EXISTS "{name}"')
    op.create_index(
        "curriculum_resources_scope_idx",
        "curriculum_resources",
        ["tenant_id", "subject_code", "grade_level", "quarter"],
    )

    indexed = {
        "schools": ["tenant_id"],
        "users": ["tenant_id", "school_id"],
        "class_groups": ["school_id", "tenant_id"],
        "students": ["school_id", "class_group_id", "tenant_id"],
        "assessments": ["tenant_id", "created_by"],
        "questions": ["assessment_id"],
        "assessment_attempts": ["assessment_id", "student_id"],
        "assessment_results": ["student_id"],
        "audit_logs": ["tenant_id", "user_id", "created_at"],
        "exam_sessions": ["assessment_id", "class_group_id", "created_by"],
        "attempt_answers": ["question_id"],
        "manual_scores": ["attempt_id", "question_id", "graded_by"],
        "teacher_classes": ["class_group_id", "subject_id"],
    }
    for table, columns in indexed.items():
        for column in columns:
            op.create_index(f"{table}_{column}_idx", table, [column])

    for table, name, condition in CHECKS:
        op.execute(f'ALTER TABLE "{table}" ADD CONSTRAINT "{table}_{name}_check" CHECK ({condition}) NOT VALID')


def downgrade() -> None:
    raise NotImplementedError("Restore the backup taken before the upgrade.")
