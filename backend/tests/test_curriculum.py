import sqlite3
import pytest
from fastapi.testclient import TestClient
from backend.tests.conftest import TEST_DB_FILE


@pytest.fixture(scope="module", autouse=True)
def seed_curriculum_test_data(client: TestClient):
    conn = sqlite3.connect(str(TEST_DB_FILE))
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM curriculum_resources")
        cur.execute("DELETE FROM assessment_solutions")
        for grade in range(5, 12):
            for r_type, label in [
                ("PRESENTATION", "Taqdimot"),
                ("WORKSHEET", "Topshiriq"),
                ("WORKBOOK", "Nazorat daftari"),
                ("SOLUTION", "Yechimlar"),
            ]:
                cur.execute(
                    """
                    INSERT INTO curriculum_resources (
                        id, tenant_id, subject_code, grade_level, quarter, lesson_number,
                        title, topic, resource_type, content_json, download_count
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        f"cur-{grade}-{r_type.lower()}",
                        "tenant-al-xorazmiy",
                        "inf",
                        grade,
                        1,
                        1,
                        f"{grade}-sinf {label}",
                        f"Mavzu {grade}",
                        r_type,
                        "{}",
                        0,
                    ),
                )
        for q_num in range(1, 16):
            cur.execute(
                """
                INSERT INTO assessment_solutions (
                    id, assessment_id, question_id, variant_number, step_by_step_solution
                ) VALUES (?, ?, ?, ?, ?)
                """,
                (
                    f"sol-11-{q_num}",
                    "chsb-inf-11-q1",
                    f"q-{q_num}",
                    1,
                    f"{q_num}-savol Yechimi",
                ),
            )
        conn.commit()
    finally:
        conn.close()


def test_get_available_grades(client: TestClient, teacher_headers: dict[str, str]):
    response = client.get("/api/v1/curriculum/grades", headers=teacher_headers)
    assert response.status_code == 200
    grades = response.json()
    assert isinstance(grades, list)
    assert grades == [5, 6, 7, 8, 9, 10, 11]


def test_list_curriculum_resources_all(client: TestClient, teacher_headers: dict[str, str]):
    response = client.get("/api/v1/curriculum/resources?tenantSlug=al-xorazmiy", headers=teacher_headers)
    assert response.status_code == 200
    resources = response.json()
    assert len(resources) >= 28


def test_filter_curriculum_by_grade(client: TestClient, teacher_headers: dict[str, str]):
    response = client.get(
        "/api/v1/curriculum/resources?gradeLevel=11&tenantSlug=al-xorazmiy",
        headers=teacher_headers,
    )
    assert response.status_code == 200
    resources = response.json()
    assert len(resources) == 4
    types = {r["resourceType"] for r in resources}
    assert types == {"PRESENTATION", "WORKSHEET", "WORKBOOK", "SOLUTION"}


def test_filter_curriculum_by_type_presentation(client: TestClient, teacher_headers: dict[str, str]):
    response = client.get(
        "/api/v1/curriculum/resources?resourceType=PRESENTATION&tenantSlug=al-xorazmiy",
        headers=teacher_headers,
    )
    assert response.status_code == 200
    presentations = response.json()
    assert len(presentations) == 7
    for p in presentations:
        assert p["resourceType"] == "PRESENTATION"
        assert "Taqdimot" in p["title"]


def test_get_assessment_solutions_chsb_11(client: TestClient, teacher_headers: dict[str, str]):
    response = client.get("/api/v1/curriculum/solutions/chsb-inf-11-q1", headers=teacher_headers)
    assert response.status_code == 200
    solutions = response.json()
    assert len(solutions) == 15
    first_sol = solutions[0]
    assert first_sol["assessmentId"] == "chsb-inf-11-q1"
    assert "Yechimi" in first_sol["stepByStepSolution"]
