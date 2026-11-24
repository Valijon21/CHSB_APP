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

    # 5. Create Users
    users_data = [
        {
            "id": "usr-teacher-01",
            "tenantId": tenant_ax.id,
            "username": "teacher_ax",
            "email": "teacher@al-xorazmiy.uz",
            "fullName": "Dilmurod Rahmataliyevich Yunusov",
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
        {
            "id": "usr-student-01",
            "tenantId": tenant_ax.id,
            "username": "student_ax",
            "email": "zuxra@student.uz",
            "fullName": "Zuxra Abduraximova",
            "hashedPassword": hashed_password,
            "role": "STUDENT",
            "isActive": True,
        },
    ]

    for u in users_data:
        await db.user.create(data=u)

    # 6. Create Class Groups (Zero initial student counts)
    classes_data = [
        {"id": "class-ax-11a", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "name": "11-A sinf", "gradeLevel": 11, "shift": 1, "studentCount": 0, "hasGroups": True},
        {"id": "class-ax-11b", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "name": "11-B sinf", "gradeLevel": 11, "shift": 1, "studentCount": 0, "hasGroups": True},
        {"id": "class-ax-11v", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "name": "11-V sinf", "gradeLevel": 11, "shift": 2, "studentCount": 0, "hasGroups": True},
        {"id": "class-ax-10a", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "name": "10-A sinf", "gradeLevel": 10, "shift": 1, "studentCount": 0, "hasGroups": True},
        {"id": "class-ax-10b", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "name": "10-B sinf", "gradeLevel": 10, "shift": 1, "studentCount": 0, "hasGroups": True},
        {"id": "class-ax-10v", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "name": "10-V sinf", "gradeLevel": 10, "shift": 1, "studentCount": 0, "hasGroups": True},
        {"id": "class-ax-9a", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "name": "9-A sinf", "gradeLevel": 9, "shift": 1, "studentCount": 0, "hasGroups": False},
        {"id": "class-ax-9b", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "name": "9-B sinf", "gradeLevel": 9, "shift": 2, "studentCount": 0, "hasGroups": False},
        {"id": "class-tm-11g1", "tenantId": tenant_tm.id, "schoolId": school_tm.id, "name": "11-Guruh-1 (Harbiy-AT)", "gradeLevel": 11, "shift": 1, "studentCount": 0, "hasGroups": False},
        {"id": "class-tm-11g2", "tenantId": tenant_tm.id, "schoolId": school_tm.id, "name": "11-Guruh-2 (Harbiy-AT)", "gradeLevel": 11, "shift": 1, "studentCount": 0, "hasGroups": False},
        {"id": "class-tm-10g1", "tenantId": tenant_tm.id, "schoolId": school_tm.id, "name": "10-Guruh-1 (Harbiy-AT)", "gradeLevel": 10, "shift": 1, "studentCount": 0, "hasGroups": False},
    ]

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

    # 7. Create Students (Clean zero baseline - students must be imported or created dynamically)
    students_raw: list[dict] = []
    for s in students_raw:
        await db.student.create(data=s)

    # 8. Create Assessments (11-sinf va 9-sinf)
    assessment_11 = await db.assessment.create(
        data={
            "id": "chsb-inf-11-q1",
            "code": "CHSB-INF-11-Q1",
            "title": "Informatika va axborot texnologiyalari, 11-sinf. 1-ChSB",
            "subject": "Informatika va AT",
            "gradeLevel": 11,
            "targetGroup": "all",
            "durationMinutes": 40,
            "totalQuestions": 15,
            "maxScore": 40.0,
        }
    )

    assessment_9 = await db.assessment.create(
        data={
            "id": "chsb-inf-9-q1",
            "code": "CHSB-INF-9-Q1",
            "title": "Informatika va axborot texnologiyalari, 9-sinf. 1-ChSB",
            "subject": "Informatika va AT",
            "gradeLevel": 9,
            "targetGroup": "all",
            "durationMinutes": 40,
            "totalQuestions": 15,
            "maxScore": 40.0,
        }
    )

    assessment_mat_9 = await db.assessment.create(
        data={
            "id": "chsb-mat-9-q1",
            "code": "CHSB-MAT-9-Q1",
            "title": "Matematika (Algebra va Geometriya), 9-sinf. 1-ChSB",
            "subject": "Matematika",
            "gradeLevel": 9,
            "durationMinutes": 45,
            "totalQuestions": 15,
            "maxScore": 40.0,
        }
    )

    # 9. Create 15 Questions for each assessment
    bloom_levels = [
        "KNOWLEDGE", "KNOWLEDGE", "COMPREHENSION", "KNOWLEDGE", "APPLICATION",
        "KNOWLEDGE", "COMPREHENSION", "APPLICATION", "ANALYSIS", "COMPREHENSION",
        "KNOWLEDGE", "APPLICATION", "ANALYSIS", "COMPREHENSION", "APPLICATION"
    ]

    for asm in [assessment_11, assessment_9, assessment_mat_9]:
        for i in range(1, 16):
            options = [
                {"id": "opt-a", "label": "A", "text": "To'g'ri javob varianti"},
                {"id": "opt-b", "label": "B", "text": "Noto'g'ri chalg'ituvchi variant 1"},
                {"id": "opt-c", "label": "C", "text": "Noto'g'ri chalg'ituvchi variant 2"},
                {"id": "opt-d", "label": "D", "text": "Noto'g'ri chalg'ituvchi variant 3"},
            ]
            await db.question.create(
                data={
                    "id": f"q-{asm.id}-{i}",
                    "assessmentId": asm.id,
                    "questionNumber": i,
                    "prompt": f"{i}-savol: {asm.subject} bo'yicha {asm.gradeLevel}-sinf test topshirig'i.",
                    "optionsJson": json.dumps(options),
                    "correctOptionId": "opt-a",
                    "bloomLevel": bloom_levels[i - 1],
                    "difficulty": "hard" if i > 10 else "medium" if i > 5 else "easy",
                    "points": 2.5,
                }
            )

    # 10. Clean baseline for Attempts & Results (zero mock results)
    results_data: list[dict] = []
    for idx, res in enumerate(results_data):
        pass

    await seed_subjects_if_empty(db)

    print(f"✅ Auto-seed completed: 2 tenants, 2 schools, {len(classes_data)} classes, 0 students, questions seeded, 0 results.")

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

