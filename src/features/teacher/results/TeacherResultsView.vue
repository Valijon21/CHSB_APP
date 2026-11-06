<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '../../tenant-context/tenantStore';
import { useTeacherStore } from '../teacherStore';

const route = useRoute();
const tenantStore = useTenantStore();
const teacherStore = useTeacherStore();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
const searchQuery = ref('');
const selectedClass = ref('');
const isExporting = ref(false);

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
    list = list.filter((r) => r.className === selectedClass.value);
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
  link.setAttribute('download', `CHSB_11_Sinf_Natijalari_${tenantSlug}.csv`);
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
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
      <div>
        <h1 class="text-xl font-bold text-slate-900">Natijalar Boshqaruvi (Results Management)</h1>
        <p class="text-xs text-slate-500 mt-0.5">
          1-CHSB topshirgan o'quvchilar natijalari, ballari va baholash statusi.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="handleExportCSV"
          :disabled="isExporting"
          class="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-medium rounded-lg text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:bg-slate-400"
        >
          <span>📥 Excel / CSV ga yuklab olish</span>
        </button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="O'quvchi ismi bo'yicha qidirish..."
          class="px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 flex-1 min-w-[200px]"
        />

        <select
          v-model="selectedClass"
          class="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700 cursor-pointer"
        >
          <option value="">Barcha sinflar</option>
          <option v-for="cls in teacherStore.classes" :key="cls.id" :value="cls.name">
            {{ cls.name }}
          </option>
        </select>
      </div>

      <div class="text-xs font-semibold text-slate-500">
        Topshirilgan ishlar: {{ filteredResults.length }} ta
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-12">
      <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 font-medium">Natijalar yuklanmoqda...</p>
    </div>

    <!-- Results Table -->
    <div v-else class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs sm:text-sm">
          <thead class="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
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
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="(res, idx) in filteredResults"
              :key="res.attemptId"
              class="hover:bg-slate-50/70"
            >
              <td class="p-3.5 text-slate-400 font-mono">{{ idx + 1 }}</td>
              <td class="p-3.5 font-bold text-slate-900">{{ res.studentName }}</td>
              <td class="p-3.5 font-medium text-slate-700">{{ res.className }}</td>
              <td class="p-3.5">
                <span class="font-bold text-teal-800 text-sm">
                  {{ res.score }}
                </span>
                <span class="text-slate-400 text-xs"> / {{ res.maxScore }}</span>
              </td>
              <td class="p-3.5 font-semibold text-slate-800">{{ res.percentage }}%</td>
              <td class="p-3.5 text-slate-500 font-mono text-xs">
                {{ res.submittedAt.slice(0, 16).replace('T', ' ') }}
              </td>
              <td class="p-3.5">
                <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {{ res.verifiedByTeacher ? 'Tasdiqlangan' : 'Dastlabki' }}
                </span>
              </td>
              <td class="p-3.5 text-right">
                <router-link
                  :to="`/t/${tenantSlug}/teacher/students/${res.rosterRecordId}`"
                  class="text-xs font-semibold text-teal-700 hover:underline"
                >
                  Ko'rish →
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredResults.length === 0" class="text-center py-10 text-xs text-slate-500">
        Natijalar topilmadi.
      </div>
    </div>
  </div>
</template>

