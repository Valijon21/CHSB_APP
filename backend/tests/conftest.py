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
