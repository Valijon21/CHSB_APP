<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();
const tenantSlug = computed(() => (route.params.tenantSlug as string) || '');
</script>

<template>
  <div class="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-800">
    <header class="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-xs">
      <div class="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-teal-800 flex items-center justify-center text-white font-bold">
            C
          </div>
          <div>
            <h1 class="text-sm md:text-base font-semibold text-slate-900 leading-tight">CHSB Baholash</h1>
            <p class="text-xs text-slate-500">
              Muassasa: <span class="font-medium text-slate-700 font-mono">{{ tenantSlug }}</span>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            Seans Faol
          </span>
        </div>
      </div>
    </header>

    <main class="flex-1 max-w-4xl w-full mx-auto p-4 md:py-8">
      <slot>
        <router-view />
      </slot>
    </main>

    <footer class="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
      <div class="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>Informatika va axborot texnologiyalari — 11-sinf (I chorak 1-ChSB)</span>
        <span class="text-slate-400">Frontend V2 Demo Prototype</span>
      </div>
    </footer>
  </div>
</template>

