import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNetworkStatus } from '../src/shared/composables/useNetworkStatus';
import { generateOfflineVerificationHash } from '../src/shared/utils/offlineHash';
import { offlineStorage, type QueuedSubmission } from '../src/shared/storage/indexedDbAdapter';
import { useAssessmentStore } from '../src/features/assessment/assessmentStore';
import { api } from '../src/shared/api';
import type { Assessment } from '../src/entities/assessment/model';

describe('Direction 3: Offline-First & Network Resilience', () => {
  describe('useNetworkStatus Composable', () => {
    it('initializes with default online status', () => {
      const net = useNetworkStatus();
      expect(net.isOnline.value).toBe(true);
      expect(net.offlineSince.value).toBeNull();
      expect(net.pendingQueueCount.value).toBe(0);
    });

    it('reacts to offline and online transitions', () => {
      const net = useNetworkStatus();

      net.handleOffline();
      expect(net.isOnline.value).toBe(false);
      expect(net.offlineSince.value).not.toBeNull();

      net.handleOnline();
      expect(net.isOnline.value).toBe(true);
      expect(net.reconnectedAt.value).not.toBeNull();
    });

    it('tracks pending sync queue count', () => {
      const net = useNetworkStatus();
      net.setPendingQueueCount(5);
      expect(net.pendingQueueCount.value).toBe(5);

      net.setPendingQueueCount(-1);
      expect(net.pendingQueueCount.value).toBe(0); // Non-negative clamp
    });
  });

  describe('Emergency Offline Verification Hash Generator', () => {
    const timestamp = '2026-11-06T12:00:00.000Z';
    const answers = { 'q-1': 'A', 'q-2': 'B', 'q-3': 'C' };

    it('generates a formatted 16-character verification token', () => {
      const hash = generateOfflineVerificationHash('student-1', 'assessment-1', answers, timestamp);

      expect(hash).toMatch(/^CHSB-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
    });

    it('is completely deterministic for identical parameters', () => {
      const hash1 = generateOfflineVerificationHash('student-1', 'assessment-1', answers, timestamp);
      const hash2 = generateOfflineVerificationHash('student-1', 'assessment-1', answers, timestamp);

      expect(hash1).toBe(hash2);
    });

    it('is order-independent for answer keys', () => {
      const answersA = { 'q-1': 'A', 'q-2': 'B' };
      const answersB = { 'q-2': 'B', 'q-1': 'A' };

      const hashA = generateOfflineVerificationHash('student-1', 'assessment-1', answersA, timestamp);
      const hashB = generateOfflineVerificationHash('student-1', 'assessment-1', answersB, timestamp);

      expect(hashA).toBe(hashB);
    });

    it('produces different codes if answers or student differ', () => {
      const hash1 = generateOfflineVerificationHash('student-1', 'assessment-1', answers, timestamp);
      const hash2 = generateOfflineVerificationHash('student-2', 'assessment-1', answers, timestamp);
      const hash3 = generateOfflineVerificationHash(
        'student-1',
        'assessment-1',
        { 'q-1': 'D', 'q-2': 'B', 'q-3': 'C' },
        timestamp
      );

      expect(hash1).not.toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });
  });

  describe('OfflineStorageAdapter (IndexedDB / Memory fallback)', () => {
    beforeEach(async () => {
      await offlineStorage.clearAll();
    });

    it('caches and retrieves assessment data offline', async () => {
      const sampleAssessment: Assessment = {
        id: 'test-chsb-offline',
        tenantId: 'tenant-test',
        title: 'Offline Test Exam',
        subject: 'Informatika',
        grade: 11,
        quarter: 1,
        assessmentNumber: 1,
        durationMinutes: 40,
        durationSeconds: 2400,
        questionCount: 1,
        maxScore: 10,
        status: 'available',
        questions: [],
      };

      await offlineStorage.cacheAssessment(sampleAssessment);
      const retrieved = await offlineStorage.getCachedAssessment('test-chsb-offline');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe('test-chsb-offline');
      expect(retrieved?.title).toBe('Offline Test Exam');
    });

    it('saves and restores drafts seamlessly', async () => {
      const draftKey = 'draft_tenant_exam_student';
      const answers = { 'q-1': 'B', 'q-2': 'D' };

      await offlineStorage.saveDraft(draftKey, answers);
      const saved = await offlineStorage.getDraft(draftKey);

      expect(saved).toEqual(answers);
    });

    it('manages submission sync queue (enqueue, list, dequeue)', async () => {
      const item: QueuedSubmission = {
        id: 'queue-1001',
        tenantId: 'tenant-test',
        attemptId: 'attempt-1001',
        assessmentId: 'chsb-inf-11-q1',
        studentId: 'student-99',
        answers: { 'q-1': 'C' },
        offlineHash: 'CHSB-1111-2222-3333',
        enqueuedAt: new Date().toISOString(),
        synced: false,
      };

      await offlineStorage.enqueueSubmission(item);
      const queueBefore = await offlineStorage.getQueuedSubmissions();
      expect(queueBefore).toHaveLength(1);
      expect(queueBefore[0]?.id).toBe('queue-1001');

      await offlineStorage.dequeueSubmission('queue-1001');
      const queueAfter = await offlineStorage.getQueuedSubmissions();
      expect(queueAfter).toHaveLength(0);
    });
  });

  describe('Assessment Store Integration: Offline Recovery & Fallback', () => {
    beforeEach(() => {
      setActivePinia(createPinia());
      vi.restoreAllMocks();
    });

    afterEach(async () => {
      await offlineStorage.clearAll();
    });

    it('enqueues submission and generates offline receipt when network drops', async () => {
      const store = useAssessmentStore();
      await store.startAssessment('tenant-al-xorazmiy', 'chsb-inf-11-q1', 'rec-ax-101');
      store.selectAnswer('q-1', 'A');

      // Mock submitAttempt throwing network failure
      const submitSpy = vi.spyOn(api.attempt, 'submitAttempt').mockRejectedValueOnce(
        new Error('Failed to fetch (Network offline)')
      );

      const ok = await store.submitAssessment('tenant-al-xorazmiy');

      expect(ok).toBe(true); // Graceful offline handling
      expect(store.receipt).not.toBeNull();
      expect(store.receipt?.status).toBe('received_demo');
      expect(store.receipt?.receiptCode).toMatch(/^CHSB-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
      expect(store.offlineEmergencyCode).toBe(store.receipt?.receiptCode);

      // Verify that the submission was added to offlineStorage queue
      const queued = await offlineStorage.getQueuedSubmissions();
      expect(queued).toHaveLength(1);
      expect(queued[0]?.offlineHash).toBe(store.receipt?.receiptCode);

      submitSpy.mockRestore();
    });

    it('drains queued submissions when syncQueuedSubmissions is triggered', async () => {
      const store = useAssessmentStore();
      const createdAttempt = await api.attempt.createAttempt(
        'tenant-al-xorazmiy',
        'chsb-inf-11-q1',
        'rec-1'
      );

      await offlineStorage.enqueueSubmission({
        id: 'q-sync-1',
        tenantId: 'tenant-al-xorazmiy',
        attemptId: createdAttempt.id,
        assessmentId: 'chsb-inf-11-q1',
        studentId: 'rec-1',
        answers: { 'q-1': 'B' },
        offlineHash: 'CHSB-AAAA-BBBB-CCCC',
        enqueuedAt: new Date().toISOString(),
        synced: false,
      });

      const synced = await store.syncQueuedSubmissions('tenant-al-xorazmiy');
      expect(synced).toBe(1);

      const remaining = await offlineStorage.getQueuedSubmissions();
      expect(remaining).toHaveLength(0);
    });
  });
});
