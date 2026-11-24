import pytest
from starlette.testclient import TestClient

def test_classes_has_groups_and_counts(client: TestClient):
    response = client.get("/api/v1/classes?tenantSlug=al-xorazmiy")
    assert response.status_code == 200
    classes = response.json()
    assert len(classes) > 0

    class_11a = next((c for c in classes if "11-A" in c["name"]), None)
    assert class_11a is not None
    assert class_11a["hasGroups"] is True
    assert "groupCounts" in class_11a
    assert class_11a["groupCounts"].get("1-guruh", 0) >= 15
    assert class_11a["groupCounts"].get("2-guruh", 0) >= 15

def test_students_filtered_by_group(client: TestClient):
    # Filter 1-guruh
    r1 = client.get("/api/v1/students?tenantSlug=al-xorazmiy&classGroupId=class-ax-11a&group=1-guruh")
    assert r1.status_code == 200
    g1_students = r1.json()
    assert len(g1_students) == 15
    for s in g1_students:
        assert s["group"] == "1-guruh"
        assert s["emaktabId"] is not None

    # Filter 2-guruh
    r2 = client.get("/api/v1/students?tenantSlug=al-xorazmiy&classGroupId=class-ax-11a&group=2-guruh")
    assert r2.status_code == 200
    g2_students = r2.json()
    assert len(g2_students) == 15
    for s in g2_students:
        assert s["group"] == "2-guruh"

def test_class_detail_with_group_filter(client: TestClient):
    # All students
    r_all = client.get("/api/v1/classes/class-ax-11a")
    assert r_all.status_code == 200
    all_data = r_all.json()
    assert len(all_data["students"]) == 30

    # Only 1-guruh
    r_g1 = client.get("/api/v1/classes/class-ax-11a?group=1-guruh")
    assert r_g1.status_code == 200
    g1_data = r_g1.json()
    assert len(g1_data["students"]) == 15
    for s in g1_data["students"]:
        assert s["group"] == "1-guruh"
