"""
Student roster: creating, importing and deleting students.
"""
from __future__ import annotations

import re
from datetime import date, datetime

from fastapi import HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models import ClassGroup, School, Student, Tenant
from backend.app.schemas.student import StudentCreate

DEFAULT_BIRTH_DATE = date(2008, 5, 15)
FIRST_ROSTER_NUMBER = 1101


def normalize_name_token(token: str | None) -> str:
    if not token:
        return ""
    return token.replace("’", "'").replace("‘", "'").replace("`", "'").strip().lower()


def pick_unique_roster_code(
    existing_codes: set[str],
    preferred: str | None = None,
    next_counter: int = FIRST_ROSTER_NUMBER,
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


async def get_existing_roster_codes(db: AsyncSession) -> tuple[set[str], int]:
    """All roster codes in use and the next free STU-xxxx number."""
    codes = set(await db.scalars(select(Student.roster_code)))
    max_num = FIRST_ROSTER_NUMBER - 1
    for code in codes:
        match = re.fullmatch(r"STU-(\d+)", code)
        if match:
            max_num = max(max_num, int(match.group(1)))
    return codes, max_num + 1


def _parse_birth_date(value: str) -> date:
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return DEFAULT_BIRTH_DATE


def serialize_student(student: Student, tenant_slug: str, class_name: str) -> dict:
    return {
        "id": student.id,
        "tenantId": student.tenant_id,
        "tenantSlug": tenant_slug,
        "schoolId": student.school_id,
        "classGroupId": student.class_group_id,
        "className": class_name,
        "rosterCode": student.roster_code,
        "firstName": student.first_name,
        "lastName": student.last_name,
        "middleName": student.middle_name,
        "fullName": f"{student.last_name} {student.first_name} {student.middle_name or ''}".strip(),
        "gender": student.gender,
        "birthDate": student.birth_date.isoformat(),
        "status": student.status.lower(),
        "group": student.group,
        "emaktabId": student.emaktab_id,
        "availableAssessmentIds": ["chsb-inf-11-q1"],
        "createdAt": student.created_at.isoformat(),
    }


def _build_student(item: StudentCreate, class_group: ClassGroup, roster_code: str) -> Student:
    return Student(
        tenant_id=class_group.tenant_id,
        school_id=class_group.school_id,
        class_group_id=class_group.id,
        roster_code=roster_code,
        first_name=item.firstName,
        last_name=item.lastName,
        middle_name=item.middleName,
        gender=item.gender,
        birth_date=_parse_birth_date(item.birthDate),
        status="ELIGIBLE" if item.status == "eligible" else "INACTIVE",
        group=item.group or None,
        emaktab_id=item.emaktabId,
    )


async def create_student(db: AsyncSession, tenant: Tenant, payload: StudentCreate) -> tuple[Student, ClassGroup]:
    class_group = None
    if payload.classGroupId:
        class_group = await db.scalar(
            select(ClassGroup).where(ClassGroup.id == payload.classGroupId, ClassGroup.tenant_id == tenant.id)
        )
    if not class_group and payload.className:
        class_group = await db.scalar(
            select(ClassGroup)
            .where(ClassGroup.tenant_id == tenant.id, ClassGroup.name == payload.className)
            .limit(1)
        )
    if not class_group:
        raise HTTPException(status_code=400, detail="Muassasada ko'rsatilgan sinf topilmadi.")

    classmates = await db.scalars(select(Student).where(Student.class_group_id == class_group.id))
    last = normalize_name_token(payload.lastName)
    first = normalize_name_token(payload.firstName)
    for other in classmates:
        if payload.emaktabId and other.emaktab_id == payload.emaktabId:
            raise HTTPException(
                status_code=409,
                detail=f"Ushbu sinfda eMaktab ID {payload.emaktabId} bo'lgan o'quvchi allaqachon mavjud.",
            )
        if normalize_name_token(other.last_name) == last and normalize_name_token(other.first_name) == first:
            raise HTTPException(
                status_code=409,
                detail=f"Ushbu sinfda {payload.lastName} {payload.firstName} ismli o'quvchi allaqachon mavjud.",
            )

    codes, counter = await get_existing_roster_codes(db)
    roster_code, _ = pick_unique_roster_code(codes, payload.rosterCode, counter)
    student = _build_student(payload, class_group, roster_code)
    db.add(student)
    await db.flush()
    return student, class_group


class _ClassResolver:
    """Find the class of an imported row by id or name, creating it when it does not exist."""

    def __init__(self, db: AsyncSession, classes: list[ClassGroup]) -> None:
        self.db = db
        self.by_id = {c.id: c for c in classes}
        self.by_name = {(c.tenant_id, c.name.strip().lower()): c for c in classes}

    async def resolve(self, tenant_id: str, item: StudentCreate) -> ClassGroup | None:
        class_group = self.by_id.get(item.classGroupId) if item.classGroupId else None
        if class_group and class_group.tenant_id != tenant_id:
            class_group = None
        if class_group or not item.className:
            return class_group

        wanted = item.className.strip().lower()
        class_group = self.by_name.get((tenant_id, wanted))
        if class_group:
            return class_group

        short = wanted.replace("sinf", "").strip()
        for (owner, name), candidate in self.by_name.items():
            if owner == tenant_id and name.replace("sinf", "").strip() == short:
                return candidate

        school = await self.db.scalar(
            select(School).where(School.tenant_id == tenant_id).order_by(School.created_at, School.id).limit(1)
        )
        if not school:
            return None

        grade_match = re.match(r"^\s*(\d+)", item.className)
        grade = min(11, max(1, int(grade_match.group(1)))) if grade_match else 10
        created = ClassGroup(
            school_id=school.id, tenant_id=tenant_id, name=item.className.strip(), grade_level=grade
        )
        self.db.add(created)
        await self.db.flush()
        self.by_id[created.id] = created
        self.by_name[(tenant_id, created.name.lower())] = created
        return created


async def bulk_create_students(
    db: AsyncSession, tenants: dict[str, Tenant], inputs: list[StudentCreate]
) -> list[tuple[Student, Tenant, ClassGroup]]:
    """Import many students in one transaction, skipping duplicates and unresolvable rows.

    `tenants` maps each tenantSlug used by the rows to a tenant the caller may write to.
    """
    tenant_ids = list({t.id for t in tenants.values()})
    classes = list(await db.scalars(select(ClassGroup).where(ClassGroup.tenant_id.in_(tenant_ids))))
    resolver = _ClassResolver(db, classes)
    existing = await db.scalars(select(Student).where(Student.tenant_id.in_(tenant_ids)))

    seen_emaktab: set[tuple[str, str]] = set()
    seen_names: set[tuple[str, str, str]] = set()
    for s in existing:
        if s.emaktab_id:
            seen_emaktab.add((s.class_group_id, s.emaktab_id))
        seen_names.add((s.class_group_id, normalize_name_token(s.last_name), normalize_name_token(s.first_name)))

    codes, counter = await get_existing_roster_codes(db)
    created: list[tuple[Student, Tenant, ClassGroup]] = []

    for item in inputs:
        tenant = tenants[item.tenantSlug]
        class_group = await resolver.resolve(tenant.id, item)
        if not class_group:
            continue

        name_key = (class_group.id, normalize_name_token(item.lastName), normalize_name_token(item.firstName))
        if item.emaktabId and (class_group.id, item.emaktabId) in seen_emaktab:
            continue
        if name_key in seen_names:
            continue
        if item.emaktabId:
            seen_emaktab.add((class_group.id, item.emaktabId))
        seen_names.add(name_key)

        roster_code, counter = pick_unique_roster_code(codes, item.rosterCode, counter)
        student = _build_student(item, class_group, roster_code)
        db.add(student)
        created.append((student, tenant, class_group))

    await db.flush()
    return created


async def delete_students(db: AsyncSession, *conditions) -> int:
    """Delete matching students. Their attempts and results go with them (database cascade)."""
    result = await db.execute(delete(Student).where(*conditions))
    return result.rowcount
