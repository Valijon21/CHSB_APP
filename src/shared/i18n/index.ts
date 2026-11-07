import { ref, computed } from 'vue';
import type { SupportedLocale, TranslationDictionary } from './types';
import { uz } from './locales/uz';
import { uz_cyrl } from './locales/uz_cyrl';
import { ru } from './locales/ru';
import { kaa } from './locales/kaa';

const STORAGE_KEY = 'chsb_locale_v2';

const dictionaries: Record<SupportedLocale, TranslationDictionary> = {
  uz,
  uz_cyrl,
  ru,
  kaa,
};

export const supportedLocales: { code: SupportedLocale; label: string }[] = [
  { code: 'uz', label: "O'zbekcha" },
  { code: 'uz_cyrl', label: 'Ўзбекча' },
  { code: 'ru', label: 'Русский' },
  { code: 'kaa', label: 'Qaraqalpaqsha' },
];

function getInitialLocale(): SupportedLocale {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null;
    if (saved && saved in dictionaries) {
      return saved;
    }
  }
  return 'uz';
}

const currentLocale = ref<SupportedLocale>(getInitialLocale());

export function useI18n() {
  const locale = computed(() => currentLocale.value);

  function setLocale(newLocale: SupportedLocale) {
    if (newLocale in dictionaries) {
      currentLocale.value = newLocale;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, newLocale);
      }
    }
  }

  function t(path: string, fallback?: string): string {
    const dict = dictionaries[currentLocale.value] || dictionaries.uz;
    const parts = path.split('.');
    let current: unknown = dict;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return fallback || path;
      }
    }

    return typeof current === 'string' ? current : fallback || path;
  }

  return {
    locale,
    setLocale,
    t,
    availableLocales: supportedLocales,
  };
}
