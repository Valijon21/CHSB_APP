from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from pydantic import BaseModel, Field
from datetime import datetime
from backend.app.db.prisma import get_prisma
from prisma import Prisma

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

@router.get("")
async def get_students(
    tenantSlug: str = Query("al-xorazmiy"),
    classGroupId: str | None = None,
    group: str | None = None,
    db: Prisma = Depends(get_prisma),
):
    tenant = await db.tenant.find_first(
        where={"OR": [{"slug": tenantSlug}, {"id": tenantSlug}]}
    )
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant topilmadi.")

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
async def create_student(payload: StudentCreate, db: Prisma = Depends(get_prisma)):
    tenant = await db.tenant.find_first(
        where={"OR": [{"slug": payload.tenantSlug}, {"id": payload.tenantSlug}]}
    )
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant topilmadi.")

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

    roster_code = payload.rosterCode
    if not roster_code:
        count = await db.student.count(where={"tenantId": tenant.id})
        roster_code = f"STU-{1100 + count + 1}"
    else:
        existing = await db.student.find_first(where={"rosterCode": roster_code})
        if existing:
            roster_code = f"{roster_code}-{int(datetime.now().timestamp())}"

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

@router.post("/bulk")
async def bulk_create_students(inputs: list[StudentCreate], db: Prisma = Depends(get_prisma)):
    if not inputs:
        return []

    tenant_slugs = {item.tenantSlug for item in inputs if item.tenantSlug}
    tenants = await db.tenant.find_many(
        where={"OR": [{"slug": {"in": list(tenant_slugs)}}, {"id": {"in": list(tenant_slugs)}}]}
    )
    tenant_map = {t.slug: t for t in tenants}
    tenant_map.update({t.id: t for t in tenants})

    tenant_ids = [t.id for t in tenant_map.values()]
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

    tenant_counts: dict[str, int] = {}
    for t_slug, t in tenant_map.items():
        if t.id not in tenant_counts:
            tenant_counts[t.id] = await db.student.count(where={"tenantId": t.id})

    results = []
    class_increment_counts: dict[str, int] = {}
    school_increment_counts: dict[str, int] = {}

    for item in inputs:
        tenant = tenant_map.get(item.tenantSlug)
        if not tenant:
            continue

        class_group = class_map.get(item.classGroupId)
        if not class_group and item.className:
            class_group = class_name_map.get((tenant.id, item.className.strip().lower()))
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

        tenant_counts[tenant.id] = tenant_counts.get(tenant.id, 0) + 1
        roster_code = item.rosterCode
        if not roster_code:
            roster_code = f"STU-{1100 + tenant_counts[tenant.id]}"

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
    tenantSlug: str | None = Query(None),
    classGroupId: str | None = Query(None),
    db: Prisma = Depends(get_prisma),
):
    where_clause: dict = {}
    tenant = None
    if tenantSlug:
        tenant = await db.tenant.find_first(
            where={"OR": [{"slug": tenantSlug}, {"id": tenantSlug}]}
        )
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant topilmadi.")
        where_clause["tenantId"] = tenant.id

    if classGroupId:
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

    if not tenant:
        await db.assessmentresult.delete_many()
        await db.assessmentattempt.delete_many()
        deleted_count = await db.student.delete_many()
        await db.classgroup.update_many(where={}, data={"studentCount": 0})
        await db.school.update_many(where={}, data={"studentCount": 0})
        return {
            "success": True,
            "deletedCount": deleted_count,
            "message": f"Barcha ({deleted_count} nafar) o'quvchi ma'lumotlari to'liq o'chirildi.",
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
async def bulk_delete_students(payload: BulkDeleteRequest, db: Prisma = Depends(get_prisma)):
    if not payload.studentIds:
        return {"success": True, "deletedCount": 0, "message": "O'quvchilar tanlanmagan."}

    students = await db.student.find_many(where={"id": {"in": payload.studentIds}})
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
async def delete_student(student_id: str, db: Prisma = Depends(get_prisma)):
    student = await db.student.find_unique(where={"id": student_id})
    if not student:
        return {"success": True, "message": "O'quvchi topilmadi."}

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

@router.post("/parse-file")
async def parse_student_roster_file(
    file: UploadFile = File(...),
    group: str | None = Form(None)
):
    from backend.app.services.excel_parser import parse_excel_or_csv_file
    file_bytes = await file.read()
    file_name = file.filename or "roster.xlsx"
    result = parse_excel_or_csv_file(file_name=file_name, file_bytes=file_bytes, group_override=group)
    return result

