import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Assessment, Question } from '../../entities/assessment/model';
import type { AssessmentAttempt, SubmissionReceipt } from '../../entities/attempt/model';
import type { AssessmentResult } from '../../entities/result/model';
import { api } from '../../shared/api';
import { seededShuffle } from '../../shared/utils/cryptoShuffle';
import { offlineStorage } from '../../shared/storage/indexedDbAdapter';
import { generateOfflineVerificationHash } from '../../shared/utils/offlineHash';

const DRAFT_STORAGE_PREFIX = 'chsb_draft_v2_';

export const useAssessmentStore = defineStore('assessment', () => {
  const assessment = ref<Assessment | null>(null);
  const attempt = ref<AssessmentAttempt | null>(null);
  const currentQuestionIndex = ref(0);
  const answers = ref<Record<string, string>>({});
  const remainingSeconds = ref(40 * 60);
  const isSubmitting = ref(false);
  const errorMessage = ref<string | null>(null);
  const receipt = ref<SubmissionReceipt | null>(null);
  const result = ref<AssessmentResult | null>(null);
  const offlineEmergencyCode = ref<string | null>(null);

  let timerInterval: ReturnType<typeof setInterval> | null = null;

  const currentQuestion = computed<Question | null>(() => {
    if (!assessment.value || assessment.value.questions.length === 0) return null;
    return assessment.value.questions[currentQuestionIndex.value] ?? null;
  });

  const totalQuestions = computed(() => assessment.value?.questions.length ?? 15);
  const answeredCount = computed(() => Object.keys(answers.value).length);
  const unansweredCount = computed(() => totalQuestions.value - answeredCount.value);
  const isLowTime = computed(() => remainingSeconds.value <= 5 * 60); // 5 min warning

  const formattedTime = computed(() => {
    const mins = Math.floor(remainingSeconds.value / 60);
    const secs = remainingSeconds.value % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
      if (remainingSeconds.value > 0) {
        remainingSeconds.value--;
      } else {
        stopTimer();
        // Auto-submit when time runs out
        if (attempt.value && !isSubmitting.value) {
          submitAssessment(attempt.value.tenantId);
        }
      }
    }, 1000);
  }

  async function startAssessment(
    tenantId: string,
    assessmentId: string,
    rosterRecordId: string,
    options?: { shuffle?: boolean }
  ): Promise<boolean> {
    errorMessage.value = null;

    try {
      let data = await api.assessment.getAssessmentById(tenantId, assessmentId);
      if (!data) {
        // Fallback to offline cached assessment
        data = await offlineStorage.getCachedAssessment(assessmentId);
      } else {
        // Cache for offline resilience
        await offlineStorage.cacheAssessment(data);
      }

      if (!data) {
        errorMessage.value = "Imtihon ma'lumotlari topilmadi.";
        return false;
      }

      let questions = data.questions;
      if (options?.shuffle) {
        const seed = `${tenantId}_${assessmentId}_${rosterRecordId}`;
        questions = seededShuffle(data.questions, `${seed}_questions`).map((q, idx) => ({
          ...q,
          order: idx + 1,
          options: seededShuffle(q.options, `${seed}_q_${q.id}_options`),
        }));
      }

      assessment.value = {
        ...data,
        questions,
      };

      // Create or restore attempt
      const newAttempt = await api.attempt.createAttempt(tenantId, assessmentId, rosterRecordId);
      attempt.value = newAttempt;

      // Recover draft from localStorage if present
      const draftKey = `${DRAFT_STORAGE_PREFIX}${tenantId}_${assessmentId}_${rosterRecordId}`;
      try {
        const saved = localStorage.getItem(draftKey);
        if (saved) {
          answers.value = JSON.parse(saved);
        } else {
          answers.value = {};
        }
      } catch {
        answers.value = {};
      }

      currentQuestionIndex.value = 0;
      remainingSeconds.value = data.durationSeconds;
      startTimer();
      return true;
    } catch {
      errorMessage.value = "Imtihonni yuklashda xatolik yuz berdi.";
      return false;
    }
  }

  function selectAnswer(questionId: string, optionId: string) {
    answers.value[questionId] = optionId;

    // Persist draft
    if (attempt.value) {
      api.attempt.saveDraft(attempt.value.tenantId, attempt.value.id, { [questionId]: optionId });

      const draftKey = `${DRAFT_STORAGE_PREFIX}${attempt.value.tenantId}_${attempt.value.assessmentId}_${attempt.value.rosterRecordId}`;
      try {
        localStorage.setItem(draftKey, JSON.stringify(answers.value));
        offlineStorage.saveDraft(draftKey, answers.value);
      } catch {
        // Safe fallback if storage quota exceeded
      }
    }
  }

  function nextQuestion() {
    if (currentQuestionIndex.value < totalQuestions.value - 1) {
      currentQuestionIndex.value++;
    }
  }

  function prevQuestion() {
    if (currentQuestionIndex.value > 0) {
      currentQuestionIndex.value--;
    }
  }

  function goToQuestion(index: number) {
    if (index >= 0 && index < totalQuestions.value) {
      currentQuestionIndex.value = index;
    }
  }

  async function submitAssessment(tenantId: string): Promise<boolean> {
    if (!attempt.value || attempt.value.status === 'submitted_demo' || isSubmitting.value) return false;

    isSubmitting.value = true;
    stopTimer();

    try {
      const submission = await api.attempt.submitAttempt(
        tenantId,
        attempt.value.id,
        `idem-${attempt.value.id}`
      );
      receipt.value = submission;
      attempt.value.status = 'submitted_demo';

      // Fetch result
      const res = await api.result.getResultByAttemptId(tenantId, attempt.value.id);
      result.value = res;

      // Clear draft storage
      const draftKey = `${DRAFT_STORAGE_PREFIX}${tenantId}_${attempt.value.assessmentId}_${attempt.value.rosterRecordId}`;
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // ignore
      }

      return true;
    } catch {
      // Offline fallback: enqueue submission in offline storage and generate offline verification code
      if (attempt.value) {
        const timestamp = new Date().toISOString();
        const offlineCode = generateOfflineVerificationHash(
          attempt.value.rosterRecordId,
          attempt.value.assessmentId,
          answers.value,
          timestamp
        );
        offlineEmergencyCode.value = offlineCode;

        await offlineStorage.enqueueSubmission({
          id: `queue-${attempt.value.id}-${Date.now()}`,
          tenantId,
          attemptId: attempt.value.id,
          assessmentId: attempt.value.assessmentId,
          studentId: attempt.value.rosterRecordId,
          answers: { ...answers.value },
          offlineHash: offlineCode,
          enqueuedAt: timestamp,
          synced: false,
        });

        // Set local provisional receipt so student can view receipt screen safely
        receipt.value = {
          attemptId: attempt.value.id,
          tenantId,
          assessmentId: attempt.value.assessmentId,
          rosterRecordId: attempt.value.rosterRecordId,
          submittedAt: timestamp,
          receiptCode: offlineCode,
          status: 'received_demo',
          message: "Demo imtihon javoblari oflayn qabul qilindi. Favqulodda kod biriktirildi.",
        };
        attempt.value.status = 'submitted_demo';
        return true;
      }

      errorMessage.value = "Imtihonni topshirishda xatolik yuz berdi. Qaytadan urinib ko'ring.";
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function syncQueuedSubmissions(tenantId: string): Promise<number> {
    const queued = await offlineStorage.getQueuedSubmissions();
    let syncedCount = 0;
    for (const item of queued) {
      if (item.tenantId === tenantId && !item.synced) {
        try {
          await api.attempt.submitAttempt(tenantId, item.attemptId, `sync-${item.id}`);
          await offlineStorage.dequeueSubmission(item.id);
          syncedCount++;
        } catch {
          // Keep in queue for next retry
        }
      }
    }
    return syncedCount;
  }

  async function loadAssessmentOverview(tenantId: string, assessmentId: string): Promise<Assessment | null> {
    errorMessage.value = null;
    try {
      let data = await api.assessment.getAssessmentById(tenantId, assessmentId);
      if (!data) {
        data = await offlineStorage.getCachedAssessment(assessmentId);
      } else {
        await offlineStorage.cacheAssessment(data);
      }
      if (data) {
        assessment.value = data;
      }
      return data;
    } catch {
      errorMessage.value = "Imtihon ma'lumotlarini yuklashda xatolik yuz berdi.";
      return null;
    }
  }

  return {
    assessment,
    attempt,
    currentQuestionIndex,
    currentQuestion,
    totalQuestions,
    answers,
    answeredCount,
    unansweredCount,
    remainingSeconds,
    formattedTime,
    isLowTime,
    isSubmitting,
    errorMessage,
    receipt,
    result,
    offlineEmergencyCode,
    loadAssessmentOverview,
    startAssessment,
    selectAnswer,
    nextQuestion,
    prevQuestion,
    goToQuestion,
    submitAssessment,
    syncQueuedSubmissions,
    stopTimer,
  };
});
