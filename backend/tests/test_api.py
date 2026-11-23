from fastapi.testclient import TestClient

def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "postgresql-18"
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
    assert data["user"]["fullName"] == "Dilmurod Ustoz"
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
    assert data["student"]["firstName"] == "Alisher"
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
    assert data[0]["code"].lower() == "chsb-inf-11-q1"

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

def test_students_emaktab_fields(client: TestClient):
    response = client.get("/api/v1/students?tenantSlug=al-xorazmiy")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 70
    with_emaktab_id = [s for s in data if s.get("emaktabId")]
    assert len(with_emaktab_id) >= 73
    with_group = [s for s in data if s.get("groupName")]
    assert len(with_group) >= 40

def test_get_classes_with_teacher(client: TestClient):
    response = client.get("/api/v1/classes?tenantSlug=al-xorazmiy")
    assert response.status_code == 200
    classes = response.json()
    assert len(classes) >= 5
    # Verify 11-A has teacher Dilmurod Yunusov
    c_11a = next((c for c in classes if c["id"] == "class-ax-11a"), None)
    assert c_11a is not None
    assert c_11a["teacherId"] == "usr-teacher-01"
    assert "Dilmurod" in c_11a["teacherName"]

    # Test filtering by teacherId
    resp_filtered = client.get("/api/v1/classes?tenantSlug=al-xorazmiy&teacherId=usr-teacher-01")
    assert resp_filtered.status_code == 200
    filtered_classes = resp_filtered.json()
    assert len(filtered_classes) >= 3
    for fc in filtered_classes:
        assert fc["teacherId"] == "usr-teacher-01"

def test_create_class_and_assign_teacher(client: TestClient):
    # 1. Create a new class with teacher
    payload = {
        "schoolId": "sch-01",
        "tenantSlug": "al-xorazmiy",
        "name": "9-G sinf",
        "gradeLevel": 9,
        "shift": 1,
        "academicYear": "2026-2027",
        "teacherId": "usr-teacher-01",
    }
    create_resp = client.post("/api/v1/classes", json=payload)
    assert create_resp.status_code == 200
    new_class = create_resp.json()
    assert new_class["name"] == "9-G sinf"
    assert new_class["teacherId"] == "usr-teacher-01"
    assert "Dilmurod" in new_class["teacherName"]
    class_id = new_class["id"]

    # 2. Reassign teacher via PATCH /classes/{class_id}/teacher
    patch_resp = client.patch(
        f"/api/v1/classes/{class_id}/teacher",
        json={"teacherId": "usr-teacher-02", "teacherName": "Dilrabo Sharafxonova"},
    )
    assert patch_resp.status_code == 200
    patched_data = patch_resp.json()
    assert patched_data["teacherId"] == "usr-teacher-02"
    assert patched_data["teacherName"] == "Dilrabo Sharafxonova"

    # 3. Verify in detail
    detail_resp = client.get(f"/api/v1/classes/{class_id}")
    assert detail_resp.status_code == 200
    detail_data = detail_resp.json()
    assert detail_data["classGroup"]["teacherId"] == "usr-teacher-02"

def test_bulk_create_and_delete_students(client: TestClient):
    payload = [
        {
            "tenantSlug": "al-xorazmiy",
            "schoolId": "school-ax-1",
            "classGroupId": "class-ax-10a",
            "firstName": "Alisher",
            "lastName": "Navoiy",
            "middleName": "G'iyosiddin o'g'li",
            "gender": "M",
            "birthDate": "2009-02-09",
            "emaktabId": "2555715665172689999",
        },
        {
            "tenantSlug": "al-xorazmiy",
            "schoolId": "school-ax-1",
            "classGroupId": "class-ax-10a",
            "firstName": "Nodira",
            "lastName": "Komilova",
            "middleName": "Farhod qizi",
            "gender": "F",
            "birthDate": "2009-05-18",
        },
    ]

    bulk_resp = client.post("/api/v1/students/bulk", json=payload)
    assert bulk_resp.status_code == 200
    created_list = bulk_resp.json()
    assert len(created_list) == 2
    assert created_list[0]["lastName"] == "Navoiy"
    assert created_list[0]["emaktabId"] == "2555715665172689999"
    assert created_list[1]["gender"] == "F"

    # Clean up created students
    for st in created_list:
        del_resp = client.delete(f"/api/v1/students/{st['id']}")
        assert del_resp.status_code == 200



