import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useOrganizationStore } from '../src/features/organization/store/organizationStore';
import { router } from '../src/app/router';

describe('TASK-MS.7: Multi-School & User Management End-to-End Integration Flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('registers /schools route in the application router', () => {
    const route = router.getRoutes().find((r) => r.path === '/schools');
    expect(route).toBeDefined();
    expect(route?.name).toBe('SchoolDirectory');
  });

  it('executes full multi-tenant school onboarding lifecycle', async () => {
    const store = useOrganizationStore();
    await store.loadSchools();
    const initialSchoolCount = store.schools.length;

    // 1. Regional Super-Admin creates a new school in Xonqa district
    const newSchool = await store.createSchool({
      name: 'Xonqa 1-sonli ixtisoslashtirilgan davlat maktab-internati',
      code: 'XON-01',
      slug: 'xonqa-1-maktab',
      districtId: 'dist-xonqa-tuman',
      districtName: 'Xonqa tumani',
      type: 'specialized',
      directorName: 'Xudayberganov Rustam',
      contactPhone: '+998623991122',
      email: 'xonqa1@xorazm.uz',
      status: 'active',
    });

    expect(newSchool.slug).toBe('xonqa-1-maktab');
    expect(store.schools.length).toBe(initialSchoolCount + 1);

    // 2. Switch context to the new school
    await store.loadSchoolContext('xonqa-1-maktab');
    expect(store.activeSchoolSlug).toBe('xonqa-1-maktab');
    expect(store.teachers.length).toBe(0);
    expect(store.students.length).toBe(0);

    // 3. Maktab ma'muri creates a new class group: 9-A
    const classGroup = await store.createClassGroup({
      schoolId: newSchool.id,
      tenantSlug: 'xonqa-1-maktab',
      name: '9-A',
      gradeLevel: 9,
      shift: 1,
      academicYear: '2026-2027',
    });
    expect(classGroup.name).toBe('9-A');
    expect(store.classGroups.length).toBe(1);

    // 4. Maktab ma'muri creates a teacher assigned to 9-A
    const teacher = await store.createTeacher({
      schoolId: newSchool.id,
      tenantSlug: 'xonqa-1-maktab',
      fullName: 'Olimov Sarvar Ilhomovich',
      subject: 'Matematika',
      qualification: 'oliy',
      assignedClassIds: [classGroup.id],
      phone: '+998905556677',
      status: 'active',
    });
    expect(teacher.fullName).toBe('Olimov Sarvar Ilhomovich');
    expect(store.teachers.length).toBe(1);

    // 5. Admin adds an individual student
    const student1 = await store.createStudent({
      tenantSlug: 'xonqa-1-maktab',
      schoolId: newSchool.id,
      classGroupId: classGroup.id,
      className: '9-A',
      firstName: 'Azizbek',
      lastName: 'Madaminov',
      gender: 'M',
      birthDate: '2010-03-15',
      status: 'eligible',
    });
    expect(student1.rosterCode.startsWith('STU-')).toBe(true);
    expect(store.students.length).toBe(1);

    // 6. Admin bulk imports a list of students for 9-A
    const bulkBatch = [
      {
        tenantSlug: 'xonqa-1-maktab',
        schoolId: newSchool.id,
        classGroupId: classGroup.id,
        className: '9-A',
        firstName: 'Dildora',
        lastName: 'Sharipova',
        gender: 'F' as const,
        birthDate: '2010-07-22',
        status: 'eligible' as const,
      },
      {
        tenantSlug: 'xonqa-1-maktab',
        schoolId: newSchool.id,
        classGroupId: classGroup.id,
        className: '9-A',
        firstName: 'Shohruh',
        lastName: 'Yoqubov',
        gender: 'M' as const,
        birthDate: '2010-10-08',
        status: 'eligible' as const,
      },
    ];

    const bulkResult = await store.bulkImportStudents(bulkBatch);
    expect(bulkResult.length).toBe(2);
    expect(store.students.length).toBe(3);

    // 7. Verify multi-tenant isolation: switching back to al-xorazmiy
    await store.loadSchoolContext('al-xorazmiy');
    expect(store.activeSchoolSlug).toBe('al-xorazmiy');
    // None of xonqa-1-maktab students should leak into al-xorazmiy
    expect(store.students.some((s) => s.lastName === 'Madaminov')).toBe(false);
  });
});
