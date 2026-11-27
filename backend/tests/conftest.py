import os
from pathlib import Path

# Ensure DATABASE_URL is present in os.environ for Prisma Client
BASE_DIR = Path(__file__).resolve().parents[2]
TEST_DB_FILE = BASE_DIR / "prisma" / "test.db"
os.environ["DATABASE_URL"] = f"file:{TEST_DB_FILE}"

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def teacher_headers(client: TestClient) -> dict[str, str]:
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "teacher_ax", "password": "Secret123!"},
    )
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def inspector_headers(client: TestClient) -> dict[str, str]:
    res = client.post(
        "/api/v1/auth/login",
        json={"username": "inspector_tashkent", "password": "Secret123!"},
    )
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
