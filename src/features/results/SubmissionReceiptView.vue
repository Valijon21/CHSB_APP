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
  <div class="max-w-lg mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center">
    <div class="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
      ✓
    </div>

    <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
      Qabul qilindi (Demo Kvitansiya)
    </span>
    <h2 class="text-xl font-bold text-slate-900 mb-2">Javoblaringiz muvaffaqiyatli topshirildi</h2>
    <p class="text-xs text-slate-500 mb-6">
      Sizning imtihon topshiriqlaringiz tizimga qayd etildi va saqlandi.
    </p>

    <div class="bg-slate-50 rounded-lg p-4 border border-slate-200 text-left text-xs space-y-2.5 mb-6">
      <div class="flex justify-between py-1 border-b border-slate-100">
        <span class="text-slate-500">Urinish kodi (ID):</span>
        <span class="font-mono font-bold text-slate-900">{{ attemptId }}</span>
      </div>
      <div class="flex justify-between py-1 border-b border-slate-100">
        <span class="text-slate-500">Javob berilgan savollar:</span>
        <span class="font-bold text-teal-800">{{ assessmentStore.answeredCount }} / {{ assessmentStore.totalQuestions }}</span>
      </div>
      <div class="flex justify-between py-1 border-b border-slate-100">
        <span class="text-slate-500">Topshirilgan vaqt:</span>
        <span class="text-slate-800 font-medium">
          {{ assessmentStore.receipt ? new Date(assessmentStore.receipt.submittedAt).toLocaleTimeString('uz-UZ') : new Date().toLocaleTimeString('uz-UZ') }}
        </span>
      </div>
      <div class="flex justify-between py-1">
        <span class="text-slate-500">Holat:</span>
        <span class="text-emerald-700 font-semibold">O'qituvchi tekshiruviga yuborildi</span>
      </div>
    </div>

    <button
      @click="viewResult"
      class="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white font-medium rounded-lg transition shadow-xs cursor-pointer text-sm"
    >
      Natijani ko'rish
    </button>
  </div>
</template>
