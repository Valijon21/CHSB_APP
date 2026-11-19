<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '../../tenant-context/tenantStore';
import { useTeacherStore } from '../teacherStore';
import BsbRubricGradingModal from './BsbRubricGradingModal.vue';
import type { AssessmentResult } from '../../../entities/result/model';

const route = useRoute();
const tenantStore = useTenantStore();
const teacherStore = useTeacherStore();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
const searchQuery = ref('');
const selectedClass = ref('');
const isExporting = ref(false);
const gradingResult = ref<AssessmentResult | null>(null);
const isGradingModalOpen = ref(false);

function openGradingModal(res: AssessmentResult) {
  gradingResult.value = res;
  isGradingModalOpen.value = true;
}

function handleSaveGrading(payload: { attemptId: string; totalScore: number; feedback: string }) {
  teacherStore.updateStudentScore(payload.attemptId, payload.totalScore, true);
  isGradingModalOpen.value = false;
  gradingResult.value = null;
}

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);
  const tenantId =
    tenantStore.currentTenant?.tenantId ||
    (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');
  await teacherStore.loadTeacherData(tenantId);
});

const filteredResults = computed(() => {
  let list = teacherStore.results;
  if (selectedClass.value) {
    list = list.filter((r) => r.className === selectedClass.value || r.className?.startsWith(selectedClass.value) || selectedClass.value.startsWith(r.className));
  }
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter((r) => r.studentName.toLowerCase().includes(q));
  }
  return list;
});

function handleExportCSV() {
  isExporting.value = true;
  const csvContent = teacherStore.exportResultsCSV();
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const classLabel = selectedClass.value ? selectedClass.value.replace(/\s+/g, '_') : 'Barcha_Sinflar';
  link.setAttribute('download', `CHSB_${classLabel}_Natijalari_${tenantSlug}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    isExporting.value = false;
  }, 500);
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div>
        <h1 class="text-xl font-bold text-slate-900 dark:text-white">Natijalar Boshqaruvi (Results Management)</h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          1-CHSB topshirgan o'quvchilar natijalari, ballari va baholash statusi.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="handleExportCSV"
          :disabled="isExporting"
          aria-label="Excel va CSV formatida yuklab olish"
          class="px-4 py-2 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white font-medium rounded-lg text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:bg-slate-400 min-h-[38px]"
        >
          <span>📥 Excel / CSV ga yuklab olish</span>
        </button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-wrap items-center justify-between gap-3 transition-colors">
      <div class="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
        <input
          v-model="searchQuery"
          type="text"
          aria-label="O'quvchi ismi bo'yicha qidirish"
          placeholder="O'quvchi ismi bo'yicha qidirish..."
          class="px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-700 flex-1 min-w-[200px]"
        />

        <select
          v-model="selectedClass"
          aria-label="Sinf bo'yicha filtrlash"
          class="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-700 cursor-pointer min-h-[36px]"
        >
          <option value="">Barcha sinflar</option>
          <option v-for="cls in teacherStore.classes" :key="cls.id" :value="cls.name">
            {{ cls.name }}
          </option>
        </select>
      </div>

      <div class="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Topshirilgan ishlar: {{ filteredResults.length }} ta
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-12">
      <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Natijalar yuklanmoqda...</p>
    </div>

    <!-- Results Table -->
    <div v-else class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden transition-colors">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs sm:text-sm">
          <thead class="bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="p-3.5">№</th>
              <th class="p-3.5">O'quvchi F.I.SH.</th>
              <th class="p-3.5">Sinf</th>
              <th class="p-3.5">To'plangan Ball</th>
              <th class="p-3.5">Foiz (%)</th>
              <th class="p-3.5">Topshirilgan Vaqt</th>
              <th class="p-3.5">Holati</th>
              <th class="p-3.5 text-right">O'quvchi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/80">
            <tr
              v-for="(res, idx) in filteredResults"
              :key="res.attemptId"
              class="hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition"
            >
              <td class="p-3.5 text-slate-400 font-mono">{{ idx + 1 }}</td>
              <td class="p-3.5 font-bold text-slate-900 dark:text-white">{{ res.studentName }}</td>
              <td class="p-3.5 font-medium text-slate-700 dark:text-slate-300">{{ res.className }}</td>
              <td class="p-3.5">
                <span class="font-bold text-teal-800 dark:text-teal-400 text-sm">
                  {{ res.score }}
                </span>
                <span class="text-slate-400 dark:text-slate-400 text-xs"> / {{ res.maxScore }}</span>
              </td>
              <td class="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{{ res.percentage }}%</td>
              <td class="p-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs">
                {{ res.submittedAt.slice(0, 16).replace('T', ' ') }}
              </td>
              <td class="p-3.5">
                <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {{ res.verifiedByTeacher ? 'Tasdiqlangan' : 'Dastlabki' }}
                </span>
              </td>
              <td class="p-3.5 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    @click="openGradingModal(res)"
                    class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition cursor-pointer min-h-[32px] inline-flex items-center gap-1"
                    title="Rasmiy mezon asosida baholash"
                  >
                    <span>🏛️</span>
                    <span>Baholash</span>
                  </button>
                  <router-link
                    :to="`/t/${tenantSlug}/teacher/students/${res.rosterRecordId}`"
                    class="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline min-h-[32px] inline-flex items-center px-1"
                  >
                    Ko'rish →
                  </router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredResults.length === 0" class="text-center py-10 text-xs text-slate-500 dark:text-slate-400">
        Natijalar topilmadi.
      </div>
    </div>

    <!-- Rubric Grading Modal -->
    <BsbRubricGradingModal
      :isOpen="isGradingModalOpen"
      :result="gradingResult"
      @close="isGradingModalOpen = false"
      @save="handleSaveGrading"
    />
  </div>
</template>

