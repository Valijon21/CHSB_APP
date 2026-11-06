<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between pb-4 border-b border-slate-200">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Sinflar va Roster Ro'yxati</h2>
        <p class="text-xs text-slate-500 mt-0.5">
          Tenant: <span class="font-mono text-indigo-700 font-semibold">{{ tenantSlug }}</span>
        </p>
      </div>
      <span class="text-xs px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 font-semibold border border-indigo-100">
        Sintetik Roster Rejimi
      </span>
    </div>

    <!-- Class list cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-3">
          <span class="text-base font-bold text-slate-900">11-A sinf</span>
          <span class="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">25 o'quvchi</span>
        </div>
        <p class="text-xs text-slate-500 mb-4">Informatika yo'nalishi (I chorak)</p>
        <div class="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
          <div>O'quvchi kodlari formati: <code class="font-bold text-indigo-900">STU-1101 ... STU-1125</code></div>
          <div>Holati: <span class="text-emerald-700 font-medium">Barchasi tasdiqlangan</span></div>
        </div>
      </div>

      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-3">
          <span class="text-base font-bold text-slate-900">11-B sinf</span>
          <span class="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">23 o'quvchi</span>
        </div>
        <p class="text-xs text-slate-500 mb-4">Axborot texnologiyalari yo'nalishi (I chorak)</p>
        <div class="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
          <div>O'quvchi kodlari formati: <code class="font-bold text-indigo-900">STU-1126 ... STU-1148</code></div>
          <div>Holati: <span class="text-emerald-700 font-medium">Barchasi tasdiqlangan</span></div>
        </div>
      </div>
    </div>
  </div>
</template>
