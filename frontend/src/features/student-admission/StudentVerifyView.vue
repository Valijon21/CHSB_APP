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
  <div class="w-full max-w-md bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs transition-colors">
    <div v-if="admissionStore.currentMatch">
      <div class="mb-5 text-center">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
          ✓ Roster Qayd Mos Keldi
        </span>
        <h2 class="text-lg font-bold text-slate-900 dark:text-white">Shaxsingizni tasdiqlang</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Iltimos, quyidagi ma'lumotlar to'g'riligini tasdiqlang.
        </p>
      </div>

      <!-- Identity confirmation card -->
      <div class="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 mb-6 space-y-2.5 text-xs sm:text-sm">
        <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
          <span class="text-slate-500 dark:text-slate-400">Ism-familiya:</span>
          <span class="font-bold text-slate-900 dark:text-white">{{ admissionStore.currentMatch.displayName }}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
          <span class="text-slate-500 dark:text-slate-400">Sinf / Guruh:</span>
          <span class="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <span>{{ admissionStore.currentMatch.className }}</span>
            <span v-if="admissionStore.currentMatch.group" class="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200">
              {{ admissionStore.currentMatch.group }}
            </span>
          </span>
        </div>
        <div v-if="admissionStore.currentMatch.emaktabId" class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
          <span class="text-slate-500 dark:text-slate-400">eMaktab ID:</span>
          <span class="font-mono text-slate-800 dark:text-slate-200 text-xs">{{ admissionStore.currentMatch.emaktabId }}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
          <span class="text-slate-500 dark:text-slate-400">Ta'lim muassasasi:</span>
          <span class="font-medium text-slate-800 dark:text-slate-200">{{ admissionStore.currentMatch.schoolName }}</span>
        </div>
        <div class="flex justify-between py-1">
          <span class="text-slate-500 dark:text-slate-400">Imtihon holati:</span>
          <span class="font-semibold text-emerald-700 dark:text-emerald-400">Ruxsat berilgan</span>
        </div>
      </div>

      <div class="space-y-2">
        <button
          @click="confirmIdentity"
          aria-label="Shaxsni tasdiqlash va imtihonga o'tish"
          class="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white font-medium rounded-xl transition shadow-xs cursor-pointer text-sm min-h-[42px]"
        >
          Ha, bu men — Imtihonga o'tish
        </button>
        <button
          @click="cancel"
          aria-label="Kiritishni bekor qilish va qaytadan kiritish"
          class="w-full py-2 px-4 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl transition text-sm cursor-pointer min-h-[40px]"
        >
          Bu men emas — Qaytadan kiritish
        </button>
      </div>
    </div>

    <!-- Fallback if redirecting -->
    <div v-else class="text-center py-6">
      <div class="w-6 h-6 border-2 border-slate-400 dark:border-slate-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
      <p class="text-xs text-slate-500 dark:text-slate-400">Yo'naltirilmoqda...</p>
    </div>
  </div>
</template>
