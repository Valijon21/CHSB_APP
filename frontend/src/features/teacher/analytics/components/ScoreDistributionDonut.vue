<script setup lang="ts">
import { computed, ref } from 'vue';

export interface ScoreDistribution {
  excellent: number; // 35 - 40
  good: number; // 28 - 34.5
  satisfactory: number; // 20 - 27.5
  needsImprovement: number; // < 20
}

const props = defineProps<{
  distribution: ScoreDistribution;
}>();

const hoveredTier = ref<string | null>(null);

const totalStudents = computed(() => {
  return (
    props.distribution.excellent +
    props.distribution.good +
    props.distribution.satisfactory +
    props.distribution.needsImprovement
  );
});

// Quality index (A'lo + Yaxshi)
const qualityRate = computed(() => {
  if (totalStudents.value === 0) return 0;
  const highAchievers = props.distribution.excellent + props.distribution.good;
  return Math.round((highAchievers / totalStudents.value) * 100);
});

// Donut math
const radius = 64;
const strokeWidth = 22;
const circumference = 2 * Math.PI * radius; // ~402.12

interface TierSlice {
  key: keyof ScoreDistribution;
  label: string;
  sublabel: string;
  gradeText: string;
  color: string;
  count: number;
  percentage: number;
  dashArray: string;
  dashOffset: number;
}

const slices = computed<TierSlice[]>(() => {
  const total = Math.max(1, totalStudents.value);
  const tiers: Array<{
    key: keyof ScoreDistribution;
    label: string;
    sublabel: string;
    gradeText: string;
    color: string;
  }> = [
    {
      key: 'excellent',
      label: "A'lo (5)",
      sublabel: '35 - 40 ball',
      gradeText: '88% - 100%',
      color: '#10b981', // emerald-500
    },
    {
      key: 'good',
      label: 'Yaxshi (4)',
      sublabel: '28 - 34.5 ball',
      gradeText: '70% - 87%',
      color: '#0d9488', // teal-600
    },
    {
      key: 'satisfactory',
      label: 'Qoniqarli (3)',
      sublabel: '20 - 27.5 ball',
      gradeText: '50% - 69%',
      color: '#f59e0b', // amber-500
    },
    {
      key: 'needsImprovement',
      label: 'Qoniqarsiz (2)',
      sublabel: '< 20 ball',
      gradeText: '0% - 49%',
      color: '#f43f5e', // rose-500
    },
  ];

  let accumulatedPercent = 0;
  return tiers.map((t) => {
    const count = props.distribution[t.key];
    const pct = (count / total) * 100;
    const sliceLen = (pct / 100) * circumference;
    // Dasharray format: "sliceLen circumference"
    const dashArray = `${sliceLen} ${circumference}`;
    const dashOffset = -(accumulatedPercent / 100) * circumference;
    accumulatedPercent += pct;

    return {
      key: t.key,
      label: t.label,
      sublabel: t.sublabel,
      gradeText: t.gradeText,
      color: t.color,
      count,
      percentage: Math.round(pct),
      dashArray,
      dashOffset,
    };
  });
});
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/80">
      <div>
        <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>🎯</span>
          <span>Ballar Taqsimoti va Sifat Ko'rsatkichi</span>
        </h3>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          O'quvchilarning 5 ballik baholar shkalasi bo'yicha proporsional nisbati.
        </p>
      </div>

      <div class="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
        Sifat ko'rsatkichi: {{ qualityRate }}%
      </div>
    </div>

    <!-- Chart & Legend Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center bg-slate-50/50 dark:bg-slate-900/40 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60">
      <!-- Donut Circle (5 cols) -->
      <div class="sm:col-span-5 flex flex-col items-center justify-center relative">
        <svg
          viewBox="0 0 180 180"
          class="w-44 h-44 -rotate-90 select-none overflow-visible"
        >
          <!-- Background track -->
          <circle
            cx="90"
            cy="90"
            :r="radius"
            :stroke-width="strokeWidth"
            fill="none"
            class="stroke-slate-200 dark:stroke-slate-700/60"
          />

          <!-- Segments -->
          <circle
            v-for="slice in slices"
            :key="slice.key"
            cx="90"
            cy="90"
            :r="radius"
            :stroke="slice.color"
            :stroke-width="hoveredTier === slice.key ? strokeWidth + 4 : strokeWidth"
            :stroke-dasharray="slice.dashArray"
            :stroke-dashoffset="slice.dashOffset"
            fill="none"
            class="transition-all duration-300 cursor-pointer"
            @mouseenter="hoveredTier = slice.key"
            @mouseleave="hoveredTier = null"
          />
        </svg>

        <!-- Donut Center Text -->
        <div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span class="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {{ totalStudents }}
          </span>
          <span class="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">
            O'quvchi
          </span>
        </div>
      </div>

      <!-- Legend & Stats Cards (7 cols) -->
      <div class="sm:col-span-7 grid grid-cols-2 gap-2.5">
        <div
          v-for="slice in slices"
          :key="slice.key"
          class="p-2.5 rounded-lg border transition-all cursor-pointer"
          :class="[
            hoveredTier === slice.key
              ? 'ring-2 ring-teal-500 bg-white dark:bg-slate-800 shadow-md'
              : 'bg-white/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80'
          ]"
          @mouseenter="hoveredTier = slice.key"
          @mouseleave="hoveredTier = null"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: slice.color }"></span>
              {{ slice.label }}
            </span>
            <span class="text-xs font-mono font-bold text-slate-900 dark:text-white">
              {{ slice.count }} ta
            </span>
          </div>

          <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{{ slice.sublabel }}</span>
            <span class="font-bold font-mono" :style="{ color: slice.color }">{{ slice.percentage }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
