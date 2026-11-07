import { ref, onMounted, getCurrentInstance } from 'vue';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'chsb_theme_v2';

function getInitialTheme(): ThemeMode {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  }

  if (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }

  return 'light';
}

const currentTheme = ref<ThemeMode>(getInitialTheme());

export function useTheme() {
  function applyTheme(theme: ThemeMode) {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }

  function setTheme(theme: ThemeMode) {
    currentTheme.value = theme;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, theme);
    }
    applyTheme(theme);
  }

  function toggleTheme() {
    setTheme(currentTheme.value === 'dark' ? 'light' : 'dark');
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      applyTheme(currentTheme.value);
    });
  }

  return {
    theme: currentTheme,
    setTheme,
    toggleTheme,
    applyTheme,
  };
}
