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
    { id: 'class-ax-11a', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '11-A sinf', gradeLevel: 11, shift: 1, studentCount: 30, hasGroups: true },
    { id: 'class-ax-11b', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '11-B sinf', gradeLevel: 11, shift: 1, studentCount: 26, hasGroups: true },
    { id: 'class-ax-11v', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '11-V sinf', gradeLevel: 11, shift: 2, studentCount: 25, hasGroups: true },
    { id: 'class-ax-10a', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '10-A sinf', gradeLevel: 10, shift: 1, studentCount: 27, hasGroups: true },
    { id: 'class-ax-10b', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '10-B sinf', gradeLevel: 10, shift: 1, studentCount: 24, hasGroups: true },
    { id: 'class-ax-10v', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '10-V sinf', gradeLevel: 10, shift: 1, studentCount: 0, hasGroups: true },
    { id: 'class-ax-9a', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '9-A sinf', gradeLevel: 9, shift: 1, studentCount: 26, hasGroups: false },
    { id: 'class-ax-9b', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '9-B sinf', gradeLevel: 9, shift: 2, studentCount: 25, hasGroups: false },
    { id: 'class-tm-11g1', tenantId: tenantTm.id, schoolId: schoolTm.id, name: '11-Guruh-1 (Harbiy-AT)', gradeLevel: 11, shift: 1, studentCount: 24, hasGroups: false },
    { id: 'class-tm-11g2', tenantId: tenantTm.id, schoolId: schoolTm.id, name: '11-Guruh-2 (Harbiy-AT)', gradeLevel: 11, shift: 1, studentCount: 22, hasGroups: false },
    { id: 'class-tm-10g1', tenantId: tenantTm.id, schoolId: schoolTm.id, name: '10-Guruh-1 (Harbiy-AT)', gradeLevel: 10, shift: 1, studentCount: 24, hasGroups: false },
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

  // 7. Create Students
  const studentsRaw = [
    // 11-A sinf (1-guruh: 11-A-Informatika-20_11_2026.xls dan olingan 15 ta real o'quvchi)
    { id: 'rec-ax-101', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1101', firstName: 'Zuxra', lastName: 'Abduraximova', middleName: '', gender: 'F', status: 'ELIGIBLE', group: '1-guruh', emaktabId: '1000001990090' },
    { id: 'rec-ax-102', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1102', firstName: 'Xayrixon', lastName: 'Abdusattorova', middleName: '', gender: 'F', status: 'ELIGIBLE', group: '1-guruh', emaktabId: '1000003598248' },
    { id: 'rec-ax-103', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1103', firstName: 'Madinabonu', lastName: 'Abdug‘afforova', middleName: '', gender: 'F', status: 'ELIGIBLE', group: '1-guruh', emaktabId: '1000001990091' },
    { id: 'rec-ax-104', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1104', firstName: 'Zaxro', lastName: 'Axmadjonova', middleName: '', gender: 'F', status: 'ELIGIBLE', group: '1-guruh', emaktabId: '1000003569688' },
    { id: 'rec-ax-105', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1105', firstName: 'O‘ktamjon', lastName: 'Davlataliyev', middleName: '', gender: 'M', status: 'ELIGIBLE', group: '1-guruh', emaktabId: '1000001990096' },
    { id: 'rec-ax-106', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1106', firstName: 'Zilola', lastName: 'Ergashaliyeva', middleName: '', gender: 'F', status: 'ELIGIBLE', group: '1-guruh', emaktabId: '1000004307678' },
    { id: 'rec-ax-107', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1107', firstName: 'Nurhayit', lastName: 'Ergashev', middleName: '', gender: 'M', status: 'ELIGIBLE', group: '1-guruh', emaktabId: '1000001990098' },
    { id: 'rec-ax-108', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1108', firstName: 'Nazira', lastName: 'Ergasheva', middleName: '', gender: 'F', status: 'ELIGIBLE', group: '1-guruh', emaktabId: '1000003569692' },
    { id: 'rec-ax-109', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1109', firstName: 'Madina', lastName: 'Jurabayeva', middleName: '', gender: 'F', status: 'ELIGIBLE', group: '1-guruh', emaktabId: '1000001990100' },
    { id: 'rec-ax-110', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1110', firstName: 'O‘tkirbek', lastName: 'Odilov', middleName: '', gender: 'M', status: 'ELIGIBLE', group: '1-guruh', emaktabId: '1000003673332' },
    { id: 'rec-ax-111', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1111', firstName: 'Gullola', lastName: 'Ozatboyeva', middleName: '', gender: 'F', status: 'ELIGIBLE', group: '1-guruh', emaktabId: '1000001990109' },
    { id: 'rec-ax-112', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1112', firstName: 'Durdona', lastName: 'Sobirjonova', middleName: '', gender: 'F', status: 'ELIGIBLE', group: '1-guruh', emaktabId: '1000003594807' },
    { id: 'rec-ax-113', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1113', firstName: 'Feruza', lastName: 'Umaraliyeva', middleName: '', gender: 'F', status: 'ELIGIBLE', group: '1-guruh', emaktabId: '1000001990115' },
    { id: 'rec-ax-114', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1114', firstName: 'Sevdora', lastName: 'Valijonova', middleName: '', gender: 'F', status: 'ELIGIBLE', group: '1-guruh', emaktabId: '1000020620646' },
    { id: 'rec-ax-115', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1115', firstName: 'Shabnam', lastName: 'Miradjonova', middleName: '', gender: 'F', status: 'ELIGIBLE', group: '1-guruh', emaktabId: '1000003569665' },

    // 11-A sinf (2-guruh: 15 ta o'quvchi)
    { id: 'rec-ax-116', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1116', firstName: 'Alisher', lastName: 'Zokirov', middleName: 'Bahrom o‘g‘li', gender: 'M', status: 'ELIGIBLE', group: '2-guruh', emaktabId: '1000001990201' },
    { id: 'rec-ax-117', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1117', firstName: 'Madina', lastName: 'Rustamova', middleName: 'Ilhom qizi', gender: 'F', status: 'ELIGIBLE', group: '2-guruh', emaktabId: '1000001990202' },
    { id: 'rec-ax-118', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1118', firstName: 'Jasur', lastName: 'Bekmurodov', middleName: 'Olim o‘g‘li', gender: 'M', status: 'ELIGIBLE', group: '2-guruh', emaktabId: '1000001990203' },
    { id: 'rec-ax-119', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1119', firstName: 'Dilnoza', lastName: 'Karimova', middleName: 'Sobir qizi', gender: 'F', status: 'ELIGIBLE', group: '2-guruh', emaktabId: '1000001990204' },
    { id: 'rec-ax-120', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1120', firstName: 'Shaxzod', lastName: 'Rahimov', middleName: 'Murod o‘g‘li', gender: 'M', status: 'ELIGIBLE', group: '2-guruh', emaktabId: '1000001990205' },
    { id: 'rec-ax-121', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1121', firstName: 'Nilufar', lastName: 'Qodirova', middleName: 'Farhod qizi', gender: 'F', status: 'ELIGIBLE', group: '2-guruh', emaktabId: '1000001990206' },
    { id: 'rec-ax-122', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1122', firstName: 'Bobur', lastName: 'Mirzayev', middleName: 'Akmal o‘g‘li', gender: 'M', status: 'ELIGIBLE', group: '2-guruh', emaktabId: '1000001990207' },
    { id: 'rec-ax-123', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1123', firstName: 'Sevara', lastName: 'Mahmudova', middleName: 'Rustam qizi', gender: 'F', status: 'ELIGIBLE', group: '2-guruh', emaktabId: '1000001990208' },
    { id: 'rec-ax-124', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1124', firstName: 'Azizbek', lastName: 'Umarov', middleName: 'Shuhrat o‘g‘li', gender: 'M', status: 'ELIGIBLE', group: '2-guruh', emaktabId: '1000001990209' },
    { id: 'rec-ax-125', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1125', firstName: 'Kamola', lastName: 'Yusupova', middleName: 'Doniyor qizi', gender: 'F', status: 'ELIGIBLE', group: '2-guruh', emaktabId: '1000001990210' },
    { id: 'rec-ax-126', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1126', firstName: 'Jamshid', lastName: 'Toirov', middleName: 'Xoliq o‘g‘li', gender: 'M', status: 'ELIGIBLE', group: '2-guruh', emaktabId: '1000001990211' },
    { id: 'rec-ax-127', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1127', firstName: 'Malika', lastName: 'Xoliqova', middleName: 'Rustam qizi', gender: 'F', status: 'ELIGIBLE', group: '2-guruh', emaktabId: '1000001990212' },
    { id: 'rec-ax-128', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1128', firstName: 'Doniyor', lastName: 'Nurmatov', middleName: 'Anvar o‘g‘li', gender: 'M', status: 'ELIGIBLE', group: '2-guruh', emaktabId: '1000001990213' },
    { id: 'rec-ax-129', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1129', firstName: 'Rayhona', lastName: 'Islomova', middleName: 'Farrux qizi', gender: 'F', status: 'ELIGIBLE', group: '2-guruh', emaktabId: '1000001990214' },
    { id: 'rec-ax-130', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11a', rosterCode: 'STU-1130', firstName: 'Sardor', lastName: 'Yunusov', middleName: 'Dilmurod o‘g‘li', gender: 'M', status: 'ELIGIBLE', group: '2-guruh', emaktabId: '1000001990215' },

    // 11-B sinf
    { id: 'rec-ax-201', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11b', rosterCode: 'STU-1131', firstName: 'Sardorbek', lastName: 'Aliyev', middleName: 'Mansur o‘g‘li', gender: 'M', status: 'ELIGIBLE', group: '1-guruh', emaktabId: '1000001990301' },
    { id: 'rec-ax-202', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11b', rosterCode: 'STU-1132', firstName: 'Gulnoza', lastName: 'Xoliqova', middleName: 'Ulug‘bek qizi', gender: 'F', status: 'ELIGIBLE', group: '1-guruh', emaktabId: '1000001990302' },
    { id: 'rec-ax-203', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11b', rosterCode: 'STU-1133', firstName: 'Sanjarbek', lastName: 'Normatov', middleName: 'Qodir o‘g‘li', gender: 'M', status: 'ELIGIBLE', group: '2-guruh', emaktabId: '1000001990303' },
    { id: 'rec-ax-204', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11b', rosterCode: 'STU-1134', firstName: 'Dildora', lastName: 'Tursunova', middleName: 'Bekzod qizi', gender: 'F', status: 'ELIGIBLE', group: '2-guruh', emaktabId: '1000001990304' },
    { id: 'rec-ax-205', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11b', rosterCode: 'STU-1135', firstName: 'Farrux', lastName: 'Ergashev', middleName: 'Ravshan o‘g‘li', gender: 'M', status: 'ELIGIBLE', group: '2-guruh', emaktabId: '1000001990305' },

    // Temurbeklar Maktabi
    { id: 'rec-tm-201', tenantId: tenantTm.id, schoolId: schoolTm.id, classGroupId: 'class-tm-11g1', rosterCode: 'TM-201', firstName: 'Sardor', lastName: 'Rahimov', middleName: 'G‘ayrat o‘g‘li', gender: 'M', status: 'ELIGIBLE', group: '1-guruh', emaktabId: '1000001990401' },
    { id: 'rec-tm-202', tenantId: tenantTm.id, schoolId: schoolTm.id, classGroupId: 'class-tm-11g1', rosterCode: 'TM-202', firstName: 'Otabek', lastName: 'Boboyev', middleName: 'Mansur o‘g‘li', gender: 'M', status: 'ELIGIBLE', group: '1-guruh', emaktabId: '1000001990402' },
    { id: 'rec-tm-203', tenantId: tenantTm.id, schoolId: schoolTm.id, classGroupId: 'class-tm-11g1', rosterCode: 'TM-203', firstName: 'Dilshod', lastName: 'Karimov', middleName: 'Shavkat o‘g‘li', gender: 'M', status: 'ELIGIBLE', group: '1-guruh', emaktabId: '1000001990403' },
    { id: 'rec-tm-204', tenantId: tenantTm.id, schoolId: schoolTm.id, classGroupId: 'class-tm-11g1', rosterCode: 'TM-204', firstName: 'Sherzodbek', lastName: 'Mansurov', middleName: 'Nodir o‘g‘li', gender: 'M', status: 'ELIGIBLE', group: '2-guruh', emaktabId: '1000001990404' },
    { id: 'rec-tm-205', tenantId: tenantTm.id, schoolId: schoolTm.id, classGroupId: 'class-tm-11g2', rosterCode: 'TM-205', firstName: 'Xurshid', lastName: 'Normurodov', middleName: 'Qobil o‘g‘li', gender: 'M', status: 'ELIGIBLE', group: '2-guruh', emaktabId: '1000001990405' },
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

