import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RealOrganizationRepository } from '../src/shared/api/realApi';
import { httpClient } from '../src/shared/api/httpClient';

describe('RealOrganizationRepository bulk import & class group resilience', () => {
  const repo = new RealOrganizationRepository();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('includes className in bulkCreateStudents payload for backend fallback resolution', async () => {
    const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValueOnce([]);

    await repo.bulkCreateStudents([
      {
        tenantSlug: 'al-xorazmiy',
        schoolId: 'school-ax-1',
        classGroupId: 'class-ax-11a',
        className: '11-A sinf',
        firstName: 'Nurhayit',
        lastName: 'Ergashev',
        gender: 'M',
        birthDate: '2009-01-01',
        status: 'eligible',
        group: '1-guruh',
        emaktabId: '1000001090005',
      },
    ]);

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledWith(
      '/students/bulk',
      expect.arrayContaining([
        expect.objectContaining({
          classGroupId: 'class-ax-11a',
          className: '11-A sinf',
          firstName: 'Nurhayit',
          lastName: 'Ergashev',
        }),
      ])
    );
  });

  it('rethrows backend errors in createClassGroup instead of returning a fake client ID', async () => {
    vi.spyOn(httpClient, 'post').mockRejectedValueOnce(new Error('HTTP 500'));

    await expect(
      repo.createClassGroup({
        schoolId: 'school-ax-1',
        tenantSlug: 'al-xorazmiy',
        name: '11-A sinf',
        gradeLevel: 11,
        shift: 1,
        academicYear: '2026-2027',
      })
    ).rejects.toThrow('HTTP 500');
  });
});
