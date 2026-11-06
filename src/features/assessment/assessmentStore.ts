import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Assessment, Question } from '../../entities/assessment/model';
import type { AssessmentAttempt, SubmissionReceipt } from '../../entities/attempt/model';
import type { AssessmentResult } from '../../entities/result/model';
import { api } from '../../shared/api';

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
    rosterRecordId: string
  ): Promise<boolean> {
    errorMessage.value = null;

    try {
      const data = await api.assessment.getAssessmentById(tenantId, assessmentId);
      if (!data) {
        errorMessage.value = "Imtihon ma'lumotlari topilmadi.";
        return false;
      }
      assessment.value = data;

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
      errorMessage.value = "Imtihonni topshirishda xatolik yuz berdi. Qaytadan urinib ko'ring.";
      return false;
    } finally {
      isSubmitting.value = false;
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
    startAssessment,
    selectAnswer,
    nextQuestion,
    prevQuestion,
    goToQuestion,
    submitAssessment,
    stopTimer,
  };
});
