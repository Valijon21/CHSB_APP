import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import EmaktabSyncView from '../src/features/emaktab/views/EmaktabSyncView.vue';

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {
      tenantSlug: 'xorazm-demo',
      assessmentId: 'asm-algebra-01',
    },
  }),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('TASK-EM.7: Integrated EmaktabSyncView & End-to-End Flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('mounts the full EmaktabSyncView and renders default roster and metrics', async () => {
    const wrapper = mount(EmaktabSyncView, {
      global: {
        stubs: {
          'router-link': {
            template: '<a><slot /></a>',
          },
        },
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('eMaktab (Kundalik) Baholarni O\'tkazish');
    expect(wrapper.text()).toContain('9-A');
    expect(wrapper.text()).toContain('Matematika');

    // Default roster should be populated
    expect(wrapper.text()).toContain("O'ktamov Jasurbek");
    expect(wrapper.text()).toContain('Aliyeva Madina');

    // Metrics bar should be present
    expect(wrapper.text()).toContain('Jami Qator');
    expect(wrapper.text()).toContain('Moslik Qamrovi');
  });

  it('allows importing a custom roster and updates grid data dynamically', async () => {
    const wrapper = mount(EmaktabSyncView, {
      global: {
        stubs: {
          'router-link': {
            template: '<a><slot /></a>',
          },
        },
      },
    });

    // Switch to textarea tab
    const textTabBtn = wrapper.findAll('button').find((b) => b.text().includes('Matn nusxasi'));
    expect(textTabBtn).toBeDefined();
    await textTabBtn!.trigger('click');

    const textarea = wrapper.find('textarea');
    await textarea.setValue('1. Karimova Nozima\n2. Sobirov Elyor');

    const submitBtn = wrapper.findAll('button').find((b) => b.text().includes('Tahlil Qilish'));
    await submitBtn!.trigger('click');

    expect(wrapper.text()).toContain('Karimova Nozima');
    expect(wrapper.text()).toContain('Sobirov Elyor');
  });

  it('opens and closes the grade thresholds modal from the action bar', async () => {
    const wrapper = mount(EmaktabSyncView, {
      global: {
        stubs: {
          'router-link': {
            template: '<a><slot /></a>',
          },
        },
      },
    });

    const configBtn = wrapper.findAll('button').find((b) => b.text().includes('Mezonlarni Sozlash'));
    expect(configBtn).toBeDefined();
    await configBtn!.trigger('click');

    // Modal should now be open
    expect(wrapper.text()).toContain('5 Ballik Baholash Mezonlarini Moslash');

    // Close button
    const closeBtn = wrapper.findAll('button').find((b) => b.text() === 'Bekor qilish');
    expect(closeBtn).toBeDefined();
    await closeBtn!.trigger('click');

    // Modal should close
    expect(wrapper.text()).not.toContain('5 Ballik Baholash Mezonlarini Moslash');
  });
});
