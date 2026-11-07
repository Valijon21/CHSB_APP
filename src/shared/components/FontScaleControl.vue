<script setup lang="ts">
import { useAccessibility } from '../composables/useAccessibility';

const { fontScale, setFontScale } = useAccessibility();
</script>

<template>
  <div class="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800 p-0.5 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs" role="group" aria-label="Shrift hajmini sozlash">
    <button
      type="button"
      @click="setFontScale('normal')"
      :class="[
        'px-2 py-0.5 rounded transition cursor-pointer text-xs',
        fontScale === 'normal'
          ? 'bg-teal-800 text-white shadow-2xs'
          : 'hover:bg-slate-100 dark:hover:bg-slate-700'
      ]"
      title="Standart shrift (100%)"
    >
      A
    </button>
    <button
      type="button"
      @click="setFontScale('large')"
      :class="[
        'px-2 py-0.5 rounded transition cursor-pointer text-sm font-semibold',
        fontScale === 'large'
          ? 'bg-teal-800 text-white shadow-2xs'
          : 'hover:bg-slate-100 dark:hover:bg-slate-700'
      ]"
      title="Kattalashtirilgan shrift (115%)"
    >
      A+
    </button>
    <button
      type="button"
      @click="setFontScale('xlarge')"
      :class="[
        'px-2 py-0.5 rounded transition cursor-pointer text-base font-extrabold',
        fontScale === 'xlarge'
          ? 'bg-teal-800 text-white shadow-2xs'
          : 'hover:bg-slate-100 dark:hover:bg-slate-700'
      ]"
      title="Maksimal shrift (130%)"
    >
      A++
    </button>
  </div>
</template>
