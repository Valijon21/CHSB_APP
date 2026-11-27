"""
Data a new installation starts with. Nothing here ever deletes or overwrites.
"""
from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.core.security import BLOCKED_PASSWORDS, MIN_PASSWORD_LENGTH, get_password_hash
from backend.app.models import AssessmentSolution, CurriculumResource, School, Subject, Tenant, User

CURRICULUM_FILE = Path(__file__).resolve().parents[1] / "data" / "curriculum.json"
DEFAULT_TENANT_ID = "tenant-al-xorazmiy"

TENANTS = [
    {
        "id": DEFAULT_TENANT_ID,
        "slug": "al-xorazmiy",
        "name": "Muhammad al-Xorazmiy nomidagi ixtisoslashtirilgan IT-maktab",
        "region_id": "tashkent-city",
    },
    {
        "id": "tenant-temurbeklar",
        "slug": "temurbeklar-maktabi",
        "name": "Temurbeklar Maktabi Harbiy-Akademik Litseyi",
        "region_id": "tashkent-city",
    },
]

SCHOOLS = [
    {
        "id": "school-ax-1",
        "tenant_id": DEFAULT_TENANT_ID,
        "name": "Al-Xorazmiy IT Bosh Kampusi",
        "district_id": "mirzo-ulugbek",
        "school_type": "specialized",
    },
    {
        "id": "school-tm-1",
        "tenant_id": "tenant-temurbeklar",
        "name": "Temurbeklar Maktabi Markaziy Kampus",
        "district_id": "chilonzor",
        "school_type": "military",
    },
]

SYSTEM_ACCOUNTS = [
    {
        "id": "usr-teacher-01",
        "username": "teacher_ax",
        "email": "teacher@al-xorazmiy.uz",
        "full_name": "Anvar Rahimov",
        "role": "TEACHER",
    },
    {
        "id": "usr-admin-01",
        "username": "admin_ax",
        "email": "admin@al-xorazmiy.uz",
        "full_name": "Al-Xorazmiy Administrator",
        "role": "SCHOOL_ADMIN",
    },
    {
        "id": "usr-inspector-01",
        "username": "inspector_tashkent",
        "email": "inspector@toshkent-xtb.uz",
        "full_name": "Shavkat Rahimov (ShHTB)",
        "role": "REGIONAL_INSPECTOR",
    },
]

STANDARD_SUBJECTS = [
    ("Matematika", "MATH", "5,6,7,8,9,10,11", "Algebra, geometriya va amaliy matematika"),
    ("Informatika va AT", "INF", "5,6,7,8,9,10,11", "Dasturlash, kompyuter savodxonligi va axborot texnologiyalari"),
    ("Fizika", "PHYS", "7,8,9,10,11", "Mexanika, termodinamika va elektrodinamika"),
    ("Kimyo", "CHEM", "7,8,9,10,11", "Umumiy va organik kimyo"),
    ("Biologiya", "BIO", "5,6,7,8,9,10,11", "Botanika, zoologiya va umumiy biologiya"),
    ("Ona tili va adabiyot", "UZB", "5,6,7,8,9,10,11", "Grammatika, adabiyot va matn bilan ishlash"),
    ("Ingliz tili", "ENG", "5,6,7,8,9,10,11", "Xorijiy til: grammatika, leksika va tinglab tushunish"),
    ("Tarix", "HIST", "5,6,7,8,9,10,11", "O'zbekiston tarixi va jahon tarixi"),
    ("Geografiya", "GEO", "5,6,7,8,9,10", "Tabiiy va iqtisodiy geografiya"),
]


async def seed_users_if_empty(db: AsyncSession) -> None:
    """Create the system accounts, only when SEED_PASSWORD provides a private password."""
    if await db.scalar(select(func.count()).select_from(User)):
        return
    password = settings.SEED_PASSWORD
    if len(password) < MIN_PASSWORD_LENGTH or password in BLOCKED_PASSWORDS:
        logger.warning(
            "No users created: set SEED_PASSWORD (at least %d characters) and restart.", MIN_PASSWORD_LENGTH
        )
        return
    if not await db.get(Tenant, DEFAULT_TENANT_ID):
        return
    school_id = await db.scalar(
        select(School.id).where(School.tenant_id == DEFAULT_TENANT_ID).order_by(School.created_at, School.id).limit(1)
    )
    hashed = get_password_hash(password)
    db.add_all(
        User(**account, tenant_id=DEFAULT_TENANT_ID, school_id=school_id, hashed_password=hashed)
        for account in SYSTEM_ACCOUNTS
    )
    await db.flush()
    logger.info("Created %d system accounts", len(SYSTEM_ACCOUNTS))


async def seed_subjects_if_empty(db: AsyncSession) -> None:
    """Give every tenant without subjects the standard list."""
    for tenant in list(await db.scalars(select(Tenant))):
        if await db.scalar(select(func.count()).select_from(Subject).where(Subject.tenant_id == tenant.id)):
            continue
        db.add_all(
            Subject(tenant_id=tenant.id, name=name, code=code, grade_levels=grades, description=description)
            for name, code, grades, description in STANDARD_SUBJECTS
        )
    await db.flush()


async def seed_curriculum(db: AsyncSession, tenant_id: str = DEFAULT_TENANT_ID) -> tuple[int, int]:
    """Add the bundled informatics material that is missing. Returns (resources, solutions) added."""
    if not await db.get(Tenant, tenant_id):
        raise ValueError(f"Tenant '{tenant_id}' does not exist.")
    data = json.loads(CURRICULUM_FILE.read_text(encoding="utf-8"))

    added = []
    for model, rows, extra in (
        (CurriculumResource, data["resources"], {"tenant_id": tenant_id}),
        (AssessmentSolution, data["solutions"], {}),
    ):
        existing = set(await db.scalars(select(model.id)))
        new = [model(**row, **extra) for row in rows if row["id"] not in existing]
        db.add_all(new)
        added.append(len(new))
    await db.flush()
    return added[0], added[1]


async def bootstrap(db: AsyncSession) -> None:
    """Fill an empty database with the schools, accounts and subjects needed to start."""
    if not await db.scalar(select(func.count()).select_from(Tenant)):
        logger.info("Empty database: creating the initial schools")
        db.add_all(Tenant(**data) for data in TENANTS)
        await db.flush()
        db.add_all(School(**data) for data in SCHOOLS)
        await db.flush()
    await seed_users_if_empty(db)
    await seed_subjects_if_empty(db)
    await db.commit()
