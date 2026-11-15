<script setup lang="ts">
import type { RegionalOverviewStats } from '../../../entities/regional/model';

defineProps<{
  overview: RegionalOverviewStats | null;
}>();
</script>

<template>
  <div v-if="overview" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
    <!-- 1. Maktablar -->
    <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
      <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
        Jami Maktablar
      </span>
      <span class="text-xl font-black text-slate-900 dark:text-white font-mono">
        {{ overview.totalSchools }}
      </span>
      <span class="block text-[10px] text-teal-700 dark:text-teal-400 font-medium mt-0.5">
        13 ta tuman/shahar
      </span>
    </div>

    <!-- 2. O'quvchilar -->
    <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
      <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
        Jami O'quvchilar
      </span>
      <span class="text-xl font-black text-slate-900 dark:text-white font-mono">
        {{ overview.totalStudents.toLocaleString() }}
      </span>
      <span class="block text-[10px] text-slate-400 font-medium mt-0.5">
        11-sinf kontingenti
      </span>
    </div>

    <!-- 3. Ishtirok % -->
    <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
      <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
        Qamrov Foizi
      </span>
      <span class="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
        {{ overview.overallParticipationRate }}%
      </span>
      <span class="block text-[10px] text-emerald-700 dark:text-emerald-500 font-medium mt-0.5">
        Yuqori davomat
      </span>
    </div>

    <!-- 4. O'rtacha ball -->
    <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
      <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
        O'rtacha Ball
      </span>
      <span class="text-xl font-black text-teal-800 dark:text-teal-300 font-mono">
        {{ overview.overallAverageScore }}
        <span class="text-xs font-normal text-slate-400">/ 40</span>
      </span>
      <span class="block text-[10px] text-teal-600 dark:text-teal-400 font-medium mt-0.5">
        82.7% o'zlashtirish
      </span>
    </div>

    <!-- 5. Sifat ko'rsatkichi -->
    <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
      <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
        Sifat Ko'rsatkichi
      </span>
      <span class="text-xl font-black text-indigo-700 dark:text-indigo-400 font-mono">
        {{ overview.overallQualityRate }}%
      </span>
      <span class="block text-[10px] text-indigo-600 dark:text-indigo-300 font-medium mt-0.5">
        4 va 5 baholar ulushi
      </span>
    </div>

    <!-- 6. Shubhali anomaliyalar -->
    <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
      <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
        Shubhali Holatlar
      </span>
      <span class="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
        {{ overview.totalActiveAnomalies }} ta
      </span>
      <span class="block text-[10px] text-rose-700 dark:text-rose-400 font-medium mt-0.5">
        Tekshirish talab etiladi
      </span>
    </div>
  </div>
</template>
