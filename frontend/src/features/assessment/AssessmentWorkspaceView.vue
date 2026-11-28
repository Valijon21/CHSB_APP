<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTenantStore } from '../tenant-context/tenantStore';
import { useStudentAdmissionStore } from '../student-admission/admissionStore';
import { useAssessmentStore } from './assessmentStore';
import { useExamProctor } from '../../shared/composables/useExamProctor';
import QuestionBlockRenderer from '../../shared/components/QuestionBlockRenderer.vue';
import BsbTaskRenderer from './components/BsbTaskRenderer.vue';
import PdfDocumentPane from './components/PdfDocumentPane.vue';
import PdfAnswerSheetPane from './components/PdfAnswerSheetPane.vue';
import type { Question } from '../../entities/assessment/model';

const route = useRoute();
const router = useRouter();
const tenantStore = useTenantStore();
const admissionStore = useStudentAdmissionStore();
const assessmentStore = useAssessmentStore();
const teacherTimeNotice = ref<string | null>(null);
const proctor = useExamProctor(3, {
  attemptId: () => assessmentStore.attempt?.id || null,
  onGrantTime: (extraSeconds, message) => {
    assessmentStore.addExtraSeconds(extraSeconds);
    teacherTimeNotice.value = message || `O'qituvchi tomonidan +${Math.round(extraSeconds / 60)} daqiqa qo'shimcha vaqt berildi.`;
  },
  onForceSubmit: () => {
    void handleFinish();
  },
});

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
const assessmentId = (route.params.assessmentId as string) || 'chsb-inf-11-q1';

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);

  proctor.startProctoring();

  // If assessment not loaded yet (or switched to another assessment), initialize it
  if (!assessmentStore.assessment || assessmentStore.assessment.id !== assessmentId) {
    const tenantId = tenantStore.currentTenant?.tenantId || 'tenant-al-xorazmiy';
    const rosterRecordId = admissionStore.confirmedStudent?.rosterRecordId || 'rec-ax-101';
    await assessmentStore.startAssessment(tenantId, assessmentId, rosterRecordId, { shuffle: true });
  }
});

function handleOptionSelect(optionId: string) {
  if (assessmentStore.currentQuestion) {
    assessmentStore.selectAnswer(assessmentStore.currentQuestion.id, optionId);
  }
}

function handleBsbAnswerUpdate(serializedVal: string) {
  if (assessmentStore.currentQuestion) {
    assessmentStore.selectAnswer(assessmentStore.currentQuestion.id, serializedVal);
  }
}

const isSplitPdfMode = computed(() => Boolean(assessmentStore.assessment?.hasPdf));

function isBsbTask(q: Question | null | undefined): boolean {
  if (!q) return false;
  return Boolean(
    (q.subQuestions && q.subQuestions.length > 0) ||
    q.tableData ||
    q.taskType === 'case_study' ||
    q.taskType === 'subquestions' ||
    q.taskType === 'table_completion' ||
    q.taskType === 'open_text' ||
    (!q.options || q.options.length === 0)
  );
}

function isQuestionAnswered(qId: string): boolean {
  const ans = assessmentStore.answers[qId];
  if (!ans) return false;
  if (typeof ans === 'string' && ans.trim().length > 0) {
    if (ans.startsWith('{')) {
      try {
        const obj = JSON.parse(ans);
        return Object.values(obj).some(v => typeof v === 'string' && (v as string).trim().length > 0);
      } catch {
        return true;
      }
    }
    return true;
  }
  return false;
}

function getOptionLabel(opt: { id: string; label?: string }, index: number): string {
  if (opt.label && opt.label.trim().length > 0) {
    return opt.label.trim().toUpperCase();
  }
  if (opt.id.toLowerCase().startsWith('opt-')) {
    const raw = opt.id.replace(/^opt-/, '').trim().toUpperCase();
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 1 && num <= 26) {
      return String.fromCharCode(64 + num);
    }
    return raw;
  }
  if (/^[a-z]$/i.test(opt.id.trim())) {
    return opt.id.trim().toUpperCase();
  }
  return String.fromCharCode(65 + index);
}

async function handleFinish() {
  const unanswered = assessmentStore.unansweredCount;
  if (unanswered > 0) {
    const confirmed = confirm(
      `${unanswered} ta savolga javob berilmagan. Shunda ham yuborilsinmi?`
    );
    if (!confirmed) return;
  }

  const tenantId = tenantStore.currentTenant?.tenantId || 'tenant-al-xorazmiy';
  const ok = await assessmentStore.submitAssessment(tenantId);
  if (ok && assessmentStore.attempt) {
    router.push(`/t/${tenantSlug}/attempts/${assessmentStore.attempt.id}/receipt`);
  }
}
</script>

<template>
  <div
    v-if="assessmentStore.assessment"
    class="space-y-4 select-none"
    @contextmenu.prevent
    @copy.prevent
    @cut.prevent
    @paste.prevent
  >
    <!-- Official Ministry & Pedagogical Center Header Banner -->
    <div class="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-xl shrink-0">
          🏛️
        </div>
        <div>
          <h2 class="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400">
            Pedagogik mahorat va xalqaro baholash ilmiy-amaliy markazi
          </h2>
          <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {{ assessmentStore.assessment.title }}
          </p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <span class="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300">
          {{ assessmentStore.assessment.grade }}-sinf
        </span>
        <span class="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300">
          {{ assessmentStore.assessment.quarter }}-chorak
        </span>
        <span class="px-2.5 py-1 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800">
          Maksimal ball: {{ assessmentStore.assessment.maxScore }} ball
        </span>
      </div>
    </div>

    <!-- Top Progress and Timer Bar -->
    <div class="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-wrap items-center justify-between gap-4 transition-colors">
      <div class="flex items-center gap-3">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Javob berildi:</span>
        <span class="px-2.5 py-1 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-300 font-bold text-sm border border-teal-200 dark:border-teal-800">
          {{ assessmentStore.answeredCount }} / {{ assessmentStore.totalQuestions }}
        </span>
      </div>

      <!-- Center Proctor / Security Status & Fullscreen toggle -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="proctor.requestFullscreen()"
          aria-label="To'liq ekranga o'tish"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition cursor-pointer text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 min-h-[34px]"
          title="To'liq ekranga o'tish"
        >
          <svg class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          <span>To'liq ekran</span>
        </button>

        <div
          :class="[
            'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border',
            proctor.violationCount.value === 0
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : proctor.violationCount.value < proctor.maxViolations
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 animate-pulse'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse'
          ]"
        >
          <span
            class="w-1.5 h-1.5 rounded-full"
            :class="proctor.violationCount.value === 0 ? 'bg-emerald-500' : 'bg-amber-500'"
          ></span>
          <span>Nazorat: {{ proctor.violationCount.value }} / {{ proctor.maxViolations }}</span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">Qolgan vaqt:</span>
        <div
          :class="[
            'px-3.5 py-1 rounded-md font-mono font-bold text-sm tracking-wider transition-colors',
            assessmentStore.isLowTime
              ? 'bg-rose-700 text-white animate-pulse'
              : 'bg-slate-900 dark:bg-teal-900 text-white border border-transparent dark:border-teal-700'
          ]"
        >
          {{ assessmentStore.formattedTime }}
        </div>
      </div>
    </div>

    <!-- Teacher Proctor Extra-Time / Notice Banner -->
    <div
      v-if="teacherTimeNotice"
      class="px-4 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-xs font-medium flex items-center justify-between gap-2"
      role="status"
    >
      <span>⏱️ {{ teacherTimeNotice }}</span>
      <button
        type="button"
        @click="teacherTimeNotice = null"
        class="text-teal-700 dark:text-teal-300 font-bold hover:underline cursor-pointer"
      >
        Yopish
      </button>
    </div>

    <!-- Split-Screen Original PDF + Answer Sheet Mode -->
    <div v-if="isSplitPdfMode" class="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
      <div class="md:col-span-7 min-w-0">
        <PdfDocumentPane
          :assessment-id="assessmentStore.assessment.id"
          :source-pdf-url="assessmentStore.assessment.sourcePdfUrl"
          :file-name="assessmentStore.assessment.sourcePdfName"
          height-class="h-[calc(100vh-210px)] min-h-[540px]"
        />
      </div>

      <div class="md:col-span-5 min-w-0">
        <PdfAnswerSheetPane
          :assessment="assessmentStore.assessment"
          :answers="assessmentStore.answers"
          :answered-count="assessmentStore.answeredCount"
          :total-questions="assessmentStore.totalQuestions"
          :is-submitting="assessmentStore.isSubmitting"
          height-class="h-[calc(100vh-210px)] min-h-[540px]"
          @select-answer="(qId, val) => assessmentStore.selectAnswer(qId, val)"
          @finish="handleFinish"
        />
      </div>
    </div>

    <!-- Main Workspace (Col 1-3 Question, Col 4 Navigator) -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <!-- Question Content Area -->
      <div
        v-if="assessmentStore.currentQuestion"
        class="lg:col-span-3 bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between min-h-[460px] transition-colors"
      >
        <div>
          <!-- Header of question -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/80 mb-4">
            <span class="font-bold text-teal-800 dark:text-teal-400 text-base sm:text-lg">
              {{ assessmentStore.currentQuestion.order }}-savol
            </span>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {{ assessmentStore.currentQuestion.cognitiveLevel }}
              </span>
              <span class="px-2 py-0.5 rounded text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                {{ assessmentStore.currentQuestion.points }} ball
              </span>
            </div>
          </div>

          <!-- Question Content Blocks (Rendered safely) -->
          <div class="mb-6">
            <QuestionBlockRenderer
              v-for="(block, bIdx) in assessmentStore.currentQuestion.blocks"
              :key="bIdx"
              :block="block"
            />
          </div>

          <!-- If question has subQuestions, tableData, or taskType is BSB -->
          <div v-if="isBsbTask(assessmentStore.currentQuestion)" class="mt-4">
            <BsbTaskRenderer
              :question="assessmentStore.currentQuestion"
              :model-value="assessmentStore.answers[assessmentStore.currentQuestion.id] || ''"
              @update:model-value="handleBsbAnswerUpdate"
            />
          </div>

          <!-- Options List (A, B, C, D) for Multiple Choice -->
          <div v-else class="space-y-3">
            <button
              v-for="(opt, optIdx) in assessmentStore.currentQuestion.options"
              :key="opt.id"
              @click="handleOptionSelect(opt.id)"
              :aria-label="`Variant ${getOptionLabel(opt, optIdx)}`"
              :class="[
                'w-full text-left p-3.5 rounded-lg border text-sm transition flex items-start gap-3 cursor-pointer',
                assessmentStore.answers[assessmentStore.currentQuestion.id] === opt.id
                  ? 'border-teal-700 dark:border-teal-500 bg-teal-50/70 dark:bg-teal-950/60 text-teal-950 dark:text-teal-100 font-semibold ring-2 ring-teal-700 dark:ring-teal-500'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200'
              ]"
            >
              <span
                :class="[
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5',
                  assessmentStore.answers[assessmentStore.currentQuestion.id] === opt.id
                    ? 'bg-teal-800 dark:bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                ]"
              >
                {{ getOptionLabel(opt, optIdx) }}
              </span>
              <span class="flex-1 leading-snug pt-0.5" v-html="opt.text"></span>
            </button>
          </div>
        </div>

        <!-- Navigation buttons bar -->
        <div class="pt-6 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between mt-8 gap-2">
          <button
            @click="assessmentStore.prevQuestion"
            :disabled="assessmentStore.currentQuestionIndex === 0"
            aria-label="Oldingi savolga qaytish"
            class="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer min-h-[40px]"
          >
            ← Oldingi savol
          </button>

          <div class="flex items-center gap-2">
            <button
              v-if="assessmentStore.currentQuestionIndex < assessmentStore.totalQuestions - 1"
              @click="assessmentStore.nextQuestion"
              aria-label="Keyingi savolga o'tish"
              class="px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white text-xs sm:text-sm font-medium transition cursor-pointer min-h-[40px]"
            >
              Keyingi savol →
            </button>
            <button
              @click="handleFinish"
              :disabled="assessmentStore.isSubmitting"
              aria-label="Imtihonni yakunlash va yuborish"
              class="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs disabled:bg-slate-400 min-h-[40px]"
            >
              {{ assessmentStore.isSubmitting ? 'Topshirilmoqda...' : 'Yakunlash va yuborish' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Question Grid Navigator (Col 4) -->
      <div class="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs h-fit transition-colors">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Savollar navigatsiyasi
          </h3>
          <span class="text-xs text-slate-400 dark:text-slate-400">{{ assessmentStore.totalQuestions }} ta</span>
        </div>

        <div class="grid grid-cols-5 gap-2">
          <button
            v-for="q in assessmentStore.assessment.questions"
            :key="q.order"
            @click="assessmentStore.goToQuestion(q.order - 1)"
            :aria-label="`${q.order}-savolga o'tish`"
            :class="[
              'h-9 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer border',
              assessmentStore.currentQuestionIndex === q.order - 1
                ? 'border-teal-700 dark:border-teal-400 ring-2 ring-teal-700 dark:ring-teal-400 text-teal-900 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60'
                : isQuestionAnswered(q.id)
                  ? 'bg-teal-800 dark:bg-teal-600 text-white border-teal-800 dark:border-teal-600'
                  : 'bg-slate-50 dark:bg-slate-700/70 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
            ]"
          >
            {{ q.order }}
          </button>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/80 space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <div class="flex items-center gap-2">
            <span class="w-3.5 h-3.5 rounded bg-teal-800 dark:bg-teal-600"></span>
            <span>Javob berilgan ({{ assessmentStore.answeredCount }})</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3.5 h-3.5 rounded bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"></span>
            <span>Javob berilmagan ({{ assessmentStore.unansweredCount }})</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3.5 h-3.5 rounded bg-teal-50 dark:bg-teal-950/60 border-2 border-teal-700 dark:border-teal-400"></span>
            <span>Hozirgi savol</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-12">
    <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
    <p class="text-sm text-slate-500 dark:text-slate-400">Imtihon savollari yuklanmoqda...</p>
  </div>

  <!-- Anti-Cheat Proctoring Alert Modal -->
  <div
    v-if="proctor.isWarningModalOpen.value"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="proctor-modal-title"
  >
    <div class="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100 dark:border-rose-900/60 text-center animate-in fade-in transition-colors">
      <div class="w-14 h-14 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900 flex items-center justify-center mb-4 text-rose-600 dark:text-rose-400">
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <h3 id="proctor-modal-title" class="text-lg font-bold text-slate-900 dark:text-white mb-2">
        Diqqat! Imtihon qoidasi buzildi
      </h3>

      <p class="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
        {{ proctor.lastWarningMessage.value }}
      </p>

      <div class="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 mb-5">
        <p class="font-semibold">
          Qoidabuzarlik: {{ proctor.violationCount.value }} / {{ proctor.maxViolations }}
        </p>
        <p class="mt-0.5 text-amber-700 dark:text-amber-300">
          Imtihon oynasidan chiqish yoki nusxa olish qat'iyan taqiqlanadi. Har bir harakat qayd etiladi.
        </p>
      </div>

      <button
        type="button"
        @click="proctor.dismissWarning"
        aria-label="Ogohlantirishni qabul qilish va imtihonni davom ettirish"
        class="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white rounded-xl font-medium text-sm transition cursor-pointer shadow-sm min-h-[42px]"
      >
        Tushundim, imtihonni davom ettirish
      </button>
    </div>
  </div>
</template>
