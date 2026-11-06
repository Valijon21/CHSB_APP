<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
const assessmentId = (route.params.assessmentId as string) || 'chsb-inf-11-q1';

function startExam() {
  router.push(`/t/${tenantSlug}/assessments/${assessmentId}/attempt`);
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
      <p class="text-sm text-slate-500 mt-1">
        Imtihonni boshlashdan oldin quyidagi qoidalar bilan diqqat bilan tanishib chiqing.
      </p>
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
      <h3 class="font-semibold text-amber-900 text-xs uppercase tracking-wider">Muhim qoidalar:</h3>
      <ul class="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-amber-950">
        <li>Har bir savolda faqat bitta to'g'ri javobni tanlang.</li>
        <li>Savollar orasida erkin harakatlanishingiz va javoblarni o'zgartirishingiz mumkin.</li>
        <li>Kiritilgan javoblar brauzeringizda avtomatik saqlanib boradi.</li>
        <li>Vaqt tugaganda test avtomatik ravishda yakunlanadi.</li>
      </ul>
    </div>

    <div class="flex flex-col sm:flex-row gap-3 justify-end">
      <button
        @click="startExam"
        class="w-full sm:w-auto px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white font-semibold rounded-lg transition shadow-xs cursor-pointer text-sm text-center"
      >
        Imtihonni boshlash (40 daqiqa)
      </button>
    </div>
  </div>
</template>
