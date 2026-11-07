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
  <div class="max-w-lg mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
    <div class="text-center pb-5 border-b border-slate-100">
      <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 mb-2">
        Dastlabki Demo Natija
      </span>
      <h2 class="text-xl font-bold text-slate-900">1-ChSB Natijasi</h2>
      <p class="text-xs text-slate-500 mt-1">Informatika va axborot texnologiyalari — 11-sinf</p>
    </div>

    <!-- Score Highlight Card -->
    <div class="my-6 p-6 rounded-xl bg-slate-50 border border-slate-200 text-center">
      <span class="text-xs text-slate-500 font-medium uppercase tracking-wider block mb-1">
        To'plangan dastlabki ball
      </span>
      <div class="text-4xl font-black text-teal-800 my-2">
        {{ assessmentStore.result?.score ?? 35 }}
        <span class="text-lg font-normal text-slate-400">/ {{ assessmentStore.result?.maxScore ?? 40 }}</span>
      </div>
      <p class="text-xs text-slate-500 font-medium">
        {{ assessmentStore.result?.percentage ?? 87.5 }}% umumiy o'zlashtirish ko'rsatkichi
      </p>
    </div>

    <!-- Questions answered breakdown -->
    <div class="bg-slate-50 rounded-lg p-3.5 border border-slate-100 text-xs text-slate-600 mb-6 space-y-1.5">
      <div class="flex justify-between">
        <span>Jami savollar:</span>
        <span class="font-bold text-slate-800">15 ta</span>
      </div>
      <div class="flex justify-between">
        <span>Javob berilgan savollar:</span>
        <span class="font-bold text-teal-800">{{ assessmentStore.result?.answeredQuestions ?? 15 }} ta</span>
      </div>
      <div class="flex justify-between">
        <span>O'quvchi:</span>
        <span class="font-medium text-slate-800">{{ assessmentStore.result?.studentName ?? "O'quvchi" }}</span>
      </div>
    </div>

    <!-- Official note about teacher verification (Preserved from legacy HTML) -->
    <div class="p-3.5 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-xs leading-relaxed mb-6">
      <strong>Eslatma:</strong> Bu natija o'qituvchi tomonidan tekshiriladi, ball o'zgarishi mumkin.
    </div>

    <!-- Official Certificate Action -->
    <button
      v-if="assessmentStore.result"
      type="button"
      @click="isCertModalOpen = true"
      class="w-full mb-3 py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white font-semibold rounded-lg transition text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2 shadow-xs"
    >
      <svg class="w-4 h-4 text-teal-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
      <span>Rasmiy Sertifikatni Ko'rish va Yuklab Olish (PDF)</span>
    </button>

    <button
      @click="finish"
      class="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition text-sm cursor-pointer"
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
