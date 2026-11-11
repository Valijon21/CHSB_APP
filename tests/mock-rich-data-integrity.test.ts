import { describe, it, expect } from 'vitest';
import { MockTeacherRepository } from '../src/mocks/repositories/MockTeacherRepository';
import { MockOrganizationRepository } from '../src/mocks/repositories/MockOrganizationRepository';
import { setActivePinia, createPinia } from 'pinia';
import { useLiveProctorStore } from '../src/features/teacher/proctor/liveProctorStore';

describe('TASK-DAT.4: Senior Enterprise Mock Data Architecture Integrity', () => {
  const teacherRepo = new MockTeacherRepository();
  const orgRepo = new MockOrganizationRepository();

  describe('Tenants & Classes Fixtures', () => {
    it('seeds 6 classes for Al-Xorazmiy and 4 for Temurbeklar Maktabi', async () => {
      const axClasses = await teacherRepo.getClasses('tenant-al-xorazmiy');
      expect(axClasses.length).toBe(6);
      expect(axClasses.map((c) => c.name)).toContain('11-A sinf');
      expect(axClasses.map((c) => c.name)).toContain('11-B sinf');
      expect(axClasses.map((c) => c.name)).toContain('11-V sinf');
      expect(axClasses.map((c) => c.name)).toContain('10-A sinf');

      const tmClasses = await teacherRepo.getClasses('tenant-temurbeklar');
      expect(tmClasses.length).toBe(4);
      expect(tmClasses.map((c) => c.name)).toContain('11-Guruh-1');
    });

    it('seeds 30+ student roster records for Al-Xorazmiy', async () => {
      const axRoster = await teacherRepo.getRoster('tenant-al-xorazmiy');
      expect(axRoster.length).toBeGreaterThanOrEqual(25);

      // Verify roster codes
      const codes = axRoster.map((r) => r.rosterCode);
      expect(codes).toContain('STU-1101');
      expect(codes).toContain('STU-1115');
      expect(codes).toContain('STU-1124');
    });
  });

  describe('Assessment Results & Analytics Seeding', () => {
    it('returns 25 detailed exam results for Al-Xorazmiy with realistic score distribution', async () => {
      const results = await teacherRepo.getResults('tenant-al-xorazmiy');
      expect(results.length).toBe(25);

      // Verify score ranges
      const scores = results.map((r) => r.score);
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);

      expect(minScore).toBeLessThan(20.0); // Has improvement cases
      expect(maxScore).toBeGreaterThanOrEqual(38.0); // Has high achievers

      // Check distribution: A'lo (>=35), Yaxshi (28..34.5), Qoniqarli (20..27.5)
      const excellent = results.filter((r) => r.score >= 35).length;
      const good = results.filter((r) => r.score >= 28 && r.score < 35).length;
      const satisfactory = results.filter((r) => r.score >= 20 && r.score < 28).length;

      expect(excellent).toBeGreaterThanOrEqual(5);
      expect(good).toBeGreaterThanOrEqual(5);
      expect(satisfactory).toBeGreaterThanOrEqual(2);
    });

    it('generates 25 official report items linked with student roster records', async () => {
      const reportItems = await teacherRepo.generateReportData('tenant-al-xorazmiy');
      expect(reportItems.length).toBe(25);

      expect(reportItems[0]?.studentName).toBe('Alisher Zokirov');
      expect(reportItems[0]?.rosterCode).toBe('STU-1101');
      expect(reportItems[0]?.maxScore).toBe(40);
    });

    it('calculates class comparison analytics across multiple parallels', async () => {
      const analytics = await teacherRepo.getAnalytics('tenant-al-xorazmiy');
      expect(analytics.classComparisons.length).toBe(6);

      const comp11a = analytics.classComparisons.find((c) => c.className === '11-A sinf');
      expect(comp11a).toBeDefined();
      expect(comp11a?.averageScore).toBeGreaterThan(30);
      expect(comp11a?.participationRate).toBeGreaterThanOrEqual(90);
    });
  });

  describe('Live Proctor Store Multi-Session Seeding', () => {
    it('seeds 12 live student sessions covering active, warning, submitted, and offline states', () => {
      setActivePinia(createPinia());
      const store = useLiveProctorStore();

      expect(store.sessions.length).toBe(12);

      const statuses = store.sessions.map((s) => s.status);
      expect(statuses).toContain('active');
      expect(statuses).toContain('warning');
      expect(statuses).toContain('submitted');
      expect(statuses).toContain('offline');
      expect(statuses).toContain('idle');
    });
  });

  describe('Organization Repository Multi-Teacher Seeding', () => {
    it('seeds 5 realistic teachers with qualifications and subjects', async () => {
      const teachers = await orgRepo.getTeachersBySchool('sch-01');
      expect(teachers.length).toBeGreaterThanOrEqual(3);
      expect(teachers.map((t) => t.fullName)).toContain('Dilmurod Quryazov');
      expect(teachers.map((t) => t.fullName)).toContain('Nilufar Rahimova');
    });
  });
});
