import os
import secrets
from pathlib import Path

# Ensure DATABASE_URL is present in os.environ for Prisma Client
BASE_DIR = Path(__file__).resolve().parents[2]
TEST_DB_FILE = BASE_DIR / "prisma" / "test.db"
os.environ["DATABASE_URL"] = f"file:{TEST_DB_FILE}"
os.environ["JWT_SECRET"] = secrets.token_urlsafe(48)

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.security import create_access_token, get_password_hash
from backend.app.db.prisma import prisma

TEST_PASSWORD = "test-only-password-1"

# username -> (tenant id, role, full name)
TEST_USERS = {
    "teacher_ax": ("tenant-al-xorazmiy", "TEACHER", "Anvar Rahimov"),
    "admin_ax": ("tenant-al-xorazmiy", "SCHOOL_ADMIN", "Al-Xorazmiy Administrator"),
    "inspector_tashkent": ("tenant-al-xorazmiy", "REGIONAL_INSPECTOR", "Shavkat Rahimov (ShHTB)"),
    "test_admin_tm": ("tenant-temurbeklar", "SCHOOL_ADMIN", "Temurbeklar Test Admin"),
}


async def _ensure_test_users() -> None:
    hashed = get_password_hash(TEST_PASSWORD)
    for username, (tenant_id, role, full_name) in TEST_USERS.items():
        data = {
            "tenantId": tenant_id,
            "role": role,
            "fullName": full_name,
            "hashedPassword": hashed,
            "isActive": True,
        }
        await prisma.user.upsert(
            where={"username": username},
            data={"create": {"username": username, **data}, "update": data},
        )


def auth_headers(username: str) -> dict[str, str]:
    tenant_id, role, _ = TEST_USERS[username]
    token = create_access_token(subject=username, role=role, tenant_id=tenant_id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def client():
    """Signed in as the al-Xorazmiy school admin unless a request overrides the header."""
    with TestClient(app) as test_client:
        test_client.portal.call(_ensure_test_users)
        test_client.headers.update(auth_headers("admin_ax"))
        yield test_client
