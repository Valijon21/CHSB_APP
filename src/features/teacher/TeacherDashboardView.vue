<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
      <div>
        <h2 class="text-xl font-bold text-slate-900">O'qituvchi Boshqaruv Paneli</h2>
        <p class="text-xs text-slate-500 mt-0.5">
          Tenant: <span class="font-mono text-indigo-700 font-semibold">{{ tenantSlug }}</span> bo'yicha imtihonlar monitoringi
        </p>
      </div>

      <div class="flex items-center gap-2">
        <router-link
          :to="`/t/${tenantSlug}/student`"
          class="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition"
        >
          O'quvchi kirish havolasi
        </router-link>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
        <span class="text-xs text-slate-500 font-medium">Jami Roster O'quvchilari</span>
        <div class="text-2xl font-bold text-slate-900 mt-1">48 nafar</div>
        <span class="text-[11px] text-emerald-600 font-medium mt-1 inline-block">2 ta sinf biriktirilgan</span>
      </div>

      <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
        <span class="text-xs text-slate-500 font-medium">Faol Baholashlar</span>
        <div class="text-2xl font-bold text-slate-900 mt-1">1 ta</div>
        <span class="text-[11px] text-indigo-600 font-medium mt-1 inline-block">11-sinf I chorak 1-ChSB</span>
      </div>

      <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
        <span class="text-xs text-slate-500 font-medium">Topshirilgan Testlar</span>
        <div class="text-2xl font-bold text-slate-900 mt-1">36 ta</div>
        <span class="text-[11px] text-slate-500 font-medium mt-1 inline-block">75% ishtirok ko'rsatkichi</span>
      </div>

      <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
        <span class="text-xs text-slate-500 font-medium">O'rtacha Ball</span>
        <div class="text-2xl font-bold text-teal-800 mt-1">32.4</div>
        <span class="text-[11px] text-slate-500 font-medium mt-1 inline-block">Maksimal 40 balldan</span>
      </div>
    </div>

    <!-- Active Assessments table preview -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-sm text-slate-900">Joriy Baholash Jarayoni</h3>
        <span class="text-xs text-slate-500 font-mono">1-ChSB (2026/2027)</span>
      </div>
      <div class="p-4 text-xs text-slate-600">
        Informatika va axborot texnologiyalari fanidan 11-sinf o'quvchilari uchun 1-ChSB test sinovlari faol rejimda o'tkazilmoqda.
      </div>
    </div>
  </div>
</template>
