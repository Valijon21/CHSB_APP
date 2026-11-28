import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CreateAssessmentModal from '@/features/teacher/assessments/CreateAssessmentModal.vue';

function attachPdfToWrapper(wrapper: ReturnType<typeof mount>, fileName = 'test-exam.pdf') {
  const file = new File(['%PDF-1.4 sample binary content'], fileName, { type: 'application/pdf' });
  const input = wrapper.find('input[type="file"]');
  Object.defineProperty(input.element, 'files', {
    value: [file],
    configurable: true,
  });
  return { file, input };
}

describe('CreateAssessmentModal Original PDF Mode', () => {
  it('requires a PDF file when submitting in Asl PDF mode', async () => {
    const wrapper = mount(CreateAssessmentModal, {
      props: { isOpen: true },
    });

    await wrapper.find('input[placeholder*="Masalan"]').setValue('Informatika 9-sinf 1-CHSB');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.emitted('create')).toBeUndefined();
    expect(wrapper.text()).toContain('Asl PDF rejimida imtihon PDF fayli yuklanishi shart');
  });

  it('emits CHSB assessment payload with answerKey and pdfFile without extracting questions', async () => {
    const wrapper = mount(CreateAssessmentModal, {
      props: { isOpen: true },
    });

    await wrapper.find('input[placeholder*="Masalan"]').setValue('Matematika 9-sinf 1-CHSB');
    const { file, input } = attachPdfToWrapper(wrapper, 'math-chsb.pdf');
    await input.trigger('change');

    expect(wrapper.text()).toContain('math-chsb.pdf');

    const keyInput = wrapper.find('input[aria-label="CHSB javoblar kaliti matni"]');
    await keyInput.setValue('1-B, 2-C, 3-D');

    await wrapper.find('form').trigger('submit');
    const emitted = wrapper.emitted('create');
    expect(emitted).toBeTruthy();
    const payload = emitted![0]![0] as Record<string, unknown>;
    expect(payload.assessmentType).toBe('CHSB');
    expect(payload.pdfFile).toBe(file);
    expect(payload.questions).toBeUndefined();
    expect(String(payload.answerKey)).toContain('1-B, 2-C, 3-D');
  });

  it('emits BSB assessment payload with written/subquestion answer sheet and pdfFile', async () => {
    const wrapper = mount(CreateAssessmentModal, {
      props: { isOpen: true },
    });

    await wrapper.find('input[placeholder*="Masalan"]').setValue('Informatika 7-sinf 1-BSB');
    const typeSelect = wrapper.findAll('select')[2]!;
    await typeSelect.setValue('BSB');

    const { file, input } = attachPdfToWrapper(wrapper, '7-sinf-bsb.pdf');
    await input.trigger('change');

    // Set task 1 to 3 sub-parts (a, b, c)
    const firstBandSelect = wrapper.find('select[aria-label="1-topshiriq bandlari"]');
    await firstBandSelect.setValue('3');

    await wrapper.find('form').trigger('submit');
    const emitted = wrapper.emitted('create');
    expect(emitted).toBeTruthy();
    const payload = emitted![0]![0] as {
      assessmentType: string;
      pdfFile: File;
      questions: Array<{ taskType?: string; options?: unknown[]; subQuestions?: Array<{ label: string }> }>;
    };
    expect(payload.assessmentType).toBe('BSB');
    expect(payload.pdfFile).toBe(file);
    expect(payload.questions.length).toBeGreaterThan(0);
    expect(payload.questions[0]!.options).toEqual([]);
    expect(payload.questions[0]!.taskType).toBe('subquestions');
    expect(payload.questions[0]!.subQuestions?.map((s) => s.label)).toEqual(['a)', 'b)', 'c)']);
  });
});
