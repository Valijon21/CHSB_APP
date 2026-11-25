import json
from datetime import datetime, timezone
import bcrypt
import sys
from pathlib import Path

# Remove local directory from sys.path to prevent backend/app/db/prisma.py from shadowing installed prisma
_db_dir = str(Path(__file__).resolve().parent)
if _db_dir in sys.path:
    sys.path.remove(_db_dir)

from prisma import Prisma

STANDARD_SUBJECTS = [
    {"name": "Matematika", "code": "MATH", "gradeLevels": "5,6,7,8,9,10,11", "description": "Algebra, geometriya va amaliy matematika"},
    {"name": "Informatika va AT", "code": "INF", "gradeLevels": "5,6,7,8,9,10,11", "description": "Dasturlash, kompyuter savodxonligi va axborot texnologiyalari"},
    {"name": "Fizika", "code": "PHYS", "gradeLevels": "7,8,9,10,11", "description": "Mexanika, termodinamika va elektrodinamika"},
    {"name": "Kimyo", "code": "CHEM", "gradeLevels": "7,8,9,10,11", "description": "Umumiy va organik kimyo"},
    {"name": "Biologiya", "code": "BIO", "gradeLevels": "5,6,7,8,9,10,11", "description": "Botanika, zoologiya va umumiy biologiya"},
    {"name": "Ona tili va adabiyot", "code": "UZB", "gradeLevels": "5,6,7,8,9,10,11", "description": "Grammatika, adabiyot va matn bilan ishlash"},
    {"name": "Ingliz tili", "code": "ENG", "gradeLevels": "5,6,7,8,9,10,11", "description": "Xorijiy til: grammatika, leksika va tinglab tushunish"},
    {"name": "Tarix", "code": "HIST", "gradeLevels": "5,6,7,8,9,10,11", "description": "O'zbekiston tarixi va jahon tarixi"},
    {"name": "Geografiya", "code": "GEO", "gradeLevels": "5,6,7,8,9,10", "description": "Tabiiy va iqtisodiy geografiya"},
]

async def seed_subjects_if_empty(db: Prisma):
    """
    Populates subjects for all existing tenants if they have none.
    """
    tenants = await db.tenant.find_many()
    for t in tenants:
        count = await db.subject.count(where={"tenantId": t.id})
        if count == 0:
            for s in STANDARD_SUBJECTS:
                await db.subject.create(
                    data={
                        "tenantId": t.id,
                        "name": s["name"],
                        "code": s["code"],
                        "gradeLevels": s["gradeLevels"],
                        "description": s["description"],
                        "isActive": True,
                    }
                )
            print(f"✅ Seeded {len(STANDARD_SUBJECTS)} subjects for tenant '{t.slug}'")

async def auto_seed_db(db: Prisma, force: bool = False):
    """
    Automatic self-bootstrapping seed function.
    Populates SQLite database with full real records if database is empty.
    """
    print("🌱 Starting Database Auto-Seed for CHSB Assessment Platform...")

    # 1. Password Hashing
    default_password = "Secret123!"
    hashed_password = bcrypt.hashpw(default_password.encode("utf-8"), bcrypt.gensalt(10)).decode("utf-8")

    # 2. Check if Tenants exist
    if not force:
        existing = await db.tenant.count()
        if existing > 0:
            print("ℹ️ Database already has records, verifying subjects...")
            await seed_subjects_if_empty(db)
            return

    # 3. Create Tenants
    tenant_ax = await db.tenant.create(
        data={
            "id": "tenant-al-xorazmiy",
            "slug": "al-xorazmiy",
            "name": "Muhammad al-Xorazmiy nomidagi ixtisoslashtirilgan IT-maktab",
            "regionId": "tashkent-city",
            "isActive": True,
        }
    )

    tenant_tm = await db.tenant.create(
        data={
            "id": "tenant-temurbeklar",
            "slug": "temurbeklar-maktabi",
            "name": "Temurbeklar Maktabi Harbiy-Akademik Litseyi",
            "regionId": "tashkent-city",
            "isActive": True,
        }
    )

    # 4. Create Schools
    school_ax = await db.school.create(
        data={
            "id": "school-ax-1",
            "tenantId": tenant_ax.id,
            "name": "Al-Xorazmiy IT Bosh Kampusi",
            "districtId": "mirzo-ulugbek",
            "schoolType": "specialized",
            "studentCount": 0,
        }
    )

    school_tm = await db.school.create(
        data={
            "id": "school-tm-1",
            "tenantId": tenant_tm.id,
            "name": "Temurbeklar Maktabi Markaziy Kampus",
            "districtId": "chilonzor",
            "schoolType": "military",
            "studentCount": 0,
        }
    )

    # 5. Create Users (System Accounts)
    users_data = [
        {
            "id": "usr-teacher-01",
            "tenantId": tenant_ax.id,
            "username": "teacher_ax",
            "email": "teacher@al-xorazmiy.uz",
            "fullName": "Anvar Rahimov",
            "hashedPassword": hashed_password,
            "role": "TEACHER",
            "isActive": True,
        },
        {
            "id": "usr-admin-01",
            "tenantId": tenant_ax.id,
            "username": "admin_ax",
            "email": "admin@al-xorazmiy.uz",
            "fullName": "Al-Xorazmiy Administrator",
            "hashedPassword": hashed_password,
            "role": "SCHOOL_ADMIN",
            "isActive": True,
        },
        {
            "id": "usr-inspector-01",
            "tenantId": tenant_ax.id,
            "username": "inspector_tashkent",
            "email": "inspector@toshkent-xtb.uz",
            "fullName": "Shavkat Rahimov (ShHTB)",
            "hashedPassword": hashed_password,
            "role": "REGIONAL_INSPECTOR",
            "isActive": True,
        },
    ]

    for u in users_data:
        await db.user.create(data=u)

    # 6. Class Groups (Clean zero baseline - classes are created via import or admin UI)
    classes_data: list[dict] = []
    for cg in classes_data:
        await db.classgroup.create(
            data={
                "id": cg["id"],
                "tenantId": cg["tenantId"],
                "schoolId": cg["schoolId"],
                "name": cg["name"],
                "gradeLevel": cg["gradeLevel"],
                "shift": cg["shift"],
                "studentCount": cg["studentCount"],
                "hasGroups": cg["hasGroups"],
                "academicYear": "2026-2027",
            }
        )

    # 7. Students (Clean zero baseline - students must be imported dynamically)
    students_raw: list[dict] = []
    for s in students_raw:
        await db.student.create(data=s)

    # 8. Assessments & Questions (Clean zero baseline - no mock assessments/questions)
    # Teachers create real assessments or import curriculum

    # 9. Attempts & Results (Clean zero baseline - zero mock results)
    results_data: list[dict] = []

    await seed_subjects_if_empty(db)

    print("✅ Clean production bootstrap completed: 2 tenants, 2 schools, auth users, 9 standard subjects, 0 mock classes, 0 mock students.")

if __name__ == "__main__":
    import asyncio
    async def run_cli_seed():
        db = Prisma()
        await db.connect()
        try:
            print("🧹 Purging old sample data...")
            await db.assessmentresult.delete_many()
            await db.assessmentattempt.delete_many()
            await db.question.delete_many()
            await db.assessment.delete_many()
            await db.student.delete_many()
            await db.classgroup.delete_many()
            await db.subject.delete_many()
            await db.user.delete_many()
            await db.school.delete_many()
            await db.tenant.delete_many()
            await auto_seed_db(db, force=True)
        finally:
            await db.disconnect()

    asyncio.run(run_cli_seed())

