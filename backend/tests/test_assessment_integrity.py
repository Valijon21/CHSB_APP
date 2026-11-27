import uuid
from fastapi.testclient import TestClient


def test_student_does_not_receive_answer_keys_while_teacher_does(
    client: TestClient,
    teacher_headers: dict[str, str],
):
    uid = uuid.uuid4().hex[:6].upper()
    cls_res = client.post(
        "/api/v1/classes",
        headers=teacher_headers,
        json={"schoolId": "school-ax-1", "tenantSlug": "al-xorazmiy", "name": f"11-INT-{uid}", "gradeLevel": 11},
    )
    assert cls_res.status_code == 200
    cls_id = cls_res.json()["id"]

    roster_code = f"STU-INT-{uid}"
    stu_res = client.post(
        "/api/v1/students",
        headers=teacher_headers,
        json={
            "tenantSlug": "al-xorazmiy",
            "schoolId": "school-ax-1",
            "classGroupId": cls_id,
            "firstName": f"Integrity{uid}",
            "lastName": "Tester",
            "gender": "M",
            "birthDate": "2008-01-01",
            "status": "eligible",
            "rosterCode": roster_code,
        },
    )
    if stu_res.status_code not in (200, 409):
        assert False, stu_res.text

    asm_res = client.post(
        "/api/v1/assessments",
        headers=teacher_headers,
        json={
            "code": f"CHSB-INT-11-{uid}",
            "title": "Integrity Test",
            "subject": "Informatika va AT",
            "gradeLevel": 11,
            "quarter": 1,
            "durationMinutes": 40,
            "totalQuestions": 2,
            "maxScore": 10.0,
            "questions": [
                {
                    "questionNumber": 1,
                    "prompt": "1-savol",
                    "options": [{"id": "opt-a", "label": "A", "text": "A"}, {"id": "opt-b", "label": "B", "text": "B"}],
                    "correctOptionId": "opt-a",
                    "points": 5.0,
                },
                {
                    "questionNumber": 2,
                    "prompt": "2-savol",
                    "options": [{"id": "opt-a", "label": "A", "text": "A"}, {"id": "opt-b", "label": "B", "text": "B"}],
                    "correctOptionId": "opt-b",
                    "points": 5.0,
                },
            ],
        },
    )
    assert asm_res.status_code == 200
    asm_id = asm_res.json()["id"]

    verify = client.post(
        "/api/v1/auth/admission/verify",
        json={"tenantSlug": "al-xorazmiy", "rosterCode": roster_code},
    )
    student_data = verify.json()
    student_headers = {"Authorization": f"Bearer {student_data['sessionToken']}"}

    # Teacher sees correctOptionId; student MUST NOT
    teacher_asm = client.get(f"/api/v1/assessments/{asm_id}", headers=teacher_headers).json()
    assert "correctOptionId" in teacher_asm["questions"][0]

    student_asm = client.get(f"/api/v1/assessments/{asm_id}", headers=student_headers).json()
    for q in student_asm["questions"]:
        assert "correctOptionId" not in q

    # Create attempt & test sequential draft merge
    att = client.post(
        "/api/v1/attempts",
        headers=student_headers,
        json={"tenantId": "tenant-al-xorazmiy", "assessmentId": asm_id, "rosterRecordId": student_data["student"]["id"]},
    )
    assert att.status_code == 200
    att_json = att.json()
    att_id = att_json["id"]
    assert att_json["durationMinutes"] == 40
    assert "deadlineAt" in att_json
    assert att_json["remainingSeconds"] > 0

    q1_id = student_asm["questions"][0]["id"]
    q2_id = student_asm["questions"][1]["id"]

    d1 = client.post(f"/api/v1/attempts/{att_id}/draft", headers=student_headers, json={"answers": {q1_id: "opt-a"}})
    assert d1.status_code == 200
    d2 = client.post(f"/api/v1/attempts/{att_id}/draft", headers=student_headers, json={"answers": {q2_id: "opt-b"}})
    assert d2.status_code == 200

    persisted = client.get(f"/api/v1/attempts/{att_id}", headers=student_headers).json()
    assert persisted["answers"][q1_id] == "opt-a"
    assert persisted["answers"][q2_id] == "opt-b"

    # Submit and verify idempotency + post-submit draft lock
    sub1 = client.post(f"/api/v1/attempts/{att_id}/submit", headers=student_headers, json={"idempotencyKey": "k1"})
    assert sub1.status_code == 200
    sub1_data = sub1.json()
    assert sub1_data["score"] == 10.0
    assert sub1_data["alreadySubmitted"] is False

    sub2 = client.post(f"/api/v1/attempts/{att_id}/submit", headers=student_headers, json={"idempotencyKey": "k1"})
    assert sub2.status_code == 200
    sub2_data = sub2.json()
    assert sub2_data["score"] == 10.0
    assert sub2_data["alreadySubmitted"] is True

    d_after = client.post(f"/api/v1/attempts/{att_id}/draft", headers=student_headers, json={"answers": {q1_id: "opt-b"}})
    assert d_after.status_code == 409

    # Cleanup
    client.delete(f"/api/v1/classes/{cls_id}", headers=teacher_headers)
