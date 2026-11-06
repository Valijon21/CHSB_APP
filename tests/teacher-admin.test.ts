import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTeacherStore } from '../src/features/teacher/teacherStore';

describe('Phase 5 — Teacher and Tenant Admin Portal', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('useTeacherStore', () => {
    it('loads classes, roster, assessments, and results for Tenant 1 (Al-Xorazmiy)', async () => {
      const store = useTeacherStore();
      const success = await store.loadTeacherData('tenant-al-xorazmiy');

      expect(success).toBe(true);
      expect(store.classes.length).toBe(2);
      expect(store.classes.map((c) => c.name)).toContain('11-A sinf');
      expect(store.classes.map((c) => c.name)).toContain('11-B sinf');

      expect(store.totalRosterCount).toBe(4);
      expect(store.assessments.length).toBe(1);
      expect(store.results.length).toBe(2);
      expect(store.averageScore).toBe(36.3); // (35 + 37.5) / 2 = 36.25 -> 36.3
    });

    it('filters roster by selected class group', async () => {
      const store = useTeacherStore();
      await store.loadTeacherData('tenant-al-xorazmiy');

      expect(store.filteredRoster.length).toBe(4); // All classes

      store.selectClass('class-ax-11a');
      expect(store.filteredRoster.length).toBe(3);
      expect(store.filteredRoster.every((r) => r.classGroupId === 'class-ax-11a')).toBe(true);

      store.selectClass('class-ax-11b');
      expect(store.filteredRoster.length).toBe(1);
      expect(store.filteredRoster[0]?.rosterCode).toBe('STU-1103');

      store.selectClass(null);
      expect(store.filteredRoster.length).toBe(4);
    });

    it('switching tenant clears previous tenant data and loads new tenant cleanly', async () => {
      const store = useTeacherStore();
      await store.loadTeacherData('tenant-al-xorazmiy');
      expect(store.classes.map((c) => c.name)).toContain('11-A sinf');

      // Switch to Tenant 2
      await store.loadTeacherData('tenant-temurbeklar');

      expect(store.classes.map((c) => c.name)).not.toContain('11-A sinf');
      expect(store.classes.map((c) => c.name)).toContain('11-Guruh-1');
      expect(store.classes.map((c) => c.name)).toContain('11-Guruh-2');

      // Roster must only belong to Tenant 2
      expect(store.roster.every((r) => r.tenantId === 'tenant-temurbeklar')).toBe(true);
      expect(store.results.every((r) => r.tenantId === 'tenant-temurbeklar')).toBe(true);
      expect(store.results[0]?.studentName).toBe('Sardor Rahimov');
    });
  });
});
