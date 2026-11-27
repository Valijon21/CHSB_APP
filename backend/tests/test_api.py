import pytest
from fastapi.testclient import TestClient
from backend.tests.conftest import TEST_PASSWORD, auth_headers

@pytest.fixture(autouse=True)
def setup_api_test_data(client: TestClient):
    # Ensure test classes exist
    for c_name in ["11-A sinf", "11-B sinf", "10-A sinf", "10-B sinf", "9-A sinf"]:
        client.post("/api/v1/classes", json={
            "schoolId": "school-ax-1",
            "tenantSlug": "al-xorazmiy",
            "name": c_name,
            "gradeLevel": int(c_name.split("-")[0]),
            "shift": 1,
            "academicYear": "2026-2027",
        })

    # Ensure test student STU-ZUXRA-TEST exists in 11-A
    c_res = client.get("/api/v1/classes?tenantSlug=al-xorazmiy")
    c_11a = next((c for c in c_res.json() if "11-A" in c["name"]), None)
    if c_11a:
        client.post("/api/v1/students", json={
            "tenantSlug": "al-xorazmiy",
            "schoolId": "school-ax-1",
            "classGroupId": c_11a["id"],
            "firstName": "Zuxra",
            "lastName": "Abduraximova",
            "middleName": "Farxod qizi",
            "gender": "F",
            "birthDate": "2008-05-15",
            "status": "eligible",
            "group": "1-guruh",
            "rosterCode": "STU-ZUXRA-TEST",
            "emaktabId": "1000001990090",
        })

    # Ensure test assessment exists
    questions = [
        {
            "questionNumber": i,
            "prompt": f"{i}-savol",
            "options": [
                {"id": "opt-a", "label": "A", "text": "A javob"},
                {"id": "opt-b", "label": "B", "text": "B javob"},
            ],
            "correctOptionId": "opt-a",
            "bloomLevel": "KNOWLEDGE",
            "difficulty": "easy",
            "points": 2.5,
        }
        for i in range(1, 16)
    ]
    client.post("/api/v1/assessments", json={
        "code": "CHSB-INF-11-Q1",
        "title": "Informatika va axborot texnologiyalari, 11-sinf. 1-ChSB",
        "subject": "Informatika va AT",
        "gradeLevel": 11,
        "quarter": 1,
        "durationMinutes": 40,
        "totalQuestions": 15,
        "maxScore": 40.0,
        "targetGroup": "all",
        "questions": questions,
    })
    yield

def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "prisma" in data["database"]
    assert data["orm"] == "prisma-client-py"

def test_auth_login_success(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "teacher_ax", "password": TEST_PASSWORD},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] == "TEACHER"
    assert data["user"]["fullName"] == "Anvar Rahimov"
    assert data["user"]["username"] == "teacher_ax"

def test_auth_login_invalid_password(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "teacher_ax", "password": "WrongPassword!"},
    )
    assert response.status_code == 401
    assert "Foydalanuvchi nomi yoki parol noto'g'ri" in response.json()["detail"]

def test_get_classes(client: TestClient):
    response = client.get("/api/v1/classes?tenantSlug=al-xorazmiy")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 5
    names = [c["name"] for c in data]
    assert "11-A sinf" in names

def test_get_class_detail(client: TestClient):
    c_res = client.get("/api/v1/classes?tenantSlug=al-xorazmiy")
    c_11a = next((c for c in c_res.json() if "11-A" in c["name"]), None)
    assert c_11a is not None
    cls_id = c_11a["id"]

    response = client.get(f"/api/v1/classes/{cls_id}")
    assert response.status_code == 200
    data = response.json()
    assert "11-A" in data["classGroup"]["name"]
    assert data["averageScore"] >= 0
    assert len(data["students"]) >= 1

def test_student_admission_verify(client: TestClient):
    response = client.post(
        "/api/v1/auth/admission/verify",
        json={"tenantSlug": "al-xorazmiy", "rosterCode": "STU-ZUXRA-TEST"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["student"]["firstName"] == "Zuxra"
    assert data["student"]["group"] == "1-guruh"
    assert data["student"]["emaktabId"] == "1000001990090"
    assert data["sessionToken"] is not None

def test_analytics_endpoint(client: TestClient):
    response = client.get("/api/v1/analytics/al-xorazmiy")
    assert response.status_code == 200
    data = response.json()
    assert "classComparisons" in data
    assert "scoreDistribution" in data
    assert data["totalStudents"] >= 0

def test_ai_class_diagnosis(client: TestClient):
    response = client.post(
        "/api/v1/ai/class-diagnosis",
        json={
            "className": "11-A",
            "averageScore": 34.2,
            "maxScore": 40.0,
            "qualityRate": 82,
            "participationRate": 92,
            "totalStudents": 25,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "className" in data
    assert "recommendations" in data or "insights" in data

def test_get_tenants(client: TestClient):
    response = client.get("/api/v1/tenants", headers=auth_headers("inspector_tashkent"))
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    slugs = [t["slug"] for t in data]
    assert "al-xorazmiy" in slugs

def test_get_tenant_context(client: TestClient):
    response = client.get("/api/v1/tenants/al-xorazmiy/context")
    assert response.status_code == 200
    data = response.json()
    assert data["tenantSlug"] == "al-xorazmiy"
    assert "Xorazmiy" in data["schoolName"]

def test_get_assessments(client: TestClient):
    response = client.get("/api/v1/assessments")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    codes = [a["code"].lower() for a in data]
    assert "chsb-inf-11-q1" in codes

def test_get_assessment_detail(client: TestClient):
    c_res = client.get("/api/v1/assessments")
    asm = next((a for a in c_res.json() if "chsb-inf-11-q1" in a["code"].lower()), None)
    assert asm is not None
    asm_id = asm["id"]

    response = client.get(f"/api/v1/assessments/{asm_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["code"].lower() == "chsb-inf-11-q1"
    assert len(data["questions"]) == 15

def test_regional_overview(client: TestClient):
    response = client.get("/api/v1/regional/overview", headers=auth_headers("inspector_tashkent"))
    assert response.status_code == 200
    data = response.json()
    assert data["totalSchools"] >= 2

def test_parse_student_roster_file_api(client: TestClient):
    csv_content = b"T/r,eMaktab ID,O'quvchi F.I.SH,Jinsi\n1,1000001990090,Abduraximova Zuxra Farxod qizi,F\n"
    response = client.post(
        "/api/v1/students/parse-file",
        files={"file": ("11-A_1-gurux.csv", csv_content, "text/csv")},
        data={"group": "1-guruh"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["totalParsed"] == 1
    assert data["detectedGroup"] == "1-guruh"
    assert data["students"][0]["fullName"] == "Abduraximova Zuxra Farxod qizi"
    assert data["students"][0]["emaktabId"] == "1000001990090"
    assert data["students"][0]["gender"] == "F"

def test_delete_all_students_endpoint(client: TestClient):
    c_res = client.get("/api/v1/classes?tenantSlug=al-xorazmiy")
    c_11a = next((c for c in c_res.json() if "11-A" in c["name"]), None)
    assert c_11a is not None

    create_res = client.post(
        "/api/v1/students",
        json={
            "tenantSlug": "al-xorazmiy",
            "schoolId": "school-ax-1",
            "classGroupId": c_11a["id"],
            "firstName": "TestStudent",
            "lastName": "DeleteMe",
            "gender": "M",
            "birthDate": "2008-01-01",
            "status": "eligible",
            "group": "1-guruh",
        },
    )
    assert create_res.status_code == 200
    stu_id = create_res.json()["id"]

    del_single = client.delete(f"/api/v1/students/{stu_id}")
    assert del_single.status_code == 200

    del_res = client.delete(
        "/api/v1/students?tenantSlug=temurbeklar-maktabi",
        headers=auth_headers("test_admin_tm"),
    )
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True
    assert "deletedCount" in del_res.json()
