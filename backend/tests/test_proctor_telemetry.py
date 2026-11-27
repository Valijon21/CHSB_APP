import uuid
from fastapi.testclient import TestClient


def test_proctor_events_live_sessions_and_actions(
    client: TestClient,
    teacher_headers: dict[str, str],
):
    uid = uuid.uuid4().hex[:6].upper()
    cls = client.post(
        "/api/v1/classes",
        headers=teacher_headers,
        json={"schoolId": "school-ax-1", "tenantSlug": "al-xorazmiy", "name": f"11-PRC-{uid}", "gradeLevel": 11},
    ).json()

    roster_code = f"STU-PRC-{uid}"
    stu = client.post(
        "/api/v1/students",
        headers=teacher_headers,
        json={
            "tenantSlug": "al-xorazmiy",
            "schoolId": "school-ax-1",
            "classGroupId": cls["id"],
            "firstName": f"Proctor{uid}",
            "lastName": "Student",
            "status": "eligible",
            "rosterCode": roster_code,
        },
    ).json()

    asm_code = f"CHSB-PRC-{uid}"
    asm = client.post(
        "/api/v1/assessments",
        headers=teacher_headers,
        json={
            "code": asm_code,
            "title": "Proctoring Test",
            "subject": "Informatika",
            "gradeLevel": 11,
            "quarter": 1,
            "totalQuestions": 2,
            "maxScore": 10.0,
        },
    ).json()

    verify = client.post(
        "/api/v1/auth/admission/verify",
        json={"tenantSlug": "al-xorazmiy", "rosterCode": roster_code},
    ).json()
    stu_hdr = {"Authorization": f"Bearer {verify['sessionToken']}"}

    att = client.post(
        "/api/v1/attempts",
        headers=stu_hdr,
        json={"tenantId": "al-xorazmiy", "assessmentId": asm["id"], "rosterRecordId": stu["id"]},
    ).json()
    att_id = att["id"]

    # 1. Student posts violation telemetry event
    ev_resp = client.post(
        f"/api/v1/proctor/attempts/{att_id}/event",
        headers=stu_hdr,
        json={
            "eventType": "tab_hidden",
            "severity": "warning",
            "message": "Vkladkadan chiqdi",
            "currentQuestion": 1,
            "answeredCount": 0,
        },
    )
    assert ev_resp.status_code == 200, ev_resp.text
    assert ev_resp.json()["ok"] is True

    # 2. Teacher fetches live sessions & sees warning status
    live_resp = client.get(
        f"/api/v1/proctor/assessments/{asm['id']}/live-sessions?tenantId=al-xorazmiy",
        headers=teacher_headers,
    )
    assert live_resp.status_code == 200, live_resp.text
    live_data = live_resp.json()
    match = next(s for s in live_data["sessions"] if s["attemptId"] == att_id)
    assert match["violationsCount"] == 1
    assert match["status"] == "warning"

    # 3. Teacher sends warning & force submits
    warn_resp = client.post(
        f"/api/v1/proctor/attempts/{att_id}/action",
        headers=teacher_headers,
        json={"action": "send_warning", "warningMessage": "Test oynasiga qayting!", "reason": "Nazorat"},
    )
    assert warn_resp.status_code == 200

    # Student heartbeat receives pending teacher warning
    hb_resp = client.post(
        f"/api/v1/proctor/attempts/{att_id}/event",
        headers=stu_hdr,
        json={"eventType": "heartbeat", "severity": "info"},
    )
    assert hb_resp.status_code == 200
    assert any(a["action"] == "send_warning" for a in hb_resp.json()["pendingActions"])

    # Force submit transitions attempt & creates result
    force_resp = client.post(
        f"/api/v1/proctor/attempts/{att_id}/action",
        headers=teacher_headers,
        json={"action": "force_submit", "reason": "Ko'chirishga urinish"},
    )
    assert force_resp.status_code == 200

    res_resp = client.get(f"/api/v1/results/attempt/{att_id}", headers=teacher_headers)
    assert res_resp.status_code == 200
    assert res_resp.json()["status"] == "verified"

