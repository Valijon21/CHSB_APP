import { ref, onMounted, getCurrentInstance } from 'vue';

export type FontScale = 'normal' | 'large' | 'xlarge';

const STORAGE_KEY = 'chsb_font_scale_v2';

const scaleValues: Record<FontScale, string> = {
  normal: '100%',
  large: '115%',
  xlarge: '130%',
};

function getInitialScale(): FontScale {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY) as FontScale | null;
    if (saved === 'normal' || saved === 'large' || saved === 'xlarge') {
      return saved;
    }
  }
  return 'normal';
}

const currentScale = ref<FontScale>(getInitialScale());

export function useAccessibility() {
  function applyScale(scale: FontScale) {
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = scaleValues[scale];
    }
  }

  function setFontScale(scale: FontScale) {
    currentScale.value = scale;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, scale);
    }
    applyScale(scale);
  }

  function increaseFont() {
    if (currentScale.value === 'normal') setFontScale('large');
    else if (currentScale.value === 'large') setFontScale('xlarge');
  }

  function decreaseFont() {
    if (currentScale.value === 'xlarge') setFontScale('large');
    else if (currentScale.value === 'large') setFontScale('normal');
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      applyScale(currentScale.value);
    });
  }

  return {
    fontScale: currentScale,
    setFontScale,
    increaseFont,
    decreaseFont,
    applyScale,
  };
}

