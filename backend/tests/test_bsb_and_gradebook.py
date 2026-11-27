import uuid
from fastapi.testclient import TestClient


def _ensure_student_and_class(client: TestClient, teacher_headers: dict[str, str], suffix: str) -> tuple[str, str, dict[str, str]]:
    uniq = f"{suffix}-{uuid.uuid4().hex[:6]}".upper()
    cls_res = client.post(
        "/api/v1/classes",
        headers=teacher_headers,
        json={"schoolId": "school-ax-1", "tenantSlug": "al-xorazmiy", "name": f"11-GB-{uniq}", "gradeLevel": 11},
    )
    assert cls_res.status_code == 200, cls_res.text
    cls_id = cls_res.json()["id"]

    roster_code = f"STU-GB-{uniq}"
    stu_res = client.post(
        "/api/v1/students",
        headers=teacher_headers,
        json={
            "tenantSlug": "al-xorazmiy",
            "schoolId": "school-ax-1",
            "classGroupId": cls_id,
            "firstName": f"Gradebook{uniq}",
            "lastName": "Student",
            "gender": "M",
            "birthDate": "2008-05-01",
            "status": "eligible",
            "rosterCode": roster_code,
        },
    )
    assert stu_res.status_code == 200, stu_res.text
    stu_data = stu_res.json()

    verify_res = client.post(
        "/api/v1/auth/admission/verify",
        json={"tenantSlug": "al-xorazmiy", "rosterCode": stu_data["rosterCode"]},
    )
    assert verify_res.status_code == 200, verify_res.text
    verify_json = verify_res.json()
    assert verify_json["success"] is True, verify_json
    return cls_id, stu_data["id"], {"Authorization": f"Bearer {verify_json['sessionToken']}"}


def test_bsb_creation_submit_pending_review_and_teacher_rubric_grade(
    client: TestClient,
    teacher_headers: dict[str, str],
):
    _, student_id, student_headers = _ensure_student_and_class(client, teacher_headers, "BSB1")

    # 1. Create a BSB assessment with an open rubric task (25 points)
    create_resp = client.post(
        "/api/v1/assessments",
        headers=teacher_headers,
        json={
            "code": "BSB-INF-11-T1",
            "title": "1-BSB Amaliy loyiha",
            "subject": "Informatika",
            "subjectCode": "INF",
            "gradeLevel": 11,
            "quarter": 1,
            "academicYear": "2026-2027",
            "assessmentType": "BSB",
            "durationMinutes": 45,
            "totalQuestions": 1,
            "maxScore": 25.0,
            "questions": [
                {
                    "prompt": "Python algoritmini yozing",
                    "taskType": "BSB_OPEN_TASK",
                    "points": 25.0,
                    "rubric": [{"criterion": "Algoritm to'g'riligi", "maxPoints": 25}],
                }
            ],
        },
    )
    assert create_resp.status_code == 200, create_resp.text
    bsb_asm = create_resp.json()
    assert bsb_asm["assessmentType"] == "BSB"
    assert bsb_asm["subjectCode"] == "INF"

    # 2. Student starts attempt & submits -> status should be pending_review
    start_resp = client.post(
        "/api/v1/attempts",
        headers=student_headers,
        json={
            "tenantId": "al-xorazmiy",
            "assessmentId": bsb_asm["id"],
            "rosterRecordId": student_id,
        },
    )
    assert start_resp.status_code == 200, start_resp.text
    attempt_id = start_resp.json()["id"]

    submit_resp = client.post(
        f"/api/v1/attempts/{attempt_id}/submit",
        headers=student_headers,
        json={"answers": {"q-1": "print(42)"}},
    )
    assert submit_resp.status_code == 200, submit_resp.text
    sub_data = submit_resp.json()
    assert sub_data["status"] == "pending_review"
    assert sub_data["verifiedByTeacher"] is False

    # 3. Student cannot grade their own result
    forbidden_grade = client.patch(
        f"/api/v1/assessments/results/{attempt_id}/grade",
        headers=student_headers,
        json={"score": 25.0},
    )
    assert forbidden_grade.status_code == 403

    # 4. Teacher grades the BSB attempt via rubric endpoint -> persists score & recalculates grade
    grade_resp = client.patch(
        f"/api/v1/assessments/results/{attempt_id}/grade",
        headers=teacher_headers,
        json={
            "score": 22.0,
            "rubricScores": {"Algoritm": 22.0},
            "feedback": "Yaxshi bajarilgan!",
            "verifiedByTeacher": True,
        },
    )
    assert grade_resp.status_code == 200, grade_resp.text
    graded = grade_resp.json()
    assert graded["score"] == 22.0
    assert graded["percentage"] == 88.0
    assert graded["grade"] == "5"
    assert graded["verifiedByTeacher"] is True
    assert graded["teacherFeedback"] == "Yaxshi bajarilgan!"
    assert graded["rubricScores"] == {"Algoritm": 22.0}


def test_attempt_absence_and_reopen_lifecycle(
    client: TestClient,
    teacher_headers: dict[str, str],
):
    _, student_id, _ = _ensure_student_and_class(client, teacher_headers, "REOPEN")

    asm_resp = client.post(
        "/api/v1/assessments",
        headers=teacher_headers,
        json={
            "code": "CHSB-REOPEN-11",
            "title": "Reopen Test",
            "subject": "Informatika",
            "gradeLevel": 11,
            "quarter": 1,
            "totalQuestions": 1,
            "maxScore": 10.0,
        },
    )
    assert asm_resp.status_code == 200
    asm_id = asm_resp.json()["id"]

    start_resp = client.post(
        "/api/v1/attempts",
        headers=teacher_headers,
        json={
            "tenantId": "al-xorazmiy",
            "assessmentId": asm_id,
            "rosterRecordId": student_id,
        },
    )
    assert start_resp.status_code == 200
    attempt_id = start_resp.json()["id"]

    abs_resp = client.post(
        f"/api/v1/assessments/attempts/{attempt_id}/absence",
        headers=teacher_headers,
        json={"reason": "ILLNESS"},
    )
    assert abs_resp.status_code == 200, abs_resp.text
    assert abs_resp.json()["status"] == "absent"
    assert abs_resp.json()["absenceReason"] == "ILLNESS"

    reopen_resp = client.post(
        f"/api/v1/assessments/attempts/{attempt_id}/reopen",
        headers=teacher_headers,
        json={"resetTimer": True},
    )
    assert reopen_resp.status_code == 200, reopen_resp.text
    assert reopen_resp.json()["status"] == "in_progress"
    assert reopen_resp.json()["reopenedBy"] is not None


def test_quarter_100_point_gradebook_aggregates_fb_bsb_chsb(
    client: TestClient,
    teacher_headers: dict[str, str],
):
    cls_id, student_id, student_headers = _ensure_student_and_class(client, teacher_headers, "Q100")

    # 1. Record Formative score: classwork 5.5 + homework 3.5 = 9.0 / 10
    fb_resp = client.post(
        "/api/v1/gradebook/formative",
        headers=teacher_headers,
        json={
            "studentId": student_id,
            "subjectCode": "INF",
            "quarter": 1,
            "academicYear": "2026-2027",
            "classwork": 5.5,
            "homework": 3.5,
        },
    )
    assert fb_resp.status_code == 200, fb_resp.text
    assert fb_resp.json()["totalScore"] == 9.0

    # 2. Submit CHSB assessment (max 40 -> correct opt-a gives 40/40)
    run_uid = uuid.uuid4().hex[:6].upper()
    chsb_resp = client.post(
        "/api/v1/assessments",
        headers=teacher_headers,
        json={
            "code": f"CHSB-Q100-INF-{run_uid}",
            "title": "CHSB 100-ball test",
            "subject": "Informatika",
            "subjectCode": "INF",
            "gradeLevel": 11,
            "quarter": 1,
            "academicYear": "2026-2027",
            "assessmentType": "CHSB",
            "totalQuestions": 1,
            "maxScore": 40.0,
        },
    )
    assert chsb_resp.status_code == 200
    chsb_id = chsb_resp.json()["id"]
    chsb_start = client.post(
        "/api/v1/attempts",
        headers=student_headers,
        json={"tenantId": "al-xorazmiy", "assessmentId": chsb_id, "rosterRecordId": student_id},
    ).json()
    sub_chsb = client.post(
        f"/api/v1/attempts/{chsb_start['id']}/submit",
        headers=student_headers,
        json={"answers": {"1": "opt-a"}},
    )
    assert sub_chsb.status_code == 200, sub_chsb.text

    # 3. Create BSB (max 50), submit & grade 41/50 -> total = 9 + 41 + 40 = 90 -> grade 5
    bsb_resp = client.post(
        "/api/v1/assessments",
        headers=teacher_headers,
        json={
            "code": f"BSB-Q100-INF-{run_uid}",
            "title": "BSB 100-ball test",
            "subject": "Informatika",
            "subjectCode": "INF",
            "gradeLevel": 11,
            "quarter": 1,
            "academicYear": "2026-2027",
            "assessmentType": "BSB",
            "totalQuestions": 1,
            "maxScore": 50.0,
        },
    )
    assert bsb_resp.status_code == 200
    bsb_id = bsb_resp.json()["id"]
    bsb_start = client.post(
        "/api/v1/attempts",
        headers=student_headers,
        json={"tenantId": "al-xorazmiy", "assessmentId": bsb_id, "rosterRecordId": student_id},
    ).json()
    client.post(
        f"/api/v1/attempts/{bsb_start['id']}/submit",
        headers=student_headers,
        json={"answers": {}},
    )
    grade_res = client.patch(
        f"/api/v1/assessments/results/{bsb_start['id']}/grade",
        headers=teacher_headers,
        json={"score": 41.0, "verifiedByTeacher": True},
    )
    assert grade_res.status_code == 200, grade_res.text

    # 4. Fetch Quarter Gradebook
    gb_resp = client.get(
        f"/api/v1/gradebook/quarter?tenantId=al-xorazmiy&classGroupId={cls_id}&quarter=1&academicYear=2026-2027&subjectCode=INF",
        headers=teacher_headers,
    )
    assert gb_resp.status_code == 200, gb_resp.text
    gb = gb_resp.json()
    assert len(gb["rows"]) == 1
    row = gb["rows"][0]
    assert row["formativeScore"] == 9.0
    assert row["bsbScore"] == 41.0
    assert row["chsbScore"] == 40.0
    assert row["totalScore100"] == 90.0
    assert row["grade5"] == "5"
