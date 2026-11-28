<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { useAssessmentStore } from '../assessment/assessmentStore';

const route = useRoute();
const router = useRouter();
const assessmentStore = useAssessmentStore();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
const attemptId = (route.params.attemptId as string) || assessmentStore.receipt?.attemptId || 'att-demo';

function viewResult() {
  router.push(`/t/${tenantSlug}/attempts/${attemptId}/result`);
}
</script>

<template>
  <div class="max-w-lg mx-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs p-6 sm:p-8 text-center transition-colors">
    <div class="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
      ✓
    </div>

    <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
      Qabul qilindi
    </span>
    <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Javoblaringiz muvaffaqiyatli topshirildi</h2>
    <p class="text-xs text-slate-500 dark:text-slate-400 mb-6">
      Sizning imtihon topshiriqlaringiz tizimga qayd etildi va saqlandi.
    </p>

    <div class="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2.5 mb-6">
      <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
        <span class="text-slate-500 dark:text-slate-400">Urinish kodi (ID):</span>
        <span class="font-mono font-bold text-slate-900 dark:text-white">{{ attemptId }}</span>
      </div>
      <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
        <span class="text-slate-500 dark:text-slate-400">Javob berilgan savollar:</span>
        <span class="font-bold text-teal-800 dark:text-teal-400">{{ assessmentStore.answeredCount }} / {{ assessmentStore.totalQuestions }}</span>
      </div>
      <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
        <span class="text-slate-500 dark:text-slate-400">Topshirilgan vaqt:</span>
        <span class="text-slate-800 dark:text-slate-200 font-medium">
          {{ assessmentStore.receipt ? new Date(assessmentStore.receipt.submittedAt).toLocaleTimeString('uz-UZ') : new Date().toLocaleTimeString('uz-UZ') }}
        </span>
      </div>
      <div class="flex justify-between py-1">
        <span class="text-slate-500 dark:text-slate-400">Holat:</span>
        <span class="text-emerald-700 dark:text-emerald-400 font-semibold">O'qituvchi tekshiruviga yuborildi</span>
      </div>
    </div>

    <button
      @click="viewResult"
      aria-label="Natijani ko'rish"
      class="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white font-medium rounded-xl transition shadow-xs cursor-pointer text-sm min-h-[42px]"
    >
      Natijani ko'rish
    </button>
  </div>
</template>
