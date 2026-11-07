<script setup lang="ts">
import type { LiveEventStreamItem } from '../../../../entities/proctor/model';

defineProps<{
  events: LiveEventStreamItem[];
}>();

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '';
  }
}

function getBadge(severity: 'info' | 'warning' | 'danger') {
  switch (severity) {
    case 'info':
      return 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800';
    case 'warning':
      return 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 animate-pulse';
    case 'danger':
      return 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800';
  }
}
</script>

<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs p-4 flex flex-col h-full max-h-[500px]">
    <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-3">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        <h3 class="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
          Jonli Hodisalar Jurnali
        </h3>
      </div>
      <span class="text-[11px] text-slate-400 font-mono">{{ events.length }} ta</span>
    </div>

    <div class="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
      <div
        v-for="evt in events"
        :key="evt.id"
        class="p-2.5 rounded-lg border bg-slate-50/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-700/60 flex items-start justify-between gap-2 transition"
      >
        <div class="space-y-0.5 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-900 dark:text-slate-100 truncate">
              {{ evt.studentName }}
            </span>
            <span
              :class="[
                'px-1.5 py-0.5 rounded text-[10px] font-semibold border',
                getBadge(evt.severity)
              ]"
            >
              {{ evt.type }}
            </span>
          </div>
          <p class="text-slate-600 dark:text-slate-400 text-[11px] leading-snug">
            {{ evt.message }}
          </p>
        </div>

        <span class="text-[10px] text-slate-400 font-mono shrink-0">
          {{ formatTime(evt.timestamp) }}
        </span>
      </div>

      <div v-if="events.length === 0" class="text-center py-8 text-slate-400 text-xs">
        Hozircha hodisalar qayd etilmadi.
      </div>
    </div>
  </div>
</template>
