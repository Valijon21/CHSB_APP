import uuid
from fastapi.testclient import TestClient


def test_real_analytics_question_stats_and_dynamic_assessment_assignment(
    client: TestClient,
    teacher_headers: dict[str, str],
):
    uid = uuid.uuid4().hex[:6].upper()
    cls_res = client.post(
        "/api/v1/classes",
        headers=teacher_headers,
        json={"schoolId": "school-ax-1", "tenantSlug": "al-xorazmiy", "name": f"10-ANL-{uid}", "gradeLevel": 10},
    )
    assert cls_res.status_code == 200
    cls_id = cls_res.json()["id"]

    # Create 2 students in 10th grade (group 1-guruh and 2-guruh)
    s1 = client.post(
        "/api/v1/students",
        headers=teacher_headers,
        json={
            "tenantSlug": "al-xorazmiy",
            "schoolId": "school-ax-1",
            "classGroupId": cls_id,
            "firstName": f"Alpha{uid}",
            "lastName": "Aaa",
            "status": "eligible",
            "group": "1-guruh",
            "rosterCode": f"STU-ANL1-{uid}",
        },
    ).json()
    client.post(
        "/api/v1/students",
        headers=teacher_headers,
        json={
            "tenantSlug": "al-xorazmiy",
            "schoolId": "school-ax-1",
            "classGroupId": cls_id,
            "firstName": f"Beta{uid}",
            "lastName": "Bbb",
            "status": "eligible",
            "group": "2-guruh",
            "rosterCode": f"STU-ANL2-{uid}",
        },
    )

    # Create a 10th-grade assessment targeted to 1-guruh
    asm_code = f"CHSB-ANL-10-{uid}"
    asm_res = client.post(
        "/api/v1/assessments",
        headers=teacher_headers,
        json={
            "code": asm_code,
            "title": "10-sinf Real Analytics",
            "subject": "Informatika",
            "gradeLevel": 10,
            "quarter": 1,
            "targetGroup": "1-guruh",
            "totalQuestions": 2,
            "maxScore": 10.0,
            "questions": [
                {
                    "prompt": "Q1",
                    "correctOptionId": "opt-a",
                    "bloomLevel": "KNOWLEDGE",
                    "points": 5.0,
                },
                {
                    "prompt": "Q2",
                    "correctOptionId": "opt-a",
                    "bloomLevel": "ANALYSIS",
                    "points": 5.0,
                },
            ],
        },
    )
    assert asm_res.status_code == 200
    asm_id = asm_res.json()["id"]

    # Dynamic assignment check: s1 (1-guruh) has asm_code.lower(), s2 (2-guruh) does NOT
    stu_list = client.get(
        f"/api/v1/students?tenantSlug=al-xorazmiy&classGroupId={cls_id}",
        headers=teacher_headers,
    ).json()
    s1_rec = next(s for s in stu_list if s["id"] == s1["id"])
    s2_rec = next(s for s in stu_list if s["id"] != s1["id"])
    assert asm_code.lower() in s1_rec["availableAssessmentIds"]
    assert asm_code.lower() not in s2_rec["availableAssessmentIds"]

    # Verify paginated response & search filter
    paged = client.get(
        f"/api/v1/students?tenantSlug=al-xorazmiy&classGroupId={cls_id}&page=1&limit=1",
        headers=teacher_headers,
    )
    assert paged.status_code == 200
    paged_json = paged.json()
    assert paged_json["total"] == 2
    assert paged_json["totalPages"] == 2
    assert len(paged_json["items"]) == 1

    searched = client.get(
        f"/api/v1/students?tenantSlug=al-xorazmiy&classGroupId={cls_id}&search=Alpha{uid}",
        headers=teacher_headers,
    )
    assert searched.status_code == 200
    assert len(searched.json()) == 1

    # Submit attempt for s1 (Q1 right, Q2 wrong -> 50% assessment accuracy)
    verify = client.post(
        "/api/v1/auth/admission/verify",
        json={"tenantSlug": "al-xorazmiy", "rosterCode": s1["rosterCode"]},
    ).json()
    stu_hdr = {"Authorization": f"Bearer {verify['sessionToken']}"}
    att = client.post(
        "/api/v1/attempts",
        headers=stu_hdr,
        json={"tenantId": "al-xorazmiy", "assessmentId": asm_id, "rosterRecordId": s1["id"]},
    ).json()
    client.post(
        f"/api/v1/attempts/{att['id']}/submit",
        headers=stu_hdr,
        json={"answers": {"1": "opt-a", "2": "opt-b"}},
    )

    stats = client.get(
        f"/api/v1/assessments/{asm_id}/stats?tenantId=al-xorazmiy",
        headers=teacher_headers,
    )
    assert stats.status_code == 200, stats.text
    st = stats.json()
    assert st["totalCompleted"] == 1
    assert st["averageScore"] == 5.0
    assert st["questionStats"][0]["correctRate"] == 100.0
    assert st["questionStats"][1]["correctRate"] == 0.0

    # Analytics & regional endpoints return real non-crash data
    anl = client.get("/api/v1/analytics/al-xorazmiy", headers=teacher_headers)
    assert anl.status_code == 200
    assert "passingRate" in anl.json()
    assert isinstance(anl.json()["questionStats"], list)


def test_regional_real_aggregations(
    client: TestClient,
    inspector_headers: dict[str, str],
):
    districts = client.get("/api/v1/regional/districts", headers=inspector_headers)
    assert districts.status_code == 200
    assert len(districts.json()) >= 1

    overview = client.get("/api/v1/regional/overview", headers=inspector_headers)
    assert overview.status_code == 200
    ov = overview.json()
    assert ov["totalSchools"] >= 1
    assert "overallParticipationRate" in ov

    anomalies = client.get("/api/v1/regional/anomalies", headers=inspector_headers)
    assert anomalies.status_code == 200
    assert isinstance(anomalies.json(), list)
