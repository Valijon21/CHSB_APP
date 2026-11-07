<script setup lang="ts">
import { ref, computed } from 'vue';
import { useNetworkStatus } from '../composables/useNetworkStatus';

const props = defineProps<{
  pendingCount?: number;
  offlineEmergencyHash?: string;
}>();

const { isOnline, offlineSince, reconnectedAt } = useNetworkStatus();
const isHashModalOpen = ref(false);

const displayPendingCount = computed(() => props.pendingCount ?? 0);
</script>

<template>
  <div>
    <!-- Offline Alert Banner -->
    <div
      v-if="!isOnline"
      class="bg-amber-600 text-white text-xs sm:text-sm px-4 py-2 flex items-center justify-between shadow-md transition-all animate-in slide-in-from-top"
      role="status"
    >
      <div class="flex items-center gap-2 max-w-2xl">
        <svg class="w-4 h-4 shrink-0 text-amber-200 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-12.728 0m0 0l2.829-2.829m-2.829 2.829L3 21M8.464 15.536a5 5 0 010-7.072m0 0l2.829 2.829" />
        </svg>
        <span>
          <strong>Internet aloqasi uzildi:</strong> Tizim oflayn rejimda ishlamoqda. Javoblaringiz mahalliy xotirada to'liq saqlanadi.
        </span>
      </div>

      <div class="flex items-center gap-2">
        <span
          v-if="displayPendingCount > 0"
          class="bg-amber-800 text-amber-100 px-2 py-0.5 rounded text-[11px] font-semibold"
        >
          {{ displayPendingCount }} ta kutilmoqda
        </span>

        <button
          v-if="offlineEmergencyHash"
          type="button"
          @click="isHashModalOpen = true"
          class="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded text-[11px] font-medium transition cursor-pointer"
        >
          Favqulodda kod
        </button>
      </div>
    </div>

    <!-- Reconnected Flash Banner -->
    <div
      v-else-if="reconnectedAt && !offlineSince"
      class="bg-emerald-600 text-white text-xs px-4 py-1.5 flex items-center justify-between transition-all"
    >
      <span class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-200 animate-ping"></span>
        Internet aloqasi tiklandi. Ma'lumotlar sinxronlanmoqda...
      </span>
    </div>

    <!-- Emergency Offline Verification Code Modal -->
    <div
      v-if="isHashModalOpen && offlineEmergencyHash"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center">
        <div class="w-12 h-12 mx-auto rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center mb-3 text-teal-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <h3 class="text-base font-bold text-slate-900 mb-1">
          Oflayn Topshirish Kod-Kvitansiyasi
        </h3>
        <p class="text-xs text-slate-500 mb-4">
          Internet umuman tiklanmasa, ushbu kodni imtihon nazoratchisi daftarchasiga yozib bering.
        </p>

        <div class="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-base font-bold tracking-widest selection:bg-emerald-900 mb-4">
          {{ offlineEmergencyHash }}
        </div>

        <button
          type="button"
          @click="isHashModalOpen = false"
          class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition cursor-pointer"
        >
          Yopish
        </button>
      </div>
    </div>
  </div>
</template>

