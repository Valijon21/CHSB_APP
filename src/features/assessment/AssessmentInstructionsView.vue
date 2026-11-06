<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTenantStore } from '../tenant-context/tenantStore';
import { useStudentAdmissionStore } from '../student-admission/admissionStore';
import { useAssessmentStore } from './assessmentStore';

const route = useRoute();
const router = useRouter();
const tenantStore = useTenantStore();
const admissionStore = useStudentAdmissionStore();
const assessmentStore = useAssessmentStore();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
const assessmentId = (route.params.assessmentId as string) || 'chsb-inf-11-q1';
const isStarting = ref(false);

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);
});

async function startExam() {
  isStarting.value = true;
  const tenantId = tenantStore.currentTenant?.tenantId || 'tenant-al-xorazmiy';
  const rosterRecordId = admissionStore.confirmedStudent?.rosterRecordId || 'rec-ax-101';

  const ok = await assessmentStore.startAssessment(tenantId, assessmentId, rosterRecordId);
  isStarting.value = false;

  if (ok) {
    router.push(`/t/${tenantSlug}/assessments/${assessmentId}/attempt`);
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
    <div class="border-b border-slate-100 pb-4 mb-6">
      <span class="inline-block px-2.5 py-1 rounded bg-teal-50 text-teal-800 text-xs font-semibold mb-2">
        I chorak baholash
      </span>
      <h2 class="text-xl sm:text-2xl font-bold text-slate-900">
        Informatika va axborot texnologiyalari, 11-sinf. 1-ChSB
      </h2>
      <p class="text-xs sm:text-sm text-slate-500 mt-1">
        Muassasa: <span class="font-medium text-slate-700">{{ tenantStore.currentTenant?.displayName }}</span>
      </p>
    </div>

    <!-- Student details badge -->
    <div v-if="admissionStore.confirmedStudent" class="mb-6 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
      <div>
        <span class="text-slate-500">O'quvchi: </span>
        <span class="font-bold text-slate-900">{{ admissionStore.confirmedStudent.displayName }}</span>
        <span class="text-slate-400"> ({{ admissionStore.confirmedStudent.className }})</span>
      </div>
      <span class="font-mono text-teal-800 font-semibold">Tasdiqlangan</span>
    </div>

    <!-- Assessment Facts Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div class="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
        <span class="block text-xs text-slate-500 font-medium">Savollar soni</span>
        <span class="text-lg font-bold text-slate-900">15 ta</span>
      </div>
      <div class="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
        <span class="block text-xs text-slate-500 font-medium">Maksimal ball</span>
        <span class="text-lg font-bold text-slate-900">40 ball</span>
      </div>
      <div class="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
        <span class="block text-xs text-slate-500 font-medium">Ajratilgan vaqt</span>
        <span class="text-lg font-bold text-teal-800">40 daqiqa</span>
      </div>
      <div class="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
        <span class="block text-xs text-slate-500 font-medium">Savol turi</span>
        <span class="text-lg font-bold text-slate-900">A / B / C / D</span>
      </div>
    </div>

    <!-- Instructions list -->
    <div class="space-y-3 text-sm text-slate-700 mb-8 bg-amber-50/60 p-4 rounded-lg border border-amber-200/70">
      <h3 class="font-semibold text-amber-900 text-xs uppercase tracking-wider">Muhim ko'rsatmalar:</h3>
      <ul class="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-amber-950">
        <li>Har bir savolda bitta to'g'ri javob variantini belgilang.</li>
        <li>Savollar navigatsiyasi orqali istalgan savolga o'tishingiz mumkin.</li>
        <li>Vaqt ko'rsatkichi 40 daqiqadan orqaga sanaydi, oxirgi 5 daqiqada ogohlantirish beriladi.</li>
        <li>Barcha savollarga javob berilgach, testni yakunlab topshiring.</li>
      </ul>
    </div>

    <div v-if="assessmentStore.errorMessage" class="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
      {{ assessmentStore.errorMessage }}
    </div>

    <div class="flex justify-end">
      <button
        @click="startExam"
        :disabled="isStarting"
        class="w-full sm:w-auto px-6 py-3 bg-teal-800 hover:bg-teal-900 disabled:bg-slate-400 text-white font-semibold rounded-lg transition shadow-xs cursor-pointer text-sm text-center flex items-center justify-center gap-2"
      >
        <span v-if="isStarting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        <span>{{ isStarting ? 'Yuklanmoqda...' : 'Imtihonni boshlash (40 daqiqa)' }}</span>
      </button>
    </div>
  </div>
</template>
