<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between pb-4 border-b border-slate-200">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Tenant Administrator Sozlamalari</h2>
        <p class="text-xs text-slate-500 mt-0.5">
          Muassasa konfiguratsiyasi: <span class="font-mono text-indigo-700 font-semibold">{{ tenantSlug }}</span>
        </p>
      </div>
      <span class="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-600 font-mono">
        Tenant Admin Portal
      </span>
    </div>

    <!-- Tenant Settings Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h3 class="text-sm font-bold text-slate-900">Muassasa Ma'lumotlari</h3>
        <div class="space-y-2 text-xs">
          <div class="flex justify-between py-1 border-b border-slate-100">
            <span class="text-slate-500">Tenant Slug:</span>
            <span class="font-mono font-medium">{{ tenantSlug }}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-100">
            <span class="text-slate-500">Rasmiy Nomi:</span>
            <span class="font-medium">Al-Xorazmiy nomidagi IT-maktab</span>
          </div>
          <div class="flex justify-between py-1">
            <span class="text-slate-500">Holat:</span>
            <span class="text-emerald-700 font-semibold">Faol (Active)</span>
          </div>
        </div>
      </div>

      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h3 class="text-sm font-bold text-slate-900">Xavfsizlik & Roster Konfiguratsiyasi</h3>
        <div class="space-y-2 text-xs">
          <div class="flex justify-between py-1 border-b border-slate-100">
            <span class="text-slate-500">Kirish usuli:</span>
            <span class="font-semibold text-slate-800">Roster Lookup (Kod orqali)</span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-100">
            <span class="text-slate-500">Ochiq ro'yxatdan o'tish:</span>
            <span class="text-rose-700 font-semibold">O'chirilgan (Disabled)</span>
          </div>
          <div class="flex justify-between py-1">
            <span class="text-slate-500">Izolyatsiya darajasi:</span>
            <span class="text-indigo-800 font-mono">Tenant Strict Isolation</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
