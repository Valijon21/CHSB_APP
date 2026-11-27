from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from pydantic import BaseModel, Field
from datetime import datetime
import re
from backend.app.db.prisma import get_prisma
from prisma import Prisma
from backend.app.core.permissions import school_staff, school_admin, resolve_tenant, ensure_tenant_access, can_access_tenant

router = APIRouter(prefix="/students", tags=["Students"])

class StudentCreate(BaseModel):
    tenantSlug: str
    schoolId: str | None = None
    classGroupId: str | None = None
    className: str | None = None
    firstName: str = Field(..., min_length=1)
    lastName: str = Field(..., min_length=1)
    middleName: str | None = None
    gender: str = "M"
    birthDate: str = "2008-05-15"
    rosterCode: str | None = None
    status: str = "eligible"
    group: str | None = None
    emaktabId: str | None = None

class BulkDeleteRequest(BaseModel):
    studentIds: list[str]

def normalize_name_token(token: str | None) -> str:
    if not token:
        return ""
    return token.replace("’", "'").replace("‘", "'").replace("`", "'").strip().lower()


def pick_unique_roster_code(
    existing_codes: set[str],
    preferred: str | None = None,
    next_counter: int = 1101,
) -> tuple[str, int]:
    """Return a globally unique roster code and the updated counter."""
    if preferred:
        if preferred not in existing_codes:
            existing_codes.add(preferred)
            return preferred, next_counter
        suffix = 1
        while f"{preferred}-{suffix}" in existing_codes:
            suffix += 1
        candidate = f"{preferred}-{suffix}"
        existing_codes.add(candidate)
        return candidate, next_counter

    counter = next_counter
    while f"STU-{counter}" in existing_codes:
        counter += 1
    candidate = f"STU-{counter}"
    existing_codes.add(candidate)
    return candidate, counter + 1


async def get_existing_roster_codes(db: Prisma) -> tuple[set[str], int]:
    """Fetch all existing roster codes and compute the safe next STU-xxxx counter."""
    rows = await db.query_raw('SELECT "roster_code" FROM "students"')
    codes: set[str] = {str(r["roster_code"]) for r in rows if r.get("roster_code")}
    max_num = 1100
    for code in codes:
        m = re.fullmatch(r"STU-(\d+)", code)
        if m:
            val = int(m.group(1))
            if val > max_num:
                max_num = val
    return codes, max_num + 1

@router.get("")
async def get_students(
    tenantSlug: str | None = Query(None),
    classGroupId: str | None = None,
    group: str | None = None,
    db: Prisma = Depends(get_prisma),
    current_user=Depends(school_staff),
):
    tenant = await resolve_tenant(db, current_user, tenantSlug)

    where_clause: dict = {"tenantId": tenant.id}
    if classGroupId:
        where_clause["classGroupId"] = classGroupId
    if group and group != "ALL":
        if group == "NONE":
            where_clause["group"] = None
        else:
            where_clause["group"] = group

    students = await db.student.find_many(
        where=where_clause,
        include={"classGroup": True},
        order={"lastName": "asc"},
    )

    return [
        {
            "id": s.id,
            "tenantId": s.tenantId,
            "tenantSlug": tenant.slug,
            "schoolId": s.schoolId,
            "classGroupId": s.classGroupId,
            "className": s.classGroup.name if s.classGroup else "",
            "rosterCode": s.rosterCode,
            "firstName": s.firstName,
            "lastName": s.lastName,
            "middleName": s.middleName,
            "fullName": f"{s.lastName} {s.firstName} {s.middleName or ''}".strip(),
            "gender": s.gender,
            "birthDate": s.birthDate.strftime("%Y-%m-%d"),
            "status": s.status.lower(),
            "group": s.group,
            "emaktabId": s.emaktabId,
            "availableAssessmentIds": ["chsb-inf-11-q1"],
            "createdAt": s.createdAt.isoformat(),
        }
        for s in students
    ]

@router.post("")
async def create_student(
    payload: StudentCreate,
    db: Prisma = Depends(get_prisma),
    current_user=Depends(school_admin),
):
    tenant = await resolve_tenant(db, current_user, payload.tenantSlug)

    # Safely resolve valid class group and school within tenant
    class_group = None
    if payload.classGroupId:
        class_group = await db.classgroup.find_first(
            where={"id": payload.classGroupId, "tenantId": tenant.id}
        )
    if not class_group and payload.className:
        class_group = await db.classgroup.find_first(
            where={"tenantId": tenant.id, "name": payload.className}
        )
    if not class_group:
        raise HTTPException(status_code=400, detail="Muassasada ko'rsatilgan sinf topilmadi.")

    class_group_id = class_group.id
    school_id = class_group.schoolId

    # Deduplication check: check if student with same name or emaktabId already exists in this class
    existing_in_class = await db.student.find_many(
        where={"classGroupId": class_group_id}
    )
    norm_last = normalize_name_token(payload.lastName)
    norm_first = normalize_name_token(payload.firstName)
    for s in existing_in_class:
        if payload.emaktabId and s.emaktabId and s.emaktabId == payload.emaktabId:
            raise HTTPException(
                status_code=409,
                detail=f"Ushbu sinfda eMaktab ID {payload.emaktabId} bo'lgan o'quvchi allaqachon mavjud.",
            )
        if normalize_name_token(s.lastName) == norm_last and normalize_name_token(s.firstName) == norm_first:
            raise HTTPException(
                status_code=409,
                detail=f"Ushbu sinfda {payload.lastName} {payload.firstName} ismli o'quvchi allaqachon mavjud.",
            )

    existing_codes, next_counter = await get_existing_roster_codes(db)
    roster_code, _ = pick_unique_roster_code(existing_codes, payload.rosterCode, next_counter)

    try:
        b_date = datetime.strptime(payload.birthDate, "%Y-%m-%d")
    except Exception:
        b_date = datetime(2008, 5, 15)

    created = await db.student.create(
        data={
            "tenantId": tenant.id,
            "schoolId": school_id,
            "classGroupId": class_group_id,
            "rosterCode": roster_code,
            "firstName": payload.firstName,
            "lastName": payload.lastName,
            "middleName": payload.middleName,
            "gender": payload.gender,
            "birthDate": b_date,
            "status": "ELIGIBLE" if payload.status == "eligible" else "INACTIVE",
            "group": payload.group if payload.group else None,
            "emaktabId": payload.emaktabId,
        },
        include={"classGroup": True},
    )

    # Increment student counts on class group and school
    await db.classgroup.update(
        where={"id": class_group_id},
        data={"studentCount": {"increment": 1}},
    )
    await db.school.update(
        where={"id": school_id},
        data={"studentCount": {"increment": 1}},
    )

    return {
        "id": created.id,
        "tenantId": created.tenantId,
        "tenantSlug": tenant.slug,
        "schoolId": created.schoolId,
        "classGroupId": created.classGroupId,
        "className": created.classGroup.name if created.classGroup else "",
        "rosterCode": created.rosterCode,
        "firstName": created.firstName,
        "lastName": created.lastName,
        "middleName": created.middleName,
        "fullName": f"{created.lastName} {created.firstName} {created.middleName or ''}".strip(),
        "status": created.status.lower(),
        "group": created.group,
        "emaktabId": created.emaktabId,
        "availableAssessmentIds": ["chsb-inf-11-q1"],
        "createdAt": created.createdAt.isoformat(),
    }

async def _resolve_or_create_class_group(
    db: Prisma,
    tenant_id: str,
    item: StudentCreate,
    class_map: dict,
    class_name_map: dict,
):
    """Resolve class group by ID, exact/short name, or auto-create it within the tenant."""
    class_group = class_map.get(item.classGroupId) if item.classGroupId else None
    if class_group and class_group.tenantId != tenant_id:
        class_group = None
    if class_group or not item.className:
        return class_group

    norm_target = item.className.strip().lower()
    class_group = class_name_map.get((tenant_id, norm_target))
    if class_group:
        return class_group

    norm_short = norm_target.replace("sinf", "").strip()
    for (t_id, c_name), c_obj in class_name_map.items():
        if t_id == tenant_id and c_name.replace("sinf", "").strip() == norm_short:
            return c_obj

    school = await db.school.find_first(where={"tenantId": tenant_id})
    if not school:
        return None

    grade_match = re.match(r"^\s*(\d+)", item.className)
    grade_lvl = min(11, max(1, int(grade_match.group(1)))) if grade_match else 10
    created_cls = await db.classgroup.create(
        data={
            "schoolId": school.id,
            "tenantId": tenant_id,
            "name": item.className.strip(),
            "gradeLevel": grade_lvl,
            "shift": 1,
            "academicYear": "2026-2027",
            "studentCount": 0,
            "hasGroups": True,
        }
    )
    class_map[created_cls.id] = created_cls
    class_name_map[(tenant_id, created_cls.name.strip().lower())] = created_cls
    return created_cls


@router.post("/bulk")
async def bulk_create_students(
    inputs: list[StudentCreate],
    db: Prisma = Depends(get_prisma),
    current_user=Depends(school_admin),
):
    if not inputs:
        return []

    tenant_slugs = {item.tenantSlug for item in inputs if item.tenantSlug}
    tenants = await db.tenant.find_many(
        where={"OR": [{"slug": {"in": list(tenant_slugs)}}, {"id": {"in": list(tenant_slugs)}}]}
    )
    tenant_map = {t.slug: t for t in tenants}
    tenant_map.update({t.id: t for t in tenants})

    # Reject the whole batch before writing anything if any row targets a foreign tenant
    for ref in {item.tenantSlug for item in inputs}:
        target = tenant_map.get(ref)
        if not target or not can_access_tenant(current_user, target.id):
            raise HTTPException(status_code=404, detail="Tenant topilmadi.")

    tenant_ids = list({t.id for t in tenant_map.values()})
    all_classes = await db.classgroup.find_many(
        where={"tenantId": {"in": tenant_ids}}
    ) if tenant_ids else []
    class_map = {c.id: c for c in all_classes}
    class_name_map = {(c.tenantId, c.name.strip().lower()): c for c in all_classes}

    all_class_ids = [c.id for c in all_classes]
    existing_students = await db.student.find_many(
        where={"classGroupId": {"in": all_class_ids}}
    ) if all_class_ids else []

    seen_emaktab_ids: set[tuple[str, str]] = {
        (s.classGroupId, s.emaktabId) for s in existing_students if s.classGroupId and s.emaktabId
    }
    seen_names: set[tuple[str, str, str]] = {
        (s.classGroupId, normalize_name_token(s.lastName), normalize_name_token(s.firstName))
        for s in existing_students if s.classGroupId
    }

    existing_codes, next_counter = await get_existing_roster_codes(db)

    results = []
    class_increment_counts: dict[str, int] = {}
    school_increment_counts: dict[str, int] = {}

    for item in inputs:
        tenant = tenant_map.get(item.tenantSlug)
        if not tenant:
            continue

        class_group = await _resolve_or_create_class_group(
            db, tenant.id, item, class_map, class_name_map
        )
        if not class_group:
            continue

        class_group_id = class_group.id
        school_id = class_group.schoolId

        norm_last = normalize_name_token(item.lastName)
        norm_first = normalize_name_token(item.firstName)

        # Deduplication check
        if item.emaktabId and (class_group_id, item.emaktabId) in seen_emaktab_ids:
            continue
        if (class_group_id, norm_last, norm_first) in seen_names:
            continue

        if item.emaktabId:
            seen_emaktab_ids.add((class_group_id, item.emaktabId))
        seen_names.add((class_group_id, norm_last, norm_first))

        roster_code, next_counter = pick_unique_roster_code(
            existing_codes, item.rosterCode, next_counter
        )

        try:
            b_date = datetime.strptime(item.birthDate, "%Y-%m-%d")
        except Exception:
            b_date = datetime(2008, 5, 15)

        created = await db.student.create(
            data={
                "tenantId": tenant.id,
                "schoolId": school_id,
                "classGroupId": class_group_id,
                "rosterCode": roster_code,
                "firstName": item.firstName,
                "lastName": item.lastName,
                "middleName": item.middleName,
                "gender": item.gender,
                "birthDate": b_date,
                "status": "ELIGIBLE" if item.status == "eligible" else "INACTIVE",
                "group": item.group if item.group else None,
                "emaktabId": item.emaktabId,
            },
            include={"classGroup": True},
        )

        class_increment_counts[class_group_id] = class_increment_counts.get(class_group_id, 0) + 1
        school_increment_counts[school_id] = school_increment_counts.get(school_id, 0) + 1

        results.append({
            "id": created.id,
            "tenantId": created.tenantId,
            "tenantSlug": tenant.slug,
            "schoolId": created.schoolId,
            "classGroupId": created.classGroupId,
            "className": created.classGroup.name if created.classGroup else "",
            "rosterCode": created.rosterCode,
            "firstName": created.firstName,
            "lastName": created.lastName,
            "middleName": created.middleName,
            "fullName": f"{created.lastName} {created.firstName} {created.middleName or ''}".strip(),
            "status": created.status.lower(),
            "group": created.group,
            "emaktabId": created.emaktabId,
            "availableAssessmentIds": ["chsb-inf-11-q1"],
            "createdAt": created.createdAt.isoformat(),
        })

    for cls_id, inc in class_increment_counts.items():
        await db.classgroup.update(where={"id": cls_id}, data={"studentCount": {"increment": inc}})
    for sch_id, inc in school_increment_counts.items():
        await db.school.update(where={"id": sch_id}, data={"studentCount": {"increment": inc}})

    return results

@router.delete("")
async def delete_all_students(
    tenantSlug: str = Query(..., min_length=1),
    classGroupId: str | None = Query(None),
    db: Prisma = Depends(get_prisma),
    current_user=Depends(school_admin),
):
    tenant = await resolve_tenant(db, current_user, tenantSlug)
    where_clause: dict = {"tenantId": tenant.id}

    if classGroupId:
        target_class = await db.classgroup.find_unique(where={"id": classGroupId})
        if not target_class or target_class.tenantId != tenant.id:
            raise HTTPException(status_code=404, detail="Sinf topilmadi.")
        where_clause["classGroupId"] = classGroupId
        students = await db.student.find_many(where=where_clause)
        student_ids = [s.id for s in students]
        deleted_count = len(student_ids)

        if student_ids:
            await db.assessmentresult.delete_many(where={"studentId": {"in": student_ids}})
            await db.assessmentattempt.delete_many(where={"studentId": {"in": student_ids}})
            await db.student.delete_many(where={"id": {"in": student_ids}})

        await db.classgroup.update(where={"id": classGroupId}, data={"studentCount": 0})
        if students and students[0].schoolId:
            school_id = students[0].schoolId
            sch = await db.school.find_unique(where={"id": school_id})
            new_count = max(0, (sch.studentCount if sch else 0) - deleted_count)
            await db.school.update(where={"id": school_id}, data={"studentCount": new_count})

        return {
            "success": True,
            "deletedCount": deleted_count,
            "message": f"Sinfdagi {deleted_count} nafar o'quvchi ma'lumotlari to'liq o'chirildi.",
        }

    students = await db.student.find_many(where={"tenantId": tenant.id})
    student_ids = [s.id for s in students]
    if student_ids:
        await db.assessmentresult.delete_many(where={"studentId": {"in": student_ids}})
        await db.assessmentattempt.delete_many(where={"studentId": {"in": student_ids}})

    deleted_count = await db.student.delete_many(where={"tenantId": tenant.id})
    await db.classgroup.update_many(where={"tenantId": tenant.id}, data={"studentCount": 0})
    await db.school.update_many(where={"tenantId": tenant.id}, data={"studentCount": 0})

    return {
        "success": True,
        "deletedCount": deleted_count,
        "message": f"{deleted_count} nafar o'quvchi ma'lumotlari to'liq o'chirildi.",
    }

@router.post("/bulk-delete")
async def bulk_delete_students(
    payload: BulkDeleteRequest,
    db: Prisma = Depends(get_prisma),
    current_user=Depends(school_admin),
):
    if not payload.studentIds:
        return {"success": True, "deletedCount": 0, "message": "O'quvchilar tanlanmagan."}

    students = await db.student.find_many(where={"id": {"in": payload.studentIds}})
    students = [s for s in students if can_access_tenant(current_user, s.tenantId)]
    if not students:
        return {"success": True, "deletedCount": 0, "message": "O'quvchilar topilmadi."}

    student_ids = [s.id for s in students]
    await db.assessmentresult.delete_many(where={"studentId": {"in": student_ids}})
    await db.assessmentattempt.delete_many(where={"studentId": {"in": student_ids}})

    deleted_count = await db.student.delete_many(where={"id": {"in": student_ids}})

    class_counts: dict[str, int] = {}
    school_counts: dict[str, int] = {}
    for s in students:
        if s.classGroupId:
            class_counts[s.classGroupId] = class_counts.get(s.classGroupId, 0) + 1
        if s.schoolId:
            school_counts[s.schoolId] = school_counts.get(s.schoolId, 0) + 1

    for c_id, count in class_counts.items():
        cls = await db.classgroup.find_unique(where={"id": c_id})
        new_cnt = max(0, (cls.studentCount if cls else 0) - count)
        await db.classgroup.update(where={"id": c_id}, data={"studentCount": new_cnt})

    for s_id, count in school_counts.items():
        sch = await db.school.find_unique(where={"id": s_id})
        new_cnt = max(0, (sch.studentCount if sch else 0) - count)
        await db.school.update(where={"id": s_id}, data={"studentCount": new_cnt})

    return {
        "success": True,
        "deletedCount": deleted_count,
        "message": f"{deleted_count} nafar o'quvchi muvaffaqiyatli o'chirildi.",
    }

@router.delete("/{student_id}")
async def delete_student(
    student_id: str,
    db: Prisma = Depends(get_prisma),
    current_user=Depends(school_admin),
):
    student = await db.student.find_unique(where={"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="O'quvchi topilmadi.")
    ensure_tenant_access(current_user, student.tenantId, "O'quvchi topilmadi.")

    await db.assessmentresult.delete_many(where={"studentId": student_id})
    await db.assessmentattempt.delete_many(where={"studentId": student_id})
    await db.student.delete(where={"id": student_id})

    if student.classGroupId:
        cls = await db.classgroup.find_unique(where={"id": student.classGroupId})
        new_cnt = max(0, (cls.studentCount if cls else 0) - 1)
        await db.classgroup.update(where={"id": student.classGroupId}, data={"studentCount": new_cnt})
    if student.schoolId:
        sch = await db.school.find_unique(where={"id": student.schoolId})
        new_cnt = max(0, (sch.studentCount if sch else 0) - 1)
        await db.school.update(where={"id": student.schoolId}, data={"studentCount": new_cnt})

    return {"success": True, "message": "O'quvchi muvaffaqiyatli o'chirildi."}

@router.post("/parse-file", dependencies=[Depends(school_admin)])
async def parse_student_roster_file(
    file: UploadFile = File(...),
    group: str | None = Form(None)
):
    from backend.app.services.excel_parser import parse_excel_or_csv_file
    file_bytes = await file.read()
    file_name = file.filename or "roster.xlsx"
    result = parse_excel_or_csv_file(file_name=file_name, file_bytes=file_bytes, group_override=group)
    return result

