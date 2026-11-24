import { PrismaClient } from '@prisma/client';
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
      studentCount: 0,
    },
  });

  const schoolTm = await prisma.school.create({
    data: {
      id: 'school-tm-1',
      tenantId: tenantTm.id,
      name: 'Temurbeklar Maktabi Markaziy Kampus',
      districtId: 'yunusobod',
      schoolType: 'lyceum',
      studentCount: 0,
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
        fullName: 'Dilmurod Rahmataliyevich Yunusov',
        hashedPassword,
        role: 'TEACHER',
        isActive: true,
      },
      {
        id: 'usr-admin-01',
        tenantId: tenantAx.id,
        username: 'admin_ax',
        email: 'admin@al-xorazmiy.uz',
        fullName: 'Al-Xorazmiy Administrator',
        hashedPassword,
        role: 'SCHOOL_ADMIN',
        isActive: true,
      },
      {
        id: 'usr-inspector-01',
        tenantId: tenantAx.id,
        username: 'inspector_tashkent',
        email: 'inspector@toshkent-xtb.uz',
        fullName: 'Shavkat Rahimov (ShHTB)',
        hashedPassword,
        role: 'REGIONAL_INSPECTOR',
        isActive: true,
      },
      {
        id: 'usr-student-01',
        tenantId: tenantAx.id,
        username: 'student_ax',
        email: 'zuxra@student.uz',
        fullName: 'Zuxra Abduraximova',
        hashedPassword,
        role: 'STUDENT',
        isActive: true,
      },
    ],
  });

  // 6. Create Class Groups
  const classGroupsData = [
    { id: 'class-ax-11a', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '11-A sinf', gradeLevel: 11, shift: 1, studentCount: 0, hasGroups: true },
    { id: 'class-ax-11b', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '11-B sinf', gradeLevel: 11, shift: 1, studentCount: 0, hasGroups: true },
    { id: 'class-ax-11v', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '11-V sinf', gradeLevel: 11, shift: 2, studentCount: 0, hasGroups: true },
    { id: 'class-ax-10a', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '10-A sinf', gradeLevel: 10, shift: 1, studentCount: 0, hasGroups: true },
    { id: 'class-ax-10b', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '10-B sinf', gradeLevel: 10, shift: 1, studentCount: 0, hasGroups: true },
    { id: 'class-ax-10v', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '10-V sinf', gradeLevel: 10, shift: 1, studentCount: 0, hasGroups: true },
    { id: 'class-ax-9a', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '9-A sinf', gradeLevel: 9, shift: 1, studentCount: 0, hasGroups: false },
    { id: 'class-ax-9b', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '9-B sinf', gradeLevel: 9, shift: 2, studentCount: 0, hasGroups: false },
    { id: 'class-tm-11g1', tenantId: tenantTm.id, schoolId: schoolTm.id, name: '11-Guruh-1 (Harbiy-AT)', gradeLevel: 11, shift: 1, studentCount: 0, hasGroups: false },
    { id: 'class-tm-11g2', tenantId: tenantTm.id, schoolId: schoolTm.id, name: '11-Guruh-2 (Harbiy-AT)', gradeLevel: 11, shift: 1, studentCount: 0, hasGroups: false },
    { id: 'class-tm-10g1', tenantId: tenantTm.id, schoolId: schoolTm.id, name: '10-Guruh-1 (Harbiy-AT)', gradeLevel: 10, shift: 1, studentCount: 0, hasGroups: false },
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
        hasGroups: cg.hasGroups,
        academicYear: '2026-2027',
      },
    });
  }

  // 7. Create Students (Clean initial state - zero mock students)
  const studentsRaw: any[] = [];
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
        gender: s.gender || 'M',
        birthDate: new Date('2008-05-15'),
        status: s.status,
        group: s.group || '1-guruh',
        emaktabId: s.emaktabId || null,
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
      targetGroup: 'all',
      durationMinutes: 40,
      totalQuestions: 15,
      maxScore: 40.0,
    },
  });

  // 9. Create 15 Questions
  const bloomLevels = [
    'KNOWLEDGE',
    'KNOWLEDGE',
    'COMPREHENSION',
    'KNOWLEDGE',
    'APPLICATION',
    'KNOWLEDGE',
    'COMPREHENSION',
    'APPLICATION',
    'ANALYSIS',
    'COMPREHENSION',
    'KNOWLEDGE',
    'APPLICATION',
    'ANALYSIS',
    'COMPREHENSION',
    'APPLICATION',
  ];

  for (let i = 1; i <= 15; i++) {
    await prisma.question.create({
      data: {
        id: `q-inf-11-${i}`,
        assessmentId: assessment.id,
        questionNumber: i,
        prompt: `${i}-savol: Informatika va zamonaviy dasturlash asoslari bo'yicha test topshirig'i.`,
        optionsJson: JSON.stringify([
          { id: 'opt-a', label: 'A', text: 'To\'g\'ri javob varianti' },
          { id: 'opt-b', label: 'B', text: 'Noto\'g\'ri chalg\'ituvchi variant 1' },
          { id: 'opt-c', label: 'C', text: 'Noto\'g\'ri chalg\'ituvchi variant 2' },
          { id: 'opt-d', label: 'D', text: 'Noto\'g\'ri chalg\'ituvchi variant 3' },
        ]),
        correctOptionId: 'opt-a',
        bloomLevel: bloomLevels[i - 1] || 'KNOWLEDGE',
        difficulty: i > 10 ? 'hard' : i > 5 ? 'medium' : 'easy',
        points: 2.5,
      },
    });
  }

  // 10. Create Attempts & Results (Clean initial state - zero mock results)
  const resultsData: any[] = [];
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
        answersJson: JSON.stringify({ 'q-inf-11-1': 'opt-a', 'q-inf-11-2': 'opt-a' }),
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

