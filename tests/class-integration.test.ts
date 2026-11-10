import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useOrganizationStore } from '../src/features/organization/store/organizationStore';
import type { ClassGroupInput, StudentInput } from '../src/entities/organization/model';

describe('TASK-CLS.4: Class Management End-to-End Integration Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('creates a new class group and allows assigning students to it', async () => {
    const orgStore = useOrganizationStore();
    await orgStore.loadSchoolContext('al-xorazmiy');

    // 1. Create a brand new class group
    const classInput: ClassGroupInput = {
      schoolId: 'sch-01',
      tenantSlug: 'al-xorazmiy',
      name: '7-G',
      gradeLevel: 7,
      shift: 2,
      academicYear: '2026-2027',
    };

    const newClass = await orgStore.createClassGroup(classInput);
    expect(newClass.id).toBeDefined();
    expect(newClass.name).toBe('7-G');
    expect(orgStore.classGroups.some((c) => c.name === '7-G')).toBe(true);

    // 2. Create student in the newly created class
    const studentInput: StudentInput = {
      tenantSlug: 'al-xorazmiy',
      schoolId: 'sch-01',
      classGroupId: newClass.id,
      className: newClass.name,
      firstName: 'Akrom',
      lastName: 'Ergashev',
      gender: 'M',
      birthDate: '2012-04-18',
      status: 'eligible',
    };

    const student = await orgStore.createStudent(studentInput);
    expect(student.id).toBeDefined();
    expect(student.classGroupId).toBe(newClass.id);
    expect(student.className).toBe('7-G');
    expect(student.rosterCode).toMatch(/^STU-\d{4}$/);

    // 3. Verify in student list
    const foundStudent = orgStore.students.find((s) => s.id === student.id);
    expect(foundStudent).toBeDefined();
    expect(foundStudent?.className).toBe('7-G');
  });
});

