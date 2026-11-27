from __future__ import annotations

from unittest.mock import AsyncMock
import pytest
from fastapi.testclient import TestClient

from backend.app.db.schema_sync import ensure_schema_synced
from backend.app.api.v1.endpoints.students import pick_unique_roster_code
from backend.app.core.config import settings


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


@pytest.mark.asyncio
async def test_ensure_schema_synced_postgres_ddl_statements(monkeypatch):
    monkeypatch.setattr(settings, "DATABASE_URL", "postgresql://user:pass@localhost:5432/db")
    mock_db = AsyncMock()
    mock_db.execute_raw = AsyncMock(return_value=0)

    await ensure_schema_synced(mock_db)

    executed_sql = "\n".join(call.args[0] for call in mock_db.execute_raw.call_args_list)
    assert 'ALTER TABLE "class_groups" ADD COLUMN IF NOT EXISTS "has_groups"' in executed_sql
    assert 'ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "group"' in executed_sql
    assert 'ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "emaktab_id"' in executed_sql
    assert 'ALTER TABLE "assessments" ADD COLUMN IF NOT EXISTS "target_group"' in executed_sql
    assert 'CREATE TABLE IF NOT EXISTS "curriculum_resources"' in executed_sql
    assert 'CREATE TABLE IF NOT EXISTS "assessment_solutions"' in executed_sql


@pytest.mark.asyncio
async def test_ensure_schema_synced_sqlite_adds_missing_column(monkeypatch):
    monkeypatch.setattr(settings, "DATABASE_URL", "file:/tmp/mock.db")
    mock_db = AsyncMock()

    async def fake_query_raw(sql: str):
        if '"class_groups"' in sql:
            return [{"name": "id"}, {"name": "name"}]
        return [{"name": "id"}, {"name": "group"}, {"name": "emaktab_id"}, {"name": "target_group"}]

    mock_db.query_raw = AsyncMock(side_effect=fake_query_raw)
    mock_db.execute_raw = AsyncMock(return_value=0)

    await ensure_schema_synced(mock_db)

    executed_sql = [call.args[0] for call in mock_db.execute_raw.call_args_list]
    assert any(
        'ALTER TABLE "class_groups" ADD COLUMN "has_groups"' in s for s in executed_sql
    )
    assert not any('ALTER TABLE "students"' in s for s in executed_sql)


def test_bulk_create_students_survives_deleted_gaps_and_classname_fallback(
    client: TestClient,
    teacher_headers: dict[str, str],
):
    c11a_res = client.post(
        "/api/v1/classes",
        headers=teacher_headers,
        json={"schoolId": "school-ax-1", "tenantSlug": "al-xorazmiy", "name": "11-A sinf", "gradeLevel": 11},
    )
    c11b_res = client.post(
        "/api/v1/classes",
        headers=teacher_headers,
        json={"schoolId": "school-ax-1", "tenantSlug": "al-xorazmiy", "name": "11-B sinf", "gradeLevel": 11},
    )
    c11a_id = c11a_res.json()["id"]
    c11b_id = c11b_res.json()["id"]

    client.delete(f"/api/v1/students?tenantSlug=al-xorazmiy&classGroupId={c11a_id}", headers=teacher_headers)
    client.delete(f"/api/v1/students?tenantSlug=al-xorazmiy&classGroupId={c11b_id}", headers=teacher_headers)

    seed_res = client.post(
        "/api/v1/students/bulk",
        headers=teacher_headers,
        json=[
            {
                "tenantSlug": "al-xorazmiy",
                "schoolId": "school-ax-1",
                "classGroupId": c11b_id,
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
                "classGroupId": c11b_id,
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

    client.delete(f"/api/v1/students/{created_11b[0]['id']}", headers=teacher_headers)

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

    bulk_res = client.post("/api/v1/students/bulk", headers=teacher_headers, json=batch)
    assert bulk_res.status_code == 200
    imported = bulk_res.json()
    assert len(imported) == 15
    codes = {s["rosterCode"] for s in imported}
    assert len(codes) == 15
    assert created_11b[1]["rosterCode"] not in codes

    client.delete(f"/api/v1/students?tenantSlug=al-xorazmiy&classGroupId={c11a_id}", headers=teacher_headers)
    client.delete(f"/api/v1/students?tenantSlug=al-xorazmiy&classGroupId={c11b_id}", headers=teacher_headers)


def test_get_class_detail_with_assessment_result(
    client: TestClient,
    teacher_headers: dict[str, str],
):
    client.post(
        "/api/v1/assessments",
        headers=teacher_headers,
        json={
            "code": "CHSB-INF-11-Q1",
            "title": "Informatika 11-sinf. 1-ChSB",
            "subject": "Informatika va AT",
            "gradeLevel": 11,
            "quarter": 1,
            "durationMinutes": 40,
            "totalQuestions": 15,
            "maxScore": 40.0,
            "targetGroup": "all",
        },
    )
    cls_res = client.post(
        "/api/v1/classes",
        headers=teacher_headers,
        json={"schoolId": "school-ax-1", "tenantSlug": "al-xorazmiy", "name": "11-A sinf", "gradeLevel": 11},
    )
    assert cls_res.status_code == 200
    c11a_id = cls_res.json()["id"]

    client.delete(f"/api/v1/students?tenantSlug=al-xorazmiy&classGroupId={c11a_id}", headers=teacher_headers)
    res = client.post(
        "/api/v1/students",
        headers=teacher_headers,
        json={
            "tenantSlug": "al-xorazmiy",
            "schoolId": "school-ax-1",
            "classGroupId": c11a_id,
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
        headers=teacher_headers,
        json={
            "tenantId": "tenant-al-xorazmiy",
            "assessmentId": "chsb-inf-11-q1",
            "rosterRecordId": stu_id,
        },
    )
    assert attempt_res.status_code == 200
    attempt_id = attempt_res.json()["id"]

    submit_res = client.post(f"/api/v1/attempts/{attempt_id}/submit", headers=teacher_headers, json={})
    assert submit_res.status_code == 200

    detail_res = client.get(f"/api/v1/classes/{c11a_id}", headers=teacher_headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail["results"]) >= 1
    assert detail["results"][0]["group"] == "1-guruh"

    client.delete(f"/api/v1/students?tenantSlug=al-xorazmiy&classGroupId={c11a_id}", headers=teacher_headers)
