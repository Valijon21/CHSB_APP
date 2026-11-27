from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app.services.students import pick_unique_roster_code


def test_pick_unique_roster_code_avoids_collisions():
    existing = {"STU-1101", "STU-1102", "STU-1104", "CUSTOM-1"}

    c1, nxt = pick_unique_roster_code(existing, None, 1101)
    assert c1 == "STU-1103"
    assert nxt == 1104

    c2, nxt = pick_unique_roster_code(existing, None, nxt)
    assert c2 == "STU-1105"
    assert nxt == 1106

    c3, _ = pick_unique_roster_code(existing, "CUSTOM-1", nxt)
    assert c3 == "CUSTOM-1-1"


def test_bulk_create_students_survives_deleted_gaps_and_classname_fallback(client: TestClient):
    # Ensure a clean slate for 11-A
    client.delete("/api/v1/students?tenantSlug=al-xorazmiy&classGroupId=class-ax-11a")

    # Seed 2 students in 11-B first so STU-1101/STU-1102 exist in DB while 11-A is empty
    seed_res = client.post(
        "/api/v1/students/bulk",
        json=[
            {
                "tenantSlug": "al-xorazmiy",
                "schoolId": "school-ax-1",
                "classGroupId": "class-ax-11b",
                "className": "11-B sinf",
                "firstName": "Gap",
                "lastName": "StudentOne",
                "gender": "M",
                "birthDate": "2009-01-01",
                "status": "eligible",
            },
            {
                "tenantSlug": "al-xorazmiy",
                "schoolId": "school-ax-1",
                "classGroupId": "class-ax-11b",
                "className": "11-B sinf",
                "firstName": "Gap",
                "lastName": "StudentTwo",
                "gender": "F",
                "birthDate": "2009-01-01",
                "status": "eligible",
            },
        ],
    )
    assert seed_res.status_code == 200
    created_11b = seed_res.json()
    assert len(created_11b) == 2

    # Delete the first student in 11-B so count drops, leaving a rosterCode gap
    client.delete(f"/api/v1/students/{created_11b[0]['id']}")

    # Bulk import 15 students into 11-A using stale classGroupId + className fallback
    batch = [
        {
            "tenantSlug": "al-xorazmiy",
            "schoolId": "school-ax-1",
            "classGroupId": "stale-client-id",
            "className": "11-A sinf",
            "firstName": f"Student{i}",
            "lastName": f"Testov{i}",
            "gender": "M" if i % 2 == 0 else "F",
            "birthDate": "2009-01-01",
            "group": "1-guruh",
            "emaktabId": f"100000999{i:04d}",
            "status": "eligible",
        }
        for i in range(1, 16)
    ]

    bulk_res = client.post("/api/v1/students/bulk", json=batch)
    assert bulk_res.status_code == 200
    imported = bulk_res.json()
    assert len(imported) == 15
    codes = {s["rosterCode"] for s in imported}
    assert len(codes) == 15
    assert created_11b[1]["rosterCode"] not in codes

    # Cleanup
    client.delete("/api/v1/students?tenantSlug=al-xorazmiy&classGroupId=class-ax-11a")
    client.delete("/api/v1/students?tenantSlug=al-xorazmiy&classGroupId=class-ax-11b")


def test_get_class_detail_with_assessment_result(client: TestClient):
    client.delete("/api/v1/students?tenantSlug=al-xorazmiy&classGroupId=class-ax-11a")
    res = client.post(
        "/api/v1/students",
        json={
            "tenantSlug": "al-xorazmiy",
            "schoolId": "school-ax-1",
            "classGroupId": "class-ax-11a",
            "firstName": "Result",
            "lastName": "Tester",
            "gender": "M",
            "birthDate": "2009-01-01",
            "group": "1-guruh",
            "status": "eligible",
        },
    )
    assert res.status_code == 200
    stu_id = res.json()["id"]

    attempt_res = client.post(
        "/api/v1/attempts",
        json={
            "tenantId": "tenant-al-xorazmiy",
            "assessmentId": "chsb-inf-11-q1",
            "rosterRecordId": stu_id,
        },
    )
    assert attempt_res.status_code == 200
    attempt_id = attempt_res.json()["id"]

    submit_res = client.post(f"/api/v1/attempts/{attempt_id}/submit", json={})
    assert submit_res.status_code == 200

    detail_res = client.get("/api/v1/classes/class-ax-11a")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail["results"]) >= 1
    assert detail["results"][0]["group"] == "1-guruh"

    client.delete("/api/v1/students?tenantSlug=al-xorazmiy&classGroupId=class-ax-11a")
