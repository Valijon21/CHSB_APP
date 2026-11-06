<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '../tenant-context/tenantStore';
import { useTeacherStore } from './teacherStore';

const route = useRoute();
const tenantStore = useTenantStore();
const teacherStore = useTeacherStore();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);
  const tenantId = tenantStore.currentTenant?.tenantId || (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');
  await teacherStore.loadTeacherData(tenantId);
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
      <div>
        <h2 class="text-xl font-bold text-slate-900">O'qituvchi Boshqaruv Paneli</h2>
        <p class="text-xs text-slate-500 mt-0.5">
          Muassasa: <span class="font-semibold text-indigo-900">{{ tenantStore.currentTenant?.displayName }}</span>
        </p>
      </div>

      <div class="flex items-center gap-2">
        <router-link
          :to="`/t/${tenantSlug}/student`"
          class="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition"
        >
          O'quvchi kirish ekrani →
        </router-link>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading" class="text-center py-12">
      <div class="w-8 h-8 border-3 border-indigo-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500">Ma'lumotlar yuklanmoqda...</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Stat cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs text-slate-500 font-medium">Jami Roster O'quvchilari</span>
          <div class="text-2xl font-bold text-slate-900 mt-1">
            {{ teacherStore.totalRosterCount }} nafar
          </div>
          <span class="text-[11px] text-emerald-600 font-medium mt-1 inline-block">
            {{ teacherStore.totalClassesCount }} ta sinf biriktirilgan
          </span>
        </div>

        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs text-slate-500 font-medium">Faol Baholashlar</span>
          <div class="text-2xl font-bold text-slate-900 mt-1">
            {{ teacherStore.assessments.length }} ta
          </div>
          <span class="text-[11px] text-indigo-600 font-medium mt-1 inline-block">
            I chorak 1-ChSB
          </span>
        </div>

        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs text-slate-500 font-medium">Topshirilgan Testlar</span>
          <div class="text-2xl font-bold text-slate-900 mt-1">
            {{ teacherStore.results.length }} ta
          </div>
          <span class="text-[11px] text-slate-500 font-medium mt-1 inline-block">
            Tekshirilgan natijalar
          </span>
        </div>

        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs text-slate-500 font-medium">O'rtacha Ball</span>
          <div class="text-2xl font-bold text-teal-800 mt-1">
            {{ teacherStore.averageScore }}
          </div>
          <span class="text-[11px] text-slate-500 font-medium mt-1 inline-block">
            Maksimal 40 balldan
          </span>
        </div>
      </div>

      <!-- Active Assessment card -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-bold text-sm text-slate-900">Joriy Baholash Jarayoni</h3>
          <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
            Faol (Available)
          </span>
        </div>
        <div class="p-4 text-xs text-slate-600 space-y-2">
          <p class="font-medium text-slate-800">
            Informatika va axborot texnologiyalari fanidan 11-sinf o'quvchilari uchun 1-ChSB test sinovlari.
          </p>
          <div class="flex gap-4 text-slate-500">
            <span>Savollar: <strong>15 ta</strong></span>
            <span>Vaqt: <strong>40 daqiqa</strong></span>
            <span>Maksimal ball: <strong>40 ball</strong></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
