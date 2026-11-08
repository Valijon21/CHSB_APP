<script setup lang="ts">
defineProps<{
  stats: {
    total: number;
    exact: number;
    fuzzy: number;
    unmatchedEmaktab: number;
    unmatchedChsb: number;
    gradesCount: Record<number, number>;
    absentCount: number;
    averagePercentage: number;
    reconciliationRate: number;
  };
  clipboardCopied: boolean;
}>();

const emit = defineEmits<{
  (e: 'copy-clipboard'): void;
  (e: 'download-csv'): void;
  (e: 'open-thresholds'): void;
}>();
</script>

<template>
  <div class="space-y-4">
    <!-- 1. Statistik Kichik Kartochkalar (Overview Metrics) -->
    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
      <!-- Jami -->
      <div class="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Jami Qator</span>
        <span class="text-lg font-black text-slate-900 dark:text-white font-mono">{{ stats.total }}</span>
        <span class="block text-[10px] text-slate-400 font-medium">o'quvchi</span>
      </div>

      <!-- Moslik % -->
      <div class="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <span class="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block">Moslik Qamrovi</span>
        <span class="text-lg font-black text-teal-700 dark:text-teal-300 font-mono">{{ stats.reconciliationRate }}%</span>
        <span class="block text-[10px] text-teal-600/70 font-medium">{{ stats.exact + stats.fuzzy }} ta topildi</span>
      </div>

      <!-- O'rtacha foiz -->
      <div class="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">O'rtacha Natija</span>
        <span class="text-lg font-black text-slate-900 dark:text-white font-mono">{{ stats.averagePercentage }}%</span>
        <span class="block text-[10px] text-slate-400 font-medium">CHSB o'rtachasi</span>
      </div>

      <!-- 5-baho -->
      <div class="bg-white dark:bg-slate-800 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/40 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-2xs">
        <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">5 (A'lo)</span>
        <span class="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">{{ stats.gradesCount[5] ?? 0 }}</span>
        <span class="block text-[10px] text-emerald-600/70 font-medium">ta o'quvchi</span>
      </div>

      <!-- 4-baho -->
      <div class="bg-white dark:bg-slate-800 p-3 rounded-xl border border-teal-100 dark:border-teal-800/40 bg-teal-50/20 dark:bg-teal-950/10 shadow-2xs">
        <span class="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 block">4 (Yaxshi)</span>
        <span class="text-lg font-black text-teal-600 dark:text-teal-400 font-mono">{{ stats.gradesCount[4] ?? 0 }}</span>
        <span class="block text-[10px] text-teal-600/70 font-medium">ta o'quvchi</span>
      </div>

      <!-- 3-baho -->
      <div class="bg-white dark:bg-slate-800 p-3 rounded-xl border border-amber-100 dark:border-amber-800/40 bg-amber-50/20 dark:bg-amber-950/10 shadow-2xs">
        <span class="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">3 (Qoniqarli)</span>
        <span class="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">{{ stats.gradesCount[3] ?? 0 }}</span>
        <span class="block text-[10px] text-amber-600/70 font-medium">ta o'quvchi</span>
      </div>

      <!-- Qatnashmagan -->
      <div class="bg-white dark:bg-slate-800 p-3 rounded-xl border border-rose-100 dark:border-rose-800/40 bg-rose-50/20 dark:bg-rose-950/10 shadow-2xs">
        <span class="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">Qatnashmagan</span>
        <span class="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">{{ stats.absentCount }}</span>
        <span class="block text-[10px] text-rose-600/70 font-medium">ta o'quvchi</span>
      </div>
    </div>

    <!-- 2. Asosiy Amal Tugmalari (Action Bar) -->
    <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="emit('open-thresholds')"
          class="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Mezonlarni Sozlash
        </button>
      </div>

      <div class="flex items-center gap-2.5 w-full sm:w-auto">
        <!-- 1-Click Clipboard Copy Button -->
        <button
          type="button"
          @click="emit('copy-clipboard')"
          :class="[
            'flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer',
            clipboardCopied
              ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
              : 'bg-teal-600 hover:bg-teal-700 text-white',
          ]"
        >
          <svg v-if="!clipboardCopied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          {{ clipboardCopied ? "Nusxalandi! (eMaktabga Ctrl+V bosing)" : "Jurnalga nusxalash (Ctrl+V)" }}
        </button>

        <!-- CSV Yuklab olish -->
        <button
          type="button"
          @click="emit('download-csv')"
          class="flex-1 sm:flex-none px-4 py-2.5 bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          eMaktab CSV Yuklab olish
        </button>
      </div>
    </div>
  </div>
</template>
