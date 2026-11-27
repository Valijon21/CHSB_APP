import pytest
from starlette.testclient import TestClient


@pytest.fixture(autouse=True)
def setup_test_students(client: TestClient, teacher_headers: dict[str, str]):
    client.post(
        "/api/v1/classes",
        headers=teacher_headers,
        json={
            "schoolId": "school-ax-1",
            "tenantSlug": "al-xorazmiy",
            "name": "11-A sinf",
            "gradeLevel": 11,
            "shift": 1,
            "academicYear": "2026-2027",
        },
    )
    students = []
    for i in range(1, 16):
        students.append({
            "tenantSlug": "al-xorazmiy",
            "className": "11-A sinf",
            "firstName": f"StudentG1_{i}",
            "lastName": f"TestG1_{i}",
            "gender": "M",
            "birthDate": "2008-01-01",
            "status": "eligible",
            "group": "1-guruh",
            "emaktabId": f"10001{i:03d}",
        })
    for i in range(1, 16):
        students.append({
            "tenantSlug": "al-xorazmiy",
            "className": "11-A sinf",
            "firstName": f"StudentG2_{i}",
            "lastName": f"TestG2_{i}",
            "gender": "F",
            "birthDate": "2008-01-01",
            "status": "eligible",
            "group": "2-guruh",
            "emaktabId": f"10002{i:03d}",
        })
    client.post("/api/v1/students/bulk", headers=teacher_headers, json=students)
    yield


def test_classes_has_groups_and_counts(client: TestClient, teacher_headers: dict[str, str]):
    response = client.get("/api/v1/classes?tenantSlug=al-xorazmiy", headers=teacher_headers)
    assert response.status_code == 200
    classes = response.json()
    assert len(classes) > 0

    class_11a = next((c for c in classes if "11-A" in c["name"]), None)
    assert class_11a is not None
    assert class_11a["hasGroups"] is True
    assert "groupCounts" in class_11a
    assert class_11a["groupCounts"].get("1-guruh", 0) >= 15
    assert class_11a["groupCounts"].get("2-guruh", 0) >= 15


def test_students_filtered_by_group(client: TestClient, teacher_headers: dict[str, str]):
    c_res = client.get("/api/v1/classes?tenantSlug=al-xorazmiy", headers=teacher_headers)
    class_11a = next((c for c in c_res.json() if "11-A" in c["name"]), None)
    assert class_11a is not None
    cls_id = class_11a["id"]

    r1 = client.get(
        f"/api/v1/students?tenantSlug=al-xorazmiy&classGroupId={cls_id}&group=1-guruh",
        headers=teacher_headers,
    )
    assert r1.status_code == 200
    g1_students = [s for s in r1.json() if s["firstName"].startswith("StudentG1_")]
    assert len(g1_students) >= 15
    for s in g1_students:
        assert s["group"] == "1-guruh"
        assert s["emaktabId"] is not None

    r2 = client.get(
        f"/api/v1/students?tenantSlug=al-xorazmiy&classGroupId={cls_id}&group=2-guruh",
        headers=teacher_headers,
    )
    assert r2.status_code == 200
    g2_students = [s for s in r2.json() if s["firstName"].startswith("StudentG2_")]
    assert len(g2_students) >= 15
    for s in g2_students:
        assert s["group"] == "2-guruh"


def test_class_detail_with_group_filter(client: TestClient, teacher_headers: dict[str, str]):
    c_res = client.get("/api/v1/classes?tenantSlug=al-xorazmiy", headers=teacher_headers)
    class_11a = next((c for c in c_res.json() if "11-A" in c["name"]), None)
    assert class_11a is not None
    cls_id = class_11a["id"]

    r_all = client.get(f"/api/v1/classes/{cls_id}", headers=teacher_headers)
    assert r_all.status_code == 200
    all_data = r_all.json()
    assert len(all_data["students"]) >= 30

    r_g1 = client.get(f"/api/v1/classes/{cls_id}?group=1-guruh", headers=teacher_headers)
    assert r_g1.status_code == 200
    g1_data = r_g1.json()
    assert len(g1_data["students"]) >= 15
    for s in g1_data["students"]:
        assert s["group"] == "1-guruh"
