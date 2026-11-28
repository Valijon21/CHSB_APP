import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { useAssessmentStore } from '@/features/assessment/assessmentStore';
import PdfAnswerSheetPane from '@/features/assessment/components/PdfAnswerSheetPane.vue';
import AssessmentWorkspaceView from '@/features/assessment/AssessmentWorkspaceView.vue';
import type { Assessment } from '@/entities/assessment/model';

const { pushMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { tenantSlug: 'al-xorazmiy', assessmentId: 'asm-pdf-1' } }),
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/shared/composables/useExamProctor', () => ({
  useExamProctor: () => ({
    startProctoring: vi.fn(),
    isWarningModalOpen: { value: false },
    lastWarningMessage: { value: '' },
    violationCount: { value: 0 },
    maxViolations: 3,
    dismissWarning: vi.fn(),
  }),
}));

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 2,
      getPage: async () => ({
        getViewport: () => ({ width: 500, height: 700 }),
        render: () => ({ promise: Promise.resolve() }),
      }),
      destroy: async () => {},
    }),
  })),
}));

vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({
  default: 'mock-worker-url',
}));

function makeChsbPdfAssessment(hasPdf = true): Assessment {
  return {
    id: 'asm-pdf-1',
    tenantId: 'tenant-al-xorazmiy',
    title: 'Matematika 9-sinf 1-CHSB (Asl PDF)',
    subject: 'Matematika',
    assessmentType: 'CHSB',
    grade: 9,
    quarter: 1,
    academicYear: '2026-2027',
    assessmentNumber: 1,
    durationMinutes: 40,
    durationSeconds: 2400,
    questionCount: 2,
    maxScore: 40,
    hasPdf,
    sourcePdfName: hasPdf ? '9-sinf-chsb.pdf' : undefined,
    sourcePdfUrl: hasPdf ? '/api/v1/assessments/asm-pdf-1/pdf' : undefined,
    status: 'available',
    questions: [
      {
        id: 'q-1',
        order: 1,
        cognitiveLevel: '(B)',
        points: 20,
        blocks: [{ type: 'paragraph', text: '1-savol' }],
        options: [
          { id: 'opt-a', label: 'A', text: 'A' },
          { id: 'opt-b', label: 'B', text: 'B' },
          { id: 'opt-c', label: 'C', text: 'C' },
          { id: 'opt-d', label: 'D', text: 'D' },
        ],
      },
      {
        id: 'q-2',
        order: 2,
        cognitiveLevel: '(Q)',
        points: 20,
        blocks: [{ type: 'paragraph', text: '2-savol' }],
        options: [
          { id: 'opt-a', label: 'A', text: 'A' },
          { id: 'opt-b', label: 'B', text: 'B' },
          { id: 'opt-c', label: 'C', text: 'C' },
          { id: 'opt-d', label: 'D', text: 'D' },
        ],
      },
    ],
  };
}

describe('Split-Screen Original PDF Workspace', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        arrayBuffer: async () => new Uint8Array([37, 80, 68, 70]).buffer,
      }))
    );
  });

  it('renders left PDF pane + right answer sheet when assessment.hasPdf is true', () => {
    const store = useAssessmentStore();
    store.assessment = makeChsbPdfAssessment(true);
    store.attempt = {
      id: 'att-1',
      tenantId: 'tenant-al-xorazmiy',
      assessmentId: 'asm-pdf-1',
      rosterRecordId: 'rec-1',
      startedAt: new Date().toISOString(),
      deadlineAt: new Date(Date.now() + 2400 * 1000).toISOString(),
      status: 'in_progress',
      answers: {},
      remainingSeconds: 2400,
    };

    const wrapper = mount(AssessmentWorkspaceView, {
      global: {
        stubs: {
          QuestionBlockRenderer: true,
        },
      },
    });

    expect(wrapper.find('[aria-label="Asl imtihon hujjati (PDF)"]').exists()).toBe(true);
    expect(wrapper.find('[aria-label="Javoblar varaqasi"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Savollar navigatsiyasi');
  });

  it('preserves standard single-question navigator layout when hasPdf is false', () => {
    const store = useAssessmentStore();
    store.assessment = makeChsbPdfAssessment(false);

    const wrapper = mount(AssessmentWorkspaceView, {
      global: {
        stubs: {
          QuestionBlockRenderer: true,
        },
      },
    });

    expect(wrapper.find('[aria-label="Asl imtihon hujjati (PDF)"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('Savollar navigatsiyasi');
  });

  it('allows selecting CHSB OMR options and BSB written subquestion answers in PdfAnswerSheetPane', async () => {
    const bsbAssessment: Assessment = {
      ...makeChsbPdfAssessment(true),
      assessmentType: 'BSB',
      questions: [
        {
          id: 'q-bsb-1',
          order: 1,
          cognitiveLevel: '(Q)',
          points: 10,
          blocks: [{ type: 'paragraph', text: '1-topshiriq' }],
          options: [],
          taskType: 'subquestions',
          subQuestions: [
            { id: 'q1-a', label: 'a)', prompt: 'a band javobi', points: 5 },
            { id: 'q1-b', label: 'b)', prompt: 'b band javobi', points: 5 },
          ],
        },
      ],
    };

    const chsbWrapper = mount(PdfAnswerSheetPane, {
      props: {
        assessment: makeChsbPdfAssessment(true),
        answers: {},
        answeredCount: 0,
        totalQuestions: 2,
        isSubmitting: false,
      },
    });

    const q2OptC = chsbWrapper.find('button[aria-label="2-savol C varianti"]');
    await q2OptC.trigger('click');
    expect(chsbWrapper.emitted('select-answer')?.[0]).toEqual(['q-2', 'opt-c']);

    const bsbWrapper = mount(PdfAnswerSheetPane, {
      props: {
        assessment: bsbAssessment,
        answers: {},
        answeredCount: 0,
        totalQuestions: 1,
        isSubmitting: false,
      },
    });

    const firstTextarea = bsbWrapper.find('textarea');
    await firstTextarea.setValue('Toza yozma javob');
    const emittedBsb = bsbWrapper.emitted('select-answer');
    expect(emittedBsb).toBeTruthy();
    expect(emittedBsb![0]![0]).toBe('q-bsb-1');
    expect(JSON.parse(String(emittedBsb![0]![1]))['q1-a']).toBe('Toza yozma javob');
  });
});
