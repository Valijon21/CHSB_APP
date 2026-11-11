<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '../../tenant-context/tenantStore';
import { useTeacherStore } from '../teacherStore';

const route = useRoute();
const tenantStore = useTenantStore();
const teacherStore = useTeacherStore();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
const reportType = ref<'class' | 'assessment' | 'grades'>('class');
const selectedClass = ref('');
const isDownloading = ref(false);

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);
  const tenantId =
    tenantStore.currentTenant?.tenantId ||
    (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');
  await teacherStore.loadTeacherData(tenantId);
});

const reportItems = computed(() => {
  let list = teacherStore.reportData;
  if (selectedClass.value) {
    list = list.filter((r) => r.className === selectedClass.value);
  }
  return list;
});

function downloadCSV() {
  isDownloading.value = true;
  const csvContent = teacherStore.exportResultsCSV();
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `CHSB_Hisobot_${tenantSlug}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    isDownloading.value = false;
  }, 500);
}

function printReport() {
  window.print();
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div>
        <h1 class="text-xl font-bold text-slate-900 dark:text-white">Hisobotlar Generatori (Reports)</h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Sinf va imtihonlar bo'yicha rasmiy qaydnoma hisobotlarini shakllantirish va eksport qilish.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="downloadCSV"
          :disabled="isDownloading"
          aria-label="Excel va CSV formatida yuklab olish"
          class="px-4 py-2 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white font-medium rounded-lg text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:bg-slate-400 min-h-[38px]"
        >
          <span>📥 Excel / CSV Yuklab Olish</span>
        </button>
        <button
          @click="printReport"
          aria-label="Hisobotni chop etish yoki PDF shaklida saqlash"
          class="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg text-xs transition border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer min-h-[38px]"
        >
          <span>🖨️ Chop Etish / PDF</span>
        </button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-wrap items-center justify-between gap-4 transition-colors">
      <div class="flex flex-wrap items-center gap-3">
        <div>
          <label for="teacher-report-type" class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Hisobot Turi:</label>
          <select
            id="teacher-report-type"
            v-model="reportType"
            aria-label="Hisobot turini tanlash"
            class="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-700 cursor-pointer min-h-[36px]"
          >
            <option value="class">Sinf bo'yicha yig'ma qaydnoma</option>
            <option value="assessment">1-CHSB Imtihon hisoboti</option>
            <option value="grades">O'quvchilar baholar varaqasi</option>
          </select>
        </div>

        <div>
          <label for="teacher-report-class" class="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Sinf:</label>
          <select
            id="teacher-report-class"
            v-model="selectedClass"
            aria-label="Sinfni tanlash"
            class="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-700 cursor-pointer min-h-[36px]"
          >
            <option value="">Barcha sinflar</option>
            <option v-for="cls in teacherStore.classes" :key="cls.id" :value="cls.name">
              {{ cls.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="text-xs text-slate-500 dark:text-slate-400">
        Jami yozuvlar: <span class="font-bold text-slate-900 dark:text-white">{{ reportItems.length }} ta</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-12">
      <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Hisobot tuzilmoqda...</p>
    </div>

    <!-- Report Preview Document -->
    <div v-else class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs p-6 space-y-6 transition-colors">
      <!-- Printable Document Header -->
      <div class="text-center pb-4 border-b border-slate-200 dark:border-slate-700 space-y-1">
        <h2 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          CHORAKLIK BAHOLASH (CHSB) RASMIY QAYDNOMASI
        </h2>
        <p class="text-xs text-slate-600 dark:text-slate-300">
          {{ tenantStore.currentTenant?.displayName }} • Informatika va axborot texnologiyalari • 11-sinf (I chorak)
        </p>
        <p class="text-[11px] text-slate-400 dark:text-slate-400">
          Shakllantirilgan sana: {{ new Date().toLocaleDateString('uz-UZ') }}
        </p>
      </div>

      <!-- Report Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs sm:text-sm border-collapse">
          <thead class="bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 font-bold border-y border-slate-200 dark:border-slate-700">
            <tr>
              <th class="p-3">№</th>
              <th class="p-3">O'quvchi F.I.SH.</th>
              <th class="p-3">Sinf</th>
              <th class="p-3">Roster Kodi</th>
              <th class="p-3">Ball (Max 40)</th>
              <th class="p-3">Foiz</th>
              <th class="p-3">Sana</th>
              <th class="p-3">Tasdiq</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/80">
            <tr
              v-for="(item, idx) in reportItems"
              :key="idx"
              class="hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition"
            >
              <td class="p-3 font-mono text-slate-400">{{ idx + 1 }}</td>
              <td class="p-3 font-bold text-slate-900 dark:text-white">{{ item.studentName }}</td>
              <td class="p-3 text-slate-700 dark:text-slate-300">{{ item.className }}</td>
              <td class="p-3 font-mono text-teal-800 dark:text-teal-400">{{ item.rosterCode }}</td>
              <td class="p-3 font-bold text-teal-900 dark:text-teal-300">{{ item.score.toFixed(1) }}</td>
              <td class="p-3 font-semibold text-slate-800 dark:text-slate-200">{{ item.percentage }}%</td>
              <td class="p-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{{ item.submittedAt.slice(0, 10) }}</td>
              <td class="p-3">
                <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {{ item.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Printable Signature block -->
      <div class="pt-8 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-8 text-xs text-slate-600 dark:text-slate-300">
        <div>
          <span class="block text-slate-400 dark:text-slate-400">Fan o'qituvchisi:</span>
          <span class="font-bold text-slate-800 dark:text-white block mt-1">{{ teacherStore.profile?.fullName || 'Dilmurod Ustoz' }}</span>
          <span class="block border-b border-slate-300 dark:border-slate-600 w-48 mt-4"></span>
        </div>
        <div class="text-right">
          <span class="block text-slate-400 dark:text-slate-400">O'quv ishlari bo'yicha direktor o'rinbosari:</span>
          <span class="font-bold text-slate-800 dark:text-white block mt-1">Tasdiqlandi</span>
          <span class="block border-b border-slate-300 dark:border-slate-600 w-48 mt-4 ml-auto"></span>
        </div>
      </div>
    </div>
  </div>
</template>

