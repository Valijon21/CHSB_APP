"""
Passwords, sign-in limits, the audit trail and the error format.
"""
import json

from fastapi.testclient import TestClient
from sqlalchemy import select, update

from backend.app.core.ratelimit import SlidingWindowLimiter
from backend.app.db.session import database
from backend.app.db.url import parse_database_url
from backend.app.models import AuditLog, User
from backend.tests.conftest import TEST_PASSWORD, auth_headers, ensure_test_users

NEW_PASSWORD = "another-private-password-2"


def sign_in(client: TestClient, username: str, password: str = TEST_PASSWORD):
    return client.post("/api/v1/auth/login", json={"username": username, "password": password})


def bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def audit_entries(client: TestClient, action: str) -> list[AuditLog]:
    async def load():
        async with database.session() as db:
            return list(await db.scalars(select(AuditLog).where(AuditLog.action == action)))

    return client.portal.call(load)


def test_changing_the_password_signs_out_other_sessions(client: TestClient):
    old_token = sign_in(client, "teacher_ax").json()["access_token"]

    response = client.post(
        "/api/v1/auth/change-password",
        headers=bearer(old_token),
        json={"currentPassword": TEST_PASSWORD, "newPassword": NEW_PASSWORD},
    )
    assert response.status_code == 200
    new_token = response.json()["access_token"]

    assert client.get("/api/v1/auth/me", headers=bearer(old_token)).status_code == 401
    assert client.get("/api/v1/auth/me", headers=bearer(new_token)).status_code == 200
    assert sign_in(client, "teacher_ax").status_code == 401
    assert sign_in(client, "teacher_ax", NEW_PASSWORD).status_code == 200
    assert audit_entries(client, "auth.password_changed")
    client.portal.call(ensure_test_users)


def test_password_change_is_validated(client: TestClient):
    headers = auth_headers("teacher_ax")
    for current, new in [
        ("wrong-current-password", NEW_PASSWORD),
        (TEST_PASSWORD, "short"),
        (TEST_PASSWORD, "Secret123!"),
        (TEST_PASSWORD, TEST_PASSWORD),
        (TEST_PASSWORD, "x" * 80),
    ]:
        response = client.post(
            "/api/v1/auth/change-password", headers=headers, json={"currentPassword": current, "newPassword": new}
        )
        assert response.status_code == 400, (current, new, response.text)
    assert sign_in(client, "teacher_ax").status_code == 200


def test_repeated_failures_are_blocked(client: TestClient):
    for _ in range(5):
        assert sign_in(client, "admin_ax", "wrong-password").status_code == 401

    blocked = sign_in(client, "admin_ax")  # even the right password has to wait
    assert blocked.status_code == 429
    assert int(blocked.headers["Retry-After"]) > 0
    assert blocked.json()["code"] == "rate_limited"
    # Other accounts are not affected
    assert sign_in(client, "teacher_ax").status_code == 200
    assert len(audit_entries(client, "auth.login_failed")) >= 5


def test_deactivated_user_loses_access(client: TestClient):
    headers = auth_headers("teacher_ax_2")
    assert client.get("/api/v1/auth/me", headers=headers).status_code == 200

    async def deactivate():
        async with database.session() as db:
            await db.execute(update(User).where(User.username == "teacher_ax_2").values(is_active=False))
            await db.commit()

    client.portal.call(deactivate)
    assert client.get("/api/v1/auth/me", headers=headers).status_code == 401
    client.portal.call(ensure_test_users)


def test_changes_are_audited_without_secrets(client: TestClient):
    sign_in(client, "admin_ax")
    client.delete("/api/v1/students?tenantSlug=al-xorazmiy&classGroupId=class-ax-11b")

    deleted = audit_entries(client, "student.deleted_many")
    assert deleted and deleted[-1].tenant_id == "tenant-al-xorazmiy" and deleted[-1].user_id
    assert json.loads(deleted[-1].details_json)["classGroupId"] == "class-ax-11b"
    for action in ("auth.login", "auth.login_failed"):
        assert all(TEST_PASSWORD not in (e.details_json or "") for e in audit_entries(client, action))


def test_errors_share_one_format_and_carry_the_request_id(client: TestClient):
    response = client.get("/api/v1/classes/missing", headers={"X-Request-ID": "trace-123"})
    assert response.status_code == 404
    assert response.json() == {"detail": "Sinf guruhi topilmadi.", "code": "not_found", "requestId": "trace-123"}
    assert response.headers["X-Request-ID"] == "trace-123"

    unsafe = client.get("/health", headers={"X-Request-ID": "bad value\twith spaces"})
    assert unsafe.headers["X-Request-ID"] != "bad value\twith spaces"


def test_validation_errors_do_not_echo_the_input(client: TestClient):
    response = client.post("/api/v1/auth/login", json={"username": "ab", "password": "zz9"})
    assert response.status_code == 422
    body = response.json()
    assert isinstance(body["detail"], str) and body["code"] == "validation_error"
    assert "zz9" not in response.text


def test_limiter_forgets_old_attempts():
    now = [0.0]
    limiter = SlidingWindowLimiter(2, 60, clock=lambda: now[0])
    limiter.record("k")
    limiter.record("k")
    assert limiter.retry_after("k") > 0
    now[0] = 61
    assert limiter.retry_after("k") == 0


def test_provider_connection_strings_are_accepted():
    url, args = parse_database_url(
        "postgresql://u:p@ep-x-pooler.eu.aws.neon.tech/db?sslmode=require&channel_binding=require&schema=public"
    )
    assert url.drivername == "postgresql+asyncpg"
    assert dict(url.query) == {}
    assert args == {"ssl": "require", "statement_cache_size": 0}
