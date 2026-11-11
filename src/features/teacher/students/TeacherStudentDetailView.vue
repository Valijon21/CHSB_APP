<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '../../tenant-context/tenantStore';
import { useTeacherStore } from '../teacherStore';

const route = useRoute();
const tenantStore = useTenantStore();
const teacherStore = useTeacherStore();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
const studentId = (route.params.studentId as string) || '';

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);
  const tenantId =
    tenantStore.currentTenant?.tenantId ||
    (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');
  await teacherStore.loadStudentDetail(tenantId, studentId);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Breadcrumbs -->
    <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
      <router-link :to="`/t/${tenantSlug}/teacher/students`" class="hover:text-teal-800 dark:hover:text-teal-400 underline">
        ← O'quvchilar ro'yxati
      </router-link>
      <span>/</span>
      <span class="font-semibold text-slate-700 dark:text-slate-200">
        {{ teacherStore.studentDetail?.roster.firstName }} {{ teacherStore.studentDetail?.roster.lastName }}
      </span>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-12">
      <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">O'quvchi ma'lumotlari yuklanmoqda...</p>
    </div>

    <!-- Student Profile Content -->
    <div v-else-if="teacherStore.studentDetail" class="space-y-6">
      <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-full bg-teal-800 dark:bg-teal-700 text-white flex items-center justify-center font-bold text-lg shadow-xs">
            {{ teacherStore.studentDetail.roster.firstName.charAt(0) }}{{ teacherStore.studentDetail.roster.lastName.charAt(0) }}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-xl font-bold text-slate-900 dark:text-white">
                {{ teacherStore.studentDetail.roster.firstName }} {{ teacherStore.studentDetail.roster.lastName }} {{ teacherStore.studentDetail.roster.middleName || '' }}
              </h1>
              <span
                :class="[
                  'px-2 py-0.5 rounded text-[11px] font-semibold',
                  teacherStore.studentDetail.roster.status === 'eligible'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                ]"
              >
                {{ teacherStore.studentDetail.roster.status === 'eligible' ? 'Faol Ruxsat' : 'Nofaol' }}
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Roster Kodi: <span class="font-mono font-bold text-teal-800 dark:text-teal-400">{{ teacherStore.studentDetail.roster.rosterCode }}</span>
              • Sinf: <span class="font-semibold text-slate-700 dark:text-slate-300">{{ teacherStore.studentDetail.className }}</span>
              • {{ teacherStore.studentDetail.schoolName }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
            <span class="text-xs text-slate-500 dark:text-slate-400 block">O'rtacha Ball</span>
            <span class="text-xl font-bold text-teal-800 dark:text-teal-400">{{ teacherStore.studentDetail.averageScore }} / 40</span>
          </div>
          <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
            <span class="text-xs text-slate-500 dark:text-slate-400 block">Davomat</span>
            <span class="text-xl font-bold text-indigo-700 dark:text-indigo-400">{{ teacherStore.studentDetail.attendanceRate }}%</span>
          </div>
        </div>
      </div>

      <!-- Test History Table -->
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden transition-colors">
        <div class="p-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
          <h2 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Topshirilgan Testlar Tarixi
          </h2>
          <span class="text-xs text-slate-500 dark:text-slate-400">
            Jami: {{ teacherStore.studentDetail.results.length }} ta imtihon
          </span>
        </div>

        <div v-if="teacherStore.studentDetail.results.length > 0" class="overflow-x-auto">
          <table class="w-full text-left text-xs sm:text-sm">
            <thead class="bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th class="p-3.5">Imtihon Nomi</th>
                <th class="p-3.5">Fan</th>
                <th class="p-3.5">Ball</th>
                <th class="p-3.5">Maksimal Ball</th>
                <th class="p-3.5">Foiz (%)</th>
                <th class="p-3.5">Topshirilgan Sana</th>
                <th class="p-3.5">Holati</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700/80">
              <tr
                v-for="res in teacherStore.studentDetail.results"
                :key="res.attemptId"
                class="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition"
              >
                <td class="p-3.5 font-bold text-slate-800 dark:text-white">1-CHSB Baholash</td>
                <td class="p-3.5 text-slate-600 dark:text-slate-300">Informatika va AT</td>
                <td class="p-3.5 font-bold text-teal-800 dark:text-teal-400 text-base">{{ res.score }}</td>
                <td class="p-3.5 text-slate-500 dark:text-slate-400">{{ res.maxScore }}</td>
                <td class="p-3.5 font-semibold text-slate-800 dark:text-white">{{ res.percentage }}%</td>
                <td class="p-3.5 text-slate-500 dark:text-slate-400 font-mono">{{ res.submittedAt.slice(0, 16).replace('T', ' ') }}</td>
                <td class="p-3.5">
                  <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Tasdiqlangan
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="text-center py-10 text-xs text-slate-500 dark:text-slate-400">
          Ushbu o'quvchi hali birorta ham test topshirmagan.
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <p class="text-sm text-slate-500 dark:text-slate-400">O'quvchi topilmadi yoki bu muassasaga tegishli emas.</p>
      <router-link
        :to="`/t/${tenantSlug}/teacher/students`"
        class="mt-3 inline-block text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline min-h-[36px]"
      >
        O'quvchilar ro'yxatiga qaytish
      </router-link>
    </div>
  </div>
</template>

