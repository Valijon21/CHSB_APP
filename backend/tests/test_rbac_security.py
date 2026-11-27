from fastapi.testclient import TestClient


def test_protected_endpoints_reject_unauthenticated_requests(client: TestClient):
    endpoints = [
        ("GET", "/api/v1/classes?tenantSlug=al-xorazmiy"),
        ("POST", "/api/v1/classes"),
        ("GET", "/api/v1/students?tenantSlug=al-xorazmiy"),
        ("DELETE", "/api/v1/students"),
        ("GET", "/api/v1/assessments"),
        ("POST", "/api/v1/assessments"),
        ("GET", "/api/v1/subjects?tenantSlug=al-xorazmiy"),
        ("GET", "/api/v1/analytics/al-xorazmiy"),
        ("GET", "/api/v1/regional/overview"),
        ("GET", "/api/v1/curriculum/resources?tenantSlug=al-xorazmiy"),
        ("POST", "/api/v1/ai/class-diagnosis"),
    ]
    for method, path in endpoints:
        res = client.request(method, path, json={})
        assert res.status_code == 401, f"{method} {path} returned {res.status_code}"


def test_teacher_blocked_from_regional_and_other_tenant(
    client: TestClient,
    teacher_headers: dict[str, str],
    inspector_headers: dict[str, str],
):
    # Teacher cannot access regional oversight endpoints
    reg_res = client.get("/api/v1/regional/overview", headers=teacher_headers)
    assert reg_res.status_code == 403

    # Inspector CAN access regional oversight
    ok_res = client.get("/api/v1/regional/overview", headers=inspector_headers)
    assert ok_res.status_code == 200

    # Teacher from al-xorazmiy cannot read or delete temurbeklar-maktabi data
    cross_get = client.get("/api/v1/students?tenantSlug=temurbeklar-maktabi", headers=teacher_headers)
    assert cross_get.status_code == 403

    cross_del = client.delete("/api/v1/students?tenantSlug=temurbeklar-maktabi", headers=teacher_headers)
    assert cross_del.status_code == 403


def test_student_token_scoped_to_own_attempts_and_blocked_from_staff_routes(
    client: TestClient,
    teacher_headers: dict[str, str],
):
    # Ensure class + student exist
    cls_res = client.post(
        "/api/v1/classes",
        headers=teacher_headers,
        json={
            "schoolId": "school-ax-1",
            "tenantSlug": "al-xorazmiy",
            "name": "11-RBAC sinf",
            "gradeLevel": 11,
            "shift": 1,
            "academicYear": "2026-2027",
        },
    )
    assert cls_res.status_code == 200
    cls_id = cls_res.json()["id"]

    stu_res = client.post(
        "/api/v1/students",
        headers=teacher_headers,
        json={
            "tenantSlug": "al-xorazmiy",
            "schoolId": "school-ax-1",
            "classGroupId": cls_id,
            "firstName": "Rbac",
            "lastName": "Student",
            "gender": "M",
            "birthDate": "2008-01-01",
            "status": "eligible",
            "rosterCode": "STU-RBAC-01",
        },
    )
    if stu_res.status_code == 409:
        pass
    else:
        assert stu_res.status_code == 200

    verify = client.post(
        "/api/v1/auth/admission/verify",
        json={"tenantSlug": "al-xorazmiy", "rosterCode": "STU-RBAC-01"},
    )
    assert verify.status_code == 200
    data = verify.json()
    assert data["success"] is True
    student_token = data["sessionToken"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # Student CANNOT list staff student rosters or create assessments
    assert client.get("/api/v1/students?tenantSlug=al-xorazmiy", headers=student_headers).status_code == 403
    assert client.post("/api/v1/assessments", headers=student_headers, json={}).status_code == 403

    # Student CAN read assessments and create their own attempt
    asm_list = client.get("/api/v1/assessments", headers=student_headers)
    assert asm_list.status_code == 200
    if asm_list.json():
        asm_id = asm_list.json()[0]["id"]
        attempt_res = client.post(
            "/api/v1/attempts",
            headers=student_headers,
            json={
                "tenantId": "tenant-al-xorazmiy",
                "assessmentId": asm_id,
                "rosterRecordId": data["student"]["id"],
            },
        )
        assert attempt_res.status_code == 200

    # Student CANNOT start an attempt for another student
    forged = client.post(
        "/api/v1/attempts",
        headers=student_headers,
        json={
            "tenantId": "tenant-al-xorazmiy",
            "assessmentId": "chsb-inf-11-q1",
            "rosterRecordId": "STU-ZUXRA-TEST",
        },
    )
    assert forged.status_code in (403, 404)

    # Cleanup
    client.delete(f"/api/v1/classes/{cls_id}", headers=teacher_headers)
