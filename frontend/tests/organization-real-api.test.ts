import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RealTeacherRepository, RealOrganizationRepository } from '@/shared/api/realApi';
import { httpClient } from '@/shared/api/httpClient';

describe('Real API Organization, Teacher & Profile Integration (TASK-3.1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('RealTeacherRepository.getProfile calls /auth/me instead of returning hardcoded data', async () => {
    const getSpy = vi.spyOn(httpClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/auth/me') {
        return {
          id: 'usr-real-99',
          tenantId: 'tenant-real',
          schoolName: '25-Maktab',
          username: 'real_teacher',
          fullName: 'Dilshod Olimov',
          role: 'TEACHER',
          email: 'dilshod@maktab.uz',
        };
      }
      return [];
    });

    const repo = new RealTeacherRepository();
    const profile = await repo.getProfile('tenant-real');

    expect(getSpy).toHaveBeenCalledWith('/auth/me');
    expect(profile.id).toBe('usr-real-99');
    expect(profile.fullName).toBe('Dilshod Olimov');
    expect(profile.assignedSchoolName).toBe('25-Maktab');
  });

  it('RealOrganizationRepository routes CRUD calls to /schools, /teachers, and /students/:id', async () => {
    const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({ id: 'created-1' });
    const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue([]);
    const patchSpy = vi.spyOn(httpClient, 'patch').mockResolvedValue({ id: 'upd-1' });
    const delSpy = vi.spyOn(httpClient, 'delete').mockResolvedValue({ success: true });

    const org = new RealOrganizationRepository();
    await org.getAllSchools();
    expect(getSpy).toHaveBeenCalledWith('/schools');

    await org.getTeachersBySchool('al-xorazmiy');
    expect(getSpy).toHaveBeenCalledWith('/teachers', { params: { tenantSlug: 'al-xorazmiy' } });

    await org.createTeacher({
      schoolId: 'sch-1',
      tenantSlug: 'al-xorazmiy',
      fullName: 'Test Teacher',
      subject: 'INF',
      qualification: 'oliy',
      assignedClassIds: [],
      phone: '+998901234567',
      email: 'test@uz',
      status: 'active',
    });
    expect(postSpy).toHaveBeenCalledWith('/teachers', expect.any(Object));

    await org.updateStudent('stu-1', { firstName: 'Updated' });
    expect(patchSpy).toHaveBeenCalledWith('/students/stu-1', { firstName: 'Updated' });

    const removed = await org.deleteTeacher('tch-1');
    expect(delSpy).toHaveBeenCalledWith('/teachers/tch-1');
    expect(removed).toBe(true);
  });
});

