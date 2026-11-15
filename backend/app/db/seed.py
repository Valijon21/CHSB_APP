import json
from datetime import datetime, timezone
import bcrypt
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

async def auto_seed_db(db: Prisma):
    """
    Automatic self-bootstrapping seed function.
    Populates SQLite database with full real records if database is empty.
    """
    print("🌱 Starting Database Auto-Seed for CHSB Assessment Platform...")

    # 1. Password Hashing
    default_password = "Secret123!"
    hashed_password = bcrypt.hashpw(default_password.encode("utf-8"), bcrypt.gensalt(10)).decode("utf-8")

    # 2. Check if Tenants exist
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
            "studentCount": 28,
        }
    )

    school_tm = await db.school.create(
        data={
            "id": "school-tm-1",
            "tenantId": tenant_tm.id,
            "name": "Temurbeklar Maktabi Markaziy Kampus",
            "districtId": "chilonzor",
            "schoolType": "military",
            "studentCount": 24,
        }
    )

    # 5. Create Users
    users_data = [
        {
            "id": "usr-teacher-01",
            "tenantId": tenant_ax.id,
            "username": "teacher_ax",
            "email": "teacher@al-xorazmiy.uz",
            "fullName": "Dilmurod Ustoz",
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
            "email": "alisher@student.uz",
            "fullName": "Alisher Zokirov",
            "hashedPassword": hashed_password,
            "role": "STUDENT",
            "isActive": True,
        },
    ]

    for u in users_data:
        await db.user.create(data=u)

    # 6. Create Class Groups
    classes_data = [
        {"id": "class-ax-11a", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "name": "11-A sinf", "gradeLevel": 11, "shift": 1, "studentCount": 28},
        {"id": "class-ax-11b", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "name": "11-B sinf", "gradeLevel": 11, "shift": 1, "studentCount": 26},
        {"id": "class-ax-11v", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "name": "11-V sinf", "gradeLevel": 11, "shift": 2, "studentCount": 25},
        {"id": "class-ax-10a", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "name": "10-A sinf", "gradeLevel": 10, "shift": 1, "studentCount": 27},
        {"id": "class-ax-10b", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "name": "10-B sinf", "gradeLevel": 10, "shift": 1, "studentCount": 24},
        {"id": "class-ax-9a", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "name": "9-A sinf", "gradeLevel": 9, "shift": 1, "studentCount": 26},
        {"id": "class-ax-9b", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "name": "9-B sinf", "gradeLevel": 9, "shift": 2, "studentCount": 25},
        {"id": "class-tm-11g1", "tenantId": tenant_tm.id, "schoolId": school_tm.id, "name": "11-Guruh-1 (Harbiy-AT)", "gradeLevel": 11, "shift": 1, "studentCount": 24},
        {"id": "class-tm-11g2", "tenantId": tenant_tm.id, "schoolId": school_tm.id, "name": "11-Guruh-2 (Harbiy-AT)", "gradeLevel": 11, "shift": 1, "studentCount": 22},
        {"id": "class-tm-10g1", "tenantId": tenant_tm.id, "schoolId": school_tm.id, "name": "10-Guruh-1 (Harbiy-AT)", "gradeLevel": 10, "shift": 1, "studentCount": 24},
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
                "academicYear": "2026-2027",
            }
        )

    # 7. Create Students
    now = datetime.now(timezone.utc)
    students_raw = [
        # 11-A sinf
        {"id": "rec-ax-101", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "classGroupId": "class-ax-11a", "rosterCode": "STU-1101", "firstName": "Alisher", "lastName": "Zokirov", "middleName": "Bahrom o‘g‘li", "status": "ELIGIBLE"},
        {"id": "rec-ax-102", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "classGroupId": "class-ax-11a", "rosterCode": "STU-1102", "firstName": "Madina", "lastName": "Rustamova", "middleName": "Ilhom qizi", "status": "ELIGIBLE"},
        {"id": "rec-ax-103", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "classGroupId": "class-ax-11a", "rosterCode": "STU-1103", "firstName": "Jasur", "lastName": "Bekmurodov", "middleName": "Olim o‘g‘li", "status": "INACTIVE"},
        {"id": "rec-ax-104", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "classGroupId": "class-ax-11a", "rosterCode": "STU-1104", "firstName": "Dilnoza", "lastName": "Karimova", "middleName": "Sobir qizi", "status": "ELIGIBLE"},
        {"id": "rec-ax-105", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "classGroupId": "class-ax-11a", "rosterCode": "STU-1105", "firstName": "Shaxzod", "lastName": "Rahimov", "middleName": "Murod o‘g‘li", "status": "ELIGIBLE"},
        {"id": "rec-ax-106", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "classGroupId": "class-ax-11a", "rosterCode": "STU-1106", "firstName": "Nilufar", "lastName": "Qodirova", "middleName": "Farhod qizi", "status": "ELIGIBLE"},
        {"id": "rec-ax-107", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "classGroupId": "class-ax-11a", "rosterCode": "STU-1107", "firstName": "Bobur", "lastName": "Mirzayev", "middleName": "Akmal o‘g‘li", "status": "ELIGIBLE"},
        {"id": "rec-ax-108", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "classGroupId": "class-ax-11a", "rosterCode": "STU-1108", "firstName": "Sevara", "lastName": "Mahmudova", "middleName": "Rustam qizi", "status": "ELIGIBLE"},
        {"id": "rec-ax-109", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "classGroupId": "class-ax-11a", "rosterCode": "STU-1109", "firstName": "Azizbek", "lastName": "Umarov", "middleName": "Shuhrat o‘g‘li", "status": "ELIGIBLE"},
        {"id": "rec-ax-110", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "classGroupId": "class-ax-11a", "rosterCode": "STU-1110", "firstName": "Kamola", "lastName": "Yusupova", "middleName": "Doniyor qizi", "status": "ELIGIBLE"},

        # 11-B sinf
        {"id": "rec-ax-111", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "classGroupId": "class-ax-11b", "rosterCode": "STU-1111", "firstName": "Sardorbek", "lastName": "Aliyev", "middleName": "Mansur o‘g‘li", "status": "ELIGIBLE"},
        {"id": "rec-ax-112", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "classGroupId": "class-ax-11b", "rosterCode": "STU-1112", "firstName": "Gulnoza", "lastName": "Xoliqova", "middleName": "Ulug‘bek qizi", "status": "ELIGIBLE"},
        {"id": "rec-ax-113", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "classGroupId": "class-ax-11b", "rosterCode": "STU-1113", "firstName": "Sanjarbek", "lastName": "Normatov", "middleName": "Qodir o‘g‘li", "status": "ELIGIBLE"},
        {"id": "rec-ax-114", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "classGroupId": "class-ax-11b", "rosterCode": "STU-1114", "firstName": "Dildora", "lastName": "Tursunova", "middleName": "Bekzod qizi", "status": "ELIGIBLE"},
        {"id": "rec-ax-115", "tenantId": tenant_ax.id, "schoolId": school_ax.id, "classGroupId": "class-ax-11b", "rosterCode": "STU-1115", "firstName": "Farrux", "lastName": "Ergashev", "middleName": "Ravshan o‘g‘li", "status": "ELIGIBLE"},

        # Temurbeklar Maktabi
        {"id": "rec-tm-201", "tenantId": tenant_tm.id, "schoolId": school_tm.id, "classGroupId": "class-tm-11g1", "rosterCode": "TM-201", "firstName": "Sardor", "lastName": "Rahimov", "middleName": "G‘ayrat o‘g‘li", "status": "ELIGIBLE"},
        {"id": "rec-tm-202", "tenantId": tenant_tm.id, "schoolId": school_tm.id, "classGroupId": "class-tm-11g1", "rosterCode": "TM-202", "firstName": "Otabek", "lastName": "Boboyev", "middleName": "Mansur o‘g‘li", "status": "ELIGIBLE"},
        {"id": "rec-tm-203", "tenantId": tenant_tm.id, "schoolId": school_tm.id, "classGroupId": "class-tm-11g1", "rosterCode": "TM-203", "firstName": "Dilshod", "lastName": "Karimov", "middleName": "Shavkat o‘g‘li", "status": "ELIGIBLE"},
        {"id": "rec-tm-204", "tenantId": tenant_tm.id, "schoolId": school_tm.id, "classGroupId": "class-tm-11g1", "rosterCode": "TM-204", "firstName": "Sherzodbek", "lastName": "Mansurov", "middleName": "Nodir o‘g‘li", "status": "ELIGIBLE"},
        {"id": "rec-tm-205", "tenantId": tenant_tm.id, "schoolId": school_tm.id, "classGroupId": "class-tm-11g2", "rosterCode": "TM-205", "firstName": "Xurshid", "lastName": "Normurodov", "middleName": "Qobil o‘g‘li", "status": "ELIGIBLE"},
    ]

    for s in students_raw:
        await db.student.create(
            data={
                "id": s["id"],
                "tenantId": s["tenantId"],
                "schoolId": s["schoolId"],
                "classGroupId": s["classGroupId"],
                "rosterCode": s["rosterCode"],
                "firstName": s["firstName"],
                "lastName": s["lastName"],
                "middleName": s["middleName"],
                "gender": "M",
                "birthDate": now,
                "status": s["status"],
            }
        )

    # 8. Create Assessment
    assessment = await db.assessment.create(
        data={
            "id": "chsb-inf-11-q1",
            "code": "CHSB-INF-11-Q1",
            "title": "Informatika va axborot texnologiyalari, 11-sinf. 1-ChSB",
            "subject": "Informatika va AT",
            "gradeLevel": 11,
            "durationMinutes": 40,
            "totalQuestions": 15,
            "maxScore": 40.0,
        }
    )

    # 9. Create 15 Questions
    bloom_levels = [
        "KNOWLEDGE", "KNOWLEDGE", "COMPREHENSION", "KNOWLEDGE", "APPLICATION",
        "KNOWLEDGE", "COMPREHENSION", "APPLICATION", "ANALYSIS", "COMPREHENSION",
        "KNOWLEDGE", "APPLICATION", "ANALYSIS", "COMPREHENSION", "APPLICATION"
    ]

    for i in range(1, 16):
        options = [
            {"id": "opt-a", "label": "A", "text": "To'g'ri javob varianti"},
            {"id": "opt-b", "label": "B", "text": "Noto'g'ri chalg'ituvchi variant 1"},
            {"id": "opt-c", "label": "C", "text": "Noto'g'ri chalg'ituvchi variant 2"},
            {"id": "opt-d", "label": "D", "text": "Noto'g'ri chalg'ituvchi variant 3"},
        ]
        await db.question.create(
            data={
                "id": f"q-inf-11-{i}",
                "assessmentId": assessment.id,
                "questionNumber": i,
                "prompt": f"{i}-savol: Informatika va zamonaviy dasturlash asoslari bo'yicha test topshirig'i.",
                "optionsJson": json.dumps(options),
                "correctOptionId": "opt-a",
                "bloomLevel": bloom_levels[i - 1],
                "difficulty": "hard" if i > 10 else "medium" if i > 5 else "easy",
                "points": 2.5,
            }
        )

    # 10. Create Attempts & Results
    results_data = [
        {"stuId": "rec-ax-101", "score": 35.0, "percentage": 87.5, "grade": "5"},
        {"stuId": "rec-ax-102", "score": 37.5, "percentage": 93.8, "grade": "5"},
        {"stuId": "rec-ax-104", "score": 32.5, "percentage": 81.3, "grade": "4"},
        {"stuId": "rec-ax-105", "score": 30.0, "percentage": 75.0, "grade": "4"},
        {"stuId": "rec-ax-106", "score": 28.0, "percentage": 70.0, "grade": "3"},
        {"stuId": "rec-ax-107", "score": 22.5, "percentage": 56.3, "grade": "3"},
        {"stuId": "rec-ax-108", "score": 18.0, "percentage": 45.0, "grade": "2"},
        {"stuId": "rec-ax-109", "score": 36.0, "percentage": 90.0, "grade": "5"},
        {"stuId": "rec-ax-110", "score": 31.0, "percentage": 77.5, "grade": "4"},
        {"stuId": "rec-ax-111", "score": 34.0, "percentage": 85.0, "grade": "5"},
        {"stuId": "rec-ax-112", "score": 29.0, "percentage": 72.5, "grade": "3"},
        {"stuId": "rec-ax-113", "score": 33.0, "percentage": 82.5, "grade": "4"},
        {"stuId": "rec-ax-114", "score": 38.0, "percentage": 95.0, "grade": "5"},
        {"stuId": "rec-ax-115", "score": 20.0, "percentage": 50.0, "grade": "2"},
    ]

    for idx, res in enumerate(results_data):
        attempt = await db.assessmentattempt.create(
            data={
                "id": f"att-seed-{idx + 1}",
                "assessmentId": assessment.id,
                "studentId": res["stuId"],
                "status": "submitted",
                "timeSpentSeconds": 1800 + (idx * 30),
                "answersJson": json.dumps({"q-inf-11-1": "opt-a", "q-inf-11-2": "opt-a"}),
            }
        )

        await db.assessmentresult.create(
            data={
                "id": f"res-seed-{idx + 1}",
                "attemptId": attempt.id,
                "studentId": res["stuId"],
                "score": res["score"],
                "maxScore": 40.0,
                "percentage": res["percentage"],
                "grade": res["grade"],
                "status": "verified",
            }
        )

    await seed_subjects_if_empty(db)

    print(f"✅ Auto-seed completed: 2 tenants, 2 schools, {len(classes_data)} classes, {len(students_raw)} students, 15 questions, {len(results_data)} results.")
