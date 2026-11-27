import uuid
from fastapi.testclient import TestClient


def test_schools_list_create_and_preset_update(
    client: TestClient,
    inspector_headers: dict[str, str],
    teacher_headers: dict[str, str],
):
    # Teacher cannot create a new school/tenant
    forbidden = client.post(
        "/api/v1/schools",
        headers=teacher_headers,
        json={"name": "Unauthorized Maktab", "slug": f"unauth-{uuid.uuid4().hex[:5]}"},
    )
    assert forbidden.status_code == 403

    # Inspector creates a school cleanly
    slug = f"maktab-{uuid.uuid4().hex[:6]}"
    create_resp = client.post(
        "/api/v1/schools",
        headers=inspector_headers,
        json={
            "name": "35-Son Umumta'lim Maktabi",
            "code": "SCH-35",
            "slug": slug,
            "districtId": "chilonzor",
            "districtName": "Chilonzor tumani",
            "type": "general",
        },
    )
    assert create_resp.status_code == 200, create_resp.text
    created = create_resp.json()
    assert created["gradingPreset"] == "MMTV_STANDARD"
    school_id = created["id"]

    # Switch preset via PATCH /schools/{id}
    patch_resp = client.patch(
        f"/api/v1/schools/{school_id}",
        headers=inspector_headers,
        json={"gradingPreset": "SPECIALIZED"},
    )
    assert patch_resp.status_code == 200, patch_resp.text
    assert patch_resp.json()["gradingPreset"] == "SPECIALIZED"

    # List schools returns newly created school
    list_resp = client.get("/api/v1/schools", headers=inspector_headers)
    assert list_resp.status_code == 200
    assert any(s["id"] == school_id for s in list_resp.json())


def test_teachers_and_student_patch_crud(
    client: TestClient,
    teacher_headers: dict[str, str],
):
    # 1. Create teacher in DB
    uid = uuid.uuid4().hex[:6]
    tch_create = client.post(
        "/api/v1/teachers",
        headers=teacher_headers,
        json={
            "tenantSlug": "al-xorazmiy",
            "fullName": f"Malika Karimova {uid}",
            "email": f"malika_{uid}@xorazm.uz",
            "subject": "Matematika",
            "qualification": "oliy",
            "phone": "+998901112233",
            "status": "active",
        },
    )
    assert tch_create.status_code == 200, tch_create.text
    tch_id = tch_create.json()["id"]

    # 2. List teachers includes new DB user
    tch_list = client.get("/api/v1/teachers?tenantSlug=al-xorazmiy", headers=teacher_headers)
    assert tch_list.status_code == 200
    assert any(t["id"] == tch_id for t in tch_list.json())

    # 3. Update & delete teacher
    tch_patch = client.patch(
        f"/api/v1/teachers/{tch_id}",
        headers=teacher_headers,
        json={"fullName": f"Malika Tursunova {uid}"},
    )
    assert tch_patch.status_code == 200
    assert tch_patch.json()["fullName"] == f"Malika Tursunova {uid}"

    tch_del = client.delete(f"/api/v1/teachers/{tch_id}", headers=teacher_headers)
    assert tch_del.status_code == 200
    assert tch_del.json()["success"] is True

    # 4. Student PATCH test
    cls_res = client.post(
        "/api/v1/classes",
        headers=teacher_headers,
        json={"schoolId": "school-ax-1", "tenantSlug": "al-xorazmiy", "name": f"10-UPD-{uid}", "gradeLevel": 10},
    )
    cls_id = cls_res.json()["id"]
    stu_res = client.post(
        "/api/v1/students",
        headers=teacher_headers,
        json={
            "tenantSlug": "al-xorazmiy",
            "schoolId": "school-ax-1",
            "classGroupId": cls_id,
            "firstName": f"Aziz{uid}",
            "lastName": "Aliyev",
            "gender": "M",
            "birthDate": "2009-03-01",
            "status": "eligible",
        },
    )
    stu_id = stu_res.json()["id"]
    stu_patch = client.patch(
        f"/api/v1/students/{stu_id}",
        headers=teacher_headers,
        json={"firstName": f"Azizbek{uid}", "group": "2-guruh", "status": "inactive"},
    )
    assert stu_patch.status_code == 200, stu_patch.text
    updated_stu = stu_patch.json()
    assert updated_stu["firstName"] == f"Azizbek{uid}"
    assert updated_stu["group"] == "2-guruh"
    assert updated_stu["status"] == "inactive"

