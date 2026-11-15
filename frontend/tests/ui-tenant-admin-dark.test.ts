import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import TenantAdminView from '../src/features/tenant-admin/TenantAdminView.vue';
import { useTenantStore } from '../src/features/tenant-context/tenantStore';
import { useTeacherStore } from '../src/features/teacher/teacherStore';
import { useOrganizationStore } from '../src/features/organization/store/organizationStore';

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {
      tenantSlug: 'al-xorazmiy',
    },
    query: {
      tab: 'teachers',
    },
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('TASK-UIX.4: Tenant Admin View Dark Mode & A11y Suite', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders TenantAdminView with dark mode configuration cards and accessible tabs', async () => {
    const tenantStore = useTenantStore();
    const teacherStore = useTeacherStore();
    const orgStore = useOrganizationStore();
    await tenantStore.loadTenant('al-xorazmiy');
    await teacherStore.loadTeacherData('tenant-al-xorazmiy');
    await orgStore.loadSchoolContext('al-xorazmiy');

    const wrapper = mount(TenantAdminView, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
          TeacherRosterTable: true,
          SystemLogViewer: true,
          CreateTeacherModal: true,
          CreateClassModal: true,
        },
      },
    });
    await flushPromises();

    // Dark mode cards
    expect(wrapper.find('.bg-white.dark\\:bg-slate-800').exists()).toBe(true);

    // Tab buttons with accessible aria labels
    const teachersTab = wrapper.find('button[aria-label="O\'qituvchilar tarkibi varag\'i"]');
    expect(teachersTab.exists()).toBe(true);

    const logsTab = wrapper.find('button[aria-label="Tizim loglari va audit xatolar konsoli"]');
    expect(logsTab.exists()).toBe(true);

    // Modal trigger buttons with accessible aria labels
    const addTeacherBtn = wrapper.find('button[aria-label="Yangi o\'qituvchi qo\'shish"]');
    expect(addTeacherBtn.exists()).toBe(true);

    const addClassBtn = wrapper.find('button[aria-label="Yangi sinf qo\'shish"]');
    expect(addClassBtn.exists()).toBe(true);
  });
});
