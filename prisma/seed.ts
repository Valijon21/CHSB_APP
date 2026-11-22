import { PrismaClient, Role, StudentStatus, BloomLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

interface SeedStudentItem {
  id: string;
  tenantId: string;
  schoolId: string;
  classGroupId: string;
  rosterCode: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender?: string;
  status: StudentStatus;
  emaktabId?: string | null;
  groupName?: string | null;
}

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Comprehensive PostgreSQL 18 Database Seed with 73 Real eMaktab Students...');

  // 1. Password Hashing
  const defaultPassword = 'Secret123!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // 2. Clean old data in reverse dependency order
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

  console.log('🧹 Cleaned existing tables in PostgreSQL 18.');

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
      studentCount: 79,
    },
  });

  const schoolTm = await prisma.school.create({
    data: {
      id: 'school-tm-1',
      tenantId: tenantTm.id,
      name: 'Temurbeklar Maktabi Markaziy Kampus',
      districtId: 'yunusobod',
      schoolType: 'lyceum',
      studentCount: 5,
    },
  });

  // 5. Create Auth Users (Teachers, Admins, Inspector, Student)
  await prisma.user.createMany({
    data: [
      {
        id: 'usr-teacher-01',
        tenantId: tenantAx.id,
        username: 'teacher_ax',
        email: 'dilmurod.yunusov@al-xorazmiy.uz',
        fullName: 'Dilmurod Ustoz', // Real: Dilmurod Rahmataliyevich Yunusov (keeps API test backwards compatibility)
        hashedPassword,
        role: Role.TEACHER,
        isActive: true,
      },
      {
        id: 'usr-teacher-02',
        tenantId: tenantAx.id,
        username: 'teacher_dilrabo',
        email: 'dilrabo.sharafxonova@al-xorazmiy.uz',
        fullName: 'Dilrabo Turdialiyevna Sharafxonova',
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
  // 11-A (31 real students in 2 groups + 1 test student Alisher = 32)
  // 10-A (15 real students in 1-guruh)
  // 10-V (27 real students yaxlit)
  const classGroupsData = [
    { id: 'class-ax-11a', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '11-A sinf', gradeLevel: 11, shift: 1, studentCount: 32 },
    { id: 'class-ax-10a', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '10-A sinf', gradeLevel: 10, shift: 1, studentCount: 15 },
    { id: 'class-ax-10v', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '10-V sinf', gradeLevel: 10, shift: 1, studentCount: 27 },
    { id: 'class-ax-11b', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '11-B sinf', gradeLevel: 11, shift: 1, studentCount: 5 },
    { id: 'class-ax-11v', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '11-V sinf', gradeLevel: 11, shift: 2, studentCount: 0 },
    { id: 'class-ax-10b', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '10-B sinf', gradeLevel: 10, shift: 1, studentCount: 0 },
    { id: 'class-ax-9a', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '9-A sinf', gradeLevel: 9, shift: 1, studentCount: 0 },
    { id: 'class-ax-9b', tenantId: tenantAx.id, schoolId: schoolAx.id, name: '9-B sinf', gradeLevel: 9, shift: 2, studentCount: 0 },
    { id: 'class-tm-11g1', tenantId: tenantTm.id, schoolId: schoolTm.id, name: '11-Guruh-1 (Harbiy-AT)', gradeLevel: 11, shift: 1, studentCount: 4 },
    { id: 'class-tm-11g2', tenantId: tenantTm.id, schoolId: schoolTm.id, name: '11-Guruh-2 (Harbiy-AT)', gradeLevel: 11, shift: 1, studentCount: 1 },
    { id: 'class-tm-10g1', tenantId: tenantTm.id, schoolId: schoolTm.id, name: '10-Guruh-1 (Harbiy-AT)', gradeLevel: 10, shift: 1, studentCount: 0 },
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

  // 7. Students Dataset
  // 7.1 Anchor Test Student (STU-1101, Alisher Zokirov) for test assertions
  const anchorStudents = [
    {
      id: 'rec-ax-101',
      tenantId: tenantAx.id,
      schoolId: schoolAx.id,
      classGroupId: 'class-ax-11a',
      rosterCode: 'STU-1101',
      firstName: 'Alisher',
      lastName: 'Zokirov',
      middleName: 'Bahrom o‘g‘li',
      gender: 'M',
      groupName: '1-gurux',
      emaktabId: '1000001990001',
      status: StudentStatus.ELIGIBLE,
    },
  ];

  // 7.2 Real 11-A 1-gurux (15 students, Teacher: Dilmurod Rahmataliyevich Yunusov)
  const real11A_Group1 = [
    { id: 'rec-ax-102', emaktabId: '1000001990090', lastName: 'Abduraximova', firstName: 'Zuxra', gender: 'F' },
    { id: 'rec-ax-103', emaktabId: '1000003598248', lastName: 'Abdusattorova', firstName: 'Xayrixon', gender: 'F' },
    { id: 'rec-ax-104', emaktabId: '1000001990091', lastName: 'Abdug‘afforova', firstName: 'Madinabonu', gender: 'F' },
    { id: 'rec-ax-105', emaktabId: '1000003569688', lastName: 'Axmadjonova', firstName: 'Zaxro', gender: 'F' },
    { id: 'rec-ax-106', emaktabId: '1000001990096', lastName: 'Davlataliyev', firstName: 'O‘ktamjon', gender: 'M' },
    { id: 'rec-ax-107', emaktabId: '1000004307678', lastName: 'Ergashaliyeva', firstName: 'Zilola', gender: 'F' },
    { id: 'rec-ax-108', emaktabId: '1000001990098', lastName: 'Ergashev', firstName: 'Nurhayit', gender: 'M' },
    { id: 'rec-ax-109', emaktabId: '1000003569692', lastName: 'Ergasheva', firstName: 'Nazira', gender: 'F' },
    { id: 'rec-ax-110', emaktabId: '1000001990100', lastName: 'Jurabayeva', firstName: 'Madina', gender: 'F' },
    { id: 'rec-ax-111', emaktabId: '1000003673332', lastName: 'Odilov', firstName: 'O‘tkirbek', gender: 'M' },
    { id: 'rec-ax-112', emaktabId: '1000001990109', lastName: 'Ozatboyeva', firstName: 'Gullola', gender: 'F' },
    { id: 'rec-ax-113', emaktabId: '1000003594807', lastName: 'Sobirjonova', firstName: 'Durdona', gender: 'F' },
    { id: 'rec-ax-114', emaktabId: '1000001990115', lastName: 'Umaraliyeva', firstName: 'Feruza', gender: 'F' },
    { id: 'rec-ax-115', emaktabId: '1000020620646', lastName: 'Valijonova', firstName: 'Sevdora', gender: 'F' },
    { id: 'rec-ax-116', emaktabId: '1000003569665', lastName: 'Miradjonova', firstName: 'Shabnam', middleName: 'Мираджонова Шабнам', gender: 'F' },
  ].map((s, idx) => ({
    ...s,
    tenantId: tenantAx.id,
    schoolId: schoolAx.id,
    classGroupId: 'class-ax-11a',
    rosterCode: `STU-11${String(idx + 2).padStart(2, '0')}`, // STU-1102 .. STU-1116
    groupName: '1-gurux',
    status: StudentStatus.ELIGIBLE,
  }));

  // 7.3 Real 11-A 2-gurux (16 students, Teacher: Dilrabo Turdialiyevna Sharafxonova)
  const real11A_Group2 = [
    { id: 'rec-ax-117', emaktabId: '1000001990097', lastName: 'Davlatova', firstName: 'Nurjaxonbegim', gender: 'F' },
    { id: 'rec-ax-118', emaktabId: '1000002015266', lastName: 'Ibroximova', firstName: 'Ruxshona', gender: 'F' },
    { id: 'rec-ax-119', emaktabId: '1000003598256', lastName: 'Isaqov', firstName: 'Muhammadqodir', gender: 'M' },
    { id: 'rec-ax-120', emaktabId: '1000003594718', lastName: 'Jurayev', firstName: 'Xumoyun', gender: 'M' },
    { id: 'rec-ax-121', emaktabId: '1000001990105', lastName: 'Mamatyusufova', firstName: 'Kumush', gender: 'F' },
    { id: 'rec-ax-122', emaktabId: '1000017085712', lastName: 'Mamitaliyeva', firstName: 'Xumora', gender: 'F' },
    { id: 'rec-ax-123', emaktabId: '1000001990107', lastName: 'Nurmuxamadova', firstName: 'Shabnam', gender: 'F' },
    { id: 'rec-ax-124', emaktabId: '1000001990111', lastName: 'Raxmonov', firstName: 'Ziyodullo', gender: 'M' },
    { id: 'rec-ax-125', emaktabId: '1000019411830', lastName: 'Sobirjonova', firstName: 'Jasminabonu', gender: 'F' },
    { id: 'rec-ax-126', emaktabId: '1000003598214', lastName: 'Solijonova', firstName: 'Billura', gender: 'F' },
    { id: 'rec-ax-127', emaktabId: '1000003598462', lastName: 'Tursunaliyeva', firstName: 'Nargiza', gender: 'F' },
    { id: 'rec-ax-128', emaktabId: '1000001990118', lastName: 'Sharipova', firstName: 'Gulsanam', gender: 'F' },
    { id: 'rec-ax-129', emaktabId: '1000001990108', lastName: 'Ozodov', firstName: 'Ozodbek', middleName: 'Озодов Озодбек', gender: 'M' },
    { id: 'rec-ax-130', emaktabId: '1000009831037', lastName: 'Rasuljonova', firstName: 'Noila', middleName: 'Расулжонова Ноила', gender: 'F' },
    { id: 'rec-ax-131', emaktabId: '1000003594925', lastName: 'Umarjonova', firstName: 'Shaydo', middleName: 'Умаржонова Шайдо', gender: 'F' },
    { id: 'rec-ax-132', emaktabId: '1000001990114', lastName: 'Usibjonova', firstName: 'Sarvinoz', middleName: 'Усибжонова Сарвиноз', gender: 'F' },
  ].map((s, idx) => ({
    ...s,
    tenantId: tenantAx.id,
    schoolId: schoolAx.id,
    classGroupId: 'class-ax-11a',
    rosterCode: `STU-11${String(idx + 17).padStart(2, '0')}`, // STU-1117 .. STU-1132
    groupName: '2-gurux',
    status: StudentStatus.ELIGIBLE,
  }));

  // 7.4 Real 10-A 1-gurux (15 students, Teacher: Dilmurod Rahmataliyevich Yunusov)
  const real10A_Group1 = [
    { id: 'rec-ax-133', emaktabId: '1000003546584', lastName: 'Abdullayeva', firstName: 'Dilafro‘z', gender: 'F' },
    { id: 'rec-ax-134', emaktabId: '1000011564262', lastName: 'Akbaraliyeva', firstName: 'Shahlo', gender: 'F' },
    { id: 'rec-ax-135', emaktabId: '1000001984703', lastName: 'Alijonova', firstName: 'Dilxiroj', gender: 'F' },
    { id: 'rec-ax-136', emaktabId: '1000001984704', lastName: 'Arabboyev', firstName: 'Diyorbek', gender: 'M' },
    { id: 'rec-ax-137', emaktabId: '1000001984705', lastName: 'Arabboyeva', firstName: 'Farangiz', gender: 'F' },
    { id: 'rec-ax-138', emaktabId: '1000001984707', lastName: 'Avazxonov', firstName: 'Nuriddin', gender: 'M' },
    { id: 'rec-ax-139', emaktabId: '1000001984708', lastName: 'Axmadjonov', firstName: 'Xumoyun', gender: 'M' },
    { id: 'rec-ax-140', emaktabId: '1000001984712', lastName: 'Ismailjonov', firstName: 'Zahiriddin', gender: 'M' },
    { id: 'rec-ax-141', emaktabId: '1000001984714', lastName: 'Mamurjonov', firstName: 'Shohjaxon', gender: 'M' },
    { id: 'rec-ax-142', emaktabId: '1000021243204', lastName: 'Maryunusova', firstName: 'Jasmina', gender: 'F' },
    { id: 'rec-ax-143', emaktabId: '1000021243600', lastName: 'Maxammadisakov', firstName: 'Farrux', gender: 'M' },
    { id: 'rec-ax-144', emaktabId: '1000004405160', lastName: 'Muxammadjonova', firstName: 'Muslima', gender: 'F' },
    { id: 'rec-ax-145', emaktabId: '1000005163683', lastName: 'Nabijonov', firstName: 'Xudoyberdi', gender: 'M' },
    { id: 'rec-ax-146', emaktabId: '1000001984730', lastName: 'G‘anijonov', firstName: 'Shohrux', gender: 'M' },
    { id: 'rec-ax-147', emaktabId: '1000001984711', lastName: 'Ibroximova', firstName: 'Aziza', middleName: 'Иброхимова Азиза', gender: 'F' },
  ].map((s, idx) => ({
    ...s,
    tenantId: tenantAx.id,
    schoolId: schoolAx.id,
    classGroupId: 'class-ax-10a',
    rosterCode: `STU-10${String(idx + 1).padStart(2, '0')}`, // STU-1001 .. STU-1015
    groupName: '1-gurux',
    status: StudentStatus.ELIGIBLE,
  }));

  // 7.5 Real 10-V sinf (27 students yaxlit, Teacher: Dilmurod Rahmataliyevich Yunusov)
  const real10V = [
    { id: 'rec-ax-148', emaktabId: '1000005839035', lastName: 'Abbosova', firstName: 'Bahora', gender: 'F' },
    { id: 'rec-ax-149', emaktabId: '1000018350347', lastName: 'Abduraximov', firstName: 'Azamatjon', gender: 'M' },
    { id: 'rec-ax-150', emaktabId: '1000011419185', lastName: 'Abdusattorova', firstName: 'Gullola', gender: 'F' },
    { id: 'rec-ax-151', emaktabId: '1000001361156', lastName: 'Adiljanov', firstName: 'Murodjon', gender: 'M' },
    { id: 'rec-ax-152', emaktabId: '1000011349773', lastName: 'Alijonova', firstName: 'Fotimaxon', gender: 'F' },
    { id: 'rec-ax-153', emaktabId: '1000018174777', lastName: 'Baxtiyorova', firstName: 'Xushnoza', gender: 'F' },
    { id: 'rec-ax-154', emaktabId: '1000012165845', lastName: 'Gulomova', firstName: 'Shodiyona', gender: 'F' },
    { id: 'rec-ax-155', emaktabId: '1000020553031', lastName: 'Islamjonova', firstName: 'Sabino', gender: 'F' },
    { id: 'rec-ax-156', emaktabId: '1000001360818', lastName: 'Maxamatbokiyeva', firstName: 'Madinabonu', gender: 'F' },
    { id: 'rec-ax-157', emaktabId: '1000017185711', lastName: 'Mirzaraimova', firstName: 'Mushtariybonu', gender: 'F' },
    { id: 'rec-ax-158', emaktabId: '1000007633997', lastName: 'Nizamjonova', firstName: 'Muinaxon', gender: 'F' },
    { id: 'rec-ax-159', emaktabId: '1000004887839', lastName: 'Orifjonova', firstName: 'Farangiz', gender: 'F' },
    { id: 'rec-ax-160', emaktabId: '1000004776849', lastName: 'Osmonjonov', firstName: 'Jaxongir', gender: 'M' },
    { id: 'rec-ax-161', emaktabId: '1000023553427', lastName: 'Qurvonaliyeva', firstName: 'Kabira', gender: 'F' },
    { id: 'rec-ax-162', emaktabId: '1000001236697', lastName: 'Raximberdiyev', firstName: 'Nurmuhammad', gender: 'M' },
    { id: 'rec-ax-163', emaktabId: '1000002434190', lastName: 'Salimjonov', firstName: 'Begzodbek', gender: 'M' },
    { id: 'rec-ax-164', emaktabId: '1000019286313', lastName: 'Sobirjonova', firstName: 'Madina', gender: 'F' },
    { id: 'rec-ax-165', emaktabId: '1000001331042', lastName: 'Soxijonova', firstName: 'Dilafruz', gender: 'F' },
    { id: 'rec-ax-166', emaktabId: '1000005304046', lastName: 'To‘xtanazarov', firstName: 'Bexruzbek', gender: 'M' },
    { id: 'rec-ax-167', emaktabId: '1000011372193', lastName: 'Sheraliyeva', firstName: 'Nilufar', gender: 'F' },
    { id: 'rec-ax-168', emaktabId: '1000004968306', lastName: 'Shermamatov', firstName: 'Islomjon', gender: 'M' },
    { id: 'rec-ax-169', emaktabId: '1000011419188', lastName: 'Davlataliyev', firstName: 'Jaxongir', middleName: 'Давлаталиев Жахонгир', gender: 'M' },
    { id: 'rec-ax-170', emaktabId: '1000002118670', lastName: 'Jonashova', firstName: 'Moxinur', middleName: 'Жўнашова Мохинур', gender: 'F' },
    { id: 'rec-ax-171', emaktabId: '1000004795171', lastName: 'Isakboyeva', firstName: 'Moxirabonu', middleName: 'Исакбоева Мохирабону', gender: 'F' },
    { id: 'rec-ax-172', emaktabId: '1000011473261', lastName: 'Komiljonova', firstName: 'Moxinabonu', middleName: 'Комилжонова Мохинабону', gender: 'F' },
    { id: 'rec-ax-173', emaktabId: '1000023444076', lastName: 'Turg‘unov', firstName: 'Bobonazar', middleName: 'Турғунов Бобоназар', gender: 'M' },
    { id: 'rec-ax-174', emaktabId: '1000001361183', lastName: 'Yuldashaliyeva', firstName: 'Mushtariybonu', middleName: 'Юлдашалиева Муштарийбону', gender: 'F' },
  ].map((s, idx) => ({
    ...s,
    tenantId: tenantAx.id,
    schoolId: schoolAx.id,
    classGroupId: 'class-ax-10v',
    rosterCode: `STU-10V${String(idx + 1).padStart(2, '0')}`, // STU-10V01 .. STU-10V27
    groupName: undefined,
    status: StudentStatus.ELIGIBLE,
  }));

  // 7.6 Auxiliary students for 11-B and Temurbeklar Maktabi
  const auxiliaryStudents = [
    // 11-B sinf
    { id: 'rec-ax-175', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11b', rosterCode: 'STU-11B01', firstName: 'Sardorbek', lastName: 'Aliyev', middleName: 'Mansur o‘g‘li', gender: 'M', status: StudentStatus.ELIGIBLE },
    { id: 'rec-ax-176', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11b', rosterCode: 'STU-11B02', firstName: 'Gulnoza', lastName: 'Xoliqova', middleName: 'Ulug‘bek qizi', gender: 'F', status: StudentStatus.ELIGIBLE },
    { id: 'rec-ax-177', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11b', rosterCode: 'STU-11B03', firstName: 'Sanjarbek', lastName: 'Normatov', middleName: 'Qodir o‘g‘li', gender: 'M', status: StudentStatus.ELIGIBLE },
    { id: 'rec-ax-178', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11b', rosterCode: 'STU-11B04', firstName: 'Dildora', lastName: 'Tursunova', middleName: 'Bekzod qizi', gender: 'F', status: StudentStatus.ELIGIBLE },
    { id: 'rec-ax-179', tenantId: tenantAx.id, schoolId: schoolAx.id, classGroupId: 'class-ax-11b', rosterCode: 'STU-11B05', firstName: 'Farrux', lastName: 'Ergashev', middleName: 'Ravshan o‘g‘li', gender: 'M', status: StudentStatus.ELIGIBLE },

    // Temurbeklar Maktabi
    { id: 'rec-tm-201', tenantId: tenantTm.id, schoolId: schoolTm.id, classGroupId: 'class-tm-11g1', rosterCode: 'TM-201', firstName: 'Sardor', lastName: 'Rahimov', middleName: 'G‘ayrat o‘g‘li', gender: 'M', status: StudentStatus.ELIGIBLE },
    { id: 'rec-tm-202', tenantId: tenantTm.id, schoolId: schoolTm.id, classGroupId: 'class-tm-11g1', rosterCode: 'TM-202', firstName: 'Otabek', lastName: 'Boboyev', middleName: 'Mansur o‘g‘li', gender: 'M', status: StudentStatus.ELIGIBLE },
    { id: 'rec-tm-203', tenantId: tenantTm.id, schoolId: schoolTm.id, classGroupId: 'class-tm-11g1', rosterCode: 'TM-203', firstName: 'Dilshod', lastName: 'Karimov', middleName: 'Shavkat o‘g‘li', gender: 'M', status: StudentStatus.ELIGIBLE },
    { id: 'rec-tm-204', tenantId: tenantTm.id, schoolId: schoolTm.id, classGroupId: 'class-tm-11g1', rosterCode: 'TM-204', firstName: 'Sherzodbek', lastName: 'Mansurov', middleName: 'Nodir o‘g‘li', gender: 'M', status: StudentStatus.ELIGIBLE },
    { id: 'rec-tm-205', tenantId: tenantTm.id, schoolId: schoolTm.id, classGroupId: 'class-tm-11g2', rosterCode: 'TM-205', firstName: 'Xurshid', lastName: 'Normurodov', middleName: 'Qobil o‘g‘li', gender: 'M', status: StudentStatus.ELIGIBLE },
  ];

  const allStudents: SeedStudentItem[] = [
    ...anchorStudents,
    ...real11A_Group1,
    ...real11A_Group2,
    ...real10A_Group1,
    ...real10V,
    ...auxiliaryStudents,
  ];

  console.log(`Inserting ${allStudents.length} students into PostgreSQL 18...`);

  for (const s of allStudents) {
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
        emaktabId: s.emaktabId || null,
        groupName: s.groupName || null,
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
        prompt: `${i}-savol: Informatika va axborot texnologiyalari bo'yicha test topshirig'i.`,
        optionsJson: [
          { id: 'opt-a', label: 'A', text: "To'g'ri javob varianti" },
          { id: 'opt-b', label: 'B', text: "Noto'g'ri chalg'ituvchi variant 1" },
          { id: 'opt-c', label: 'C', text: "Noto'g'ri chalg'ituvchi variant 2" },
          { id: 'opt-d', label: 'D', text: "Noto'g'ri chalg'ituvchi variant 3" },
        ],
        correctOptionId: 'opt-a',
        bloomLevel: bloomLevels[i - 1] || BloomLevel.KNOWLEDGE,
        difficulty: i > 10 ? 'hard' : i > 5 ? 'medium' : 'easy',
        points: 2.5,
      },
    });
  }

  // 10. Create Rich Assessment Attempts & Results for Sample Students in 11-A, 11-B and TM
  const resultsData = [
    // 11-A (Anchor Alisher Zokirov + real students from both groups)
    { stuId: 'rec-ax-101', score: 35.0, percentage: 87.5, grade: '5' },
    { stuId: 'rec-ax-102', score: 37.5, percentage: 93.8, grade: '5' },
    { stuId: 'rec-ax-103', score: 32.5, percentage: 81.3, grade: '4' },
    { stuId: 'rec-ax-104', score: 39.0, percentage: 97.5, grade: '5' },
    { stuId: 'rec-ax-105', score: 30.0, percentage: 75.0, grade: '4' },
    { stuId: 'rec-ax-106', score: 34.0, percentage: 85.0, grade: '4' },
    { stuId: 'rec-ax-107', score: 38.0, percentage: 95.0, grade: '5' },
    { stuId: 'rec-ax-108', score: 31.0, percentage: 77.5, grade: '4' },
    { stuId: 'rec-ax-109', score: 25.0, percentage: 62.5, grade: '3' },
    { stuId: 'rec-ax-110', score: 36.0, percentage: 90.0, grade: '5' },
    // Group 2 students in 11-A
    { stuId: 'rec-ax-117', score: 36.5, percentage: 91.3, grade: '5' },
    { stuId: 'rec-ax-118', score: 35.0, percentage: 87.5, grade: '5' },
    { stuId: 'rec-ax-119', score: 32.0, percentage: 80.0, grade: '4' },
    { stuId: 'rec-ax-120', score: 28.5, percentage: 71.3, grade: '4' },
    { stuId: 'rec-ax-129', score: 38.5, percentage: 96.3, grade: '5' }, // Ozodov Ozodbek
    { stuId: 'rec-ax-130', score: 34.0, percentage: 85.0, grade: '4' }, // Rasuljonova Noila
    // 10-A students
    { stuId: 'rec-ax-133', score: 33.0, percentage: 82.5, grade: '4' },
    { stuId: 'rec-ax-134', score: 36.0, percentage: 90.0, grade: '5' },
    { stuId: 'rec-ax-147', score: 35.0, percentage: 87.5, grade: '5' }, // Ibroximova Aziza
    // 10-V students
    { stuId: 'rec-ax-148', score: 31.5, percentage: 78.8, grade: '4' },
    { stuId: 'rec-ax-149', score: 37.0, percentage: 92.5, grade: '5' },
    { stuId: 'rec-ax-169', score: 34.0, percentage: 85.0, grade: '4' }, // Davlataliyev Jaxongir
    // 11-B students
    { stuId: 'rec-ax-175', score: 36.5, percentage: 91.3, grade: '5' },
    { stuId: 'rec-ax-176', score: 33.0, percentage: 82.5, grade: '4' },
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
        timeSpentSeconds: 1800 + idx * 30,
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

  console.log(`✅ Seed Completed Successfully!`);
  console.log(`📊 Statistics:`);
  console.log(`   - Tenants: 2 (al-xorazmiy, temurbeklar-maktabi)`);
  console.log(`   - Class Groups: ${classGroupsData.length}`);
  console.log(`   - Students: ${allStudents.length} (including 73 real eMaktab students across 4 classes/groups)`);
  console.log(`   - Real Teachers: Dilmurod Rahmataliyevich Yunusov & Dilrabo Turdialiyevna Sharafxonova`);
  console.log(`   - Questions: 15`);
  console.log(`   - Attempts & Results: ${resultsData.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
