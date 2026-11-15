import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import TeacherDashboardView from '../src/features/teacher/dashboard/TeacherDashboardView.vue';
import TeacherProfileView from '../src/features/teacher/profile/TeacherProfileView.vue';
import { useTeacherStore } from '../src/features/teacher/teacherStore';
import { useTenantStore } from '../src/features/tenant-context/tenantStore';

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {
      tenantSlug: 'al-xorazmiy',
    },
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('TASK-UIX.1: Teacher Dashboard & Profile Dark Mode & A11y', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders TeacherDashboardView with dark mode classes and accessible links', async () => {
    const tenantStore = useTenantStore();
    const teacherStore = useTeacherStore();
    await tenantStore.loadTenant('al-xorazmiy');
    await teacherStore.loadTeacherData('tenant-al-xorazmiy');

    const wrapper = mount(TeacherDashboardView, {
      global: {
        stubs: {
          'router-link': {
            template: '<a><slot /></a>',
          },
        },
      },
    });

    const header = wrapper.find('.bg-white.dark\\:bg-slate-800');
    expect(header.exists()).toBe(true);

    const reportBtn = wrapper.find('[aria-label="Hisobot olish"]');
    expect(reportBtn.exists()).toBe(true);

    const analyticsBtn = wrapper.find('[aria-label="Tahlillar ko\'rish"]');
    expect(analyticsBtn.exists()).toBe(true);
  });

  it('renders TeacherProfileView with dark mode styles and accessible form inputs', async () => {
    const tenantStore = useTenantStore();
    const teacherStore = useTeacherStore();
    await tenantStore.loadTenant('al-xorazmiy');
    await teacherStore.loadTeacherData('tenant-al-xorazmiy');

    const wrapper = mount(TeacherProfileView);

    const profileCard = wrapper.find('.bg-white.dark\\:bg-slate-800');
    expect(profileCard.exists()).toBe(true);

    const langSelect = wrapper.find('#profile-default-lang');
    expect(langSelect.exists()).toBe(true);
    expect(langSelect.attributes('aria-label')).toBe('Tizim tili tanlash');

    const rowsSelect = wrapper.find('#profile-rows-per-page');
    expect(rowsSelect.exists()).toBe(true);
    expect(rowsSelect.attributes('aria-label')).toBe('Jadvallardagi qatorlar soni tanlash');

    const notifySubmit = wrapper.find('input[aria-label="O\'quvchi test topshirganda xabarnoma olish"]');
    expect(notifySubmit.exists()).toBe(true);

    const saveBtn = wrapper.find('button[aria-label="Sozlamalarni saqlash"]');
    expect(saveBtn.exists()).toBe(true);
    await saveBtn.trigger('click');
    expect(wrapper.text()).toContain('Sozlamalar saqlandi');
  });
});
