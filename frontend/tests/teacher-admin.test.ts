import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTeacherStore } from '../src/features/teacher/teacherStore';

describe('Phase 5 — Teacher Workspace Enterprise Architecture', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('Teacher Overview & Classes', () => {
    it('loads classes, roster, assessments, and results for Tenant 1 (Al-Xorazmiy)', async () => {
      const store = useTeacherStore();
      const success = await store.loadTeacherData('tenant-al-xorazmiy');

      expect(success).toBe(true);
      expect(store.classes.length).toBe(6);
      expect(store.classes.map((c) => c.name)).toContain('11-A sinf');
      expect(store.classes.map((c) => c.name)).toContain('11-B sinf');

      expect(store.totalRosterCount).toBe(28);
      expect(store.assessments.length).toBe(1);
      expect(store.results.length).toBe(25);
      expect(store.averageScore).toBeGreaterThanOrEqual(30);
    });

    it('filters roster by selected class group and instant search', async () => {
      const store = useTeacherStore();
      await store.loadTeacherData('tenant-al-xorazmiy');

      expect(store.filteredRoster.length).toBe(28); // All classes

      store.selectClass('class-ax-11a');
      expect(store.filteredRoster.length).toBe(11);
      expect(store.filteredRoster.every((r) => r.classGroupId === 'class-ax-11a')).toBe(true);

      // Search within class
      store.setSearchQuery('Alisher');
      expect(store.filteredRoster.length).toBe(1);
      expect(store.filteredRoster[0]?.firstName).toBe('Alisher');

      // Clear search
      store.setSearchQuery('');
      expect(store.filteredRoster.length).toBe(11);

      store.selectClass(null);
      expect(store.filteredRoster.length).toBe(28);
    });
  });

  describe('Class & Student Detail Modules', () => {
    it('loads class detail and verifies roster and participation metrics', async () => {
      const store = useTeacherStore();
      const ok = await store.loadClassDetail('tenant-al-xorazmiy', 'class-ax-11a');

      expect(ok).toBe(true);
      expect(store.classDetail).not.toBeNull();
      expect(store.classDetail?.classGroup.name).toBe('11-A sinf');
      expect(store.classDetail?.students.length).toBe(11);
      expect(store.classDetail?.averageScore).toBeGreaterThanOrEqual(30);
      expect(store.classDetail?.participationRate).toBeGreaterThan(0);
    });

    it('loads student detail and checks profile metrics and test history', async () => {
      const store = useTeacherStore();
      const ok = await store.loadStudentDetail('tenant-al-xorazmiy', 'rec-ax-101');

      expect(ok).toBe(true);
      expect(store.studentDetail).not.toBeNull();
      expect(store.studentDetail?.roster.firstName).toBe('Alisher');
      expect(store.studentDetail?.className).toBe('11-A sinf');
      expect(store.studentDetail?.attendanceRate).toBe(98);
      expect(store.studentDetail?.results.length).toBe(1);
      expect(store.studentDetail?.results[0]?.score).toBe(35);
    });
  });

  describe('Assessments & Analytics Modules', () => {
    it('loads assessment detail and checks 15 questions cognitive levels breakdown', async () => {
      const store = useTeacherStore();
      const ok = await store.loadAssessmentDetail('tenant-al-xorazmiy', 'chsb-inf-11-q1');

      expect(ok).toBe(true);
      expect(store.assessmentDetail).not.toBeNull();
      expect(store.assessmentDetail?.questionStats.length).toBe(15);
      expect(store.assessmentDetail?.questionStats[0]?.cognitiveLevel).toBe('(B)');
      expect(store.assessmentDetail?.questionStats[10]?.cognitiveLevel).toBe('(M)');
    });

    it('loads analytics with class comparisons, score distributions and cognitive stats', async () => {
      const store = useTeacherStore();
      await store.loadTeacherData('tenant-al-xorazmiy');

      expect(store.analytics).not.toBeNull();
      expect(store.analytics?.classComparisons.length).toBe(6);
      expect(store.analytics?.scoreDistribution.excellent).toBeGreaterThan(0);
      expect(store.analytics?.cognitiveBreakdown.knowledge.points).toBe(17.5);
      expect(store.analytics?.cognitiveBreakdown.application.points).toBe(13.5);
      expect(store.analytics?.cognitiveBreakdown.reasoning.points).toBe(9.0);
    });
  });

  describe('Reports Generation & CSV Export', () => {
    it('generates compliant CSV data for results export', async () => {
      const store = useTeacherStore();
      await store.loadTeacherData('tenant-al-xorazmiy');

      const csv = store.exportResultsCSV();
      expect(csv).toContain('№,O\'quvchi F.I.SH.,Sinf,Roster Kodi,Imtihon,Ball,Maksimal Ball,Foiz (%),Topshirilgan Vaqt,Holati');
      expect(csv).toContain('Alisher Zokirov');
      expect(csv).toContain('35.0');
    });
  });

  describe('Teacher Profile & Cross-Tenant Isolation', () => {
    it('loads teacher profile and verifies assigned subjects and classes', async () => {
      const store = useTeacherStore();
      await store.loadTeacherData('tenant-al-xorazmiy');

      expect(store.profile).not.toBeNull();
      expect(store.profile?.fullName).toBe('Anvar Rahimov');
      expect(store.profile?.assignedSchoolName).toBe('Al-Xorazmiy IT Bosh Kampusi');
      expect(store.profile?.subjects).toContain('Informatika va axborot texnologiyalari');
    });

    it('switching tenant clears previous tenant data and loads new tenant cleanly', async () => {
      const store = useTeacherStore();
      await store.loadTeacherData('tenant-al-xorazmiy');
      expect(store.classes.map((c) => c.name)).toContain('11-A sinf');

      // Switch to Tenant 2 (Temurbeklar)
      await store.loadTeacherData('tenant-temurbeklar');

      expect(store.classes.map((c) => c.name)).not.toContain('11-A sinf');
      expect(store.classes.map((c) => c.name)).toContain('11-Guruh-1');
      expect(store.classes.map((c) => c.name)).toContain('11-Guruh-2');

      // Roster and profile must strictly belong to Tenant 2
      expect(store.roster.every((r) => r.tenantId === 'tenant-temurbeklar')).toBe(true);
      expect(store.results.every((r) => r.tenantId === 'tenant-temurbeklar')).toBe(true);
      expect(store.results[0]?.studentName).toBe('Sardor Rahimov');
      expect(store.profile?.fullName).toBe('Farrux Komilov');
    });
  });
});
