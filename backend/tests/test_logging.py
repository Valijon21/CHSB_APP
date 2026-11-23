from fastapi.testclient import TestClient
from pathlib import Path
from backend.app.core.logging import APP_LOG_PATH, ERROR_LOG_PATH

def test_trace_id_and_headers_in_response(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert "x-trace-id" in response.headers or "X-Trace-ID" in response.headers
    assert "x-process-time" in response.headers or "X-Process-Time" in response.headers

def test_app_log_written_to_disk(client: TestClient):
    # Perform a request that will be logged
    response = client.get("/api/v1/classes?tenantSlug=al-xorazmiy")
    assert response.status_code == 200

    # Verify app.log exists and contains the request log
    assert APP_LOG_PATH.exists()
    content = APP_LOG_PATH.read_text(encoding="utf-8")
    assert "/api/v1/classes" in content
    assert "trace_id=" in content

def test_system_logs_endpoint(client: TestClient):
    # 1. GET /api/v1/system/logs?log_type=app
    response = client.get("/api/v1/system/logs?log_type=app&limit=50")
    assert response.status_code == 200
    data = response.json()
    assert data["logType"] == "app"
    assert data["totalLines"] > 0
    assert isinstance(data["logs"], list)
    assert len(data["logs"]) > 0

    # 2. GET /api/v1/system/logs/download?log_type=app
    dl_resp = client.get("/api/v1/system/logs/download?log_type=app")
    assert dl_resp.status_code == 200
    assert dl_resp.headers["content-type"].startswith("text/plain")

