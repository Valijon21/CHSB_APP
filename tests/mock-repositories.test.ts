import { describe, it, expect } from 'vitest';
import { MockTenantRepository } from './mocks/repositories/MockTenantRepository';
import { MockRosterRepository } from './mocks/repositories/MockRosterRepository';
import { MockAssessmentRepository } from './mocks/repositories/MockAssessmentRepository';
import { MockAttemptRepository } from './mocks/repositories/MockAttemptRepository';
import { MockTeacherRepository } from './mocks/repositories/MockTeacherRepository';

describe('Mock Repositories and Tenant Isolation', () => {
  const tenantRepo = new MockTenantRepository();
  const rosterRepo = new MockRosterRepository();
  const assessmentRepo = new MockAssessmentRepository();
  const attemptRepo = new MockAttemptRepository();
  const teacherRepo = new MockTeacherRepository();

  describe('Tenant Public Discovery', () => {
    it('finds active tenant by valid slug', async () => {
      const ctx = await tenantRepo.getPublicContextBySlug('al-xorazmiy');
      expect(ctx).not.toBeNull();
      expect(ctx?.tenantId).toBe('tenant-al-xorazmiy');
      expect(ctx?.status).toBe('active');
    });

    it('returns null for nonexistent tenant slug', async () => {
      const ctx = await tenantRepo.getPublicContextBySlug('nonexistent-school');
      expect(ctx).toBeNull();
    });
  });

  describe('Roster Admission Scenarios', () => {
    it('returns success for valid eligible roster code', async () => {
      const res = await rosterRepo.lookup({
        tenantSlug: 'al-xorazmiy',
        rosterCode: 'STU-1101',
      });
      expect(res.status).toBe('success');
      if (res.status === 'success') {
        expect(res.match.displayName).toBe('Alisher Zokirov');
        expect(res.match.className).toBe('11-A sinf');
        expect(res.match.eligibilityStatus).toBe('eligible');
      }
    });

    it('returns inactive for inactive roster code', async () => {
      const res = await rosterRepo.lookup({
        tenantSlug: 'al-xorazmiy',
        rosterCode: 'STU-1103',
      });
      expect(res.status).toBe('inactive');
      if (res.status === 'inactive') {
        expect(res.message).toContain('faol emas');
      }
    });

    it('returns ambiguous for ambiguous match', async () => {
      const res = await rosterRepo.lookup({
        tenantSlug: 'al-xorazmiy',
        rosterCode: 'AMBIGUOUS-CODE',
      });
      expect(res.status).toBe('ambiguous');
    });

    it('returns generic not_found for invalid code without leaking student existence', async () => {
      const res = await rosterRepo.lookup({
        tenantSlug: 'al-xorazmiy',
        rosterCode: 'FAKE-999',
      });
      expect(res.status).toBe('not_found');
      if (res.status === 'not_found') {
        expect(res.message).toBe("Ma'lumotlar mos kelmadi.");
      }
    });
  });

  describe('STRICT CROSS-TENANT ISOLATION', () => {
    it('Tenant A student code cannot be admitted under Tenant B', async () => {
      // STU-1101 belongs to al-xorazmiy
      const res = await rosterRepo.lookup({
        tenantSlug: 'temurbeklar-maktabi', // Wrong tenant!
        rosterCode: 'STU-1101',
      });
      expect(res.status).toBe('not_found');
    });

    it('Tenant B student code cannot be admitted under Tenant A', async () => {
      // TM-201 belongs to temurbeklar-maktabi
      const res = await rosterRepo.lookup({
        tenantSlug: 'al-xorazmiy', // Wrong tenant!
        rosterCode: 'TM-201',
      });
      expect(res.status).toBe('not_found');
    });

    it('Tenant A attempt cannot be accessed with Tenant B tenantId', async () => {
      const attempt = await attemptRepo.createAttempt(
        'tenant-al-xorazmiy',
        'chsb-inf-11-q1',
        'rec-ax-101'
      );

      // Access with correct tenant
      const foundCorrect = await attemptRepo.getAttemptById('tenant-al-xorazmiy', attempt.id);
      expect(foundCorrect).not.toBeNull();
      expect(foundCorrect?.id).toBe(attempt.id);

      // Access with mismatched tenant
      const foundWrong = await attemptRepo.getAttemptById('tenant-temurbeklar', attempt.id);
      expect(foundWrong).toBeNull();
    });

    it('Teacher view only returns classes for current tenant', async () => {
      const classesAx = await teacherRepo.getClasses('tenant-al-xorazmiy');
      const classesTm = await teacherRepo.getClasses('tenant-temurbeklar');

      expect(classesAx.every((c) => c.tenantId === 'tenant-al-xorazmiy')).toBe(true);
      expect(classesTm.every((c) => c.tenantId === 'tenant-temurbeklar')).toBe(true);
      expect(classesAx.some((c) => c.name === '11-Guruh-1')).toBe(false);
    });
  });

  describe('Assessment Content and Security Invariants', () => {
    it('assessment has exactly 15 questions and 40 points', async () => {
      const assessment = await assessmentRepo.getAssessmentById('tenant-al-xorazmiy', 'chsb-inf-11-q1');
      expect(assessment).not.toBeNull();
      expect(assessment?.questions.length).toBe(15);
      expect(assessment?.maxScore).toBe(40);
      expect(assessment?.durationMinutes).toBe(40);
      expect(assessment?.durationSeconds).toBe(2400);

      const totalPoints = assessment?.questions.reduce((sum, q) => sum + q.points, 0);
      expect(totalPoints).toBe(40);
    });

    it('NEVER contains correct answers or answer keys in student payload', async () => {
      const assessment = await assessmentRepo.getAssessmentById('tenant-al-xorazmiy', 'chsb-inf-11-q1');
      for (const q of assessment!.questions) {
        const item = q as Record<string, unknown>;
        // Assert no answer secrets exist on question
        expect(item.correctOptionId).toBeUndefined();
        expect(item.answer).toBeUndefined();
        expect(item.key).toBeUndefined();
        expect(item.scoringSecret).toBeUndefined();
      }
    });

    it('supports idempotent submission', async () => {
      const attempt = await attemptRepo.createAttempt('tenant-al-xorazmiy', 'chsb-inf-11-q1', 'rec-ax-101');
      const key = 'idem-key-123';

      const receipt1 = await attemptRepo.submitAttempt('tenant-al-xorazmiy', attempt.id, key);
      const receipt2 = await attemptRepo.submitAttempt('tenant-al-xorazmiy', attempt.id, key);

      expect(receipt1.status).toBe('received_demo');
      expect(receipt1.attemptId).toBe(receipt2.attemptId);
      expect(receipt1.submittedAt).toBe(receipt2.submittedAt);
    });
  });
});
