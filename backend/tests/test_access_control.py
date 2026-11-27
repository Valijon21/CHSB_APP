"""
Access control: who may call what, and whose data they may see.
"""
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import update

from backend.app.core.config import Settings, settings
from backend.app.core.security import STUDENT_TOKEN, create_access_token, get_password_hash
from backend.app.db.session import database
from backend.app.main import app
from backend.app.models import User
from backend.tests.conftest import TEST_PASSWORD, auth_headers

ANONYMOUS = {"Authorization": ""}
PUBLIC_ROUTES = {
    ("POST", "/api/v1/auth/login"),
    ("GET", "/api/v1/tenants/{slug}/context"),
}


def api_operations():
    for path, methods in app.openapi()["paths"].items():
        if path.startswith(settings.API_V1_STR):
            for method in methods:
                yield method.upper(), path


def test_every_non_public_route_rejects_anonymous_requests(client: TestClient):
    operations = list(api_operations())
    assert len(operations) > 30
    assert PUBLIC_ROUTES <= set(operations)

    open_routes = []
    for method, path in operations:
        if (method, path) in PUBLIC_ROUTES:
            continue
        url = path
        while "{" in url:
            url = url[: url.index("{")] + "x" + url[url.index("}") + 1 :]
        response = client.request(method, url, headers=ANONYMOUS)
        if response.status_code != 401:
            open_routes.append((method, path, response.status_code))
    assert open_routes == []


@pytest.mark.parametrize("token_type", [STUDENT_TOKEN, ""])
def test_only_staff_tokens_open_staff_routes(client: TestClient, token_type: str):
    # Same signing key and a real staff username, but not a staff token
    token = create_access_token(
        subject="admin_ax", role="STUDENT", tenant_id="tenant-al-xorazmiy", token_type=token_type
    )
    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


@pytest.mark.parametrize(
    "method,url",
    [
        ("POST", "/api/v1/classes"),
        ("DELETE", "/api/v1/classes?tenantSlug=al-xorazmiy"),
        ("DELETE", "/api/v1/classes/x"),
        ("POST", "/api/v1/students"),
        ("POST", "/api/v1/students/bulk"),
        ("POST", "/api/v1/students/bulk-delete"),
        ("POST", "/api/v1/students/parse-file"),
        ("DELETE", "/api/v1/students?tenantSlug=al-xorazmiy"),
        ("DELETE", "/api/v1/students/x"),
        ("POST", "/api/v1/subjects"),
        ("DELETE", "/api/v1/subjects/x"),
        ("GET", "/api/v1/regional/overview"),
    ],
)
def test_teacher_cannot_administer_or_oversee(client: TestClient, method: str, url: str):
    response = client.request(method, url, headers=auth_headers("teacher_ax"))
    assert response.status_code == 403


@pytest.mark.parametrize(
    "url",
    [
        "/api/v1/students",
        "/api/v1/classes",
        "/api/v1/assessments",
        "/api/v1/analytics/al-xorazmiy",
        "/api/v1/results/tenant/al-xorazmiy",
    ],
)
def test_inspector_cannot_read_school_data(client: TestClient, url: str):
    response = client.get(url, headers=auth_headers("inspector_tashkent"))
    assert response.status_code == 403


@pytest.fixture
def home_student(client: TestClient):
    """A student of al-Xorazmiy, together with the class."""
    created_class = client.post(
        "/api/v1/classes",
        json={"schoolId": "school-ax-1", "tenantSlug": "al-xorazmiy", "name": "7-Z sinf", "gradeLevel": 7},
    ).json()
    client.post(
        "/api/v1/students",
        json={"tenantSlug": "al-xorazmiy", "classGroupId": created_class["id"], "firstName": "Izolyatsiya", "lastName": "Tekshiruv"},
    )
    students = client.get(f"/api/v1/students?classGroupId={created_class['id']}").json()
    yield students[0]
    client.delete(f"/api/v1/classes/{created_class['id']}")


def test_other_tenant_cannot_read_or_destroy(client: TestClient, home_student: dict):
    foreign = auth_headers("test_admin_tm")
    class_id = home_student["classGroupId"]
    student_id = home_student["id"]

    for method, url in [
        ("GET", "/api/v1/students?tenantSlug=al-xorazmiy"),
        ("GET", "/api/v1/classes?tenantSlug=al-xorazmiy"),
        ("GET", f"/api/v1/classes/{class_id}"),
        ("GET", "/api/v1/subjects?tenantSlug=al-xorazmiy"),
        ("GET", "/api/v1/curriculum/resources?tenantSlug=al-xorazmiy"),
        ("GET", "/api/v1/analytics/al-xorazmiy"),
        ("GET", "/api/v1/results/tenant/al-xorazmiy"),
        ("GET", "/api/v1/tenants/tenant-al-xorazmiy"),
        ("DELETE", f"/api/v1/students/{student_id}"),
        ("DELETE", f"/api/v1/classes/{class_id}"),
        ("DELETE", "/api/v1/students?tenantSlug=al-xorazmiy"),
        ("DELETE", "/api/v1/classes?tenantSlug=al-xorazmiy"),
        # Own tenant, foreign class
        ("DELETE", f"/api/v1/students?tenantSlug=temurbeklar-maktabi&classGroupId={class_id}"),
    ]:
        response = client.request(method, url, headers=foreign)
        assert response.status_code == 404, (method, url, response.status_code)

    attempt = client.post(
        "/api/v1/attempts",
        headers=foreign,
        json={"tenantId": "x", "assessmentId": "x", "rosterRecordId": student_id},
    )
    assert attempt.status_code == 404

    bulk_delete = client.post("/api/v1/students/bulk-delete", headers=foreign, json={"studentIds": [student_id]})
    assert bulk_delete.json()["deletedCount"] == 0

    bulk_create = client.post(
        "/api/v1/students/bulk",
        headers=foreign,
        json=[{"tenantSlug": "al-xorazmiy", "classGroupId": class_id, "firstName": "Begona", "lastName": "Yozuv"}],
    )
    assert bulk_create.status_code == 404

    remaining = client.get(f"/api/v1/students?classGroupId={class_id}").json()
    assert [s["id"] for s in remaining] == [student_id]

    own_list = client.get("/api/v1/tenants", headers=foreign).json()
    assert [t["slug"] for t in own_list] == ["temurbeklar-maktabi"]


@pytest.mark.parametrize("url", ["/api/v1/students", "/api/v1/classes"])
def test_mass_delete_requires_an_explicit_tenant(client: TestClient, url: str):
    assert client.delete(url).status_code == 422


def test_login_returns_tenant(client: TestClient):
    response = client.post("/api/v1/auth/login", json={"username": "admin_ax", "password": TEST_PASSWORD})
    assert response.status_code == 200
    assert response.json()["user"]["tenantSlug"] == "al-xorazmiy"


def test_published_default_password_is_blocked(client: TestClient):
    async def set_default_password():
        async with database.session() as db:
            await db.execute(
                update(User)
                .where(User.username == "test_admin_tm")
                .values(hashed_password=get_password_hash("Secret123!"))
            )
            await db.commit()

    client.portal.call(set_default_password)
    response = client.post("/api/v1/auth/login", json={"username": "test_admin_tm", "password": "Secret123!"})
    assert response.status_code == 403
    assert "access_token" not in response.json()


@pytest.mark.parametrize(
    "url",
    [
        "/api/v1/regional/overview",
        "/api/v1/regional/districts",
        "/api/v1/regional/rankings",
        "/api/v1/regional/anomalies",
    ],
)
def test_inspector_can_open_oversight(client: TestClient, url: str):
    response = client.get(url, headers=auth_headers("inspector_tashkent"))
    assert response.status_code == 200


def test_debug_endpoint_is_gone(client: TestClient):
    assert client.get("/api/v1/system/debug-db").status_code == 404


@pytest.mark.parametrize(
    "url",
    ["/%2e%2e/canary.txt", "/..%2fcanary.txt", "/%2e%2e/%2e%2e/canary.txt", "/assets/..%2f..%2fcanary.txt"],
)
def test_files_outside_the_frontend_build_are_never_served(
    client: TestClient, tmp_path: Path, monkeypatch, url: str
):
    dist = tmp_path / "dist"
    dist.mkdir()
    (dist / "index.html").write_text("<html>app</html>")
    (tmp_path / "canary.txt").write_text("CANARY-OUTSIDE-DIST")
    monkeypatch.setattr(settings, "FRONTEND_DIST", dist)

    assert "CANARY-OUTSIDE-DIST" not in client.get(url).text


@pytest.mark.parametrize("secret", ["", "short", "chsb-super-secure-jwt-key-2026-production"])
def test_weak_or_published_jwt_secret_is_refused(secret: str):
    with pytest.raises(ValidationError):
        Settings(JWT_SECRET=secret)
