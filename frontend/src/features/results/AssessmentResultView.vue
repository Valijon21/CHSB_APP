<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTenantStore } from '../tenant-context/tenantStore';
import { useAssessmentStore } from '../assessment/assessmentStore';
import { api } from '../../shared/api';
import CertificateModal from './CertificateModal.vue';

const route = useRoute();
const router = useRouter();
const tenantStore = useTenantStore();
const assessmentStore = useAssessmentStore();
const isCertModalOpen = ref(false);

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
const attemptId = (route.params.attemptId as string) || 'demo-attempt';

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);

  // If result not in store, fetch from repo
  if (!assessmentStore.result) {
    const tenantId = tenantStore.currentTenant?.tenantId || 'tenant-al-xorazmiy';
    const res = await api.result.getResultByAttemptId(tenantId, attemptId);
    if (res) {
      assessmentStore.result = res;
    }
  }
});

function finish() {
  assessmentStore.stopTimer();
  router.push(`/t/${tenantSlug}/student`);
}
</script>

<template>
  <div class="max-w-lg mx-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs p-6 sm:p-8 transition-colors">
    <div class="text-center pb-5 border-b border-slate-100 dark:border-slate-700/80">
      <span
        :class="[
          'inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border mb-2',
          assessmentStore.result?.status === 'pending_review'
            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            : assessmentStore.result?.verifiedByTeacher
              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800'
        ]"
      >
        {{
          assessmentStore.result?.status === 'pending_review'
            ? "O'qituvchi tekshiruvi kutilmoqda"
            : assessmentStore.result?.verifiedByTeacher
              ? 'Rasmiy Tasdiqlangan Natija'
              : 'Dastlabki Natija'
        }}
      </span>
      <h2 class="text-xl font-bold text-slate-900 dark:text-white">
        {{ assessmentStore.result?.assessmentTitle || assessmentStore.assessment?.title || 'Baholash Natijasi' }}
      </h2>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
        {{ assessmentStore.result?.className || '' }}
        {{ assessmentStore.result?.assessmentType ? `• ${assessmentStore.result.assessmentType}` : '' }}
      </p>
    </div>

    <!-- Pending Review Card for BSB/PROJECT -->
    <div
      v-if="assessmentStore.result?.status === 'pending_review'"
      class="my-6 p-6 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center space-y-2"
    >
      <div class="text-3xl">⏳</div>
      <h3 class="text-sm font-bold text-amber-900 dark:text-amber-200">
        Ishingiz rubrika tekshiruviga yuborildi
      </h3>
      <p class="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
        Bu {{ assessmentStore.result?.assessmentType || 'BSB' }} ishi ochiq/amaliy topshiriqlardan iborat bo‘lib, o‘qituvchi baholash varaqasi asosida tekshirganidan so‘ng yakuniy ball va 5 ballik baho e’lon qilinadi.
      </p>
    </div>

    <!-- Score Highlight Card -->
    <div v-else class="my-6 p-6 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-center">
      <span class="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider block mb-1">
        To'plangan ball
      </span>
      <div class="text-4xl font-black text-teal-800 dark:text-teal-400 my-2">
        {{ assessmentStore.result?.score ?? 0 }}
        <span class="text-lg font-normal text-slate-400 dark:text-slate-500">/ {{ assessmentStore.result?.maxScore ?? assessmentStore.assessment?.maxScore ?? 40 }}</span>
      </div>
      <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">
        {{ assessmentStore.result?.percentage ?? 0 }}% umumiy o'zlashtirish
        <span v-if="assessmentStore.result?.grade" class="ml-1.5 font-bold text-teal-800 dark:text-teal-300">
          • Baho: {{ assessmentStore.result.grade }}
        </span>
      </p>
    </div>

    <!-- Questions answered breakdown -->
    <div class="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 mb-6 space-y-1.5">
      <div class="flex justify-between">
        <span>Jami topshiriqlar:</span>
        <span class="font-bold text-slate-800 dark:text-white">{{ assessmentStore.result?.totalQuestions ?? assessmentStore.totalQuestions ?? 0 }} ta</span>
      </div>
      <div class="flex justify-between">
        <span>Javob berilgan:</span>
        <span class="font-bold text-teal-800 dark:text-teal-400">{{ assessmentStore.result?.answeredQuestions ?? assessmentStore.answeredCount ?? 0 }} ta</span>
      </div>
      <div class="flex justify-between">
        <span>O'quvchi:</span>
        <span class="font-medium text-slate-800 dark:text-white">{{ assessmentStore.result?.studentName ?? "O'quvchi" }}</span>
      </div>
    </div>

    <div
      v-if="assessmentStore.result?.teacherFeedback || assessmentStore.result?.teacherNote"
      class="p-3.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-xs leading-relaxed mb-4"
    >
      <strong>O'qituvchi izohi:</strong> {{ assessmentStore.result?.teacherFeedback || assessmentStore.result?.teacherNote }}
    </div>

    <!-- Official note about teacher verification -->
    <div
      v-else-if="!assessmentStore.result?.verifiedByTeacher"
      class="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs leading-relaxed mb-6"
    >
      <strong>Eslatma:</strong> Natija o'qituvchi tomonidan tasdiqlangach yakuniy jurnalga kiritiladi.
    </div>

    <!-- Official Certificate Action -->
    <button
      v-if="assessmentStore.result"
      type="button"
      @click="isCertModalOpen = true"
      aria-label="Rasmiy sertifikatni ko'rish va yuklab olish"
      class="w-full mb-3 py-2.5 px-4 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white font-semibold rounded-xl transition text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2 shadow-xs min-h-[42px]"
    >
      <svg class="w-4 h-4 text-teal-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
      <span>Rasmiy Sertifikatni Ko'rish va Yuklab Olish (PDF)</span>
    </button>

    <button
      @click="finish"
      aria-label="Bosh sahifaga qaytish"
      class="w-full py-2.5 px-4 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-medium rounded-xl transition text-sm cursor-pointer min-h-[42px]"
    >
      Bosh sahifaga qaytish
    </button>

    <!-- Certificate Modal Component -->
    <CertificateModal
      v-if="assessmentStore.result"
      :is-open="isCertModalOpen"
      :result="assessmentStore.result"
      :school-name="tenantStore.currentTenant?.displayName"
      @close="isCertModalOpen = false"
    />
  </div>
</template>
