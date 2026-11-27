"""
Upgrading an installation created by the earlier versions must not lose data.
"""
import asyncio
from datetime import UTC, date, datetime
from pathlib import Path

import asyncpg
import pytest
from alembic import command
from alembic.config import Config

from backend.app.core.config import settings
from backend.app.manage import migrate
from backend.tests.conftest import TEST_DATABASE_URL, asyncpg_dsn

LEGACY_SCHEMA = (Path(__file__).parent / "fixtures" / "legacy_schema.sql").read_text()
SCHEMA = "migration_case"
SCHEMA_URL = f"{TEST_DATABASE_URL}{'&' if '?' in TEST_DATABASE_URL else '?'}schema={SCHEMA}"

LEGACY_DATA = """
INSERT INTO tenants (id, slug, name, region_id, created_at) VALUES
  ('t-big', 'big', 'Big school', 'r', '2026-01-01 10:00:00'),
  ('t-small', 'small', 'Small school', 'r', '2026-01-02 10:00:00');
INSERT INTO schools (id, tenant_id, name, district_id, student_count) VALUES
  ('s-big', 't-big', 'Big', 'd', 99), ('s-small', 't-small', 'Small', 'd', 0);
INSERT INTO users (id, tenant_id, username, hashed_password, full_name, role) VALUES
  ('u1', 't-big', 'one', 'x', 'One', 'TEACHER'), ('u2', 't-small', 'two', 'x', 'Two', 'SOMETHING_OLD');
INSERT INTO class_groups (id, school_id, tenant_id, name, grade_level, student_count) VALUES
  ('c-big', 's-big', 't-big', '11-A', 11, 2), ('c-small', 's-small', 't-small', '11-B', 11, 1);
INSERT INTO students (id, school_id, class_group_id, tenant_id, roster_code, first_name, last_name, birth_date, "group") VALUES
  ('p1', 's-big', 'c-big', 't-big', 'STU-1', 'A', 'A', '2008-05-15 00:00:00', '1-guruh'),
  ('p2', 's-big', 'c-big', 't-big', 'STU-2', 'B', 'B', '2009-12-31 23:00:00', NULL),
  ('p3', 's-small', 'c-small', 't-small', 'STU-3', 'C', 'C', '2008-01-01 00:00:00', NULL);
INSERT INTO assessments (id, code, title, subject, grade_level) VALUES
  ('a-taken', 'TAKEN', 'Taken in the small school', 'X', 11),
  ('a-unused', 'UNUSED', 'Nobody took it', 'X', 11);
INSERT INTO questions (id, assessment_id, question_number, prompt, options_json, correct_option_id) VALUES
  ('q1', 'a-taken', 1, 'one', '[]', 'opt-a'), ('q2', 'a-taken', 2, 'two', '[]', 'opt-b'),
  ('q3', 'a-taken', 3, 'three', '[]', 'opt-c');
INSERT INTO assessment_attempts (id, assessment_id, student_id, answers_json, status, started_at) VALUES
  ('at1', 'a-taken', 'p3', '{"q1": "opt-a", "2": "opt-b", "unknown": "opt-c", "1": "opt-d"}', 'submitted', '2026-03-04 05:06:07'),
  ('at2', 'a-unused', 'p1', 'not json', 'in_progress', '2026-03-04 05:06:07'),
  ('at3', 'a-unused', 'p3', '{}', 'in_progress', '2026-03-04 05:06:07');
INSERT INTO assessment_results (id, attempt_id, student_id, score, max_score, percentage, grade) VALUES
  ('r1', 'at1', 'p3', 5, 40, 12.5, '2');
INSERT INTO audit_logs (id, user_id, action) VALUES ('l1', 'u1', 'old');
INSERT INTO subjects (id, tenant_id, name, code) VALUES ('sub1', 't-big', 'Math', 'MATH');
INSERT INTO curriculum_resources (id, tenant_id, subject_code, grade_level, title, topic, resource_type) VALUES
  ('cr1', 't-big', 'inf', 11, 't', 't', 'PRESENTATION');
INSERT INTO assessment_solutions (id, assessment_id, question_id, step_by_step_solution) VALUES ('as1', 'x', 'y', 'z');
"""

DATA_TABLES = (
    "tenants", "schools", "users", "class_groups", "students", "assessments", "questions",
    "assessment_attempts", "assessment_results", "audit_logs", "subjects", "curriculum_resources",
    "assessment_solutions",
)


def run_sql(*statements: str) -> None:
    async def execute():
        connection = await asyncpg.connect(asyncpg_dsn(), server_settings={"search_path": SCHEMA})
        try:
            for statement in statements:
                await connection.execute(statement)
        finally:
            await connection.close()

    asyncio.run(execute())


def fetch(query: str) -> list[tuple]:
    async def execute():
        connection = await asyncpg.connect(asyncpg_dsn(), server_settings={"search_path": SCHEMA})
        try:
            return [tuple(row) for row in await connection.fetch(query)]
        finally:
            await connection.close()

    return asyncio.run(execute())


def counts() -> dict[str, int]:
    return {table: fetch(f"SELECT COUNT(*) FROM {table}")[0][0] for table in DATA_TABLES}


def assert_models_match_database() -> None:
    config = Config()
    config.set_main_option("script_location", str(settings.BASE_DIR / "backend" / "app" / "db" / "migrations"))
    config.attributes["database_url"] = SCHEMA_URL
    command.check(config)  # raises if autogenerate would change anything


@pytest.fixture
def empty_schema(migrated_database):
    run_sql(f"DROP SCHEMA IF EXISTS {SCHEMA} CASCADE", f"CREATE SCHEMA {SCHEMA}")
    yield
    run_sql(f"DROP SCHEMA IF EXISTS {SCHEMA} CASCADE")


def test_empty_database_ends_up_matching_the_models(empty_schema):
    migrate(SCHEMA_URL)
    assert_models_match_database()
    migrate(SCHEMA_URL)  # running again changes nothing


def test_existing_installation_keeps_its_data(empty_schema):
    run_sql(LEGACY_SCHEMA, LEGACY_DATA)
    before = counts()

    migrate(SCHEMA_URL)

    assert counts() == before
    assert_models_match_database()

    # Answers keyed by question id or number are moved; the id wins over the number
    assert fetch("SELECT attempt_id, question_id, option_id FROM attempt_answers ORDER BY question_id") == [
        ("at1", "q1", "opt-a"),
        ("at1", "q2", "opt-b"),
    ]
    # Nothing is thrown away
    assert fetch("SELECT answers_json FROM assessment_attempts WHERE id = 'at2'") == [("not json",)]
    # Owner: the school that took it, otherwise the largest school ('a-unused' was taken by both)
    assert fetch("SELECT id, tenant_id FROM assessments ORDER BY id") == [
        ("a-taken", "t-small"),
        ("a-unused", "t-big"),
    ]
    assert fetch("SELECT birth_date FROM students ORDER BY id") == [
        (date(2008, 5, 15),), (date(2009, 12, 31),), (date(2008, 1, 1),)
    ]
    assert fetch("SELECT started_at FROM assessment_attempts WHERE id = 'at1'") == [
        (datetime(2026, 3, 4, 5, 6, 7, tzinfo=UTC),)
    ]
    assert fetch("SELECT id, school_id, token_version FROM users ORDER BY id") == [
        ("u1", "s-big", 0), ("u2", "s-small", 0)
    ]


def test_installation_missing_late_columns_is_completed(empty_schema):
    run_sql(
        LEGACY_SCHEMA,
        'ALTER TABLE class_groups DROP COLUMN has_groups',
        'ALTER TABLE students DROP COLUMN "group", DROP COLUMN emaktab_id',
        'ALTER TABLE assessments DROP COLUMN target_group',
        "DROP TABLE curriculum_resources, assessment_solutions",
    )
    migrate(SCHEMA_URL)
    assert_models_match_database()
