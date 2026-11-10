import { describe, it, expect, beforeEach } from 'vitest';
import { MockOrganizationRepository } from '../src/mocks/repositories/MockOrganizationRepository';

describe('TASK-MS.2: MockOrganizationRepository (Multi-School & Users CRUD)', () => {
  let repo: MockOrganizationRepository;

  beforeEach(() => {
    repo = new MockOrganizationRepository();
  });

  describe('Schools (Maktablar) Management', () => {
    it('retrieves all initially seeded schools', async () => {
      const schools = await repo.getAllSchools();
      expect(schools.length).toBeGreaterThanOrEqual(3);
      expect(schools.some((s) => s.slug === 'al-xorazmiy')).toBe(true);
      expect(schools.some((s) => s.slug === 'xorazm-demo')).toBe(true);
    });

    it('creates a new school and increments count', async () => {
      const newSchool = await repo.createSchool({
        name: 'Urganch 30-sonli umumiy o\'rta ta\'lim maktabi',
        code: 'URG-30',
        slug: 'urganch-30-maktab',
        districtId: 'dist-urganch-shahar',
        districtName: 'Urganch shahri',
        type: 'general',
        directorName: 'Yusupov Otabek',
        contactPhone: '+998622278901',
        email: '30maktab@urganch.uz',
        status: 'active',
      });

      expect(newSchool.id).toBeDefined();
      expect(newSchool.slug).toBe('urganch-30-maktab');

      const found = await repo.getSchoolBySlug('urganch-30-maktab');
      expect(found).not.toBeNull();
      expect(found?.name).toContain('30-sonli');
    });

    it('rejects creating a school with duplicate slug', async () => {
      await expect(
        repo.createSchool({
          name: 'Duplicate School',
          code: 'DUP-01',
          slug: 'al-xorazmiy', // Duplicate!
          districtId: 'dist-1',
          districtName: 'Urganch',
          type: 'general',
          directorName: 'Direktor',
          contactPhone: '+998901112233',
          status: 'active',
        })
      ).rejects.toThrow();
    });
  });

  describe('Teachers (O\'qituvchilar) Management', () => {
    it('creates a teacher and maps assigned class names', async () => {
      const teacher = await repo.createTeacher({
        schoolId: 'sch-01',
        tenantSlug: 'al-xorazmiy',
        fullName: 'Saidova Feruza Murodovna',
        subject: 'Fizika',
        qualification: 'birinchi',
        assignedClassIds: ['cls-ax-11a'],
        phone: '+998907654321',
        email: 'feruza@al-xorazmiy.uz',
        status: 'active',
      });

      expect(teacher.id).toBeDefined();
      expect(teacher.assignedClassNames).toContain('11-A');

      const teachers = await repo.getTeachersBySchool('al-xorazmiy');
      expect(teachers.some((t) => t.id === teacher.id)).toBe(true);
    });

    it('updates teacher qualification and subject', async () => {
      const teachers = await repo.getTeachersBySchool('al-xorazmiy');
      const teacher = teachers[0];
      expect(teacher).toBeDefined();

      const updated = await repo.updateTeacher(teacher!.id, {
        qualification: 'oliy',
        subject: 'Sun\'iy intellekt',
      });

      expect(updated?.qualification).toBe('oliy');
      expect(updated?.subject).toBe('Sun\'iy intellekt');
    });

    it('deletes a teacher', async () => {
      const teachers = await repo.getTeachersBySchool('al-xorazmiy');
      const teacher = teachers[0];
      expect(teacher).toBeDefined();

      const success = await repo.deleteTeacher(teacher!.id);
      expect(success).toBe(true);

      const after = await repo.getTeachersBySchool('al-xorazmiy');
      expect(after.some((t) => t.id === teacher!.id)).toBe(false);
    });
  });

  describe('Students (O\'quvchilar) Management', () => {
    it('creates an individual student with auto-generated roster code', async () => {
      const student = await repo.createStudent({
        tenantSlug: 'al-xorazmiy',
        schoolId: 'sch-01',
        classGroupId: 'cls-ax-11a',
        className: '11-A',
        firstName: 'Anvar',
        lastName: 'Sobirov',
        gender: 'M',
        birthDate: '2008-11-05',
        status: 'eligible',
      });

      expect(student.rosterCode.startsWith('STU-')).toBe(true);
      expect(student.fullName).toBe('Sobirov Anvar');

      const list = await repo.getStudentsBySchool('al-xorazmiy');
      expect(list.some((s) => s.id === student.id)).toBe(true);
    });

    it('bulk creates students in a batch', async () => {
      const batch = [
        {
          tenantSlug: 'xorazm-demo',
          schoolId: 'sch-03',
          classGroupId: 'cls-demo-9a',
          className: '9-A',
          firstName: 'Nozima',
          lastName: 'Karimova',
          gender: 'F' as const,
          birthDate: '2010-06-18',
          status: 'eligible' as const,
        },
        {
          tenantSlug: 'xorazm-demo',
          schoolId: 'sch-03',
          classGroupId: 'cls-demo-9a',
          className: '9-A',
          firstName: 'Bekzod',
          lastName: 'Yo\'ldoshev',
          gender: 'M' as const,
          birthDate: '2010-08-25',
          status: 'eligible' as const,
        },
      ];

      const created = await repo.bulkCreateStudents(batch);
      expect(created.length).toBe(2);
      expect(created[0]?.fullName).toBe('Karimova Nozima');
      expect(created[1]?.fullName).toBe('Yo\'ldoshev Bekzod');

      const demoStudents = await repo.getStudentsBySchool('xorazm-demo', 'cls-demo-9a');
      expect(demoStudents.length).toBeGreaterThanOrEqual(3);
    });

    it('updates and deletes student records', async () => {
      const students = await repo.getStudentsBySchool('al-xorazmiy');
      const student = students[0];
      expect(student).toBeDefined();

      const updated = await repo.updateStudent(student!.id, {
        lastName: 'Olimov',
        status: 'inactive',
      });

      expect(updated?.fullName).toContain('Olimov');
      expect(updated?.status).toBe('inactive');

      const deleted = await repo.deleteStudent(student!.id);
      expect(deleted).toBe(true);
    });
  });

  describe('Class Groups (Sinflar) Management', () => {
    it('creates a new class group and lists classes for a school', async () => {
      const newClass = await repo.createClassGroup({
        schoolId: 'sch-01',
        tenantSlug: 'al-xorazmiy',
        name: '11-B',
        gradeLevel: 11,
        shift: 2,
        academicYear: '2026-2027',
      });

      expect(newClass.id).toBeDefined();
      expect(newClass.name).toBe('11-B');

      const classes = await repo.getClassGroupsBySchool('al-xorazmiy');
      expect(classes.some((c) => c.id === newClass.id)).toBe(true);
    });
  });
});

