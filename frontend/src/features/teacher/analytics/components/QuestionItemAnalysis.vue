<script setup lang="ts">
import { computed, ref } from 'vue';

export interface QuestionStatItem {
  order: number;
  cognitiveLevel: string; // e.g. "(B)", "(Q)", "(M)"
  points: number;
  correctRate: number; // e.g. 94, 88, 58
}

const props = defineProps<{
  questionStats: QuestionStatItem[];
}>();

const selectedFilter = ref<'ALL' | 'B' | 'Q' | 'M'>('ALL');

const filteredStats = computed(() => {
  if (selectedFilter.value === 'ALL') {
    return props.questionStats;
  }
  return props.questionStats.filter((q) => q.cognitiveLevel.includes(selectedFilter.value));
});

// Highest and lowest accuracy questions
const hardestQuestion = computed(() => {
  if (props.questionStats.length === 0) return null;
  return [...props.questionStats].sort((a, b) => a.correctRate - b.correctRate)[0] ?? null;
});

const easiestQuestion = computed(() => {
  if (props.questionStats.length === 0) return null;
  return [...props.questionStats].sort((a, b) => b.correctRate - a.correctRate)[0] ?? null;
});

function getDifficultyBadge(rate: number) {
  if (rate >= 85) {
    return {
      label: 'Oson',
      class: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    };
  } else if (rate >= 70) {
    return {
      label: "O'rtacha",
      class: 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    };
  } else if (rate >= 55) {
    return {
      label: 'Qiyin',
      class: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    };
  } else {
    return {
      label: 'Murakkab',
      class: 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    };
  }
}

function getBarColor(rate: number) {
  if (rate >= 85) return 'bg-emerald-500';
  if (rate >= 70) return 'bg-teal-500';
  if (rate >= 55) return 'bg-amber-500';
  return 'bg-rose-500';
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header & Filter -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-700/80">
      <div>
        <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>🔍</span>
          <span>Savollar Kesimida Qiyinlik va Xatolar Tahlili (Item Analysis)</span>
        </h3>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          15 ta imtihon topshirig'i bo'yicha to'g'ri yechish aniqligi va metodik qiyinlik darajalari.
        </p>
      </div>

      <!-- Cognitive Level Filter Pills -->
      <div class="flex items-center gap-1.5 text-xs">
        <span class="text-slate-400 dark:text-slate-500 text-[11px] mr-1">Filtr:</span>
        <button
          type="button"
          @click="selectedFilter = 'ALL'"
          class="px-2.5 py-1 rounded-md font-semibold transition cursor-pointer min-h-[30px]"
          :class="selectedFilter === 'ALL' ? 'bg-teal-800 text-white dark:bg-teal-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'"
        >
          Barchasi (15)
        </button>
        <button
          type="button"
          @click="selectedFilter = 'B'"
          class="px-2.5 py-1 rounded-md font-semibold transition cursor-pointer min-h-[30px]"
          :class="selectedFilter === 'B' ? 'bg-blue-700 text-white dark:bg-blue-600' : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100'"
        >
          Bilish (B)
        </button>
        <button
          type="button"
          @click="selectedFilter = 'Q'"
          class="px-2.5 py-1 rounded-md font-semibold transition cursor-pointer min-h-[30px]"
          :class="selectedFilter === 'Q' ? 'bg-amber-700 text-white dark:bg-amber-600' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100'"
        >
          Qo'llash (Q)
        </button>
        <button
          type="button"
          @click="selectedFilter = 'M'"
          class="px-2.5 py-1 rounded-md font-semibold transition cursor-pointer min-h-[30px]"
          :class="selectedFilter === 'M' ? 'bg-indigo-700 text-white dark:bg-indigo-600' : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'"
        >
          Mulohaza (M)
        </button>
      </div>
    </div>

    <!-- Quick Insights Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div v-if="easiestQuestion" class="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between text-xs">
        <div>
          <span class="text-slate-500 dark:text-slate-400 block text-[11px]">Eng yuqori o'zlashtirilgan:</span>
          <span class="font-bold text-emerald-900 dark:text-emerald-300">
            {{ easiestQuestion.order }}-savol {{ easiestQuestion.cognitiveLevel }}
          </span>
        </div>
        <span class="text-base font-black font-mono text-emerald-700 dark:text-emerald-400">
          {{ easiestQuestion.correctRate }}% aniqlik
        </span>
      </div>

      <div v-if="hardestQuestion" class="p-3 rounded-lg bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs">
        <div>
          <span class="text-slate-500 dark:text-slate-400 block text-[11px]">Eng ko'p xato qilingan:</span>
          <span class="font-bold text-rose-900 dark:text-rose-300">
            {{ hardestQuestion.order }}-savol {{ hardestQuestion.cognitiveLevel }}
          </span>
        </div>
        <span class="text-base font-black font-mono text-rose-700 dark:text-rose-400">
          {{ hardestQuestion.correctRate }}% aniqlik
        </span>
      </div>
    </div>

    <!-- Questions Grid / List -->
    <div class="bg-slate-50/50 dark:bg-slate-900/40 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
      <div
        v-for="q in filteredStats"
        :key="q.order"
        class="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <!-- Left: Question Order & Badge -->
        <div class="flex items-center gap-2.5 min-w-[140px]">
          <span class="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-mono font-bold text-xs text-slate-800 dark:text-white">
            {{ q.order }}
          </span>
          <div>
            <span class="text-xs font-bold text-slate-800 dark:text-white">{{ q.order }}-savol</span>
            <span class="text-[10px] text-slate-500 dark:text-slate-400 block">
              {{ q.cognitiveLevel }} • {{ q.points }} ball
            </span>
          </div>
        </div>

        <!-- Middle: Accuracy Progress Bar -->
        <div class="flex-1 max-w-md space-y-1">
          <div class="flex justify-between text-[11px]">
            <span class="text-slate-500 dark:text-slate-400">To'g'ri javoblar ulushi</span>
            <span class="font-mono font-bold text-slate-800 dark:text-white">{{ q.correctRate }}%</span>
          </div>
          <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-300"
              :class="getBarColor(q.correctRate)"
              :style="{ width: `${q.correctRate}%` }"
            ></div>
          </div>
        </div>

        <!-- Right: Difficulty Tag -->
        <div class="flex items-center justify-end min-w-[90px]">
          <span
            class="px-2.5 py-0.5 rounded text-[11px] font-semibold border"
            :class="getDifficultyBadge(q.correctRate).class"
          >
            {{ getDifficultyBadge(q.correctRate).label }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

