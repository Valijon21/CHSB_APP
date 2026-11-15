import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTenantStore } from '../src/features/tenant-context/tenantStore';
import { useStudentAdmissionStore } from '../src/features/student-admission/admissionStore';
import { useAssessmentStore } from '../src/features/assessment/assessmentStore';
import { useTeacherStore } from '../src/features/teacher/teacherStore';
import rawQuestions from './mocks/fixtures/raw_questions.json';
import { chsbAssessmentQuestions } from './mocks/fixtures/questions';
import { mockTenants } from './mocks/fixtures/tenants';

describe('Phase 6 — Hardening, Security, E2E and Tenant Isolation Suite', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  describe('1. Full End-to-End Synthetic Learner Journey', () => {
    it('executes admission -> verification -> assessment -> submission -> receipt workflow', async () => {
      const tenantStore = useTenantStore();
      const admissionStore = useStudentAdmissionStore();
      const assessmentStore = useAssessmentStore();

      // Step 1: Open Tenant Context
      await tenantStore.loadTenant('al-xorazmiy');
      expect(tenantStore.currentTenant?.tenantSlug).toBe('al-xorazmiy');
      expect(tenantStore.currentTenant?.displayName).toBe("Al-Xorazmiy nomidagi ixtisoslashtirilgan IT-maktab");

      // Step 2: Roster Lookup
      const lookupOk = await admissionStore.lookup('al-xorazmiy', 'STU-1101');
      expect(lookupOk).toBe(true);
      expect(admissionStore.currentMatch).not.toBeNull();
      expect(admissionStore.currentMatch?.displayName).toBe('Alisher Zokirov');
      expect(admissionStore.currentMatch?.className).toBe('11-A sinf');

      // Step 3: Identity Confirmation
      const confirmOk = admissionStore.confirmIdentity();
      expect(confirmOk).toBe(true);
      expect(admissionStore.confirmedStudent?.rosterRecordId).toBe('rec-ax-101');
      expect(admissionStore.activeAssessmentId).toBe('chsb-inf-11-q1');

      // Step 4: Start Assessment
      await assessmentStore.startAssessment(
        tenantStore.currentTenant!.tenantId,
        admissionStore.activeAssessmentId!,
        admissionStore.confirmedStudent!.rosterRecordId
      );

      expect(assessmentStore.assessment).not.toBeNull();
      expect(assessmentStore.totalQuestions).toBe(15);
      expect(assessmentStore.assessment?.maxScore).toBe(40);
      expect(assessmentStore.assessment?.durationMinutes).toBe(40);
      expect(assessmentStore.assessment?.subject).toBe('Informatika va axborot texnologiyalari');

      // Step 5: Answer All 15 Questions
      const questions = assessmentStore.assessment!.questions;
      expect(questions.length).toBe(15);

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]!;
        assessmentStore.goToQuestion(i);
        expect(assessmentStore.currentQuestionIndex).toBe(i);
        expect(assessmentStore.currentQuestion?.id).toBe(q.id);

        // Select an option (e.g. 'A')
        assessmentStore.selectAnswer(q.id, 'A');
      }

      expect(assessmentStore.answeredCount).toBe(15);
      expect(assessmentStore.unansweredCount).toBe(0);

      // Step 6: Submit Assessment
      const submitOk = await assessmentStore.submitAssessment(tenantStore.currentTenant!.tenantId);
      expect(submitOk).toBe(true);
      expect(assessmentStore.attempt).not.toBeNull();
      expect(assessmentStore.attempt?.status).toBe('submitted_demo');

      // Step 7: Receipt & Provisional Score Verification
      expect(assessmentStore.receipt).toBeDefined();
      expect(assessmentStore.receipt?.status).toBe('received_demo');
      expect(assessmentStore.receipt?.message).toContain('muvaffaqiyatli qabul qilindi');
      expect(assessmentStore.result).toBeDefined();
      expect(assessmentStore.result?.maxScore).toBe(40);
    });
  });

  describe('2. Security Invariants: Zero Answer Keys or Secret Leaks', () => {
    it('ensures raw_questions.json contains no answer keys or isCorrect markers', () => {
      const rawText = JSON.stringify(rawQuestions);
      expect(rawText).not.toContain('isCorrect');
      expect(rawText).not.toContain('correctOptionId');
      expect(rawText).not.toContain('correctAnswer');
      expect(rawText).not.toContain('answerKey');
      expect(rawText).not.toContain('secret');
    });

    it('ensures chsbAssessmentQuestions contains client-safe questions with no answers', () => {
      expect(chsbAssessmentQuestions.length).toBe(15);

      for (const q of chsbAssessmentQuestions) {
        const questionObj = q as unknown as Record<string, unknown>;
        expect(questionObj.correctOptionId).toBeUndefined();
        expect(questionObj.isCorrect).toBeUndefined();
        expect(questionObj.answerKey).toBeUndefined();

        for (const opt of q.options) {
          const optObj = opt as unknown as Record<string, unknown>;
          expect(optObj.isCorrect).toBeUndefined();
        }
      }
    });

    it('ensures student admission store never exposes raw roster secret identifiers', async () => {
      const admissionStore = useStudentAdmissionStore();
      await admissionStore.lookup('al-xorazmiy', 'STU-1101');
      const match = admissionStore.currentMatch;
      expect(match).not.toBeNull();
      // Only public, user-facing verification fields are present
      expect(Object.keys(match!).sort()).toEqual([
        'availableAssessmentIds',
        'className',
        'displayName',
        'eligibilityStatus',
        'rosterRecordId',
        'schoolName',
      ].sort());
    });
  });

  describe('3. Strict Multi-Tenant Isolation & Cache Scoping', () => {
    it('strictly isolates synthetic tenant 1 (Al-Xorazmiy) from synthetic tenant 2 (Temurbeklar)', async () => {
      const admissionStore = useStudentAdmissionStore();

      // Al-Xorazmiy student lookup in Temurbeklar must fail
      const failedLookup = await admissionStore.lookup('temurbeklar-maktabi', 'STU-1101');
      expect(failedLookup).toBe(false);
      expect(admissionStore.currentMatch).toBeNull();
      expect(admissionStore.status).toBe('error');
      expect(admissionStore.errorMessage).toBe("Ma'lumotlar mos kelmadi.");

      // Temurbeklar student lookup in Al-Xorazmiy must fail
      const failedLookup2 = await admissionStore.lookup('al-xorazmiy', 'TM-201');
      expect(failedLookup2).toBe(false);
      expect(admissionStore.currentMatch).toBeNull();
      expect(admissionStore.status).toBe('error');
      expect(admissionStore.errorMessage).toBe("Ma'lumotlar mos kelmadi.");

      // Valid lookup in own tenant works
      const successLookup = await admissionStore.lookup('temurbeklar-maktabi', 'TM-201');
      expect(successLookup).toBe(true);
      expect(admissionStore.currentMatch?.displayName).toBe('Sardor Rahimov');
      expect(admissionStore.currentMatch?.schoolName).toBe('Temurbeklar Maktabi Markaziy Kampus');
    });

    it('ensures teacher store purges all data when switching tenants', async () => {
      const teacherStore = useTeacherStore();

      await teacherStore.loadTeacherData('tenant-al-xorazmiy');
      expect(teacherStore.classes.length).toBe(6);
      expect(teacherStore.classes[0]?.name).toBe('11-A sinf');

      // Switch to Temurbeklar maktabi
      await teacherStore.loadTeacherData('tenant-temurbeklar');
      expect(teacherStore.classes.length).toBe(4);
      expect(teacherStore.classes[0]?.name).toBe('11-Guruh-1');

      // Al-Xorazmiy classes must NOT be present
      expect(teacherStore.classes.some((c) => c.name === '11-A sinf')).toBe(false);
    });

    it('verifies synthetic tenant fixtures have independent tenantIds and settings', () => {
      expect(mockTenants.length).toBeGreaterThanOrEqual(2);
      const [t1, t2] = mockTenants;
      expect(t1!.id).not.toBe(t2!.id);
      expect(t1!.slug).not.toBe(t2!.slug);
      expect(t1!.name).not.toBe(t2!.name);
    });
  });

  describe('4. Draft Persistence and Recovery', () => {
    it('restores answered drafts from localStorage seamlessly', async () => {
      const assessmentStore = useAssessmentStore();
      await assessmentStore.startAssessment('tenant-al-xorazmiy', 'chsb-inf-11-q1', 'rec-ax-101');

      assessmentStore.selectAnswer('q-1', 'A');
      assessmentStore.selectAnswer('q-2', 'C');
      assessmentStore.selectAnswer('q-3', 'B');

      expect(assessmentStore.answeredCount).toBe(3);

      // Verify localStorage was written with correct attempt key
      const draftKey = `chsb_draft_v2_tenant-al-xorazmiy_chsb-inf-11-q1_rec-ax-101`;
      const rawStored = localStorage.getItem(draftKey);
      expect(rawStored).not.toBeNull();
      const parsed = JSON.parse(rawStored!);
      expect(parsed['q-1']).toBe('A');
      expect(parsed['q-2']).toBe('C');
      expect(parsed['q-3']).toBe('B');

      // Create fresh Pinia/store instance and restart same assessment
      setActivePinia(createPinia());
      const freshStore = useAssessmentStore();
      await freshStore.startAssessment('tenant-al-xorazmiy', 'chsb-inf-11-q1', 'rec-ax-101');

      expect(freshStore.answers['q-1']).toBe('A');
      expect(freshStore.answers['q-2']).toBe('C');
      expect(freshStore.answers['q-3']).toBe('B');
      expect(freshStore.answeredCount).toBe(3);
    });
  });

  describe('5. Double Submission and Guard Tests', () => {
    it('prevents resubmitting an already-submitted assessment', async () => {
      const assessmentStore = useAssessmentStore();
      await assessmentStore.startAssessment('tenant-al-xorazmiy', 'chsb-inf-11-q1', 'rec-ax-101');

      const submit1 = await assessmentStore.submitAssessment('tenant-al-xorazmiy');
      expect(submit1).toBe(true);

      // Second attempt to submit should be rejected
      const submit2 = await assessmentStore.submitAssessment('tenant-al-xorazmiy');
      expect(submit2).toBe(false);
    });
  });
});
