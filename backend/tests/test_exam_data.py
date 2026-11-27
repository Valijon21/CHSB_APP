"""
Answers, grading and ownership of assessments.
"""
import pytest
from fastapi.testclient import TestClient

from backend.tests.conftest import auth_headers

CODE = "EXAM-DATA-1"


@pytest.fixture(scope="module")
def exam(client: TestClient) -> dict:
    teacher = auth_headers("teacher_ax")
    created = client.post(
        "/api/v1/assessments",
        headers=teacher,
        json={"title": "Javoblar tekshiruvi", "subject": "Fizika", "gradeLevel": 11, "totalQuestions": 4,
              "maxScore": 10, "code": CODE},
    )
    assert created.status_code == 200
    return client.get(f"/api/v1/assessments/{CODE}", headers=teacher).json()


@pytest.fixture
def attempt(client: TestClient, exam: dict) -> dict:
    student = client.post(
        "/api/v1/students",
        json={"tenantSlug": "al-xorazmiy", "classGroupId": "class-ax-11a", "firstName": "Javob",
              "lastName": "Beruvchi"},
    ).json()
    response = client.post(
        "/api/v1/attempts",
        json={"tenantId": "al-xorazmiy", "assessmentId": exam["code"], "rosterRecordId": student["id"]},
    )
    assert response.status_code == 200
    yield response.json()
    client.delete(f"/api/v1/students/{student['id']}")


def save(client: TestClient, attempt_id: str, answers: dict):
    return client.post(f"/api/v1/attempts/{attempt_id}/draft", json={"answers": answers})


def test_each_save_adds_to_the_earlier_answers(client: TestClient, exam: dict, attempt: dict):
    # The exam screen sends one answer per click
    for question in exam["questions"]:
        assert save(client, attempt["id"], {question["id"]: "opt-b"}).status_code == 200
        assert save(client, attempt["id"], {question["id"]: question["correctOptionId"]}).status_code == 200

    stored = client.get(f"/api/v1/attempts/{attempt['id']}").json()["answers"]
    assert stored == {q["id"]: q["correctOptionId"] for q in exam["questions"]}

    result = client.post(f"/api/v1/attempts/{attempt['id']}/submit", json={}).json()
    assert (result["score"], result["grade"]) == (10.0, "5")


def test_submitted_attempt_is_locked(client: TestClient, exam: dict, attempt: dict):
    first_question = exam["questions"][0]
    save(client, attempt["id"], {first_question["id"]: first_question["correctOptionId"]})
    first = client.post(f"/api/v1/attempts/{attempt['id']}/submit", json={}).json()

    assert save(client, attempt["id"], {first_question["id"]: "opt-b"}).status_code == 409
    again = client.post(f"/api/v1/attempts/{attempt['id']}/submit", json={}).json()
    assert again == first
    result = client.get(f"/api/v1/results/attempt/{attempt['id']}").json()
    assert result["score"] == first["score"] == 2.5


def test_unknown_answer_keys_are_ignored(client: TestClient, attempt: dict):
    assert save(client, attempt["id"], {"no-such-question": "opt-a", "99": "opt-a"}).status_code == 200
    assert client.get(f"/api/v1/attempts/{attempt['id']}").json()["answers"] == {}


def test_assessments_belong_to_one_school(client: TestClient, exam: dict):
    foreign = auth_headers("test_admin_tm")
    assert CODE not in [a["code"] for a in client.get("/api/v1/assessments", headers=foreign).json()]
    assert client.get(f"/api/v1/assessments/{CODE}", headers=foreign).status_code == 404
    assert client.get("/api/v1/assessments?tenantId=al-xorazmiy", headers=foreign).status_code == 404

    question = exam["questions"][0]
    url = f"/api/v1/assessments/{exam['id']}/questions/{question['id']}"
    assert client.put(url, headers=foreign, json={"prompt": "o'zgartirildi"}).status_code == 404

    taken = client.post(
        "/api/v1/assessments", headers=foreign,
        json={"title": "Boshqa maktab", "subject": "Fizika", "code": CODE},
    )
    assert taken.status_code == 409


def test_teachers_edit_only_their_own_questions(client: TestClient, exam: dict):
    question = exam["questions"][1]
    url = f"/api/v1/assessments/{exam['id']}/questions/{question['id']}"
    body = {"prompt": "Yangilangan savol"}

    assert client.put(url, headers=auth_headers("teacher_ax_2"), json=body).status_code == 403
    assert client.put(url, headers=auth_headers("teacher_ax"), json=body).status_code == 200
    assert client.put(url, headers=auth_headers("admin_ax"), json=body).status_code == 200
