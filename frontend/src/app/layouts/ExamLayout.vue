<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import { useAssessmentStore } from '../../features/assessment/assessmentStore';
import NetworkStatusIndicator from '../../shared/components/NetworkStatusIndicator.vue';
import LanguageSwitcher from '../../shared/components/LanguageSwitcher.vue';
import ThemeToggle from '../../shared/components/ThemeToggle.vue';
import FontScaleControl from '../../shared/components/FontScaleControl.vue';

const route = useRoute();
const tenantSlug = computed(() => (route.params.tenantSlug as string) || '');
const assessmentStore = useAssessmentStore();
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors">
    <!-- Exam Top Bar (Sticky & Rigid) -->
    <header class="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30 shrink-0 shadow-xs">
      <div :class="['mx-auto px-3 sm:px-5 h-14 flex items-center justify-between', assessmentStore.assessment?.hasPdf ? 'max-w-[1760px]' : 'max-w-5xl']">
        <div class="flex items-center gap-2">
          <span class="w-8 h-8 rounded-md bg-teal-800 flex items-center justify-center text-white font-bold text-sm">
            C
          </span>
          <div class="hidden sm:block">
            <h1 class="text-xs font-semibold text-slate-900 dark:text-white leading-none truncate max-w-[260px] md:max-w-md">
              {{ assessmentStore.assessment?.title || 'CHSB / BSB Baholash' }}
            </h1>
            <span class="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{{ tenantSlug }}</span>
          </div>
        </div>

        <!-- Right utility tools: A11y font, Language, Theme, and Exam top actions -->
        <div class="flex items-center gap-2 sm:gap-3">
          <div id="exam-top-actions" class="flex items-center gap-2">
            <!-- Workspace injects timer here if teleported -->
          </div>
          <FontScaleControl />
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <!-- Global Network Resilience & Offline Status Indicator -->
    <NetworkStatusIndicator
      :offline-emergency-hash="assessmentStore.offlineEmergencyCode || undefined"
    />

    <!-- Main Exam Workspace -->
    <main :class="['flex-1 w-full mx-auto flex flex-col', assessmentStore.assessment?.hasPdf ? 'max-w-[1760px] p-2.5 sm:p-4' : 'max-w-5xl p-3 sm:p-6']">
      <slot>
        <router-view />
      </slot>
    </main>
  </div>
</template>

