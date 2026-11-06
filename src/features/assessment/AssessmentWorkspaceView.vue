<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTenantStore } from '../tenant-context/tenantStore';
import { useStudentAdmissionStore } from '../student-admission/admissionStore';
import { useAssessmentStore } from './assessmentStore';
import QuestionBlockRenderer from '../../shared/components/QuestionBlockRenderer.vue';

const route = useRoute();
const router = useRouter();
const tenantStore = useTenantStore();
const admissionStore = useStudentAdmissionStore();
const assessmentStore = useAssessmentStore();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
const assessmentId = (route.params.assessmentId as string) || 'chsb-inf-11-q1';

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);

  // If assessment not loaded yet (e.g. direct refresh), initialize it
  if (!assessmentStore.assessment) {
    const tenantId = tenantStore.currentTenant?.tenantId || 'tenant-al-xorazmiy';
    const rosterRecordId = admissionStore.confirmedStudent?.rosterRecordId || 'rec-ax-101';
    await assessmentStore.startAssessment(tenantId, assessmentId, rosterRecordId);
  }
});

function handleOptionSelect(optionId: string) {
  if (assessmentStore.currentQuestion) {
    assessmentStore.selectAnswer(assessmentStore.currentQuestion.id, optionId);
  }
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
  <div v-if="assessmentStore.assessment" class="space-y-4">
    <!-- Top Progress and Timer Bar -->
    <div class="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Javob berildi:</span>
        <span class="px-2.5 py-1 rounded-md bg-teal-50 text-teal-900 font-bold text-sm border border-teal-200">
          {{ assessmentStore.answeredCount }} / {{ assessmentStore.totalQuestions }}
        </span>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-xs text-slate-500 font-medium">Qolgan vaqt:</span>
        <div
          :class="[
            'px-3.5 py-1 rounded-md font-mono font-bold text-sm tracking-wider transition-colors',
            assessmentStore.isLowTime
              ? 'bg-rose-700 text-white animate-pulse'
              : 'bg-slate-900 text-white'
          ]"
        >
          {{ assessmentStore.formattedTime }}
        </div>
        <span class="text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
          Demo Timer
        </span>
      </div>
    </div>

    <!-- Main Workspace (Col 1-3 Question, Col 4 Navigator) -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <!-- Question Content Area -->
      <div
        v-if="assessmentStore.currentQuestion"
        class="lg:col-span-3 bg-white p-5 sm:p-8 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[460px]"
      >
        <div>
          <!-- Header of question -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <span class="font-bold text-teal-800 text-base sm:text-lg">
              {{ assessmentStore.currentQuestion.order }}-savol
            </span>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                {{ assessmentStore.currentQuestion.cognitiveLevel }}
              </span>
              <span class="px-2 py-0.5 rounded text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
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

          <!-- Options List (A, B, C, D) -->
          <div class="space-y-3">
            <button
              v-for="opt in assessmentStore.currentQuestion.options"
              :key="opt.id"
              @click="handleOptionSelect(opt.id)"
              :class="[
                'w-full text-left p-3.5 rounded-lg border text-sm transition flex items-start gap-3 cursor-pointer',
                assessmentStore.answers[assessmentStore.currentQuestion.id] === opt.id
                  ? 'border-teal-700 bg-teal-50/70 text-teal-950 font-semibold ring-2 ring-teal-700'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              ]"
            >
              <span
                :class="[
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5',
                  assessmentStore.answers[assessmentStore.currentQuestion.id] === opt.id
                    ? 'bg-teal-800 text-white'
                    : 'bg-slate-100 text-slate-600'
                ]"
              >
                {{ opt.id }}
              </span>
              <span class="flex-1 leading-snug pt-0.5" v-html="opt.text"></span>
            </button>
          </div>
        </div>

        <!-- Navigation buttons bar -->
        <div class="pt-6 border-t border-slate-100 flex items-center justify-between mt-8 gap-2">
          <button
            @click="assessmentStore.prevQuestion"
            :disabled="assessmentStore.currentQuestionIndex === 0"
            class="px-4 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            ← Oldingi savol
          </button>

          <div class="flex items-center gap-2">
            <button
              v-if="assessmentStore.currentQuestionIndex < assessmentStore.totalQuestions - 1"
              @click="assessmentStore.nextQuestion"
              class="px-4 py-2 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs sm:text-sm font-medium transition cursor-pointer"
            >
              Keyingi savol →
            </button>
            <button
              @click="handleFinish"
              :disabled="assessmentStore.isSubmitting"
              class="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs disabled:bg-slate-400"
            >
              {{ assessmentStore.isSubmitting ? 'Topshirilmoqda...' : 'Yakunlash va yuborish' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Question Grid Navigator (Col 4) -->
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-fit">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Savollar navigatsiyasi
          </h3>
          <span class="text-xs text-slate-400">15 ta</span>
        </div>

        <div class="grid grid-cols-5 gap-2">
          <button
            v-for="q in assessmentStore.assessment.questions"
            :key="q.order"
            @click="assessmentStore.goToQuestion(q.order - 1)"
            :class="[
              'h-9 rounded-md text-xs font-bold transition flex items-center justify-center cursor-pointer border',
              assessmentStore.currentQuestionIndex === q.order - 1
                ? 'border-teal-700 ring-2 ring-teal-700 text-teal-900 bg-teal-50'
                : assessmentStore.answers[q.id]
                  ? 'bg-teal-800 text-white border-teal-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            ]"
          >
            {{ q.order }}
          </button>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
          <div class="flex items-center gap-2">
            <span class="w-3.5 h-3.5 rounded bg-teal-800"></span>
            <span>Javob berilgan ({{ assessmentStore.answeredCount }})</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3.5 h-3.5 rounded bg-slate-50 border border-slate-200"></span>
            <span>Javob berilmagan ({{ assessmentStore.unansweredCount }})</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3.5 h-3.5 rounded bg-teal-50 border-2 border-teal-700"></span>
            <span>Hozirgi savol</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-12">
    <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
    <p class="text-sm text-slate-500">Imtihon savollari yuklanmoqda...</p>
  </div>
</template>
