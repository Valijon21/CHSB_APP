from fastapi.testclient import TestClient


def test_get_available_grades(client: TestClient):
    response = client.get("/api/v1/curriculum/grades")
    assert response.status_code == 200
    grades = response.json()
    assert isinstance(grades, list)
    assert grades == [5, 6, 7, 8, 9, 10, 11]

def test_list_curriculum_resources_all(client: TestClient):
    response = client.get("/api/v1/curriculum/resources?tenantSlug=al-xorazmiy")
    assert response.status_code == 200
    resources = response.json()
    assert len(resources) >= 28  # 7 grades * 4 types

def test_filter_curriculum_by_grade(client: TestClient):
    response = client.get("/api/v1/curriculum/resources?gradeLevel=11&tenantSlug=al-xorazmiy")
    assert response.status_code == 200
    resources = response.json()
    assert len(resources) == 4
    types = {r["resourceType"] for r in resources}
    assert types == {"PRESENTATION", "WORKSHEET", "WORKBOOK", "SOLUTION"}

def test_filter_curriculum_by_type_presentation(client: TestClient):
    response = client.get("/api/v1/curriculum/resources?resourceType=PRESENTATION&tenantSlug=al-xorazmiy")
    assert response.status_code == 200
    presentations = response.json()
    assert len(presentations) == 7  # Grades 5 to 11
    for p in presentations:
        assert p["resourceType"] == "PRESENTATION"
        assert "Taqdimot" in p["title"]

def test_get_assessment_solutions_chsb_11(client: TestClient):
    response = client.get("/api/v1/curriculum/solutions/chsb-inf-11-q1")
    assert response.status_code == 200
    solutions = response.json()
    assert len(solutions) == 15
    first_sol = solutions[0]
    assert first_sol["assessmentId"] == "chsb-inf-11-q1"
    assert "Yechimi" in first_sol["stepByStepSolution"]
