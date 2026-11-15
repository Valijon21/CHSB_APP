<script setup lang="ts">
import { ref, watch } from 'vue';
import { useNetworkStatus } from '../composables/useNetworkStatus';

const { isOnline, pendingQueueCount } = useNetworkStatus();

const showReconnectedBanner = ref(false);
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

watch(isOnline, (online, wasOnline) => {
  if (wasOnline === false && online === true) {
    showReconnectedBanner.value = true;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(() => {
      showReconnectedBanner.value = false;
    }, 4000);
  }
});
</script>

<template>
  <aside
    v-if="!isOnline"
    role="alert"
    aria-live="assertive"
    class="sticky top-0 z-50 bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs sm:text-sm animate-pulse-subtle"
  >
    <div class="flex items-center gap-2.5 max-w-5xl mx-auto w-full">
      <span class="flex h-3 w-3 relative flex-shrink-0">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
      </span>
      <div class="flex-1">
        <p class="font-semibold tracking-wide">
          Internet aloqasi uzildi (Oflayn rejim)
        </p>
        <p class="text-[11px] sm:text-xs text-amber-100 font-normal">
          Xavotir olmang: barcha javoblar va ma'lumotlar qurilma xotirasida xavfsiz saqlanmoqda. Aloqa tiklanishi bilan avtomatik yuboriladi.
          <span v-if="pendingQueueCount > 0" class="ml-1 font-bold underline">
            ({{ pendingQueueCount }} ta so'rov navbatda)
          </span>
        </p>
      </div>
    </div>
  </aside>

  <aside
    v-else-if="showReconnectedBanner"
    role="status"
    aria-live="polite"
    class="sticky top-0 z-50 bg-emerald-700 text-white px-4 py-2 shadow-md flex items-center justify-between gap-3 text-xs sm:text-sm transition-all duration-300"
  >
    <div class="flex items-center gap-2 max-w-5xl mx-auto w-full">
      <svg class="w-4 h-4 text-emerald-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <p class="font-medium text-emerald-50">
        Internet aloqasi qayta tiklandi! Tizim server bilan sinxronlandi.
      </p>
    </div>
    <button
      type="button"
      @click="showReconnectedBanner = false"
      aria-label="Xabarnomani yopish"
      class="text-emerald-200 hover:text-white p-1 rounded transition cursor-pointer"
    >
      ✕
    </button>
  </aside>
</template>

<style scoped>
@keyframes subtlePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.92; }
}
.animate-pulse-subtle {
  animation: subtlePulse 2.5s infinite ease-in-out;
}
</style>

