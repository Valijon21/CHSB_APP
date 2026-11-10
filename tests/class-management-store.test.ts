import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { MockOrganizationRepository } from '../src/mocks/repositories/MockOrganizationRepository';
import { useOrganizationStore } from '../src/features/organization/store/organizationStore';
import { useTeacherStore } from '../src/features/teacher/teacherStore';
import type { ClassGroupInput } from '../src/entities/organization/model';

describe('TASK-CLS.1: Class Management Store & Repository Sync', () => {
  let mockRepo: MockOrganizationRepository;

  beforeEach(() => {
    setActivePinia(createPinia());
    mockRepo = new MockOrganizationRepository();
  });

  it('creates a new class group in repository with head teacher linking', async () => {
    const input: ClassGroupInput = {
      schoolId: 'sch-01',
      tenantSlug: 'al-xorazmiy',
      name: '8-B',
      gradeLevel: 8,
      shift: 2,
      academicYear: '2026-2027',
      headTeacherId: 'tch-01',
    };

    const created = await mockRepo.createClassGroup(input);
    expect(created.id).toBeDefined();
    expect(created.name).toBe('8-B');
    expect(created.gradeLevel).toBe(8);
    expect(created.shift).toBe(2);
    expect(created.headTeacherName).toBe('Dilmurod Quryazov');

    // Check teacher assigned classes updated
    const teacher = (await mockRepo.getTeachersBySchool('al-xorazmiy')).find((t) => t.id === 'tch-01');
    expect(teacher?.assignedClassNames).toContain('8-B');
  });

  it('adds class group to organizationStore re-actively', async () => {
    const orgStore = useOrganizationStore();
    await orgStore.loadSchoolContext('al-xorazmiy');

    const initialLen = orgStore.classGroups.length;

    const input: ClassGroupInput = {
      schoolId: 'sch-01',
      tenantSlug: 'al-xorazmiy',
      name: '10-V',
      gradeLevel: 10,
      shift: 1,
      academicYear: '2026-2027',
    };

    const created = await orgStore.createClassGroup(input);
    expect(orgStore.classGroups.length).toBe(initialLen + 1);
    expect(orgStore.classGroups.some((c) => c.name === '10-V')).toBe(true);
    expect(created.name).toBe('10-V');
  });

  it('updates teacherStore classes and totalClassesCount with addClass', () => {
    const teacherStore = useTeacherStore();
    expect(teacherStore.totalClassesCount).toBe(0);

    teacherStore.addClass({
      id: 'cls-new-8b',
      tenantId: 'al-xorazmiy',
      schoolId: 'sch-01',
      name: '8-B',
      grade: 8,
      academicYear: '2026-2027',
      studentCount: 0,
    });

    expect(teacherStore.totalClassesCount).toBe(1);
    expect(teacherStore.classes[0]?.name).toBe('8-B');
  });
});

