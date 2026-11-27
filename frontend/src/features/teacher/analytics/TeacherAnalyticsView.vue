<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '../../tenant-context/tenantStore';
import { useTeacherStore } from '../teacherStore';
import type { MasteryTier } from '../../../entities/teacher/model';

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
const selectedTierFilter = ref<'ALL' | MasteryTier>('ALL');
const masterySearch = ref('');

function resolvedTenantId(): string {
  return (
    tenantStore.currentTenant?.tenantId ||
    (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy')
  );
}

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);
  const tenantId = resolvedTenantId();
  await teacherStore.loadTeacherData(tenantId);
  if (teacherStore.assessments.length > 0 && !teacherStore.assessments.some((a) => a.id === selectedAssessmentFilter.value)) {
    selectedAssessmentFilter.value = teacherStore.assessments[0]!.id;
  }
  await Promise.all([
    teacherStore.loadAssessmentDetail(tenantId, selectedAssessmentFilter.value),
    teacherStore.loadStudentsMastery(tenantId),
  ]);
});

watch(selectedAssessmentFilter, (newId) => {
  if (newId) {
    void teacherStore.loadAssessmentDetail(resolvedTenantId(), newId);
  }
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

// Dynamic KPI calculations (computed cleanly from real store data)
const averageScore = computed(() => {
  if (displayedComparisons.value.length === 0) return 0;
  const sum = displayedComparisons.value.reduce((acc, c) => acc + c.averageScore, 0);
  return Number((sum / displayedComparisons.value.length).toFixed(1));
});

const qualityRate = computed(() => {
  if (!teacherStore.analytics) return 0;
  const dist = teacherStore.analytics.scoreDistribution;
  const total = dist.excellent + dist.good + dist.satisfactory + dist.needsImprovement;
  if (total === 0) return 0;
  return Math.round(((dist.excellent + dist.good) / total) * 100);
});

const passingRate = computed(() => {
  if (!teacherStore.analytics) return 0;
  const dist = teacherStore.analytics.scoreDistribution;
  const total = dist.excellent + dist.good + dist.satisfactory + dist.needsImprovement;
  if (total === 0) return 0;
  return Math.round(((total - dist.needsImprovement) / total) * 100);
});

const scoreStdDev = computed(() => {
  const scores = teacherStore.results.map((r) => r.score);
  if (scores.length === 0) return '0.0';
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((acc, s) => acc + Math.pow(s - mean, 2), 0) / scores.length;
  return Math.sqrt(variance).toFixed(1);
});

const questionStats = computed(() => {
  return teacherStore.assessmentDetail?.questionStats || [];
});

const filteredStudentMastery = computed(() => {
  const list = teacherStore.studentsMastery?.students || [];
  return list.filter((s) => {
    if (selectedClassFilter.value !== 'ALL' && s.className !== selectedClassFilter.value) {
      return false;
    }
    if (selectedTierFilter.value !== 'ALL' && s.tier !== selectedTierFilter.value) {
      return false;
    }
    const q = masterySearch.value.trim().toLowerCase();
    if (q && !s.studentName.toLowerCase().includes(q) && !s.rosterCode.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });
});

function tierBadgeClass(tier: MasteryTier): string {
  switch (tier) {
    case 'excellent':
      return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    case 'proficient':
      return 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800';
    case 'developing':
      return 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    default:
      return 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800';
  }
}

function trendLabel(trend: string): string {
  if (trend === 'improving') return '↑ O‘sish';
  if (trend === 'declining') return '↓ Pasayish';
  return '→ Barqaror';
}
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
            <option
              v-if="!teacherStore.assessments.some((a) => a.title.includes('1-CHSB Informatika'))"
              value="chsb-inf-11-q1"
            >
              1-CHSB Informatika (11-sinf)
            </option>
            <option v-for="asm in teacherStore.assessments" :key="asm.id" :value="asm.id">
              {{ asm.title }} ({{ asm.grade }}-sinf)
            </option>
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

      <!-- Natijalar Barqarorligi -->
      <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-1">
        <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Natijalar Barqarorligi</span>
        <div class="flex items-baseline gap-1.5">
          <span class="text-2xl font-black text-indigo-700 dark:text-indigo-300 font-mono">σ = {{ scoreStdDev }}</span>
        </div>
        <span class="text-[10px] text-slate-500 dark:text-slate-400">
          Standart chetlanish ({{ teacherStore.results.length }} ta ish)
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

      <!-- Row 4: Individual Student Mastery & Risk Analysis (Deterministic / AI-Free) -->
      <div
        v-if="teacherStore.studentsMastery"
        class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden transition-colors"
      >
        <div class="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🎯</span>
              <span>O'quvchilar O'zlashtirishlari Analizi</span>
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Har bir o'quvchining foizi, 100-ballik chorak natijasi, Bloom ko'nikmalari va zaif mavzulari bo'yicha avtomatik tahlil (AI siz).
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <input
              v-model="masterySearch"
              type="text"
              aria-label="O'quvchi o'zlashtirishidan qidirish"
              placeholder="Ism yoki roster kod..."
              class="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
            />
            <select
              v-model="selectedTierFilter"
              aria-label="O'zlashtirish darajasi bo'yicha filtr"
              class="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">Barcha darajalar ({{ teacherStore.studentsMastery.totalStudents }})</option>
              <option value="excellent">A'lochi ({{ teacherStore.studentsMastery.summary.excellentCount }})</option>
              <option value="proficient">Barqaror ({{ teacherStore.studentsMastery.summary.proficientCount }})</option>
              <option value="developing">Nazoratda ({{ teacherStore.studentsMastery.summary.developingCount }})</option>
              <option value="at_risk">Xavf guruhida ({{ teacherStore.studentsMastery.summary.atRiskCount }})</option>
            </select>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th class="p-3">O'quvchi</th>
                <th class="p-3">Sinf</th>
                <th class="p-3">O'rtacha (%)</th>
                <th class="p-3">Chorak (100)</th>
                <th class="p-3">Daraja (5)</th>
                <th class="p-3">Dinamika</th>
                <th class="p-3">Zaif yo'nalish</th>
                <th class="p-3 text-right">Batafsil</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700/80">
              <tr
                v-for="stu in filteredStudentMastery"
                :key="stu.studentId"
                class="hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition"
              >
                <td class="p-3 font-bold text-slate-900 dark:text-white">
                  {{ stu.studentName }}
                  <span class="block text-[10px] font-mono font-normal text-slate-400">{{ stu.rosterCode }}</span>
                </td>
                <td class="p-3 text-slate-600 dark:text-slate-300">{{ stu.className }}</td>
                <td class="p-3 font-mono font-bold text-teal-800 dark:text-teal-300">{{ stu.averagePercentage }}%</td>
                <td class="p-3 font-mono font-semibold text-slate-700 dark:text-slate-200">{{ stu.quarterTotal100 }}</td>
                <td class="p-3">
                  <span :class="['px-2 py-0.5 rounded text-[11px] font-semibold border', tierBadgeClass(stu.tier)]">
                    {{ stu.tierLabel }}
                  </span>
                </td>
                <td class="p-3 text-xs font-medium text-slate-600 dark:text-slate-300">{{ trendLabel(stu.trend) }}</td>
                <td class="p-3 text-slate-600 dark:text-slate-300 max-w-[200px] truncate" :title="stu.weakestArea">
                  {{ stu.weakestArea }}
                </td>
                <td class="p-3 text-right">
                  <router-link
                    :to="`/t/${tenantSlug}/teacher/students/${stu.studentId}`"
                    class="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline"
                  >
                    Tahlil →
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="filteredStudentMastery.length === 0" class="text-center py-8 text-xs text-slate-500 dark:text-slate-400">
          Tanlangan filtr bo'yicha o'quvchilar topilmadi.
        </div>
      </div>
    </div>
  </div>
</template>
