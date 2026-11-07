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
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
      <div>
        <h1 class="text-xl font-bold text-slate-900">Baholashlar Boshqaruvi (Assessments Catalog)</h1>
        <p class="text-xs text-slate-500 mt-0.5">
          CHSB choraklik imtihonlari va ularning faollik holatlari.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          I Chorak Baholashlari Faol
        </span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-12">
      <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 font-medium">Baholashlar yuklanmoqda...</p>
    </div>

    <!-- Assessments Cards -->
    <div v-else class="space-y-4">
      <div
        v-for="asm in teacherStore.assessments"
        :key="asm.id"
        class="bg-white rounded-xl border border-slate-200 shadow-xs p-6 hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              {{ asm.grade }}-sinf
            </span>
            <span class="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
              {{ asm.quarter }}-chorak
            </span>
            <span class="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
              {{ asm.status === 'available' ? 'Faol / Ochiq' : 'Rejalashtirilgan' }}
            </span>
          </div>

          <h2 class="text-lg font-bold text-slate-900">
            {{ asm.title }}
          </h2>
          <p class="text-xs text-slate-500">
            Fan: <span class="font-medium text-slate-700">{{ asm.subject }}</span> • Maksimal ball: <span class="font-bold text-teal-800">{{ asm.maxScore }} ball</span>
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-6 text-xs text-slate-600">
          <div class="text-center">
            <span class="text-slate-400 block text-[11px]">Savollar</span>
            <span class="font-bold text-slate-900 text-sm">{{ asm.questionCount }} ta</span>
          </div>
          <div class="text-center">
            <span class="text-slate-400 block text-[11px]">Vaqt</span>
            <span class="font-bold text-slate-900 text-sm">{{ asm.durationMinutes }} daqiqa</span>
          </div>
          <div class="text-center">
            <span class="text-slate-400 block text-[11px]">Ishtirok</span>
            <span class="font-bold text-indigo-700 text-sm">
              {{ teacherStore.results.length }} ta topshirildi
            </span>
          </div>

          <div class="flex items-center gap-2">
            <router-link
              :to="`/t/${tenantSlug}/teacher/assessments/${asm.id}/live`"
              class="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold transition flex items-center gap-1.5 shadow-2xs text-xs"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-ping"></span>
              <span>Jonli Nazorat</span>
            </router-link>

            <router-link
              :to="`/t/${tenantSlug}/teacher/assessments/${asm.id}`"
              class="px-3 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg font-semibold transition text-xs"
            >
              Tahlilni ko'rish →
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

