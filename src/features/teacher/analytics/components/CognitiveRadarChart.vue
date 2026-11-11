<script setup lang="ts">
import { computed } from 'vue';

export interface CognitiveDomain {
  label: string;
  points: number;
  averageAccuracy: number;
}

export interface CognitiveBreakdown {
  knowledge: CognitiveDomain;
  application: CognitiveDomain;
  reasoning: CognitiveDomain;
}

const props = defineProps<{
  breakdown: CognitiveBreakdown;
}>();

// Radar Math for 3 Axes (Equilateral triangle)
// Center at (130, 120), Max Radius = 85
const cx = 130;
const cy = 120;
const maxR = 85;

// Angles in radians:
// Knowledge: -90 deg (-pi/2) -> top
// Application: 30 deg (pi/6) -> bottom right
// Reasoning: 150 deg (5pi/6) -> bottom left
const angles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];

function getPoint(angle: number, radiusRatio: number) {
  const r = maxR * Math.min(1, Math.max(0, radiusRatio));
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

// Grid levels at 25%, 50%, 75%, 100%
const gridLevels = [0.25, 0.5, 0.75, 1.0];

function getGridPolygon(level: number) {
  return angles
    .map((a) => {
      const pt = getPoint(a, level);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');
}

// Data polygon points
const dataPolygon = computed(() => {
  const kAcc = props.breakdown.knowledge.averageAccuracy / 100;
  const qAcc = props.breakdown.application.averageAccuracy / 100;
  const mAcc = props.breakdown.reasoning.averageAccuracy / 100;

  const p1 = getPoint(angles[0]!, kAcc);
  const p2 = getPoint(angles[1]!, qAcc);
  const p3 = getPoint(angles[2]!, mAcc);

  return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;
});

const vertices = computed(() => {
  return [
    {
      domain: props.breakdown.knowledge,
      short: 'B',
      angle: angles[0]!,
      ...getPoint(angles[0]!, props.breakdown.knowledge.averageAccuracy / 100),
      labelPos: { x: cx, y: cy - maxR - 12, anchor: 'middle' },
    },
    {
      domain: props.breakdown.application,
      short: 'Q',
      angle: angles[1]!,
      ...getPoint(angles[1]!, props.breakdown.application.averageAccuracy / 100),
      labelPos: { x: cx + maxR + 10, y: cy + maxR / 2 + 10, anchor: 'start' },
    },
    {
      domain: props.breakdown.reasoning,
      short: 'M',
      angle: angles[2]!,
      ...getPoint(angles[2]!, props.breakdown.reasoning.averageAccuracy / 100),
      labelPos: { x: cx - maxR - 10, y: cy + maxR / 2 + 10, anchor: 'end' },
    },
  ];
});

// Pedagogical recommendation
const recommendation = computed(() => {
  const mAcc = props.breakdown.reasoning.averageAccuracy;
  const qAcc = props.breakdown.application.averageAccuracy;

  if (mAcc < 65) {
    return {
      type: 'warning',
      title: "Mulohaza (M) darajasiga e'tibor qaratish tavsiya etiladi",
      body: "O'quvchilar nazariy tushunchalarni yaxshi o'zlashtirgan, biroq masalalarni chuqur tahlil qilish va murakkab muammoli vaziyatlarni yechishda qiyinchilikka duch kelishmoqda.",
    };
  } else if (qAcc < 70) {
    return {
      type: 'info',
      title: "Qo'llash (Q) ko'nikmalarini oshirish",
      body: "Amaliy dasturlash va hisoblash mashg'ulotlarini ko'paytirish maqsadga muvofiq.",
    };
  } else {
    return {
      type: 'success',
      title: "Kognitiv ko'rsatkichlar me'yorida",
      body: "Barcha yo'nalishlar bo'yicha barqaror o'zlashtirish dinamikasi qayd etildi.",
    };
  }
});
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/80">
      <div>
        <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>🧠</span>
          <span>Bloom Taksonomiyasi (Kognitiv Qobiliyatlar Radari)</span>
        </h3>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          Bilish (B), Qo'llash (Q) va Mulohaza (M) darajalari bo'yicha o'zlashtirish balansi.
        </p>
      </div>

      <span class="px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
        3 Bosqichli Diagnostika
      </span>
    </div>

    <!-- Radar & Diagnostic Cards Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center bg-slate-50/50 dark:bg-slate-900/40 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60">
      <!-- Radar SVG (5 cols) -->
      <div class="lg:col-span-5 flex justify-center">
        <svg
          viewBox="0 0 260 240"
          class="w-full max-w-[260px] h-auto overflow-visible select-none"
        >
          <defs>
            <radialGradient id="radarAreaGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#0d9488" stop-opacity="0.45" />
              <stop offset="100%" stop-color="#0d9488" stop-opacity="0.15" />
            </radialGradient>
          </defs>

          <!-- Triangular Grid Polygons -->
          <polygon
            v-for="lvl in gridLevels"
            :key="lvl"
            :points="getGridPolygon(lvl)"
            fill="none"
            class="stroke-slate-200 dark:stroke-slate-700/80"
            :stroke-width="lvl === 1.0 ? '1.5' : '1'"
            :stroke-dasharray="lvl < 1.0 ? '2 2' : 'none'"
          />

          <!-- 3 Axes Lines -->
          <line
            v-for="ang in angles"
            :key="ang"
            :x1="cx"
            :y1="cy"
            :x2="getPoint(ang, 1.0).x"
            :y2="getPoint(ang, 1.0).y"
            class="stroke-slate-300 dark:stroke-slate-700"
            stroke-width="1.2"
          />

          <!-- Data Polygon Area -->
          <polygon
            :points="dataPolygon"
            fill="url(#radarAreaGrad)"
            class="stroke-teal-600 dark:stroke-teal-400"
            stroke-width="2.5"
          />

          <!-- Vertices Dots & Labels -->
          <g v-for="v in vertices" :key="v.short">
            <circle
              :cx="v.x"
              :cy="v.y"
              r="4.5"
              class="fill-teal-600 dark:fill-teal-300 stroke-white dark:stroke-slate-900"
              stroke-width="2"
            />
            <text
              :x="v.labelPos.x"
              :y="v.labelPos.y"
              :text-anchor="v.labelPos.anchor"
              class="text-[11px] font-bold fill-slate-800 dark:fill-slate-200"
            >
              {{ v.domain.label }}
            </text>
            <text
              :x="v.labelPos.x"
              :y="v.labelPos.y + 12"
              :text-anchor="v.labelPos.anchor"
              class="text-[10px] font-mono font-bold fill-teal-700 dark:fill-teal-400"
            >
              {{ v.domain.averageAccuracy }}%
            </text>
          </g>
        </svg>
      </div>

      <!-- Domain Breakdown Cards & Recommendations (7 cols) -->
      <div class="lg:col-span-7 space-y-3">
        <div class="grid grid-cols-3 gap-2.5">
          <!-- Bilish (B) -->
          <div class="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/60">
            <div class="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300">
              <span>Bilish (B)</span>
              <span class="text-[11px] font-mono">{{ breakdown.knowledge.points }} b.</span>
            </div>
            <div class="text-xl font-bold font-mono text-blue-800 dark:text-blue-400 mt-1">
              {{ breakdown.knowledge.averageAccuracy }}%
            </div>
            <span class="text-[10px] text-blue-700/80 dark:text-blue-400 block mt-0.5">Nazariya va atamalar</span>
          </div>

          <!-- Qo'llash (Q) -->
          <div class="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/60">
            <div class="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-300">
              <span>Qo'llash (Q)</span>
              <span class="text-[11px] font-mono">{{ breakdown.application.points }} b.</span>
            </div>
            <div class="text-xl font-bold font-mono text-amber-800 dark:text-amber-400 mt-1">
              {{ breakdown.application.averageAccuracy }}%
            </div>
            <span class="text-[10px] text-amber-700/80 dark:text-amber-400 block mt-0.5">Amaliy algoritmlar</span>
          </div>

          <!-- Mulohaza (M) -->
          <div class="p-3 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-900/60">
            <div class="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-300">
              <span>Mulohaza (M)</span>
              <span class="text-[11px] font-mono">{{ breakdown.reasoning.points }} b.</span>
            </div>
            <div class="text-xl font-bold font-mono text-indigo-800 dark:text-indigo-400 mt-1">
              {{ breakdown.reasoning.averageAccuracy }}%
            </div>
            <span class="text-[10px] text-indigo-700/80 dark:text-indigo-400 block mt-0.5">Tahlil va xulosalar</span>
          </div>
        </div>

        <!-- Pedagogical Recommendation Notice -->
        <div class="p-3.5 rounded-xl border bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-start gap-3">
          <span class="text-lg">💡</span>
          <div class="text-xs space-y-0.5">
            <h4 class="font-bold text-slate-900 dark:text-white">{{ recommendation.title }}</h4>
            <p class="text-slate-600 dark:text-slate-300 leading-relaxed">{{ recommendation.body }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

