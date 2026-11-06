<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();
const tenantSlug = computed(() => (route.params.tenantSlug as string) || '');
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-100 text-slate-800">
    <!-- Exam Top Bar (Sticky) -->
    <header class="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-8 h-8 rounded-md bg-teal-800 flex items-center justify-center text-white font-bold text-sm">
            C
          </span>
          <div class="hidden sm:block">
            <h1 class="text-xs font-semibold text-slate-900 leading-none">Informatika 11-sinf: 1-ChSB</h1>
            <span class="text-[11px] text-slate-500 font-mono">{{ tenantSlug }}</span>
          </div>
        </div>

        <!-- Teleport target or default slot for timer/progress in Phase 4 -->
        <div id="exam-top-actions" class="flex items-center gap-4">
          <!-- Workspace can inject custom timer here -->
        </div>
      </div>
    </header>

    <!-- Main Exam Workspace -->
    <main class="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 flex flex-col">
      <slot>
        <router-view />
      </slot>
    </main>
  </div>
</template>

