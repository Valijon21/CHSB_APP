"""
Tests run against a real PostgreSQL database that is wiped at the start of a run.

    TEST_DATABASE_URL=postgresql://user:password@127.0.0.1:5432/chsb_test pytest backend/tests

The database name must end with "_test", so real data cannot be wiped by accident.
"""
import asyncio
import os
import secrets

DEFAULT_TEST_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5432/chsb_test"
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", DEFAULT_TEST_DATABASE_URL)

# Set before the application is imported; environment variables win over .env
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["JWT_SECRET"] = secrets.token_urlsafe(48)
os.environ["SEED_PASSWORD"] = ""
os.environ["LOG_LEVEL"] = "WARNING"

import asyncpg
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from backend.app.core.security import create_access_token, get_password_hash
from backend.app.db.seed import bootstrap, seed_curriculum
from backend.app.db.session import database
from backend.app.db.url import parse_database_url
from backend.app.main import app
from backend.app.manage import migrate
from backend.app.models import ClassGroup, User
from backend.app.services.auth import reset_login_limits

TEST_PASSWORD = "test-only-password-1"

# username -> (tenant id, role, full name)
TEST_USERS = {
    "teacher_ax": ("tenant-al-xorazmiy", "TEACHER", "Anvar Rahimov"),
    "teacher_ax_2": ("tenant-al-xorazmiy", "TEACHER", "Ikkinchi O'qituvchi"),
    "admin_ax": ("tenant-al-xorazmiy", "SCHOOL_ADMIN", "Al-Xorazmiy Administrator"),
    "inspector_tashkent": ("tenant-al-xorazmiy", "REGIONAL_INSPECTOR", "Shavkat Rahimov (ShHTB)"),
    "test_admin_tm": ("tenant-temurbeklar", "SCHOOL_ADMIN", "Temurbeklar Test Admin"),
}


def asyncpg_dsn() -> str:
    url, _ = parse_database_url(TEST_DATABASE_URL)
    return url.set(drivername="postgresql").render_as_string(hide_password=False)


async def _reset_schema() -> None:
    connection = await asyncpg.connect(asyncpg_dsn())
    try:
        await connection.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public")
    finally:
        await connection.close()


async def ensure_test_users() -> None:
    """Create the test users, or put them back into their initial state."""
    hashed = get_password_hash(TEST_PASSWORD)
    async with database.session() as db:
        for username, (tenant_id, role, full_name) in TEST_USERS.items():
            user = await db.scalar(select(User).where(User.username == username))
            if not user:
                user = User(username=username, token_version=0)
                db.add(user)
            user.tenant_id = tenant_id
            user.role = role
            user.full_name = full_name
            user.hashed_password = hashed
            user.is_active = True
            user.token_version = 0
        await db.commit()


async def _seed() -> None:
    database.connect()
    try:
        async with database.session() as db:
            await bootstrap(db)
            await seed_curriculum(db)
            for class_id, name in (("class-ax-11a", "11-A sinf"), ("class-ax-11b", "11-B sinf")):
                db.add(ClassGroup(
                    id=class_id, school_id="school-ax-1", tenant_id="tenant-al-xorazmiy",
                    name=name, grade_level=11,
                ))
            await db.commit()
        await ensure_test_users()
    finally:
        await database.disconnect()


@pytest.fixture(scope="session")
def migrated_database():
    url, _ = parse_database_url(TEST_DATABASE_URL)
    if not (url.database or "").endswith("_test"):
        pytest.exit(f"Refusing to wipe '{url.database}': the test database name must end with _test", 2)
    try:
        asyncio.run(_reset_schema())
    except (OSError, asyncpg.PostgresError) as error:
        pytest.exit(f"Test database is not available ({error}). See backend/tests/conftest.py", 2)
    migrate()
    asyncio.run(_seed())


def auth_headers(username: str) -> dict[str, str]:
    tenant_id, role, _ = TEST_USERS[username]
    token = create_access_token(subject=username, role=role, tenant_id=tenant_id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
def fresh_login_limits():
    reset_login_limits()


@pytest.fixture(scope="module")
def client(migrated_database):
    """Signed in as the al-Xorazmiy school admin unless a request overrides the header."""
    with TestClient(app) as test_client:
        test_client.portal.call(ensure_test_users)
        test_client.headers.update(auth_headers("admin_ax"))
        yield test_client
