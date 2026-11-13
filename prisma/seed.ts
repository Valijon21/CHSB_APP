import { PrismaClient, Role, StudentStatus, BloomLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Prisma Database Seed for CHSB Assessment Platform...');

  // 1. Password Hashing
  const defaultPassword = 'Secret123!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // 2. Clear old data in reverse dependency order
  await prisma.assessmentResult.deleteMany();
  await prisma.assessmentAttempt.deleteMany();
  await prisma.question.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.classGroup.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();
  await prisma.tenant.deleteMany();

  console.log('🧹 Cleaned existing tables.');

  // 3. Create Tenants
  const tenantAx = await prisma.tenant.create({
    data: {
      id: 'tenant-al-xorazmiy',
      slug: 'al-xorazmiy',
      name: 'Muhammad al-Xorazmiy nomidagi ixtisoslashtirilgan IT-maktab',
      regionId: 'tashkent-city',
      isActive: true,
    },
  });

  const tenantTm = await prisma.tenant.create({
    data: {
      id: 'tenant-temurbeklar',
      slug: 'temurbeklar-maktabi',
      name: 'Temurbeklar Maktabi Harbiy-Akademik Litseyi',
      regionId: 'tashkent-city',
      isActive: true,
    },
  });

  // 4. Create Schools
  const schoolAx = await prisma.school.create({
    data: {
      id: 'school-ax-1',
      tenantId: tenantAx.id,
      name: 'Al-Xorazmiy IT Bosh Kampusi',
      districtId: 'mirzo-ulugbek',
      schoolType: 'specialized',
      studentCount: 28,
    },
  });

  const schoolTm = await prisma.school.create({
    data: {
      id: 'school-tm-1',
      tenantId: tenantTm.id,
      name: 'Temurbeklar Maktabi Markaziy Kampus',
      districtId: 'yunusobod',
      schoolType: 'lyceum',
      studentCount: 24,
    },
  });

  // 5. Create Users (Auth Accounts)
  await prisma.user.createMany({
    data: [
      {
        id: 'usr-teacher-01',
        tenantId: tenantAx.id,
        username: 'teacher_ax',
        email: 'teacher@al-xorazmiy.uz',
        fullName: 'Dilmurod Ustoz',
        hashedPassword,
        role: Role.TEACHER,
        isActive: true,
      },
      {
        id: 'usr-admin-01',
        tenantId: tenantAx.id,
        username: 'admin_ax',
        email: 'admin@al-xorazmiy.uz',
        fullName: 'Al-Xorazmiy Administrator',
        hashedPassword,
        role: Role.SCHOOL_ADMIN,
        isActive: true,
      },
      {
        id: 'usr-inspector-01',
        tenantId: tenantAx.id,
        username: 'inspector_tashkent',
        email: 'inspector@toshkent-xtb.uz',
        fullName: 'Shavkat Rahimov (ShHTB)',
        hashedPassword,
        role: Role.REGIONAL_INSPECTOR,
        isActive: true,
      },
      {
        id: 'usr-student-01',
        tenantId: tenantAx.id,
        username: 'student_ax',
        email: 'alisher@student.uz',
        fullName: 'Alisher Zokirov',
        hashedPassword,
        role: Role.STUDENT,
        isActive: true,
      },
    ],
  });

  // 6. Create Class Groups
  const classGroupsData = [
    { id: 'class-ax-11a', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '11-A sinf', gradeLevel: 11, shift: 1, studentCount: 28 },
    { id: 'class-ax-11b', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '11-B sinf', gradeLevel: 11, shift: 1, studentCount: 26 },
    { id: 'class-ax-11v', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '11-V sinf', gradeLevel: 11, shift: 2, studentCount: 25 },
    { id: 'class-ax-10a', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '10-A sinf', gradeLevel: 10, shift: 1, studentCount: 27 },
    { id: 'class-ax-10b', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '10-B sinf', gradeLevel: 10, shift: 1, studentCount: 24 },
    { id: 'class-ax-9a', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '9-A sinf', gradeLevel: 9, shift: 1, studentCount: 26 },
    { id: 'class-ax-9b', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '9-B sinf', gradeLevel: 9, shift: 2, studentCount: 25 },
    { id: 'class-tm-11g1', tenantId: tenantTm.id, schoolId: schoolTm.id, name: '11-Guruh-1 (Harbiy-AT)', gradeLevel: 11, shift: 1, studentCount: 24 },
    { id: 'class-tm-11g2', tenantId: tenantTm.id, schoolId: schoolTm.id, name: '11-Guruh-2 (Harbiy-AT)', gradeLevel: 11, shift: 1, studentCount: 22 },
    { id: 'class-tm-10g1', tenantId: tenantTm.id, schoolId: schoolTm.id, name: '10-Guruh-1 (Harbiy-AT)', gradeLevel: 10, shift: 1, studentCount: 24 },
  ];

  for (const cg of classGroupsData) {
    await prisma.classGroup.create({
      data: {
        id: cg.id,
        tenantId: cg.tenantId,
        schoolId: cg.schoolId,
        name: cg.name,
        gradeLevel: cg.gradeLevel,
        shift: cg.shift,
        studentCount: cg.studentCount,
        academicYear: '2026-2027',
      },
    });
  }

  // 7. Create Students
  const studentsRaw = [
    // 11-A sinf
    { id: 'rec-ax-101', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1101', firstName: 'Alisher', lastName: 'Zokirov', middleName: 'Bahrom o‘g‘li', status: StudentStatus.ELIGIBLE },
    { id: 'rec-ax-102', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1102', firstName: 'Madina', lastName: 'Rustamova', middleName: 'Ilhom qizi', status: StudentStatus.ELIGIBLE },
    { id: 'rec-ax-103', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1103', firstName: 'Jasur', lastName: 'Bekmurodov', middleName: 'Olim o‘g‘li', status: StudentStatus.INACTIVE },
    { id: 'rec-ax-104', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1104', firstName: 'Dilnoza', lastName: 'Karimova', middleName: 'Sobir qizi', status: StudentStatus.ELIGIBLE },
    { id: 'rec-ax-105', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1105', firstName: 'Shaxzod', lastName: 'Rahimov', middleName: 'Murod o‘g‘li', status: StudentStatus.ELIGIBLE },
    { id: 'rec-ax-106', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1106', firstName: 'Nilufar', lastName: 'Qodirova', middleName: 'Farhod qizi', status: StudentStatus.ELIGIBLE },
    { id: 'rec-ax-107', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1107', firstName: 'Bobur', lastName: 'Mirzayev', middleName: 'Akmal o‘g‘li', status: StudentStatus.ELIGIBLE },
    { id: 'rec-ax-108', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1108', firstName: 'Sevara', lastName: 'Mahmudova', middleName: 'Rustam qizi', status: StudentStatus.ELIGIBLE },
    { id: 'rec-ax-109', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1109', firstName: 'Azizbek', lastName: 'Umarov', middleName: 'Shuhrat o‘g‘li', status: StudentStatus.ELIGIBLE },
    { id: 'rec-ax-110', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1110', firstName: 'Kamola', lastName: 'Yusupova', middleName: 'Doniyor qizi', status: StudentStatus.ELIGIBLE },

    // 11-B sinf
    { id: 'rec-ax-111', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11b', rosterCode: 'STU-1111', firstName: 'Sardorbek', lastName: 'Aliyev', middleName: 'Mansur o‘g‘li', status: StudentStatus.ELIGIBLE },
    { id: 'rec-ax-112', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11b', rosterCode: 'STU-1112', firstName: 'Gulnoza', lastName: 'Xoliqova', middleName: 'Ulug‘bek qizi', status: StudentStatus.ELIGIBLE },
    { id: 'rec-ax-113', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11b', rosterCode: 'STU-1113', firstName: 'Sanjarbek', lastName: 'Normatov', middleName: 'Qodir o‘g‘li', status: StudentStatus.ELIGIBLE },
    { id: 'rec-ax-114', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11b', rosterCode: 'STU-1114', firstName: 'Dildora', lastName: 'Tursunova', middleName: 'Bekzod qizi', status: StudentStatus.ELIGIBLE },
    { id: 'rec-ax-115', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11b', rosterCode: 'STU-1115', firstName: 'Farrux', lastName: 'Ergashev', middleName: 'Ravshan o‘g‘li', status: StudentStatus.ELIGIBLE },

    // Temurbeklar Maktabi
    { id: 'rec-tm-201', tenantId: tenantTm.id, schoolId: schoolTm.id, classGroupId: 'class-tm-11g1', rosterCode: 'TM-201', firstName: 'Sardor', lastName: 'Rahimov', middleName: 'G‘ayrat o‘g‘li', status: StudentStatus.ELIGIBLE },
    { id: 'rec-tm-202', tenantId: tenantTm.id, schoolId: schoolTm.id, classGroupId: 'class-tm-11g1', rosterCode: 'TM-202', firstName: 'Otabek', lastName: 'Boboyev', middleName: 'Mansur o‘g‘li', status: StudentStatus.ELIGIBLE },
    { id: 'rec-tm-203', tenantId: tenantTm.id, schoolId: schoolTm.id, classGroupId: 'class-tm-11g1', rosterCode: 'TM-203', firstName: 'Dilshod', lastName: 'Karimov', middleName: 'Shavkat o‘g‘li', status: StudentStatus.ELIGIBLE },
    { id: 'rec-tm-204', tenantId: tenantTm.id, schoolId: schoolTm.id, classGroupId: 'class-tm-11g1', rosterCode: 'TM-204', firstName: 'Sherzodbek', lastName: 'Mansurov', middleName: 'Nodir o‘g‘li', status: StudentStatus.ELIGIBLE },
    { id: 'rec-tm-205', tenantId: tenantTm.id, schoolId: schoolTm.id, classGroupId: 'class-tm-11g2', rosterCode: 'TM-205', firstName: 'Xurshid', lastName: 'Normurodov', middleName: 'Qobil o‘g‘li', status: StudentStatus.ELIGIBLE },
  ];

  for (const s of studentsRaw) {
    await prisma.student.create({
      data: {
        id: s.id,
        tenantId: s.tenantId,
        schoolId: s.schoolId,
        classGroupId: s.classGroupId,
        rosterCode: s.rosterCode,
        firstName: s.firstName,
        lastName: s.lastName,
        middleName: s.middleName,
        birthDate: new Date('2008-05-15'),
        status: s.status,
      },
    });
  }

  // 8. Create Assessment
  const assessment = await prisma.assessment.create({
    data: {
      id: 'chsb-inf-11-q1',
      code: 'CHSB-INF-11-Q1',
      title: 'Informatika va axborot texnologiyalari, 11-sinf. 1-ChSB',
      subject: 'Informatika va AT',
      gradeLevel: 11,
      durationMinutes: 40,
      totalQuestions: 15,
      maxScore: 40.0,
    },
  });

  // 9. Create 15 Questions
  const bloomLevels = [
    BloomLevel.KNOWLEDGE,
    BloomLevel.KNOWLEDGE,
    BloomLevel.COMPREHENSION,
    BloomLevel.KNOWLEDGE,
    BloomLevel.APPLICATION,
    BloomLevel.KNOWLEDGE,
    BloomLevel.COMPREHENSION,
    BloomLevel.APPLICATION,
    BloomLevel.ANALYSIS,
    BloomLevel.COMPREHENSION,
    BloomLevel.KNOWLEDGE,
    BloomLevel.APPLICATION,
    BloomLevel.ANALYSIS,
    BloomLevel.COMPREHENSION,
    BloomLevel.APPLICATION,
  ];

  for (let i = 1; i <= 15; i++) {
    await prisma.question.create({
      data: {
        id: `q-inf-11-${i}`,
        assessmentId: assessment.id,
        questionNumber: i,
        prompt: `${i}-savol: Informatika va zamonaviy dasturlash asoslari bo'yicha test topshirig'i.`,
        optionsJson: [
          { id: 'opt-a', label: 'A', text: 'To\'g\'ri javob varianti' },
          { id: 'opt-b', label: 'B', text: 'Noto\'g\'ri chalg\'ituvchi variant 1' },
          { id: 'opt-c', label: 'C', text: 'Noto\'g\'ri chalg\'ituvchi variant 2' },
          { id: 'opt-d', label: 'D', text: 'Noto\'g\'ri chalg\'ituvchi variant 3' },
        ],
        correctOptionId: 'opt-a',
        bloomLevel: bloomLevels[i - 1] || BloomLevel.KNOWLEDGE,
        difficulty: i > 10 ? 'hard' : i > 5 ? 'medium' : 'easy',
        points: 2.5,
      },
    });
  }

  // 10. Create 25 Attempts & Results
  const resultsData = [
    // 11-A
    { stuId: 'rec-ax-101', score: 35.0, percentage: 87.5, grade: '5' },
    { stuId: 'rec-ax-102', score: 37.5, percentage: 93.8, grade: '5' },
    { stuId: 'rec-ax-104', score: 39.0, percentage: 97.5, grade: '5' },
    { stuId: 'rec-ax-105', score: 32.5, percentage: 81.3, grade: '4' },
    { stuId: 'rec-ax-106', score: 34.0, percentage: 85.0, grade: '4' },
    { stuId: 'rec-ax-107', score: 31.0, percentage: 77.5, grade: '4' },
    { stuId: 'rec-ax-108', score: 38.0, percentage: 95.0, grade: '5' },
    { stuId: 'rec-ax-109', score: 25.0, percentage: 62.5, grade: '3' },
    { stuId: 'rec-ax-110', score: 36.0, percentage: 90.0, grade: '5' },
    // 11-B
    { stuId: 'rec-ax-111', score: 36.5, percentage: 91.3, grade: '5' },
    { stuId: 'rec-ax-112', score: 33.0, percentage: 82.5, grade: '4' },
    { stuId: 'rec-ax-113', score: 29.5, percentage: 73.8, grade: '4' },
    { stuId: 'rec-ax-114', score: 38.5, percentage: 96.3, grade: '5' },
    { stuId: 'rec-ax-115', score: 31.5, percentage: 78.8, grade: '4' },
    // Temurbeklar
    { stuId: 'rec-tm-201', score: 37.0, percentage: 92.5, grade: '5' },
    { stuId: 'rec-tm-202', score: 34.5, percentage: 86.3, grade: '5' },
    { stuId: 'rec-tm-203', score: 32.0, percentage: 80.0, grade: '4' },
    { stuId: 'rec-tm-204', score: 28.0, percentage: 70.0, grade: '3' },
    { stuId: 'rec-tm-205', score: 35.5, percentage: 88.8, grade: '5' },
  ];

  for (let idx = 0; idx < resultsData.length; idx++) {
    const res = resultsData[idx];
    if (!res) continue;

    const attempt = await prisma.assessmentAttempt.create({
      data: {
        id: `att-seed-${idx + 1}`,
        assessmentId: assessment.id,
        studentId: res.stuId,
        status: 'submitted',
        timeSpentSeconds: 1800 + (idx * 30),
        answersJson: { 'q-inf-11-1': 'opt-a', 'q-inf-11-2': 'opt-a' },
      },
    });

    await prisma.assessmentResult.create({
      data: {
        id: `res-seed-${idx + 1}`,
        attemptId: attempt.id,
        studentId: res.stuId,
        score: res.score,
        maxScore: 40.0,
        percentage: res.percentage,
        grade: res.grade,
        status: 'verified',
      },
    });
  }

  console.log(`✅ Seeded ${classGroupsData.length} classes, ${studentsRaw.length} students, 15 questions, and ${resultsData.length} results.`);
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
