from pathlib import Path
from fastapi.testclient import TestClient
from backend.app.core.config import settings
from backend.app.core.logging_config import setup_logging


def test_regional_rankings_returns_district_id_without_500(
    client: TestClient,
    inspector_headers: dict[str, str],
):
    res = client.get("/api/v1/regional/rankings", headers=inspector_headers)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    if data:
        assert "districtName" in data[0]
        assert data[0]["districtName"]


def test_debug_db_hidden_when_debug_is_false(
    client: TestClient,
    inspector_headers: dict[str, str],
    monkeypatch,
):
    monkeypatch.setattr(settings, "DEBUG", False)
    res = client.get("/api/v1/system/debug-db", headers=inspector_headers)
    assert res.status_code == 404


def test_rotating_file_logger_writes_log_file(tmp_path: Path):
    log = setup_logging(log_dir=tmp_path)
    log.info("Rotating log verification entry")
    for h in log.handlers:
        h.flush()
    log_file = tmp_path / "backend.log"
    assert log_file.exists()
    assert "Rotating log verification entry" in log_file.read_text(encoding="utf-8")
