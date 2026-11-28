import uuid
from fastapi.testclient import TestClient


def test_upload_and_stream_original_assessment_pdf_and_answer_key(
    client: TestClient,
    teacher_headers: dict[str, str],
):
    uid = uuid.uuid4().hex[:6].upper()
    create_res = client.post(
        "/api/v1/assessments",
        headers=teacher_headers,
        json={
            "code": f"CHSB-PDF-{uid}",
            "title": "PDF Split-Screen 1-ChSB",
            "subject": "Informatika",
            "subjectCode": "INF",
            "gradeLevel": 10,
            "quarter": 1,
            "assessmentType": "CHSB",
            "totalQuestions": 3,
            "maxScore": 40.0,
            "answerKey": "1-B, 2-C, 3-A",
        },
    )
    assert create_res.status_code == 200, create_res.text
    asm_id = create_res.json()["id"]
    assert create_res.json()["hasPdf"] is False

    # Reject non-PDF binary
    bad_up = client.post(
        f"/api/v1/assessments/{asm_id}/pdf",
        headers=teacher_headers,
        files={"file": ("not_pdf.txt", b"hello world", "text/plain")},
    )
    assert bad_up.status_code == 400

    # Upload real PDF payload
    sample_pdf = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF"
    up_res = client.post(
        f"/api/v1/assessments/{asm_id}/pdf",
        headers=teacher_headers,
        files={"file": ("10-sinf BSB_1.pdf", sample_pdf, "application/pdf")},
    )
    assert up_res.status_code == 200, up_res.text
    up_json = up_res.json()
    assert up_json["hasPdf"] is True
    assert up_json["sourcePdfUrl"] == f"/api/v1/assessments/{asm_id}/pdf"
    assert up_json["sourcePdfSize"] == len(sample_pdf)

    # Verify detail includes PDF metadata & answerKey was applied
    detail_res = client.get(f"/api/v1/assessments/{asm_id}", headers=teacher_headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["hasPdf"] is True
    assert detail["questions"][0]["correctOptionId"] == "opt-b"
    assert detail["questions"][1]["correctOptionId"] == "opt-c"
    assert detail["questions"][2]["correctOptionId"] == "opt-a"

    # Stream inline PDF back as teacher (and verify student token works too)
    pdf_res = client.get(f"/api/v1/assessments/{asm_id}/pdf", headers=teacher_headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert pdf_res.content == sample_pdf

    # Verify student admission token can also stream the PDF
    verify_res = client.post(
        "/api/v1/auth/admission/verify",
        json={"tenantSlug": "al-xorazmiy", "rosterCode": "STU-1101"},
    )
    if verify_res.status_code == 200 and verify_res.json().get("success"):
        stu_tok = verify_res.json()["sessionToken"]
        stu_pdf = client.get(
            f"/api/v1/assessments/{asm_id}/pdf",
            headers={"Authorization": f"Bearer {stu_tok}"},
        )
        assert stu_pdf.status_code == 200
        assert stu_pdf.content == sample_pdf
