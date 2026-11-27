from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient


def test_extract_questions_proxy_without_key_returns_clean_fallback(
    client: TestClient,
    teacher_headers: dict[str, str],
    monkeypatch,
):
    monkeypatch.setattr("backend.app.api.v1.endpoints.ai.settings.GEMINI_API_KEY", "")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    res = client.post(
        "/api/v1/ai/extract-questions",
        headers=teacher_headers,
        json={"rawText": "1-topshiriq. Test savol matni", "maxScore": 50},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is False
    assert data["questions"] == []
    assert "kaliti sozlanmagan" in data["error"]


def test_extract_questions_proxy_parses_mocked_gemini_output(
    client: TestClient,
    teacher_headers: dict[str, str],
    monkeypatch,
):
    monkeypatch.setattr("backend.app.api.v1.endpoints.ai.settings.GEMINI_API_KEY", "test-server-key")

    mock_items = [
        {
            "number": 1,
            "title": "1-topshiriq",
            "prompt": "Kiritish qurilmalari – __ __",
            "taskType": "subquestions",
            "points": 10,
            "subQuestions": [
                {"id": "1-a", "label": "a)", "prompt": "Klaviatura — __", "points": 5, "rubric": "5 ball"},
                {"id": "1-b", "label": "b)", "prompt": "Sichqoncha", "points": 5, "rubric": "5 ball"},
            ],
            "sourceExcerpt": "1-topshiriq. Kiritish qurilmalari",
        }
    ]

    with patch("backend.app.api.v1.endpoints.ai._call_gemini_json", new=AsyncMock(return_value=mock_items)):
        res = client.post(
            "/api/v1/ai/extract-questions",
            headers=teacher_headers,
            json={"rawText": "1-topshiriq. Kiritish qurilmalari", "maxScore": 50},
        )

    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["questions"]) == 1
    q = data["questions"][0]
    assert q["isApprovedByHuman"] is False
    assert "_" not in q["prompt"]
    assert q["subQuestions"][0]["prompt"] == "Klaviatura"


def test_extract_roster_proxy_parses_mocked_gemini_output(
    client: TestClient,
    teacher_headers: dict[str, str],
    monkeypatch,
):
    monkeypatch.setattr("backend.app.api.v1.endpoints.ai.settings.GEMINI_API_KEY", "test-server-key")

    mock_roster = [
        {
            "orderIndex": 1,
            "fullName": "Karimova Dilnoza",
            "firstName": "Dilnoza",
            "lastName": "Karimova",
            "gender": "F",
            "emaktabId": "1000001234567",
        }
    ]

    with patch("backend.app.api.v1.endpoints.ai._call_gemini_json", new=AsyncMock(return_value=mock_roster)):
        res = client.post(
            "/api/v1/ai/extract-roster",
            headers=teacher_headers,
            json={"rawText": "1 Karimova Dilnoza 1000001234567", "defaultGroup": "1-guruh"},
        )

    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["students"]) == 1
    assert data["students"][0]["firstName"] == "Dilnoza"
    assert data["students"][0]["gender"] == "F"
