import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import SubmissionReceiptView from '../src/features/results/SubmissionReceiptView.vue';
import AssessmentResultView from '../src/features/results/AssessmentResultView.vue';
import CertificateModal from '../src/features/results/CertificateModal.vue';
import NotFoundView from '../src/shared/components/NotFoundView.vue';
import { useAssessmentStore } from '../src/features/assessment/assessmentStore';
import { useTenantStore } from '../src/features/tenant-context/tenantStore';
import type { AssessmentResult } from '../src/entities/result/model';
import type { SubmissionReceipt } from '../src/entities/attempt/model';

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {
      tenantSlug: 'al-xorazmiy',
      attemptId: 'att-ax-101-q1',
    },
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const mockResult: AssessmentResult = {
  attemptId: 'att-ax-101-q1',
  tenantId: 'tenant-al-xorazmiy',
  assessmentId: 'chsb-inf-11-q1',
  studentName: 'Alisher Zokirov',
  className: '11-A',
  rosterRecordId: 'rec-ax-101',
  score: 37.5,
  maxScore: 40,
  percentage: 93.8,
  status: 'verified',
  submittedAt: new Date().toISOString(),
  verifiedByTeacher: true,
  answeredQuestions: 15,
  totalQuestions: 15,
};

const mockReceipt: SubmissionReceipt = {
  attemptId: 'att-ax-101-q1',
  tenantId: 'tenant-al-xorazmiy',
  assessmentId: 'chsb-inf-11-q1',
  rosterRecordId: 'rec-ax-101',
  status: 'received',
  submittedAt: new Date().toISOString(),
  message: 'Topshirildi',
  receiptCode: 'RCP-12345',
};

describe('TASK-UIX.7: Results, Receipt, Certificate & 404 Dark Mode Suite', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders SubmissionReceiptView with dark mode styles and receipt data', async () => {
    const assessmentStore = useAssessmentStore();
    assessmentStore.receipt = mockReceipt;

    const wrapper = mount(SubmissionReceiptView);
    await flushPromises();

    expect(wrapper.find('.bg-white.dark\\:bg-slate-800').exists()).toBe(true);
    expect(wrapper.text()).toContain('Javoblaringiz muvaffaqiyatli topshirildi');
    expect(wrapper.find('button[aria-label="Natijani ko\'rish"]').exists()).toBe(true);
  });

  it('renders AssessmentResultView with dark mode score and certificate button', async () => {
    const tenantStore = useTenantStore();
    const assessmentStore = useAssessmentStore();
    await tenantStore.loadTenant('al-xorazmiy');

    assessmentStore.result = mockResult;

    const wrapper = mount(AssessmentResultView, {
      global: {
        stubs: {
          CertificateModal: true,
        },
      },
    });
    await flushPromises();

    expect(wrapper.find('.bg-white.dark\\:bg-slate-800').exists()).toBe(true);
    expect(wrapper.text()).toContain('37.5');
    expect(wrapper.find('button[aria-label="Rasmiy sertifikatni ko\'rish va yuklab olish"]').exists()).toBe(true);
    expect(wrapper.find('button[aria-label="Bosh sahifaga qaytish"]').exists()).toBe(true);
  });

  it('renders CertificateModal with accessible print and close buttons', () => {
    const wrapper = mount(CertificateModal, {
      props: {
        isOpen: true,
        result: mockResult,
        schoolName: 'Al-Xorazmiy nomidagi AKT maktabi',
      },
      global: {
        stubs: {
          QrCodeRenderer: true,
        },
      },
    });

    const printBtn = wrapper.find('button[aria-label="Sertifikatni chop etish yoki PDF sifatida saqlash"]');
    expect(printBtn.exists()).toBe(true);

    const closeBtn = wrapper.find('button[aria-label="Sertifikat modal oynasini yopish"]');
    expect(closeBtn.exists()).toBe(true);
  });

  it('renders NotFoundView with dark mode theme and home navigation', () => {
    const wrapper = mount(NotFoundView);
    expect(wrapper.find('.dark\\:bg-slate-900').exists()).toBe(true);
    expect(wrapper.find('.bg-white.dark\\:bg-slate-800').exists()).toBe(true);
    expect(wrapper.find('button[aria-label="Bosh sahifaga qaytish"]').exists()).toBe(true);
  });
});
