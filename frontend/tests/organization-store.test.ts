import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useOrganizationStore } from '../src/features/organization/store/organizationStore';

describe('TASK-MS.3: Organization & Multi-School Pinia Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('loads schools list and computes overall statistics', async () => {
    const store = useOrganizationStore();
    await store.loadSchools();

    expect(store.schools.length).toBeGreaterThanOrEqual(3);
    const stats = store.overallStats;
    expect(stats.totalSchools).toBeGreaterThanOrEqual(3);
    expect(stats.totalStudents).toBeGreaterThan(0);
    expect(stats.totalTeachers).toBeGreaterThan(0);
  });

  it('filters schools by district and search query', async () => {
    const store = useOrganizationStore();
    await store.loadSchools();

    // District filter
    store.setDistrictFilter('dist-xiva-shahar');
    expect(store.filteredSchools.every((s) => s.districtId === 'dist-xiva-shahar')).toBe(true);

    // Search query
    store.setDistrictFilter('all');
    store.setSearchQuery('Al-Xorazmiy');
    expect(store.filteredSchools.length).toBe(1);
    expect(store.filteredSchools[0]?.slug).toBe('al-xorazmiy');
  });

  it('loads school context (teachers, students, classes) for active school', async () => {
    const store = useOrganizationStore();
    await store.loadSchools();
    await store.loadSchoolContext('al-xorazmiy');

    expect(store.activeSchool?.slug).toBe('al-xorazmiy');
    expect(store.teachers.length).toBeGreaterThan(0);
    expect(store.students.length).toBeGreaterThan(0);
    expect(store.classGroups.length).toBeGreaterThan(0);
  });

  it('creates a new school and adds it to the state', async () => {
    const store = useOrganizationStore();
    await store.loadSchools();

    const created = await store.createSchool({
      name: 'Bog\'ot 1-sonli ixtisoslashtirilgan maktab',
      code: 'BOG-01',
      slug: 'bogot-1-maktab',
      districtId: 'dist-bogot-tuman',
      districtName: 'Bog\'ot tumani',
      type: 'specialized',
      directorName: 'Qalandarov Bobur',
      contactPhone: '+998623123456',
      status: 'active',
    });

    expect(created.slug).toBe('bogot-1-maktab');
    expect(store.schools.some((s) => s.slug === 'bogot-1-maktab')).toBe(true);
  });

  it('creates, updates, and deletes teachers in the active school', async () => {
    const store = useOrganizationStore();
    await store.loadSchools();
    await store.loadSchoolContext('al-xorazmiy');

    const initialTeacherCount = store.teachers.length;

    const teacher = await store.createTeacher({
      schoolId: 'sch-01',
      tenantSlug: 'al-xorazmiy',
      fullName: 'Yusupova Munira',
      subject: 'Ingliz tili',
      qualification: 'ikkinchi',
      assignedClassIds: ['cls-ax-11a'],
      phone: '+998909876543',
      status: 'active',
    });

    expect(store.teachers.length).toBe(initialTeacherCount + 1);
    expect(teacher.fullName).toBe('Yusupova Munira');

    // Update teacher
    await store.updateTeacher(teacher.id, { qualification: 'birinchi' });
    const found = store.teachers.find((t) => t.id === teacher.id);
    expect(found?.qualification).toBe('birinchi');

    // Delete teacher
    await store.deleteTeacher(teacher.id);
    expect(store.teachers.some((t) => t.id === teacher.id)).toBe(false);
  });

  it('creates an individual student and performs bulk import', async () => {
    const store = useOrganizationStore();
    await store.loadSchools();
    await store.loadSchoolContext('al-xorazmiy');

    const initialCount = store.students.length;

    // Single student
    const student = await store.createStudent({
      tenantSlug: 'al-xorazmiy',
      schoolId: 'sch-01',
      classGroupId: 'cls-ax-11a',
      className: '11-A',
      firstName: 'Sanjar',
      lastName: 'Boltayev',
      gender: 'M',
      birthDate: '2008-07-15',
      status: 'eligible',
    });

    expect(student.rosterCode.startsWith('STU-')).toBe(true);
    expect(store.students.length).toBe(initialCount + 1);

    // Bulk import
    const batch = [
      {
        tenantSlug: 'al-xorazmiy',
        schoolId: 'sch-01',
        classGroupId: 'cls-ax-11a',
        className: '11-A',
        firstName: 'Shahlo',
        lastName: 'Matkarimova',
        gender: 'F' as const,
        birthDate: '2008-03-10',
        status: 'eligible' as const,
      },
    ];

    const bulkResult = await store.bulkImportStudents(batch);
    expect(bulkResult.length).toBe(1);
    expect(store.students.length).toBe(initialCount + 2);

    // Delete student
    await store.deleteStudent(student.id);
    expect(store.students.some((s) => s.id === student.id)).toBe(false);
  });
});

