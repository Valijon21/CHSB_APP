import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import StudentEntryLayout from '../src/app/layouts/StudentEntryLayout.vue';
import StudentEntryView from '../src/features/student-admission/StudentEntryView.vue';
import StudentVerifyView from '../src/features/student-admission/StudentVerifyView.vue';
import { useStudentAdmissionStore } from '../src/features/student-admission/admissionStore';
import { useTenantStore } from '../src/features/tenant-context/tenantStore';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {
      tenantSlug: 'al-xorazmiy',
    },
  }),
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

describe('TASK-UIX.5: Student Admission Journey Dark Mode & A11y Suite', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  it('renders StudentEntryLayout with ThemeToggle, LanguageSwitcher, and dark classes', () => {
    const wrapper = mount(StudentEntryLayout, {
      global: {
        stubs: {
          'router-view': true,
          LanguageSwitcher: { template: '<div class="stub-lang-switcher" />' },
          ThemeToggle: { template: '<div class="stub-theme-toggle" />' },
        },
      },
    });

    expect(wrapper.find('.stub-lang-switcher').exists()).toBe(true);
    expect(wrapper.find('.stub-theme-toggle').exists()).toBe(true);
    expect(wrapper.find('.dark\\:bg-slate-900').exists()).toBe(true);
  });

  it('renders StudentEntryView with dark mode card and accessible input', async () => {
    const tenantStore = useTenantStore();
    await tenantStore.loadTenant('al-xorazmiy');

    const wrapper = mount(StudentEntryView, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
        },
      },
    });
    await flushPromises();

    expect(wrapper.find('.bg-white.dark\\:bg-slate-800').exists()).toBe(true);
    const input = wrapper.find('input[aria-label="O\'quvchi Roster kodi"]');
    expect(input.exists()).toBe(true);
    const submitBtn = wrapper.find('button[aria-label="Kodni tekshirish va davom etish"]');
    expect(submitBtn.exists()).toBe(true);
  });

  it('renders StudentVerifyView with dark mode card and confirmation buttons', async () => {
    const admissionStore = useStudentAdmissionStore();
    admissionStore.currentMatch = {
      rosterRecordId: 'rec-ax-101',
      displayName: 'Alisher Zokirov',
      className: '11-A',
      schoolName: 'Al-Xorazmiy nomidagi AKT maktabi',
      status: 'eligible',
      availableAssessmentIds: ['chsb-inf-11-q1'],
    };

    const wrapper = mount(StudentVerifyView);
    await flushPromises();

    expect(wrapper.find('.bg-white.dark\\:bg-slate-800').exists()).toBe(true);
    expect(wrapper.text()).toContain('Alisher Zokirov');
    expect(wrapper.find('button[aria-label="Shaxsni tasdiqlash va imtihonga o\'tish"]').exists()).toBe(true);
    expect(wrapper.find('button[aria-label="Kiritishni bekor qilish va qaytadan kiritish"]').exists()).toBe(true);
  });
});
