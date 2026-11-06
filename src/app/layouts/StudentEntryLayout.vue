<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();
const tenantSlug = computed(() => (route.params.tenantSlug as string) || '');
</script>

<template>
  <div class="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-800">
    <!-- Header -->
    <header class="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
      <div class="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-teal-800 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            C
          </div>
          <div>
            <h1 class="text-base font-semibold text-slate-900 leading-tight">CHSB Baholash Platformasi</h1>
            <p class="text-xs text-slate-500" v-if="tenantSlug">
              Muassasa: <span class="font-medium text-slate-700 font-mono">{{ tenantSlug }}</span>
            </p>
          </div>
        </div>
        <div class="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
          O'quvchi Kirishi
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 max-w-4xl w-full mx-auto p-4 md:py-8 flex flex-col items-center justify-center">
      <slot>
        <router-view />
      </slot>
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
      <div class="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>&copy; {{ new Date().getFullYear() }} CHSB Baholash Tizimi. Barcha huquqlar himoyalangan.</span>
        <span class="text-slate-400">Roster Admission Mode (V2)</span>
      </div>
    </footer>
  </div>
</template>

