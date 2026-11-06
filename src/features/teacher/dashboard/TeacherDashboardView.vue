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
    <!-- Header banner -->
    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
            Pedagogik Boshqaruv
          </span>
          <span class="text-xs text-slate-400">• CHSB V2</span>
        </div>
        <h1 class="text-xl sm:text-2xl font-bold text-slate-900">
          Xush kelibsiz, {{ teacherStore.profile?.fullName || 'Dilmurod Ustoz' }}!
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 mt-1">
          {{ tenantStore.currentTenant?.displayName }} — 11-sinf Informatika va axborot texnologiyalari bo'yicha hisobotlar paneli.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <router-link
          :to="`/t/${tenantSlug}/teacher/reports`"
          class="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-medium transition shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <span>📑 Hisobot olish</span>
        </router-link>
        <router-link
          :to="`/t/${tenantSlug}/teacher/analytics`"
          class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition border border-slate-200 flex items-center gap-1.5 cursor-pointer"
        >
          <span>📉 Tahlillar</span>
        </router-link>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-12">
      <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 font-medium">O'qituvchi ma'lumotlari yuklanmoqda...</p>
    </div>

    <div v-else class="space-y-6">
      <!-- KPI Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs text-slate-500 font-medium">Jami O'quvchilar (Roster)</span>
          <div class="text-2xl font-bold text-slate-900 mt-1">
            {{ teacherStore.totalRosterCount }} nafar
          </div>
          <div class="mt-2 text-[11px] text-teal-700 font-medium flex items-center gap-1">
            <span>{{ teacherStore.totalClassesCount }} ta biriktirilgan sinf</span>
          </div>
        </div>

        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs text-slate-500 font-medium">Faol CHSB Imtihoni</span>
          <div class="text-2xl font-bold text-slate-900 mt-1">
            {{ teacherStore.assessments.length }} ta
          </div>
          <div class="mt-2 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <span>1-CHSB (15 savol, 40 ball)</span>
          </div>
        </div>

        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs text-slate-500 font-medium">Topshirilgan Ishlar</span>
          <div class="text-2xl font-bold text-slate-900 mt-1">
            {{ teacherStore.results.length }} ta
          </div>
          <div class="mt-2 text-[11px] text-indigo-600 font-medium">
            Ishtirok: {{ Math.round((teacherStore.results.length / (teacherStore.totalRosterCount || 1)) * 100) }}%
          </div>
        </div>

        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs text-slate-500 font-medium">O'rtacha Ball (40 ballik)</span>
          <div class="text-2xl font-bold text-teal-800 mt-1">
            {{ teacherStore.averageScore }} ball
          </div>
          <div class="mt-2 text-[11px] text-slate-500">
            O'rtacha: {{ ((teacherStore.averageScore / 40) * 100).toFixed(1) }}%
          </div>
        </div>
      </div>

      <!-- Quick Sections Grid: Classes & Recent Results -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Classes Overview (Col 1-2) -->
        <div class="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Biriktirilgan Sinflar va Natijalar
            </h2>
            <router-link
              :to="`/t/${tenantSlug}/teacher/classes`"
              class="text-xs text-teal-700 font-semibold hover:underline"
            >
              Barcha sinflar →
            </router-link>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="cls in teacherStore.classes"
              :key="cls.id"
              class="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-teal-500 transition"
            >
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-900 text-sm">{{ cls.name }}</span>
                <span class="text-xs font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                  {{ cls.grade }}-sinf
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">O'quvchilar: {{ cls.studentCount }} nafar</p>
              <div class="mt-3 pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                <span class="text-slate-400">{{ cls.academicYear }}</span>
                <router-link
                  :to="`/t/${tenantSlug}/teacher/classes/${cls.id}`"
                  class="font-semibold text-teal-700 hover:underline"
                >
                  Tafsilotlar →
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity & Notifications (Col 3) -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
            So'nggi Harakatlar
          </h2>

          <div class="space-y-3">
            <div
              v-for="res in teacherStore.results"
              :key="res.attemptId"
              class="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1"
            >
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-800">{{ res.studentName }}</span>
                <span class="font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                  {{ res.score }} ball
                </span>
              </div>
              <div class="flex justify-between text-slate-500 text-[11px]">
                <span>Sinf: {{ res.className }}</span>
                <span>{{ res.submittedAt.slice(0, 10) }}</span>
              </div>
            </div>

            <div class="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <span class="font-bold">Eslatma:</span>
              <p class="mt-0.5 text-[11px]">
                1-CHSB imtihonlari yakunlanishiga 3 kun qoldi. Qatnashmagan o'quvchilarga xabar bering.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

