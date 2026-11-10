import { describe, it, expect } from 'vitest';
import {
  SchoolInputSchema,
  SchoolRecordSchema,
  TeacherInputSchema,
  TeacherRecordSchema,
  StudentInputSchema,
  StudentRecordSchema,
  ClassGroupInputSchema,
  ClassGroupRecordSchema,
} from '../src/entities/organization/model';

describe('TASK-MS.1: Organization, Multi-School, Teacher and Student Schemas', () => {
  describe('SchoolInputSchema & SchoolRecordSchema', () => {
    it('validates a valid school input', () => {
      const validSchool = {
        name: 'Urganch shahar 1-sonli ixtisoslashtirilgan maktab',
        code: 'URG-01',
        slug: 'urganch-1-maktab',
        districtId: 'dist-urganch-shahar',
        districtName: 'Urganch shahri',
        type: 'specialized',
        directorName: 'Boboyev Shavkat Karimovich',
        contactPhone: '+998622241020',
        email: 'info@urganch1.uz',
        status: 'active',
      };

      const parsed = SchoolInputSchema.parse(validSchool);
      expect(parsed.slug).toBe('urganch-1-maktab');
      expect(parsed.type).toBe('specialized');
    });

    it('rejects an invalid school slug with uppercase or spaces or special chars', () => {
      expect(() =>
        SchoolInputSchema.parse({
          name: 'Test Maktab',
          code: 'TM-01',
          slug: 'Urganch 1 Maktab!', // Invalid characters
          districtId: 'dist-1',
          districtName: 'Urganch',
          directorName: 'Direktor',
          contactPhone: '123456789',
        })
      ).toThrow();
    });

    it('validates SchoolRecord with student and teacher counts', () => {
      const record = {
        id: 'sch-101',
        name: 'Xiva 2-sonli maktab',
        code: 'XIV-02',
        slug: 'xiva-2-maktab',
        districtId: 'dist-xiva-shahar',
        districtName: 'Xiva shahri',
        directorName: 'Madaminova O.',
        contactPhone: '+998623751234',
        studentCount: 450,
        teacherCount: 32,
        createdAt: '2026-11-10T10:00:00Z',
      };

      const parsed = SchoolRecordSchema.parse(record);
      expect(parsed.id).toBe('sch-101');
      expect(parsed.studentCount).toBe(450);
      expect(parsed.status).toBe('active');
    });
  });

  describe('TeacherInputSchema & TeacherRecordSchema', () => {
    it('validates a correct teacher input', () => {
      const teacher = {
        schoolId: 'sch-101',
        tenantSlug: 'urganch-1-maktab',
        fullName: 'Karimov Jasurbek Anvarovich',
        subject: 'Matematika',
        qualification: 'oliy',
        assignedClassIds: ['cls-9a', 'cls-11b'],
        phone: '+998901234567',
        email: 'jasur.karimov@school.uz',
        status: 'active',
      };

      const parsed = TeacherInputSchema.parse(teacher);
      expect(parsed.fullName).toBe('Karimov Jasurbek Anvarovich');
      expect(parsed.qualification).toBe('oliy');
      expect(parsed.assignedClassIds.length).toBe(2);
    });

    it('rejects teacher with short name or missing schoolId', () => {
      expect(() =>
        TeacherInputSchema.parse({
          schoolId: '',
          tenantSlug: '',
          fullName: 'A', // too short
          subject: 'Matematika',
          phone: '123',
        })
      ).toThrow();
    });

    it('validates TeacherRecord with assigned class names', () => {
      const record = {
        id: 'tch-01',
        schoolId: 'sch-101',
        tenantSlug: 'urganch-1-maktab',
        fullName: 'Aliyeva Gulnoza',
        subject: 'Informatika',
        phone: '+998912345678',
        assignedClassIds: ['cls-11a'],
        assignedClassNames: ['11-A sinf'],
        createdAt: '2026-11-10T10:00:00Z',
      };

      const parsed = TeacherRecordSchema.parse(record);
      expect(parsed.assignedClassNames).toContain('11-A sinf');
      expect(parsed.qualification).toBe('mutaxassis');
    });
  });

  describe('StudentInputSchema & StudentRecordSchema', () => {
    it('validates a valid student with YYYY-MM-DD birthdate', () => {
      const student = {
        tenantSlug: 'urganch-1-maktab',
        schoolId: 'sch-101',
        classGroupId: 'cls-9a',
        className: '9-A',
        firstName: 'Dilshodbek',
        lastName: 'O\'ktamov',
        gender: 'M',
        birthDate: '2010-04-22',
        status: 'eligible',
      };

      const parsed = StudentInputSchema.parse(student);
      expect(parsed.firstName).toBe('Dilshodbek');
      expect(parsed.gender).toBe('M');
      expect(parsed.status).toBe('eligible');
    });

    it('rejects malformed birthDate formats like DD.MM.YYYY', () => {
      expect(() =>
        StudentInputSchema.parse({
          tenantSlug: 'urganch-1-maktab',
          schoolId: 'sch-101',
          classGroupId: 'cls-9a',
          className: '9-A',
          firstName: 'Dilshodbek',
          lastName: 'O\'ktamov',
          gender: 'M',
          birthDate: '22.04.2010', // Invalid format
        })
      ).toThrow();
    });

    it('validates StudentRecord with auto-assigned rosterCode and fullName', () => {
      const record = {
        id: 'stu-501',
        rosterCode: 'STU-1250',
        fullName: 'O\'ktamov Dilshodbek',
        tenantSlug: 'urganch-1-maktab',
        schoolId: 'sch-101',
        classGroupId: 'cls-9a',
        className: '9-A',
        firstName: 'Dilshodbek',
        lastName: 'O\'ktamov',
        gender: 'M',
        birthDate: '2010-04-22',
        createdAt: '2026-11-10T10:00:00Z',
      };

      const parsed = StudentRecordSchema.parse(record);
      expect(parsed.rosterCode).toBe('STU-1250');
      expect(parsed.fullName).toBe('O\'ktamov Dilshodbek');
    });
  });

  describe('ClassGroupInputSchema & ClassGroupRecordSchema', () => {
    it('validates a valid class group', () => {
      const classInput = {
        schoolId: 'sch-101',
        tenantSlug: 'urganch-1-maktab',
        name: '10-B',
        gradeLevel: 10,
        shift: 1,
        academicYear: '2026-2027',
      };

      const parsed = ClassGroupInputSchema.parse(classInput);
      expect(parsed.name).toBe('10-B');
      expect(parsed.gradeLevel).toBe(10);
      expect(parsed.shift).toBe(1);
    });

    it('rejects invalid gradeLevel outside 1-11 range', () => {
      expect(() =>
        ClassGroupInputSchema.parse({
          schoolId: 'sch-101',
          tenantSlug: 'urganch-1-maktab',
          name: '12-A',
          gradeLevel: 12, // Invalid
        })
      ).toThrow();
    });

    it('validates ClassGroupRecord with student count', () => {
      const record = {
        id: 'cls-10b',
        schoolId: 'sch-101',
        tenantSlug: 'urganch-1-maktab',
        name: '10-B',
        gradeLevel: 10,
        studentCount: 34,
        createdAt: '2026-11-10T10:00:00Z',
      };

      const parsed = ClassGroupRecordSchema.parse(record);
      expect(parsed.studentCount).toBe(34);
    });
  });
});

