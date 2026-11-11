<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import LanguageSwitcher from '../../shared/components/LanguageSwitcher.vue';
import ThemeToggle from '../../shared/components/ThemeToggle.vue';

const route = useRoute();
const tenantSlug = computed(() => (route.params.tenantSlug as string) || 'al-xorazmiy');
</script>

<template>
  <div class="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans transition-colors">
    <!-- Header -->
    <header class="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 backdrop-blur-xs sticky top-0 z-20 shadow-xs">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-teal-700 dark:bg-teal-600 flex items-center justify-center text-white font-black text-base shadow-xs">
            CH
          </div>
          <div>
            <h1 class="text-sm md:text-base font-bold text-slate-900 dark:text-white leading-tight">
              CHSB Baholash
            </h1>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">
              Muassasa: <span class="font-semibold text-teal-700 dark:text-teal-400 font-mono">{{ tenantSlug }}</span>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Seans Faol</span>
          </span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:py-8">
      <slot>
        <router-view />
      </slot>
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 py-4 text-xs text-slate-500 dark:text-slate-400">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span class="font-medium text-slate-600 dark:text-slate-300">
          CHSB — Choraklik Baholash Milliy Tizimi
        </span>
        <span class="text-slate-400 dark:text-slate-500 text-[11px]">
          Xavfsiz va shaffof onlayn monitoring
        </span>
      </div>
    </footer>
  </div>
</template>
