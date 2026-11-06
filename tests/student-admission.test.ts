import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTenantStore } from '../src/features/tenant-context/tenantStore';
import { useStudentAdmissionStore } from '../src/features/student-admission/admissionStore';

describe('Phase 3 — Student Roster Admission Flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('useTenantStore', () => {
    it('loads active tenant by slug', async () => {
      const tenantStore = useTenantStore();
      const success = await tenantStore.loadTenant('al-xorazmiy');

      expect(success).toBe(true);
      expect(tenantStore.currentTenant?.tenantSlug).toBe('al-xorazmiy');
      expect(tenantStore.currentTenant?.status).toBe('active');
      expect(tenantStore.error).toBeNull();
    });

    it('sets error for invalid tenant slug', async () => {
      const tenantStore = useTenantStore();
      const success = await tenantStore.loadTenant('unknown-school');

      expect(success).toBe(false);
      expect(tenantStore.currentTenant).toBeNull();
      expect(tenantStore.error).toContain('topilmadi');
    });

    it('clears tenant context', async () => {
      const tenantStore = useTenantStore();
      await tenantStore.loadTenant('al-xorazmiy');
      tenantStore.clearTenant();

      expect(tenantStore.currentTenant).toBeNull();
      expect(tenantStore.error).toBeNull();
    });
  });

  describe('useStudentAdmissionStore', () => {
    it('rejects empty roster code with validation message', async () => {
      const admissionStore = useStudentAdmissionStore();
      const success = await admissionStore.lookup('al-xorazmiy', '   ');

      expect(success).toBe(false);
      expect(admissionStore.status).toBe('error');
      expect(admissionStore.errorMessage).toContain('kiriting');
    });

    it('successfully matches valid roster code STU-1101', async () => {
      const admissionStore = useStudentAdmissionStore();
      const success = await admissionStore.lookup('al-xorazmiy', 'STU-1101');

      expect(success).toBe(true);
      expect(admissionStore.status).toBe('match_found');
      expect(admissionStore.currentMatch?.displayName).toBe('Alisher Zokirov');
      expect(admissionStore.currentMatch?.className).toBe('11-A sinf');
      expect(admissionStore.errorMessage).toBeNull();
    });

    it('confirms identity and sets admitted status', async () => {
      const admissionStore = useStudentAdmissionStore();
      await admissionStore.lookup('al-xorazmiy', 'STU-1101');

      const confirmed = admissionStore.confirmIdentity();
      expect(confirmed).toBe(true);
      expect(admissionStore.status).toBe('admitted');
      expect(admissionStore.confirmedStudent?.displayName).toBe('Alisher Zokirov');
      expect(admissionStore.activeAssessmentId).toBe('chsb-inf-11-q1');
    });

    it('rejects inactive roster code STU-1103 with explanation', async () => {
      const admissionStore = useStudentAdmissionStore();
      const success = await admissionStore.lookup('al-xorazmiy', 'STU-1103');

      expect(success).toBe(false);
      expect(admissionStore.status).toBe('error');
      expect(admissionStore.errorMessage).toContain('faol emas');
      expect(admissionStore.currentMatch).toBeNull();
    });

    it('rejects cross-tenant lookup (STU-1101 under temurbeklar-maktabi)', async () => {
      const admissionStore = useStudentAdmissionStore();
      const success = await admissionStore.lookup('temurbeklar-maktabi', 'STU-1101');

      expect(success).toBe(false);
      expect(admissionStore.status).toBe('error');
      expect(admissionStore.errorMessage).toBe("Ma'lumotlar mos kelmadi.");
    });
  });
});
