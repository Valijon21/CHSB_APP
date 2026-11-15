<script setup lang="ts">
import { computed } from 'vue';

export interface GradeDistributionItem {
  grade: '5' | '4' | '3' | '2';
  label: string;
  range: string;
  count: number;
  percentage: number;
  colorClass: string;
  bgClass: string;
  barColor: string;
}

const props = defineProps<{
  distribution: {
    grade5: number;
    grade4: number;
    grade3: number;
    grade2: number;
    total: number;
  };
}>();

const items = computed<GradeDistributionItem[]>(() => {
  const total = props.distribution.total || 1;
  return [
    {
      grade: '5',
      label: "A'lo (5 baho)",
      range: '86% – 100%',
      count: props.distribution.grade5,
      percentage: Math.round((props.distribution.grade5 / total) * 100),
      colorClass: 'text-emerald-700 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
      barColor: '#059669', // emerald-600
    },
    {
      grade: '4',
      label: 'Yaxshi (4 baho)',
      range: '71% – 85%',
      count: props.distribution.grade4,
      percentage: Math.round((props.distribution.grade4 / total) * 100),
      colorClass: 'text-teal-700 dark:text-teal-400',
      bgClass: 'bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800',
      barColor: '#0d9488', // teal-600
    },
    {
      grade: '3',
      label: 'Qoniqarli (3 baho)',
      range: '56% – 70%',
      count: props.distribution.grade3,
      percentage: Math.round((props.distribution.grade3 / total) * 100),
      colorClass: 'text-amber-700 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
      barColor: '#d97706', // amber-600
    },
    {
      grade: '2',
      label: 'Qoniqarsiz (2 baho)',
      range: '0% – 55%',
      count: props.distribution.grade2,
      percentage: Math.round((props.distribution.grade2 / total) * 100),
      colorClass: 'text-rose-700 dark:text-rose-400',
      bgClass: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800',
      barColor: '#e11d48', // rose-600
    },
  ];
});

const maxCount = computed(() => {
  const counts = items.value.map((i) => i.count);
  return Math.max(1, ...counts);
});
</script>

<template>
  <div
    role="region"
    aria-label="Sinf baholar taqsimoti gistogrammasi"
    class="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-4 transition-colors"
  >
    <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60">
      <div>
        <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <span>📊</span>
          <span>Baholar Taqsimoti Gistogrammasi</span>
        </h3>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          CHSB natijalari bo'yicha akademik baholar ulushi
        </p>
      </div>
      <span class="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/60">
        Jami: {{ distribution.total }} ta
      </span>
    </div>

    <!-- Histogram Bars -->
    <div class="space-y-3">
      <div
        v-for="item in items"
        :key="item.grade"
        class="space-y-1.5"
      >
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span
              :class="['w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] border', item.bgClass, item.colorClass]"
            >
              {{ item.grade }}
            </span>
            <span class="font-medium text-slate-800 dark:text-slate-200">{{ item.label }}</span>
            <span class="text-[11px] text-slate-400 dark:text-slate-400">({{ item.range }})</span>
          </div>
          <div class="flex items-center gap-2 font-mono">
            <span class="font-bold text-slate-900 dark:text-white">{{ item.count }} nafar</span>
            <span class="text-slate-400 dark:text-slate-400 text-[11px]">({{ item.percentage }}%)</span>
          </div>
        </div>

        <!-- Progress Track -->
        <div class="h-3 w-full bg-slate-100 dark:bg-slate-700/70 rounded-full overflow-hidden flex">
          <div
            class="h-full rounded-full transition-all duration-500 ease-out"
            :style="{
              width: `${(item.count / maxCount) * 100}%`,
              backgroundColor: item.barColor,
            }"
            :aria-valuenow="item.count"
            :aria-valuemax="maxCount"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>
