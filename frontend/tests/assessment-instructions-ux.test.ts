import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import AssessmentInstructionsView from '../src/features/assessment/AssessmentInstructionsView.vue';
import { useAssessmentStore } from '../src/features/assessment/assessmentStore';
import { useStudentAdmissionStore } from '../src/features/student-admission/admissionStore';

const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useRoute: () => ({
    params: {
      tenantSlug: 'al-xorazmiy',
      assessmentId: 'chsb-inf-11-q1',
    },
  }),
}));

describe('TASK-INS.1..4: AssessmentInstructionsView UI/UX & Pre-Flight Diagnostics', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockPush.mockClear();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('renders instructions with facts grid and pre-flight diagnostics', async () => {
    const wrapper = mount(AssessmentInstructionsView);
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Texnik Tayyorgarlik Tekshiruvi');
    });

    expect(wrapper.text()).toContain('Savollar');
    expect(wrapper.text()).toContain('Maks. ball');
    expect(wrapper.text()).toContain('Vaqt');
    expect(wrapper.text()).toContain('Format');
    expect(wrapper.text()).toContain('To\'liq ekran nazorati');
    expect(wrapper.text()).toContain('Avto-saqlash faol');
  });

  it('disables start exam button until rules agreement checkbox is checked', async () => {
    const wrapper = mount(AssessmentInstructionsView);
    const startButton = wrapper.find('button[aria-label="Imtihonni boshlash"]');
    expect(startButton.attributes('disabled')).toBeDefined();

    const checkbox = wrapper.find<HTMLInputElement>('#rules-agreement');
    expect(checkbox.exists()).toBe(true);
    expect(checkbox.element.checked).toBe(false);

    // Check the agreement checkbox
    await checkbox.setValue(true);

    // Now button should be enabled
    expect(startButton.attributes('disabled')).toBeUndefined();
    expect(wrapper.text()).toContain('Imtihonni Boshlash');
  });

  it('shows student badge when student is confirmed in admissionStore', async () => {
    const admissionStore = useStudentAdmissionStore();
    admissionStore.confirmedStudent = {
      rosterRecordId: 'rec-ax-101',
      displayName: "Jasurbek O'ktamov",
      className: '11-A',
      schoolName: 'Al-Xorazmiy IT-maktab',
      availableAssessmentIds: ['chsb-inf-11-q1'],
      eligibilityStatus: 'eligible',
    };

    const wrapper = mount(AssessmentInstructionsView);
    expect(wrapper.text()).toContain("Jasurbek O'ktamov");
    expect(wrapper.text()).toContain('11-A');
    expect(wrapper.text()).toContain('Al-Xorazmiy IT-maktab');
    expect(wrapper.text()).toContain('Tasdiqlangan');
  });

  it('calls startAssessment and navigates to attempt view when started', async () => {
    const wrapper = mount(AssessmentInstructionsView);
    const checkbox = wrapper.find<HTMLInputElement>('#rules-agreement');
    await checkbox.setValue(true);

    const startButton = wrapper.find('button[aria-label="Imtihonni boshlash"]');
    await startButton.trigger('click');

    await vi.waitFor(() => {
      const assessmentStore = useAssessmentStore();
      expect(assessmentStore.assessment).not.toBeNull();
      expect(mockPush).toHaveBeenCalledWith('/t/al-xorazmiy/assessments/chsb-inf-11-q1/attempt');
    });
  });
});
