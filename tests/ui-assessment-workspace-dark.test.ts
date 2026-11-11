import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import ExamLayout from '../src/app/layouts/ExamLayout.vue';
import AssessmentWorkspaceView from '../src/features/assessment/AssessmentWorkspaceView.vue';
import QuestionBlockRenderer from '../src/shared/components/QuestionBlockRenderer.vue';
import { useAssessmentStore } from '../src/features/assessment/assessmentStore';
import { useTenantStore } from '../src/features/tenant-context/tenantStore';

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {
      tenantSlug: 'al-xorazmiy',
      assessmentId: 'chsb-inf-11-q1',
    },
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('TASK-UIX.6: Assessment Workspace & Exam Layout Dark Mode Suite', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders ExamLayout with ThemeToggle, FontScaleControl, and dark header', () => {
    const wrapper = mount(ExamLayout, {
      global: {
        stubs: {
          'router-view': true,
          LanguageSwitcher: true,
          ThemeToggle: { template: '<div class="stub-theme" />' },
          FontScaleControl: true,
          NetworkStatusIndicator: true,
        },
      },
    });

    expect(wrapper.find('.dark\\:bg-slate-900').exists()).toBe(true);
    expect(wrapper.find('.stub-theme').exists()).toBe(true);
  });

  it('renders AssessmentWorkspaceView with dark cards, options, and question navigator', async () => {
    const tenantStore = useTenantStore();
    const assessmentStore = useAssessmentStore();
    await tenantStore.loadTenant('al-xorazmiy');
    await assessmentStore.startAssessment('tenant-al-xorazmiy', 'chsb-inf-11-q1', 'rec-ax-101');

    const wrapper = mount(AssessmentWorkspaceView, {
      global: {
        stubs: {
          QuestionBlockRenderer: true,
        },
      },
    });
    await flushPromises();

    expect(wrapper.find('.bg-white.dark\\:bg-slate-800').exists()).toBe(true);

    // Option buttons with aria labels
    const optionA = wrapper.find('button[aria-label="Variant A"]');
    expect(optionA.exists()).toBe(true);

    // Question navigation buttons with accessible labels
    const q1Btn = wrapper.find('button[aria-label="1-savolga o\'tish"]');
    expect(q1Btn.exists()).toBe(true);

    const prevBtn = wrapper.find('button[aria-label="Oldingi savolga qaytish"]');
    expect(prevBtn.exists()).toBe(true);
  });

  it('renders QuestionBlockRenderer with dark text and tables', () => {
    const tableBlock = {
      type: 'table' as const,
      columns: ['Atama', 'Ta\'rifi'],
      rows: [['RAM', 'Tezkor xotira'], ['ROM', 'Doimiy xotira']],
    };

    const wrapper = mount(QuestionBlockRenderer, {
      props: {
        block: tableBlock,
      },
    });

    expect(wrapper.find('.dark\\:bg-slate-800').exists()).toBe(true);
    expect(wrapper.find('.dark\\:text-slate-100').exists()).toBe(true);
  });
});
