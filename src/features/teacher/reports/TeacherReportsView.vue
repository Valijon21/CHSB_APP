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
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
      <div>
        <h1 class="text-xl font-bold text-slate-900">Hisobotlar Generatori (Reports)</h1>
        <p class="text-xs text-slate-500 mt-0.5">
          Sinf va imtihonlar bo'yicha rasmiy qaydnoma hisobotlarini shakllantirish va eksport qilish.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="downloadCSV"
          :disabled="isDownloading"
          class="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-medium rounded-lg text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:bg-slate-400"
        >
          <span>📥 Excel / CSV Yuklab Olish</span>
        </button>
        <button
          @click="printReport"
          class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition border border-slate-200 flex items-center gap-1.5 cursor-pointer"
        >
          <span>🖨️ Chop Etish / PDF</span>
        </button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <div>
          <label class="block text-[11px] font-semibold text-slate-500 mb-1">Hisobot Turi:</label>
          <select
            v-model="reportType"
            class="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700 cursor-pointer"
          >
            <option value="class">Sinf bo'yicha yig'ma qaydnoma</option>
            <option value="assessment">1-CHSB Imtihon hisoboti</option>
            <option value="grades">O'quvchilar baholar varaqasi</option>
          </select>
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-slate-500 mb-1">Sinf:</label>
          <select
            v-model="selectedClass"
            class="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700 cursor-pointer"
          >
            <option value="">Barcha sinflar</option>
            <option v-for="cls in teacherStore.classes" :key="cls.id" :value="cls.name">
              {{ cls.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="text-xs text-slate-500">
        Jami yozuvlar: <span class="font-bold text-slate-900">{{ reportItems.length }} ta</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-12">
      <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 font-medium">Hisobot tuzilmoqda...</p>
    </div>

    <!-- Report Preview Document -->
    <div v-else class="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
      <!-- Printable Document Header -->
      <div class="text-center pb-4 border-b border-slate-200 space-y-1">
        <h2 class="text-base sm:text-lg font-bold text-slate-900">
          CHORAKLIK BAHOLASH (CHSB) RASMIY QAYDNOMASI
        </h2>
        <p class="text-xs text-slate-600">
          {{ tenantStore.currentTenant?.displayName }} • Informatika va axborot texnologiyalari • 11-sinf (I chorak)
        </p>
        <p class="text-[11px] text-slate-400">
          Shakllantirilgan sana: {{ new Date().toLocaleDateString('uz-UZ') }}
        </p>
      </div>

      <!-- Report Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs sm:text-sm border-collapse">
          <thead class="bg-slate-50 text-slate-700 font-bold border-y border-slate-200">
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
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="(item, idx) in reportItems"
              :key="idx"
              class="hover:bg-slate-50/70"
            >
              <td class="p-3 font-mono text-slate-400">{{ idx + 1 }}</td>
              <td class="p-3 font-bold text-slate-900">{{ item.studentName }}</td>
              <td class="p-3 text-slate-700">{{ item.className }}</td>
              <td class="p-3 font-mono text-teal-800">{{ item.rosterCode }}</td>
              <td class="p-3 font-bold text-teal-900">{{ item.score.toFixed(1) }}</td>
              <td class="p-3 font-semibold text-slate-800">{{ item.percentage }}%</td>
              <td class="p-3 text-slate-500 font-mono text-xs">{{ item.submittedAt.slice(0, 10) }}</td>
              <td class="p-3">
                <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {{ item.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Printable Signature block -->
      <div class="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-600">
        <div>
          <span class="block text-slate-400">Fan o'qituvchisi:</span>
          <span class="font-bold text-slate-800 block mt-1">{{ teacherStore.profile?.fullName || 'Dilmurod Ustoz' }}</span>
          <span class="block border-b border-slate-300 w-48 mt-4"></span>
        </div>
        <div class="text-right">
          <span class="block text-slate-400">O'quv ishlari bo'yicha direktor o'rinbosari:</span>
          <span class="font-bold text-slate-800 block mt-1">Tasdiqlandi</span>
          <span class="block border-b border-slate-300 w-48 mt-4 ml-auto"></span>
        </div>
      </div>
    </div>
  </div>
</template>

