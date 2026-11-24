from fastapi.testclient import TestClient

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
        json={"username": "teacher_ax", "password": "Secret123!"},
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
    response = client.get("/api/v1/classes/class-ax-11a")
    assert response.status_code == 200
    data = response.json()
    assert data["classGroup"]["name"] == "11-A sinf"
    assert data["averageScore"] > 0
    assert len(data["students"]) > 0

def test_student_admission_verify(client: TestClient):
    response = client.post(
        "/api/v1/auth/admission/verify",
        json={"tenantSlug": "al-xorazmiy", "rosterCode": "STU-1101"},
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
    assert data["totalAssessed"] > 0
    assert data["averageScore"] > 0
    assert len(data["classComparisons"]) > 0

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
    response = client.get("/api/v1/tenants")
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
    response = client.get("/api/v1/assessments/chsb-inf-11-q1")
    assert response.status_code == 200
    data = response.json()
    assert data["code"].lower() == "chsb-inf-11-q1"
    assert len(data["questions"]) == 15

def test_regional_overview(client: TestClient):
    response = client.get("/api/v1/regional/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["totalSchools"] >= 2
    assert data["regionalAverageScore"] > 0
