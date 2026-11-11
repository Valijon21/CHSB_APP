<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import LanguageSwitcher from '../../shared/components/LanguageSwitcher.vue';
import ThemeToggle from '../../shared/components/ThemeToggle.vue';

const route = useRoute();
const tenantSlug = computed(() => (route.params.tenantSlug as string) || '');
</script>

<template>
  <div class="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans transition-colors">
    <!-- Header -->
    <header class="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-800/90 backdrop-blur sticky top-0 z-10 shadow-xs">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-teal-800 dark:bg-teal-700 flex items-center justify-center text-white font-black text-lg shadow-xs">
            C
          </div>
          <div>
            <h1 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">CHSB Baholash Platformasi</h1>
            <p class="text-[11px] text-slate-500 dark:text-slate-400" v-if="tenantSlug">
              Muassasa: <span class="font-semibold text-teal-700 dark:text-teal-400 font-mono">{{ tenantSlug }}</span>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <div class="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
            O'quvchi Kirishi
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:py-8 flex flex-col items-center justify-center">
      <slot>
        <router-view />
      </slot>
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>&copy; {{ new Date().getFullYear() }} CHSB Baholash Tizimi. Barcha huquqlar himoyalangan.</span>
        <span class="text-slate-400 dark:text-slate-500">Roster Admission Mode (V2)</span>
      </div>
    </footer>
  </div>
</template>

