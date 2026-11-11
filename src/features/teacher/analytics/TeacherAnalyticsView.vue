<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '../../tenant-context/tenantStore';
import { useTeacherStore } from '../teacherStore';

const route = useRoute();
const tenantStore = useTenantStore();
const teacherStore = useTeacherStore();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);
  const tenantId =
    tenantStore.currentTenant?.tenantId ||
    (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');
  await teacherStore.loadTeacherData(tenantId);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div>
        <h1 class="text-xl font-bold text-slate-900 dark:text-white">Pedagogik Tahlillar (Analytics)</h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Sinflar o'rtasidagi natijalar taqqoslanishi, qiyinlik darajalari va o'zlashtirish dinamikasi.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
          CHSB 11-Sinf Tahlili
        </span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-12">
      <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Tahliliy ma'lumotlar hisoblanmoqda...</p>
    </div>

    <!-- Analytics Dashboard -->
    <div v-else-if="teacherStore.analytics" class="space-y-6">
      <!-- Top Comparative Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Class Comparison Card -->
        <div class="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4 transition-colors">
          <h2 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-700/80">
            Sinflar O'rtasida O'rtacha Ball Taqqoslanishi
          </h2>

          <div class="space-y-4">
            <div
              v-for="cmp in teacherStore.analytics.classComparisons"
              :key="cmp.className"
              class="space-y-1.5"
            >
              <div class="flex justify-between text-xs">
                <span class="font-bold text-slate-800 dark:text-white">{{ cmp.className }}</span>
                <span class="font-bold text-teal-800 dark:text-teal-400">{{ cmp.averageScore }} / {{ cmp.maxPossibleScore }} ball ({{ Math.round((cmp.averageScore / cmp.maxPossibleScore) * 100) }}%)</span>
              </div>
              <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  class="bg-teal-700 dark:bg-teal-500 h-full rounded-full transition-all"
                  :style="{ width: `${(cmp.averageScore / cmp.maxPossibleScore) * 100}%` }"
                ></div>
              </div>
              <div class="flex justify-between text-[11px] text-slate-400 dark:text-slate-400">
                <span>O'quvchilar: {{ cmp.studentCount }} nafar</span>
                <span>Ishtirok: {{ cmp.participationRate }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Score Distribution Card -->
        <div class="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4 transition-colors">
          <h2 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-700/80">
            Ballar Taqsimoti (O'zlashtirish Darajasi)
          </h2>

          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
              <span class="text-xs text-emerald-800 dark:text-emerald-300 font-semibold block">A'lo (35 - 40 ball)</span>
              <span class="text-2xl font-bold text-emerald-900 dark:text-emerald-200 mt-1 block">
                {{ teacherStore.analytics.scoreDistribution.excellent }} ta
              </span>
              <span class="text-[11px] text-emerald-700 dark:text-emerald-400">87.5% - 100%</span>
            </div>

            <div class="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
              <span class="text-xs text-blue-800 dark:text-blue-300 font-semibold block">Yaxshi (28 - 34.5 ball)</span>
              <span class="text-2xl font-bold text-blue-900 dark:text-blue-200 mt-1 block">
                {{ teacherStore.analytics.scoreDistribution.good }} ta
              </span>
              <span class="text-[11px] text-blue-700 dark:text-blue-400">70% - 86%</span>
            </div>

            <div class="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800">
              <span class="text-xs text-amber-800 dark:text-amber-300 font-semibold block">Qoniqarli (20 - 27.5 ball)</span>
              <span class="text-2xl font-bold text-amber-900 dark:text-amber-200 mt-1 block">
                {{ teacherStore.analytics.scoreDistribution.satisfactory }} ta
              </span>
              <span class="text-[11px] text-amber-700 dark:text-amber-400">50% - 69%</span>
            </div>

            <div class="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800">
              <span class="text-xs text-rose-800 dark:text-rose-300 font-semibold block">Qoniqarsiz (&lt; 20 ball)</span>
              <span class="text-2xl font-bold text-rose-900 dark:text-rose-200 mt-1 block">
                {{ teacherStore.analytics.scoreDistribution.needsImprovement }} ta
              </span>
              <span class="text-[11px] text-rose-700 dark:text-rose-400">0% - 49%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cognitive Breakdown (Bilish, Qo'llash, Mulohaza) -->
      <div class="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4 transition-colors">
        <h2 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-700/80">
          Kognitiv Qobiliyatlar Tahlili (B / Q / M)
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-sm text-slate-800 dark:text-white">
                {{ teacherStore.analytics.cognitiveBreakdown.knowledge.label }}
              </span>
              <span class="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                17.5 ball
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Asosiy tushunchalar, atamalar va nazariy bilimlarni eslash.
            </p>
            <div class="pt-2 flex justify-between items-center text-xs">
              <span class="text-slate-500 dark:text-slate-400">O'zlashtirish aniqligi:</span>
              <span class="font-bold text-blue-800 dark:text-blue-400 text-sm">
                {{ teacherStore.analytics.cognitiveBreakdown.knowledge.averageAccuracy }}%
              </span>
            </div>
          </div>

          <div class="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-sm text-slate-800 dark:text-white">
                {{ teacherStore.analytics.cognitiveBreakdown.application.label }}
              </span>
              <span class="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                13.5 ball
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              O'rganilgan algoritmlar, dasturlar va amaliy masalalarni yechish.
            </p>
            <div class="pt-2 flex justify-between items-center text-xs">
              <span class="text-slate-500 dark:text-slate-400">O'zlashtirish aniqligi:</span>
              <span class="font-bold text-amber-800 dark:text-amber-400 text-sm">
                {{ teacherStore.analytics.cognitiveBreakdown.application.averageAccuracy }}%
              </span>
            </div>
          </div>

          <div class="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-sm text-slate-800 dark:text-white">
                {{ teacherStore.analytics.cognitiveBreakdown.reasoning.label }}
              </span>
              <span class="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                9.0 ball
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Mantiqiy tahlil, kod xatolarini topish va natijani bashorat qilish.
            </p>
            <div class="pt-2 flex justify-between items-center text-xs">
              <span class="text-slate-500 dark:text-slate-400">O'zlashtirish aniqligi:</span>
              <span class="font-bold text-indigo-800 dark:text-indigo-400 text-sm">
                {{ teacherStore.analytics.cognitiveBreakdown.reasoning.averageAccuracy }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

