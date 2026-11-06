<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();
const router = useRouter();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
const code = computed(() => (route.query.code as string) || 'STU-1101');

function confirmIdentity() {
  // Navigate to instructions of assessment
  router.push(`/t/${tenantSlug}/assessments/chsb-inf-11-q1/instructions`);
}

function cancel() {
  router.push(`/t/${tenantSlug}/student`);
}
</script>

<template>
  <div class="w-full max-w-md bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
    <div class="mb-5 text-center">
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-2">
        Roster Match Topildi
      </span>
      <h2 class="text-lg font-bold text-slate-900">Shaxsingizni tasdiqlang</h2>
      <p class="text-xs text-slate-500 mt-1">
        Quyidagi ma'lumotlar sizga tegishli ekanligini tasdiqlang.
      </p>
    </div>

    <div class="bg-slate-50 rounded-lg p-4 border border-slate-200/80 mb-6 space-y-2.5 text-sm">
      <div class="flex justify-between">
        <span class="text-slate-500">O'quvchi kodi:</span>
        <span class="font-mono font-semibold text-slate-800">{{ code }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-500">Ism-familiya:</span>
        <span class="font-semibold text-slate-900">Alisher Zokirov</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-500">Sinf / Guruh:</span>
        <span class="font-medium text-slate-800">11-A sinf</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-500">Maktab:</span>
        <span class="font-medium text-slate-800">Al-Xorazmiy nomidagi IT-maktab</span>
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
</template>
