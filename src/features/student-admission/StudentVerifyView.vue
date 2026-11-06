<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStudentAdmissionStore } from './admissionStore';

const route = useRoute();
const router = useRouter();
const admissionStore = useStudentAdmissionStore();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';

onMounted(() => {
  // If no match in store, redirect back to entry
  if (!admissionStore.currentMatch) {
    router.replace(`/t/${tenantSlug}/student`);
  }
});

function confirmIdentity() {
  const ok = admissionStore.confirmIdentity();
  if (ok && admissionStore.activeAssessmentId) {
    router.push(`/t/${tenantSlug}/assessments/${admissionStore.activeAssessmentId}/instructions`);
  }
}

function cancel() {
  admissionStore.reset();
  router.push(`/t/${tenantSlug}/student`);
}
</script>

<template>
  <div class="w-full max-w-md bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
    <div v-if="admissionStore.currentMatch">
      <div class="mb-5 text-center">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
          ✓ Roster Qayd Mos Keldi
        </span>
        <h2 class="text-lg font-bold text-slate-900">Shaxsingizni tasdiqlang</h2>
        <p class="text-xs text-slate-500 mt-1">
          Iltimos, quyidagi ma'lumotlar to'g'riligini tasdiqlang.
        </p>
      </div>

      <!-- Identity confirmation card -->
      <div class="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-6 space-y-2.5 text-xs sm:text-sm">
        <div class="flex justify-between py-1 border-b border-slate-100">
          <span class="text-slate-500">Ism-familiya:</span>
          <span class="font-bold text-slate-900">{{ admissionStore.currentMatch.displayName }}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-100">
          <span class="text-slate-500">Sinf / Guruh:</span>
          <span class="font-medium text-slate-800">{{ admissionStore.currentMatch.className }}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-100">
          <span class="text-slate-500">Ta'lim muassasasi:</span>
          <span class="font-medium text-slate-800">{{ admissionStore.currentMatch.schoolName }}</span>
        </div>
        <div class="flex justify-between py-1">
          <span class="text-slate-500">Imtihon holati:</span>
          <span class="font-semibold text-emerald-700">Ruxsat berilgan</span>
        </div>
      </div>

      <div class="space-y-2">
        <button
          @click="confirmIdentity"
          class="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white font-medium rounded-lg transition shadow-xs cursor-pointer text-sm"
        >
          Ha, bu men — Imtihonga o'tish
        </button>
        <button
          @click="cancel"
          class="w-full py-2 px-4 bg-transparent hover:bg-slate-100 text-slate-600 font-medium rounded-lg transition text-sm cursor-pointer"
        >
          Bu men emas — Qaytadan kiritish
        </button>
      </div>
    </div>

    <!-- Fallback if redirecting -->
    <div v-else class="text-center py-6">
      <div class="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
      <p class="text-xs text-slate-500">Yo'naltirilmoqda...</p>
    </div>
  </div>
</template>
