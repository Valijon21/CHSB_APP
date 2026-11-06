<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '../../tenant-context/tenantStore';
import { useTeacherStore } from '../teacherStore';

const route = useRoute();
const tenantStore = useTenantStore();
const teacherStore = useTeacherStore();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
const assessmentId = (route.params.assessmentId as string) || '';

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);
  const tenantId =
    tenantStore.currentTenant?.tenantId ||
    (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');
  await teacherStore.loadAssessmentDetail(tenantId, assessmentId);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Breadcrumbs -->
    <div class="flex items-center gap-2 text-xs text-slate-500">
      <router-link :to="`/t/${tenantSlug}/teacher/assessments`" class="hover:text-teal-800 underline">
        ← Baholashlar ro'yxati
      </router-link>
      <span>/</span>
      <span class="font-semibold text-slate-700">{{ teacherStore.assessmentDetail?.summary.title || 'Imtihon' }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-12">
      <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 font-medium">Imtihon tahlili yuklanmoqda...</p>
    </div>

    <!-- Content -->
    <div v-else-if="teacherStore.assessmentDetail" class="space-y-6">
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span class="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
            {{ teacherStore.assessmentDetail.summary.grade }}-sinf • {{ teacherStore.assessmentDetail.summary.quarter }}-chorak
          </span>
          <h1 class="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {{ teacherStore.assessmentDetail.summary.title }}
          </h1>
          <p class="text-xs text-slate-500 mt-1">
            Fan: {{ teacherStore.assessmentDetail.summary.subject }} • Davomiyligi: {{ teacherStore.assessmentDetail.summary.durationMinutes }} daqiqa • Jami: {{ teacherStore.assessmentDetail.summary.maxScore }} ball
          </p>
        </div>

        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span class="text-[11px] text-slate-500 block">Biriktirilgan</span>
            <span class="text-lg font-bold text-slate-900">{{ teacherStore.assessmentDetail.totalAssigned }}</span>
          </div>
          <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span class="text-[11px] text-slate-500 block">Topshirdi</span>
            <span class="text-lg font-bold text-indigo-700">{{ teacherStore.assessmentDetail.totalCompleted }}</span>
          </div>
          <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span class="text-[11px] text-slate-500 block">O'rtacha Ball</span>
            <span class="text-lg font-bold text-teal-800">{{ teacherStore.assessmentDetail.averageScore }}</span>
          </div>
        </div>
      </div>

      <!-- Question Difficulty & Cognitive Analysis Table -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Savollar Tuzilmasi va O'zlashtirish Darajasi (15 ta savol)
          </h2>
          <span class="text-xs text-slate-500">Agregat sintetik tahlil</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs sm:text-sm">
            <thead class="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th class="p-3.5">Savol №</th>
                <th class="p-3.5">Kognitiv Daraja</th>
                <th class="p-3.5">Ball Qiymati</th>
                <th class="p-3.5">To'g'ri Javob Qaydlari</th>
                <th class="p-3.5">Vizual Ko'rsatkich</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="q in teacherStore.assessmentDetail.questionStats"
                :key="q.order"
                class="hover:bg-slate-50/70"
              >
                <td class="p-3.5 font-bold text-slate-800">{{ q.order }}-savol</td>
                <td class="p-3.5 font-semibold text-slate-700">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[11px]',
                      q.cognitiveLevel === '(B)' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                      q.cognitiveLevel === '(Q)' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      'bg-purple-50 text-purple-800 border border-purple-200'
                    ]"
                  >
                    {{ q.cognitiveLevel === '(B)' ? 'Bilish (B)' : q.cognitiveLevel === '(Q)' ? "Qo'llash (Q)" : 'Mulohaza (M)' }}
                  </span>
                </td>
                <td class="p-3.5 font-mono font-bold text-teal-800">{{ q.points }} ball</td>
                <td class="p-3.5 font-bold text-slate-900">{{ q.correctRate }}%</td>
                <td class="p-3.5 w-48">
                  <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all"
                      :class="q.correctRate >= 80 ? 'bg-emerald-500' : q.correctRate >= 65 ? 'bg-amber-500' : 'bg-rose-500'"
                      :style="{ width: `${q.correctRate}%` }"
                    ></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

