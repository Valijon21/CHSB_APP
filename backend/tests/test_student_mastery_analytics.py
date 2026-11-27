import uuid
from fastapi.testclient import TestClient


def test_deterministic_students_mastery_and_remediation_without_ai(
    client: TestClient,
    teacher_headers: dict[str, str],
):
    uid = uuid.uuid4().hex[:6].upper()
    cls = client.post(
        "/api/v1/classes",
        headers=teacher_headers,
        json={"schoolId": "school-ax-1", "tenantSlug": "al-xorazmiy", "name": f"11-MST-{uid}", "gradeLevel": 11},
    ).json()

    roster_code = f"STU-MST-{uid}"
    stu = client.post(
        "/api/v1/students",
        headers=teacher_headers,
        json={
            "tenantSlug": "al-xorazmiy",
            "schoolId": "school-ax-1",
            "classGroupId": cls["id"],
            "firstName": f"Mastery{uid}",
            "lastName": "Student",
            "status": "eligible",
            "rosterCode": roster_code,
        },
    ).json()

    asm_code = f"CHSB-MST-{uid}"
    asm = client.post(
        "/api/v1/assessments",
        headers=teacher_headers,
        json={
            "code": asm_code,
            "title": "Mastery Verification Test",
            "subject": "Informatika",
            "subjectCode": "INF",
            "gradeLevel": 11,
            "quarter": 1,
            "totalQuestions": 2,
            "maxScore": 40.0,
            "questions": [
                {"prompt": "Knowledge Q", "correctOptionId": "opt-a", "bloomLevel": "KNOWLEDGE", "points": 20.0},
                {"prompt": "Analysis Q", "correctOptionId": "opt-a", "bloomLevel": "ANALYSIS", "points": 20.0},
            ],
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
    # Student answers Knowledge right (100%) and Analysis wrong (0%) -> 50%
    client.post(
        f"/api/v1/attempts/{att['id']}/submit",
        headers=stu_hdr,
        json={"answers": {"1": "opt-a", "2": "opt-b"}},
    )

    # 1. List all students mastery deterministically
    list_res = client.get(
        f"/api/v1/analytics/al-xorazmiy/students-mastery?classGroupId={cls['id']}&quarter=1",
        headers=teacher_headers,
    )
    assert list_res.status_code == 200, list_res.text
    list_data = list_res.json()
    assert list_data["summary"]["engine"] == "deterministic-pedagogical-engine"
    assert len(list_data["students"]) == 1
    row = list_data["students"][0]
    assert row["averagePercentage"] == 50.0
    assert row["bloomMastery"]["knowledge"] == 100.0
    assert row["bloomMastery"]["analysis"] == 0.0
    assert row["weakestBloom"] == "ANALYSIS"

    # 2. Single student deep mastery dossier + remediation plan
    detail_res = client.get(
        f"/api/v1/analytics/al-xorazmiy/students/{stu['id']}/mastery?quarter=1",
        headers=teacher_headers,
    )
    assert detail_res.status_code == 200, detail_res.text
    detail = detail_res.json()
    assert detail["remediationPlan"]["engine"] == "deterministic-pedagogical-engine"
    assert len(detail["remediationPlan"]["trajectory"]) == 5
    assert len(detail["missedQuestions"]) == 1
    assert detail["missedQuestions"][0]["questionNumber"] == 2

    # 3. class-diagnosis and student-remediation run deterministically without AI calls
    diag = client.post(
        "/api/v1/ai/class-diagnosis",
        headers=teacher_headers,
        json={
            "className": "11-MST",
            "averageScore": 20.0,
            "maxScore": 40.0,
            "qualityRate": 50,
            "participationRate": 100,
            "totalStudents": 10,
        },
    )
    assert diag.status_code == 200
    assert diag.json()["source"] == "deterministic-pedagogical-engine"

    rem = client.post(
        "/api/v1/ai/student-remediation",
        headers=teacher_headers,
        json={
            "studentName": "Mastery Student",
            "rosterCode": roster_code,
            "score": 20.0,
            "percentage": 50.0,
            "weakestBloom": "ANALYSIS",
            "weakTopics": ["Algoritmlar tahlili"],
        },
    )
    assert rem.status_code == 200
    assert rem.json()["engine"] == "deterministic-pedagogical-engine"

