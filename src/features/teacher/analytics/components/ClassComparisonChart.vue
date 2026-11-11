<script setup lang="ts">
import { ref } from 'vue';

export interface ClassComparisonItem {
  className: string;
  averageScore: number;
  maxPossibleScore: number;
  studentCount: number;
  participationRate: number;
  highestScore?: number;
  lowestScore?: number;
}

const props = defineProps<{
  comparisons: ClassComparisonItem[];
}>();

const activeIndex = ref<number | null>(null);

// Dimensions
const viewBoxWidth = 600;
const viewBoxHeight = 220;
const chartTop = 20;
const chartBottom = 170;
const chartHeight = chartBottom - chartTop;
const maxScore = 40;

// Grid lines at 10, 20, 30, 40
const gridValues = [0, 10, 20, 30, 40];

function getY(val: number) {
  return chartBottom - (val / maxScore) * chartHeight;
}

function getItemX(index: number) {
  const count = Math.max(1, props.comparisons.length);
  const slotWidth = (viewBoxWidth - 80) / count;
  return 60 + index * slotWidth + slotWidth / 2;
}

function getBarWidth() {
  const count = Math.max(1, props.comparisons.length);
  const slotWidth = (viewBoxWidth - 80) / count;
  return Math.min(52, slotWidth * 0.55);
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header & Legend -->
    <div class="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-700/80">
      <div>
        <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>📊</span>
          <span>Sinflar Kesimida O'rtacha Natijalar Taqqoslanishi</span>
        </h3>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          Har bir sinf bo'yicha o'rtacha ball va ishtirok darajasining taqqoslama dinamikasi (Max 40 ball).
        </p>
      </div>

      <!-- Legend -->
      <div class="flex items-center gap-4 text-xs">
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded bg-teal-600 dark:bg-teal-500"></span>
          <span class="text-slate-600 dark:text-slate-300 font-medium">O'rtacha Ball</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span class="text-slate-600 dark:text-slate-300 font-medium">Ishtirok (90%+)</span>
        </div>
      </div>
    </div>

    <!-- Chart Container -->
    <div class="relative w-full overflow-hidden bg-slate-50/50 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60">
      <svg
        :viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`"
        class="w-full h-auto overflow-visible select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="barTealGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0d9488" />
            <stop offset="100%" stop-color="#0f766e" />
          </linearGradient>
          <linearGradient id="barTealActiveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#14b8a6" />
            <stop offset="100%" stop-color="#0d9488" />
          </linearGradient>
        </defs>

        <!-- Horizontal Grid Lines -->
        <g class="grid-lines opacity-40 dark:opacity-20">
          <line
            v-for="gVal in gridValues"
            :key="gVal"
            x1="50"
            :y1="getY(gVal)"
            :x2="viewBoxWidth - 20"
            :y2="getY(gVal)"
            stroke="currentColor"
            stroke-dasharray="3 3"
            class="text-slate-300 dark:text-slate-600"
          />
        </g>

        <!-- Y Axis Labels -->
        <g class="y-labels text-[10px] font-mono fill-slate-400 dark:fill-slate-500">
          <text
            v-for="gVal in gridValues"
            :key="'lbl-' + gVal"
            x="42"
            :y="getY(gVal) + 3"
            text-anchor="end"
          >
            {{ gVal }}
          </text>
        </g>

        <!-- Bars -->
        <g
          v-for="(item, idx) in comparisons"
          :key="item.className"
          class="cursor-pointer transition-transform duration-200"
          @mouseenter="activeIndex = idx"
          @mouseleave="activeIndex = null"
        >
          <!-- Bar Glow / Highlight if active -->
          <rect
            v-if="activeIndex === idx"
            :x="getItemX(idx) - getBarWidth() / 2 - 4"
            :y="getY(item.averageScore) - 4"
            :width="getBarWidth() + 8"
            :height="chartBottom - getY(item.averageScore) + 4"
            rx="8"
            class="fill-teal-400/20 dark:fill-teal-300/20"
          />

          <!-- Main Bar -->
          <rect
            :x="getItemX(idx) - getBarWidth() / 2"
            :y="getY(item.averageScore)"
            :width="getBarWidth()"
            :height="Math.max(4, chartBottom - getY(item.averageScore))"
            rx="6"
            :fill="activeIndex === idx ? 'url(#barTealActiveGrad)' : 'url(#barTealGrad)'"
            class="transition-all duration-200"
          />

          <!-- Score Value on Top of Bar -->
          <text
            :x="getItemX(idx)"
            :y="getY(item.averageScore) - 6"
            text-anchor="middle"
            class="text-[11px] font-bold fill-slate-800 dark:fill-white font-mono"
          >
            {{ item.averageScore.toFixed(1) }}
          </text>

          <!-- Class Name Below Bar -->
          <text
            :x="getItemX(idx)"
            :y="chartBottom + 20"
            text-anchor="middle"
            class="text-xs font-bold fill-slate-700 dark:fill-slate-200"
          >
            {{ item.className }}
          </text>

          <!-- Participation Pill Below Name -->
          <g :transform="`translate(${getItemX(idx) - 22}, ${chartBottom + 28})`">
            <rect
              width="44"
              height="16"
              rx="8"
              class="fill-emerald-100 dark:fill-emerald-950/80 stroke-emerald-300 dark:stroke-emerald-800"
              stroke-width="1"
            />
            <text
              x="22"
              y="11"
              text-anchor="middle"
              class="text-[9px] font-bold fill-emerald-800 dark:fill-emerald-300"
            >
              {{ item.participationRate }}%
            </text>
          </g>
        </g>
      </svg>

      <!-- Interactive Tooltip Overlay -->
      <div
        v-if="activeIndex !== null && comparisons[activeIndex]"
        class="absolute top-2 right-2 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-xs text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700 pointer-events-none transition-all z-10 space-y-1 min-w-[160px]"
      >
        <div class="flex items-center justify-between font-bold border-b border-slate-700 pb-1">
          <span>{{ comparisons[activeIndex]!.className }}</span>
          <span class="text-teal-400">{{ comparisons[activeIndex]!.averageScore }} ball</span>
        </div>
        <div class="text-[11px] text-slate-300 space-y-0.5 pt-0.5">
          <div class="flex justify-between">
            <span>O'quvchilar:</span>
            <span class="font-bold text-white">{{ comparisons[activeIndex]!.studentCount }} nafar</span>
          </div>
          <div class="flex justify-between">
            <span>Ishtirok:</span>
            <span class="font-bold text-emerald-400">{{ comparisons[activeIndex]!.participationRate }}%</span>
          </div>
          <div class="flex justify-between">
            <span>O'zlashtirish:</span>
            <span class="font-bold text-white">{{ Math.round((comparisons[activeIndex]!.averageScore / 40) * 100) }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
