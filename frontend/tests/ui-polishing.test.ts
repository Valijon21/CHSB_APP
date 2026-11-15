import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { useI18n, supportedLocales } from '../src/shared/i18n';
import { uz } from '../src/shared/i18n/locales/uz';
import { uz_cyrl } from '../src/shared/i18n/locales/uz_cyrl';
import { ru } from '../src/shared/i18n/locales/ru';
import { kaa } from '../src/shared/i18n/locales/kaa';
import { useTheme } from '../src/shared/composables/useTheme';
import { useAccessibility } from '../src/shared/composables/useAccessibility';
import LanguageSwitcher from '../src/shared/components/LanguageSwitcher.vue';
import ThemeToggle from '../src/shared/components/ThemeToggle.vue';
import FontScaleControl from '../src/shared/components/FontScaleControl.vue';

describe('Direction 5: Professional UI/UX Polishing', () => {
  describe('Typesafe Multi-Language System (i18n)', () => {
    it('has complete translation parity across all 4 regional languages', () => {
      const locales = [uz, uz_cyrl, ru, kaa];
      const sections = ['common', 'header', 'exam', 'result', 'teacher'] as const;

      locales.forEach((dict) => {
        sections.forEach((sec) => {
          expect(dict[sec]).toBeDefined();
          const keys = Object.keys(uz[sec]);
          keys.forEach((key) => {
            const val = (dict[sec] as Record<string, string>)[key] ?? '';
            expect(val).toBeDefined();
            expect(typeof val).toBe('string');
            expect(val.length).toBeGreaterThan(0);
          });
        });
      });
    });

    it('switches languages dynamically and retrieves nested translations', () => {
      const { t, setLocale, locale } = useI18n();

      setLocale('uz');
      expect(locale.value).toBe('uz');
      expect(t('common.loading')).toBe('Yuklanmoqda...');
      expect(t('exam.remainingTime')).toBe('Qolgan vaqt');

      setLocale('ru');
      expect(locale.value).toBe('ru');
      expect(t('common.loading')).toBe('Загрузка...');
      expect(t('exam.remainingTime')).toBe('Оставшееся время');

      setLocale('kaa');
      expect(locale.value).toBe('kaa');
      expect(t('common.loading')).toBe('Júklenbekte...');

      setLocale('uz_cyrl');
      expect(locale.value).toBe('uz_cyrl');
      expect(t('common.loading')).toBe('Юкланмоқда...');

      // Reset back to uz
      setLocale('uz');
    });

    it('handles missing keys with fallback', () => {
      const { t } = useI18n();
      expect(t('nonexistent.key', 'Def')).toBe('Def');
      expect(t('nonexistent.key')).toBe('nonexistent.key');
    });

    it('exposes 4 supported locales', () => {
      expect(supportedLocales).toHaveLength(4);
      expect(supportedLocales.map((l) => l.code)).toEqual(['uz', 'uz_cyrl', 'ru', 'kaa']);
    });
  });

  describe('Theme Engine (Dark / Light Mode)', () => {
    beforeEach(() => {
      document.documentElement.classList.remove('dark');
    });

    it('toggles theme between light and dark', () => {
      const { theme, setTheme, toggleTheme, applyTheme } = useTheme();

      setTheme('light');
      expect(theme.value).toBe('light');

      toggleTheme();
      expect(theme.value).toBe('dark');

      applyTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      applyTheme('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      // Reset
      setTheme('light');
    });
  });

  describe('Accessibility (A11y) Font Scaling Engine', () => {
    beforeEach(() => {
      document.documentElement.style.fontSize = '100%';
    });

    it('steps font scale through normal, large, and xlarge', () => {
      const { fontScale, setFontScale, increaseFont, decreaseFont } = useAccessibility();

      setFontScale('normal');
      expect(fontScale.value).toBe('normal');
      expect(document.documentElement.style.fontSize).toBe('100%');

      increaseFont();
      expect(fontScale.value).toBe('large');
      expect(document.documentElement.style.fontSize).toBe('115%');

      increaseFont();
      expect(fontScale.value).toBe('xlarge');
      expect(document.documentElement.style.fontSize).toBe('130%');

      // Max clamp
      increaseFont();
      expect(fontScale.value).toBe('xlarge');

      decreaseFont();
      expect(fontScale.value).toBe('large');

      decreaseFont();
      expect(fontScale.value).toBe('normal');

      // Min clamp
      decreaseFont();
      expect(fontScale.value).toBe('normal');
    });
  });

  describe('UI Polishing Components', () => {
    it('mounts LanguageSwitcher and changes locale', async () => {
      const wrapper = mount(LanguageSwitcher);
      expect(wrapper.find('select').exists()).toBe(true);

      const select = wrapper.find('select');
      await select.setValue('ru');

      const { locale } = useI18n();
      expect(locale.value).toBe('ru');

      // Reset
      const { setLocale } = useI18n();
      setLocale('uz');
    });

    it('mounts ThemeToggle and toggles theme on click', async () => {
      const wrapper = mount(ThemeToggle);
      const btn = wrapper.find('button');
      expect(btn.exists()).toBe(true);

      const { theme } = useTheme();
      const initial = theme.value;
      await btn.trigger('click');
      expect(theme.value).not.toBe(initial);

      // Toggle back
      await btn.trigger('click');
      expect(theme.value).toBe(initial);
    });

    it('mounts FontScaleControl and changes scale on button clicks', async () => {
      const wrapper = mount(FontScaleControl);
      const buttons = wrapper.findAll('button');
      expect(buttons).toHaveLength(3);

      // Click A++ (xlarge)
      await buttons[2]?.trigger('click');
      const { fontScale, setFontScale } = useAccessibility();
      expect(fontScale.value).toBe('xlarge');

      // Reset
      setFontScale('normal');
    });
  });
});
