import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Prisma Database Seed for CHSB Assessment Platform...');

  // 1. Password Hashing
  if (process.env.ALLOW_DB_RESET !== 'yes') {
    throw new Error('Refusing to run: this seed DELETES ALL DATA. Set ALLOW_DB_RESET=yes to confirm.');
  }
  const seedPassword = process.env.SEED_PASSWORD ?? '';
  if (seedPassword.length < 10 || seedPassword === 'Secret123!') {
    throw new Error('Set SEED_PASSWORD to a private password of at least 10 characters.');
  }
  const hashedPassword = await bcrypt.hash(seedPassword, 10);

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

  // 5. Create Users (System Accounts)
  await prisma.user.createMany({
    data: [
      {
        id: 'usr-teacher-01',
        tenantId: tenantAx.id,
        username: 'teacher_ax',
        email: 'teacher@al-xorazmiy.uz',
        fullName: 'Anvar Rahimov',
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
    ],
  });

  console.log('✅ Clean production bootstrap completed: 2 tenants, 2 schools, auth accounts, 0 mock classes, 0 mock students.');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

