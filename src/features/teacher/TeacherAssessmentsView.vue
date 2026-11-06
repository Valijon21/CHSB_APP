<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between pb-4 border-b border-slate-200">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Baholashlar Ro'yxati</h2>
        <p class="text-xs text-slate-500 mt-0.5">
          Tenant: <span class="font-mono text-indigo-700 font-semibold">{{ tenantSlug }}</span>
        </p>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
            <tr>
              <th class="p-3.5">Baholash nomi</th>
              <th class="p-3.5">Fan</th>
              <th class="p-3.5">Sinf</th>
              <th class="p-3.5">Savollar / Ball</th>
              <th class="p-3.5">Vaqt</th>
              <th class="p-3.5">Holati</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr class="hover:bg-slate-50/60">
              <td class="p-3.5 font-bold text-slate-900">1-ChSB (I chorak)</td>
              <td class="p-3.5">Informatika va AT</td>
              <td class="p-3.5">11-sinf</td>
              <td class="p-3.5">15 ta / 40 ball</td>
              <td class="p-3.5">40 daqiqa</td>
              <td class="p-3.5">
                <span class="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  Faol
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
