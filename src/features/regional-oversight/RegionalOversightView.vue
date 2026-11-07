<script setup lang="ts">
import { onMounted } from 'vue';
import { useRegionalStore } from './regionalStore';
import RegionalStatsCards from './components/RegionalStatsCards.vue';
import DistrictHeatmapTable from './components/DistrictHeatmapTable.vue';
import AnomalyDetectorCard from './components/AnomalyDetectorCard.vue';

const store = useRegionalStore();

onMounted(async () => {
  await store.loadRegionalData();
});

function handleExportCsv() {
  const csvContent = store.exportRegionalCsv();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `CHSB_Xorazm_Viloyat_Hisoboti_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function handlePrint() {
  window.print();
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Official Regional Crest & Export Actions -->
    <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            Viloyat Ta'lim Boshqarmasi
          </span>
          <span class="text-xs text-slate-400 font-mono">11-Sinf ChSB Nazorati</span>
        </div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Viloyat va Tuman ChSB Super-Boshqaruv Paneli
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Xorazm viloyati bo'yicha 13 ta tuman, 538 ta maktab va 184,500 nafar o'quvchi natijalari monitoringi
        </p>
      </div>

      <!-- Action Buttons (CSV & PDF/Print) -->
      <div class="flex items-center gap-2.5 print:hidden">
        <button
          type="button"
          @click="handleExportCsv"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition cursor-pointer"
        >
          <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Excel (CSV) Eksport</span>
        </button>

        <button
          type="button"
          @click="handlePrint"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <svg class="w-4 h-4 text-teal-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Hisobotni Chop Etish (PDF)</span>
        </button>
      </div>
    </div>

    <!-- 1. Regional Overview Stats Cards -->
    <RegionalStatsCards :overview="store.overview" />

    <!-- 2. Main Regional Split: Heatmap Table (Col 8) & Anomaly Card (Col 4) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <!-- Heatmap Table -->
        <DistrictHeatmapTable
          :districts="store.sortedDistricts"
          :selected-district-id="store.selectedDistrictId"
          :sort-by="store.sortBy"
          :sort-order="store.sortOrder"
          @select-district="store.selectDistrict"
          @sort="store.setSort"
        />

        <!-- Top and Needs Improvement Schools Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Top Schools -->
          <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700 mb-3">
              <span class="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>🏆</span> Yetakchi Maktablar (Top-3)
              </span>
            </div>
            <div class="space-y-2 text-xs">
              <div
                v-for="sch in store.topSchools"
                :key="sch.id"
                class="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40"
              >
                <div>
                  <h5 class="font-bold text-slate-900 dark:text-white">{{ sch.schoolName }}</h5>
                  <span class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{{ sch.districtName }}</span>
                </div>
                <div class="text-right">
                  <span class="font-bold font-mono text-emerald-800 dark:text-emerald-300 block">{{ sch.averageScore }} ball</span>
                  <span class="text-[10px] text-emerald-600 font-semibold">{{ sch.qualityPercentage }}% sifat</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Needs Improvement Schools -->
          <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700 mb-3">
              <span class="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>⚠️</span> E'tibor Talab Maktablar
              </span>
            </div>
            <div class="space-y-2 text-xs">
              <div
                v-for="sch in store.needsImprovementSchools"
                :key="sch.id"
                class="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40"
              >
                <div>
                  <h5 class="font-bold text-slate-900 dark:text-white">{{ sch.schoolName }}</h5>
                  <span class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{{ sch.districtName }}</span>
                </div>
                <div class="text-right">
                  <span class="font-bold font-mono text-amber-800 dark:text-amber-300 block">{{ sch.averageScore }} ball</span>
                  <span class="text-[10px] text-amber-700 font-semibold">{{ sch.qualityPercentage }}% sifat</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Integrity Anomaly Detector Card -->
      <div class="lg:col-span-1">
        <AnomalyDetectorCard
          :anomalies="store.filteredAnomalies"
          @resolve="store.resolveAnomaly"
        />
      </div>
    </div>
  </div>
</template>

