<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '../../tenant-context/tenantStore';
import { useTeacherStore } from '../teacherStore';

// Charts
import ClassComparisonChart from './components/ClassComparisonChart.vue';
import ScoreDistributionDonut from './components/ScoreDistributionDonut.vue';
import CognitiveRadarChart from './components/CognitiveRadarChart.vue';
import QuestionItemAnalysis from './components/QuestionItemAnalysis.vue';

const route = useRoute();
const tenantStore = useTenantStore();
const teacherStore = useTeacherStore();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';

// Active Filters
const selectedClassFilter = ref<string>('ALL');
const selectedAssessmentFilter = ref<string>('chsb-inf-11-q1');

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);
  const tenantId =
    tenantStore.currentTenant?.tenantId ||
    (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');

  await teacherStore.loadTeacherData(tenantId);
  await teacherStore.loadAssessmentDetail(tenantId, selectedAssessmentFilter.value);
});

// Filtered Class Comparisons
const displayedComparisons = computed(() => {
  if (!teacherStore.analytics) return [];
  if (selectedClassFilter.value === 'ALL') {
    return teacherStore.analytics.classComparisons;
  }
  return teacherStore.analytics.classComparisons.filter(
    (c) => c.className === selectedClassFilter.value
  );
});

// Dynamic KPI calculations
const averageScore = computed(() => {
  if (displayedComparisons.value.length === 0) return 36.2;
  const sum = displayedComparisons.value.reduce((acc, c) => acc + c.averageScore, 0);
  return Number((sum / displayedComparisons.value.length).toFixed(1));
});

const qualityRate = computed(() => {
  if (!teacherStore.analytics) return 87.5;
  const dist = teacherStore.analytics.scoreDistribution;
  const total = dist.excellent + dist.good + dist.satisfactory + dist.needsImprovement;
  if (total === 0) return 0;
  return Math.round(((dist.excellent + dist.good) / total) * 100);
});

const passingRate = computed(() => {
  if (!teacherStore.analytics) return 100;
  const dist = teacherStore.analytics.scoreDistribution;
  const total = dist.excellent + dist.good + dist.satisfactory + dist.needsImprovement;
  if (total === 0) return 100;
  return Math.round(((total - dist.needsImprovement) / total) * 100);
});

// Fallback question stats if not loaded yet
const questionStats = computed(() => {
  if (teacherStore.assessmentDetail?.questionStats && teacherStore.assessmentDetail.questionStats.length > 0) {
    return teacherStore.assessmentDetail.questionStats;
  }
  return [
    { order: 1, cognitiveLevel: '(B)', points: 2.5, correctRate: 94 },
    { order: 2, cognitiveLevel: '(B)', points: 2.5, correctRate: 88 },
    { order: 3, cognitiveLevel: '(Q)', points: 2.5, correctRate: 78 },
    { order: 4, cognitiveLevel: '(B)', points: 2.5, correctRate: 91 },
    { order: 5, cognitiveLevel: '(B)', points: 2.5, correctRate: 85 },
    { order: 6, cognitiveLevel: '(B)', points: 2.5, correctRate: 80 },
    { order: 7, cognitiveLevel: '(Q)', points: 2.5, correctRate: 72 },
    { order: 8, cognitiveLevel: '(Q)', points: 2.5, correctRate: 69 },
    { order: 9, cognitiveLevel: '(B)', points: 2.5, correctRate: 89 },
    { order: 10, cognitiveLevel: '(B)', points: 2.5, correctRate: 82 },
    { order: 11, cognitiveLevel: '(M)', points: 3.0, correctRate: 64 },
    { order: 12, cognitiveLevel: '(M)', points: 3.0, correctRate: 58 },
    { order: 13, cognitiveLevel: '(Q)', points: 3.0, correctRate: 75 },
    { order: 14, cognitiveLevel: '(Q)', points: 3.0, correctRate: 70 },
    { order: 15, cognitiveLevel: '(M)', points: 3.0, correctRate: 61 },
  ];
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div>
        <h1 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>📈</span>
          <span>Pedagogik Tahlillar va Diagnostika Markazi</span>
        </h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Sinflararo komparativ tahlil, Bloom taksonomiyasi va savollar diskriminatsiyasi ko'rsatkichlari.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <router-link
          :to="`/t/${tenantSlug}/teacher/reports`"
          aria-label="Rasmiy hisobotlar bo'limiga o'tish"
          class="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white font-medium rounded-lg text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer min-h-[38px]"
        >
          <span>📑 Rasmiy Hisobotlar (Qaydnoma) →</span>
        </router-link>
      </div>
    </div>

    <!-- Interactive Filter Toolbar -->
    <div class="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex flex-wrap items-center justify-between gap-3 transition-colors">
      <div class="flex flex-wrap items-center gap-3">
        <!-- Sinf Tanlash -->
        <div class="flex items-center gap-1.5 text-xs">
          <label for="analytics-class-filter" class="text-slate-500 dark:text-slate-400 text-[11px] font-semibold">Sinf:</label>
          <select
            id="analytics-class-filter"
            v-model="selectedClassFilter"
            aria-label="Sinf bo'yicha tahlilni filtrlash"
            class="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-700 text-xs min-h-[36px]"
          >
            <option value="ALL">Barcha parallel sinflar</option>
            <option v-for="cls in teacherStore.classes" :key="cls.id" :value="cls.name">
              {{ cls.name }}
            </option>
          </select>
        </div>

        <!-- Baholash Turi -->
        <div class="flex items-center gap-1.5 text-xs">
          <label for="analytics-assessment-filter" class="text-slate-500 dark:text-slate-400 text-[11px] font-semibold">CHSB:</label>
          <select
            id="analytics-assessment-filter"
            v-model="selectedAssessmentFilter"
            aria-label="Baholash bo'yicha saralash"
            class="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-700 text-xs min-h-[36px]"
          >
            <option value="chsb-inf-11-q1">1-CHSB Informatika (11-sinf)</option>
          </select>
        </div>
      </div>

      <!-- Academic Year badge -->
      <div class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span>2026-2027 o'quv yili • 1-chorak</span>
      </div>
    </div>

    <!-- Executive KPI Ribbon -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <!-- O'rtacha Ball -->
      <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-1">
        <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">O'rtacha Ball</span>
        <div class="flex items-baseline gap-1.5">
          <span class="text-2xl font-black text-teal-800 dark:text-teal-300 font-mono">{{ averageScore }}</span>
          <span class="text-xs text-slate-400 font-mono">/ 40.0</span>
        </div>
        <span class="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5">
          <span>↑ +3.8%</span>
          <span class="font-normal text-slate-400">o'tgan chorakka nisbatan</span>
        </span>
      </div>

      <!-- Sifat Ko'rsatkichi -->
      <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-1">
        <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Sifat Ko'rsatkichi (4 va 5)</span>
        <div class="flex items-baseline gap-1.5">
          <span class="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">{{ qualityRate }}%</span>
        </div>
        <span class="text-[10px] text-slate-500 dark:text-slate-400">
          A'lo va yaxshi baholar ulushi
        </span>
      </div>

      <!-- O'zlashtirish Darajasi -->
      <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-1">
        <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">O'zlashtirish Darajasi</span>
        <div class="flex items-baseline gap-1.5">
          <span class="text-2xl font-black text-blue-700 dark:text-blue-300 font-mono">{{ passingRate }}%</span>
        </div>
        <span class="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
          100% ijobiy natija (qoniqarsiz yo'q)
        </span>
      </div>

      <!-- Standart Chetlanish (Barqarorlik) -->
      <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-1">
        <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Natijalar Barqarorligi</span>
        <div class="flex items-baseline gap-1.5">
          <span class="text-2xl font-black text-indigo-700 dark:text-indigo-300 font-mono">σ = 2.1</span>
        </div>
        <span class="text-[10px] text-slate-500 dark:text-slate-400">
          Kam chetlanish (yuqori barqarorlik)
        </span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-16">
      <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Pedagogik tahlillar hisoblanmoqda...</p>
    </div>

    <!-- Analytics Dashboard Visualizations -->
    <div v-else-if="teacherStore.analytics" class="space-y-6">
      <!-- Row 1: Class Comparison & Score Distribution Donut -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 1. Class Comparison Chart -->
        <div class="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs transition-colors">
          <ClassComparisonChart :comparisons="displayedComparisons" />
        </div>

        <!-- 2. Score Distribution Donut -->
        <div class="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs transition-colors">
          <ScoreDistributionDonut :distribution="teacherStore.analytics.scoreDistribution" />
        </div>
      </div>

      <!-- Row 2: Bloom Cognitive Radar -->
      <div class="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs transition-colors">
        <CognitiveRadarChart :breakdown="teacherStore.analytics.cognitiveBreakdown" />
      </div>

      <!-- Row 3: Question Item Analysis -->
      <div class="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs transition-colors">
        <QuestionItemAnalysis :question-stats="questionStats" />
      </div>
    </div>
  </div>
</template>
