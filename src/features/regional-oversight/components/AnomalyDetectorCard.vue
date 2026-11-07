<script setup lang="ts">
import type { IntegrityAnomaly } from '../../../entities/regional/model';

defineProps<{
  anomalies: IntegrityAnomaly[];
}>();

const emit = defineEmits<{
  (e: 'resolve', anomalyId: string): void;
}>();

function formatAnomalyType(type: IntegrityAnomaly['type']) {
  switch (type) {
    case 'speed_anomaly':
      return 'O\'ta tez topshirish (shubha)';
    case 'cluster_error':
      return 'Bir xil klaster xatolik';
    case 'high_violations':
      return 'Ko\'p qoidabuzarlik to\'plami';
  }
}
</script>

<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs p-4 flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-3">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
        <h3 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Akademik Halollik & Anomaliyalar Auditi
        </h3>
      </div>
      <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800">
        {{ anomalies.length }} ta faol
      </span>
    </div>

    <!-- Anomaly Cards List -->
    <div class="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
      <div
        v-for="anom in anomalies"
        :key="anom.id"
        class="p-3 rounded-lg border bg-rose-50/40 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/60 space-y-2 text-xs transition"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-900 dark:text-white">
                {{ anom.schoolName }}
              </span>
              <span class="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                ({{ anom.districtName }}, {{ anom.className }})
              </span>
            </div>
            <span class="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200">
              {{ formatAnomalyType(anom.type) }}
            </span>
          </div>

          <span
            :class="[
              'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
              anom.severity === 'high'
                ? 'bg-rose-700 text-white'
                : 'bg-amber-600 text-white'
            ]"
          >
            {{ anom.severity === 'high' ? 'Yuqori xavf' : 'O\'rta xavf' }}
          </span>
        </div>

        <p class="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
          {{ anom.description }}
        </p>

        <div class="flex items-center justify-between pt-2 border-t border-rose-100 dark:border-rose-900/40">
          <span class="text-[10px] text-slate-400">
            Fan: <strong>{{ anom.subject }}</strong>
          </span>

          <button
            type="button"
            @click="emit('resolve', anom.id)"
            class="px-2.5 py-1 rounded bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            Tekshirildi ✓
          </button>
        </div>
      </div>

      <div v-if="anomalies.length === 0" class="text-center py-8 text-slate-400 text-xs">
        Hech qanday shubhali anomaliya aniqlanmadi. Tizim to'liq barqaror.
      </div>
    </div>
  </div>
</template>
