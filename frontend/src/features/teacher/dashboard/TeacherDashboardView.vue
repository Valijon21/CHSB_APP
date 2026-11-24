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
  await teacherStore.loadTeacherData(tenantId, true);
});
</script>

<template>
  <div class="space-y-6 font-sans">
    <!-- Header banner -->
    <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
      <div>
        <div class="flex items-center gap-2 mb-1.5">
          <span class="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
            Pedagogik Boshqaruv
          </span>
          <span class="text-xs text-slate-400 dark:text-slate-500">• CHSB V2</span>
        </div>
        <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Xush kelibsiz, {{ teacherStore.profile?.fullName || 'Anvar Ustoz' }}!
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {{ tenantStore.currentTenant?.displayName }} — 11-sinf Informatika va axborot texnologiyalari bo'yicha hisobotlar paneli.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <router-link
          :to="`/t/${tenantSlug}/teacher/reports`"
          aria-label="Hisobot olish"
          class="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer min-h-[40px]"
        >
          <span>📑 Hisobot olish</span>
        </router-link>
        <router-link
          :to="`/t/${tenantSlug}/teacher/analytics`"
          aria-label="Tahlillar ko'rish"
          class="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition border border-slate-200 dark:border-slate-600 flex items-center gap-1.5 cursor-pointer min-h-[40px]"
        >
          <span>📉 Tahlillar</span>
        </router-link>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-12">
      <div class="w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">O'qituvchi ma'lumotlari yuklanmoqda...</p>
    </div>

    <div v-else class="space-y-6">
      <!-- KPI Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs transition-colors">
          <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">Jami O'quvchilar (Roster)</span>
          <div class="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {{ teacherStore.totalRosterCount }} nafar
          </div>
          <div class="mt-2 text-[11px] text-teal-700 dark:text-teal-400 font-bold flex items-center gap-1">
            <span>{{ teacherStore.totalClassesCount }} ta biriktirilgan sinf</span>
          </div>
        </div>

        <div class="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs transition-colors">
          <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">Faol CHSB Imtihoni</span>
          <div class="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {{ teacherStore.assessments.length }} ta
          </div>
          <div class="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <span>1-CHSB (15 savol, 40 ball)</span>
          </div>
        </div>

        <div class="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs transition-colors">
          <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">Topshirilgan Ishlar</span>
          <div class="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {{ teacherStore.results.length }} ta
          </div>
          <div class="mt-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
            Ishtirok: {{ Math.round((teacherStore.results.length / (teacherStore.totalRosterCount || 1)) * 100) }}%
          </div>
        </div>

        <div class="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs transition-colors">
          <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">O'rtacha Ball (40 ballik)</span>
          <div class="text-2xl font-black text-teal-700 dark:text-teal-400 mt-1 font-mono">
            {{ teacherStore.averageScore }} ball
          </div>
          <div class="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            O'rtacha: {{ ((teacherStore.averageScore / 40) * 100).toFixed(1) }}%
          </div>
        </div>
      </div>

      <!-- Quick Sections Grid: Classes & Recent Results -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Classes Overview (Col 1-2) -->
        <div class="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs p-5 space-y-4 transition-colors">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/70">
            <h2 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Biriktirilgan Sinflar va Natijalar
            </h2>
            <router-link
              :to="`/t/${tenantSlug}/teacher/classes`"
              class="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline"
            >
              Barcha sinflar →
            </router-link>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="cls in teacherStore.classes"
              :key="cls.id"
              class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500 transition-colors"
            >
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-900 dark:text-white text-sm">{{ cls.name }}</span>
                <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  {{ cls.grade }}-sinf
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">O'quvchilar: {{ cls.studentCount }} nafar</p>
              <div class="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80 flex justify-between items-center text-xs">
                <span class="text-slate-400 dark:text-slate-500 font-mono">{{ cls.academicYear }}</span>
                <router-link
                  :to="`/t/${tenantSlug}/teacher/classes/${cls.id}`"
                  class="font-bold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Tafsilotlar →
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity & Notifications (Col 3) -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs p-5 space-y-4 transition-colors">
          <h2 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-3 border-b border-slate-100 dark:border-slate-700/70">
            So'nggi Harakatlar
          </h2>

          <div class="space-y-3">
            <div
              v-for="res in teacherStore.results"
              :key="res.attemptId"
              class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/80 text-xs space-y-1"
            >
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-800 dark:text-slate-200">{{ res.studentName }}</span>
                <span class="font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-800 font-mono">
                  {{ res.score }} ball
                </span>
              </div>
              <div class="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span>Sinf: {{ res.className }}</span>
                <span class="font-mono">{{ res.submittedAt.slice(0, 10) }}</span>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-xs">
              <span class="font-bold flex items-center gap-1">
                <span>⚠️</span> Eslatma:
              </span>
              <p class="mt-1 text-[11px] leading-relaxed">
                1-CHSB imtihonlari yakunlanishiga 3 kun qoldi. Qatnashmagan o'quvchilarga xabar bering.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
