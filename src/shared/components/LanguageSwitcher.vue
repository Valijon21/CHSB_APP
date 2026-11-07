<script setup lang="ts">
import { useI18n } from '../i18n';
import type { SupportedLocale } from '../i18n/types';

const { locale, setLocale, availableLocales } = useI18n();

function onChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  setLocale(target.value as SupportedLocale);
}
</script>

<template>
  <div class="relative inline-flex items-center">
    <label for="chsb-language-select" class="sr-only">Tilni tanlash</label>
    <select
      id="chsb-language-select"
      :value="locale"
      @change="onChange"
      class="bg-white/80 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-700 cursor-pointer transition shadow-2xs"
    >
      <option
        v-for="item in availableLocales"
        :key="item.code"
        :value="item.code"
      >
        {{ item.label }}
      </option>
    </select>
  </div>
</template>
