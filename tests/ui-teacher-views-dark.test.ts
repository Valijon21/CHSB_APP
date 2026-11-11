import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import TeacherStudentsView from '../src/features/teacher/students/TeacherStudentsView.vue';
import TeacherStudentDetailView from '../src/features/teacher/students/TeacherStudentDetailView.vue';
import TeacherAssessmentsView from '../src/features/teacher/assessments/TeacherAssessmentsView.vue';
import TeacherAssessmentDetailView from '../src/features/teacher/assessments/TeacherAssessmentDetailView.vue';
import TeacherResultsView from '../src/features/teacher/results/TeacherResultsView.vue';
import TeacherAnalyticsView from '../src/features/teacher/analytics/TeacherAnalyticsView.vue';
import TeacherReportsView from '../src/features/teacher/reports/TeacherReportsView.vue';
import { useTeacherStore } from '../src/features/teacher/teacherStore';
import { useTenantStore } from '../src/features/tenant-context/tenantStore';

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {
      tenantSlug: 'al-xorazmiy',
      studentId: 'rec-ax-101',
      assessmentId: 'chsb-inf-11-q1',
    },
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('TASK-UIX.3: Teacher Sub-views Dark Mode & Accessibility Suite', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders TeacherStudentsView with dark mode and accessible filters', async () => {
    const tenantStore = useTenantStore();
    const teacherStore = useTeacherStore();
    await tenantStore.loadTenant('al-xorazmiy');
    await teacherStore.loadTeacherData('tenant-al-xorazmiy');

    const wrapper = mount(TeacherStudentsView, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
          CreateStudentModal: true,
          BulkStudentImportModal: true,
        },
      },
    });
    await flushPromises();

    expect(wrapper.find('.bg-white.dark\\:bg-slate-800').exists()).toBe(true);
    expect(wrapper.find('input[aria-label="O\'quvchi ismi yoki Roster kodi bo\'yicha qidirish"]').exists()).toBe(true);
    expect(wrapper.find('select[aria-label="Sinf bo\'yicha filtrlash"]').exists()).toBe(true);
    expect(wrapper.find('select[aria-label="Status bo\'yicha filtrlash"]').exists()).toBe(true);
    expect(wrapper.find('.overflow-x-auto').exists()).toBe(true);
  });

  it('renders TeacherStudentDetailView with dark mode profile card and test history', async () => {
    const tenantStore = useTenantStore();
    const teacherStore = useTeacherStore();
    await tenantStore.loadTenant('al-xorazmiy');
    await teacherStore.loadStudentDetail('tenant-al-xorazmiy', 'rec-ax-101');

    const wrapper = mount(TeacherStudentDetailView, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
        },
      },
    });
    await flushPromises();

    expect(wrapper.find('.bg-white.dark\\:bg-slate-800').exists()).toBe(true);
    expect(wrapper.text()).toContain('Alisher');
    expect(wrapper.text()).toContain('STU-1101');
    expect(wrapper.find('.overflow-x-auto').exists()).toBe(true);
  });

  it('renders TeacherAssessmentsView with dark mode cards and action pills', async () => {
    const tenantStore = useTenantStore();
    const teacherStore = useTeacherStore();
    await tenantStore.loadTenant('al-xorazmiy');
    await teacherStore.loadTeacherData('tenant-al-xorazmiy');

    const wrapper = mount(TeacherAssessmentsView, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
        },
      },
    });
    await flushPromises();

    expect(wrapper.find('.bg-white.dark\\:bg-slate-800').exists()).toBe(true);
    expect(wrapper.text()).toContain('Baholashlar Boshqaruvi');
  });

  it('renders TeacherAssessmentDetailView with dark mode cognitive breakdown', async () => {
    const tenantStore = useTenantStore();
    const teacherStore = useTeacherStore();
    await tenantStore.loadTenant('al-xorazmiy');
    await teacherStore.loadAssessmentDetail('tenant-al-xorazmiy', 'chsb-inf-11-q1');

    const wrapper = mount(TeacherAssessmentDetailView, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
        },
      },
    });
    await flushPromises();

    expect(wrapper.find('.bg-white.dark\\:bg-slate-800').exists()).toBe(true);
    expect(wrapper.find('.overflow-x-auto').exists()).toBe(true);
  });

  it('renders TeacherResultsView with dark mode and export button', async () => {
    const tenantStore = useTenantStore();
    const teacherStore = useTeacherStore();
    await tenantStore.loadTenant('al-xorazmiy');
    await teacherStore.loadTeacherData('tenant-al-xorazmiy');

    const wrapper = mount(TeacherResultsView, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
        },
      },
    });
    await flushPromises();

    expect(wrapper.find('.bg-white.dark\\:bg-slate-800').exists()).toBe(true);
    expect(wrapper.find('button[aria-label="Excel va CSV formatida yuklab olish"]').exists()).toBe(true);
    expect(wrapper.find('.overflow-x-auto').exists()).toBe(true);
  });

  it('renders TeacherAnalyticsView with dark mode KPI and comparison cards', async () => {
    const tenantStore = useTenantStore();
    const teacherStore = useTeacherStore();
    await tenantStore.loadTenant('al-xorazmiy');
    await teacherStore.loadTeacherData('tenant-al-xorazmiy');

    const wrapper = mount(TeacherAnalyticsView);
    await flushPromises();

    expect(wrapper.find('.bg-white.dark\\:bg-slate-800').exists()).toBe(true);
    expect(wrapper.text()).toContain('Pedagogik Tahlillar');
    expect(wrapper.text()).toContain('Ballar Taqsimoti');
  });

  it('renders TeacherReportsView with dark mode document preview and selects', async () => {
    const tenantStore = useTenantStore();
    const teacherStore = useTeacherStore();
    await tenantStore.loadTenant('al-xorazmiy');
    await teacherStore.loadTeacherData('tenant-al-xorazmiy');

    const wrapper = mount(TeacherReportsView);
    await flushPromises();

    expect(wrapper.find('.bg-white.dark\\:bg-slate-800').exists()).toBe(true);
    expect(wrapper.find('select[aria-label="Hisobot turini tanlash"]').exists()).toBe(true);
    expect(wrapper.find('select[aria-label="Sinfni tanlash"]').exists()).toBe(true);
    expect(wrapper.find('.overflow-x-auto').exists()).toBe(true);
  });
});
