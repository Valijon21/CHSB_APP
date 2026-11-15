import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { useAssessmentStore } from '../src/features/assessment/assessmentStore';
import QuestionBlockRenderer from '../src/shared/components/QuestionBlockRenderer.vue';
import type { QuestionBlock } from '../src/entities/assessment/model';

describe('Phase 4 — Assessment Experience & Engine', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('QuestionBlockRenderer Component', () => {
    it('renders paragraph block with formatted text', () => {
      const block: QuestionBlock = {
        type: 'paragraph',
        text: 'Audio tahrirlashda <b>waveform</b> nima?',
      };
      const wrapper = mount(QuestionBlockRenderer, {
        props: { block },
      });
      expect(wrapper.text()).toContain('Audio tahrirlashda waveform nima?');
      expect(wrapper.html()).toContain('<b>waveform</b>');
    });

    it('renders image block with alt text and src', () => {
      const block: QuestionBlock = {
        type: 'image',
        assetId: '/assets/questions/img3.jpg',
        alt: 'Birds Life intro',
      };
      const wrapper = mount(QuestionBlockRenderer, {
        props: { block },
      });
      const img = wrapper.find('img');
      expect(img.exists()).toBe(true);
      expect(img.attributes('src')).toBe('/assets/questions/img3.jpg');
      expect(img.attributes('alt')).toBe('Birds Life intro');
    });

    it('renders table block with header and rows', () => {
      const block: QuestionBlock = {
        type: 'table',
        columns: ['Buyruq', 'Vazifasi'],
        rows: [
          ['Split', 'Videoni ikkiga ajratish'],
          ['Trim', 'Bosh yoki oxirini kesish'],
        ],
      };
      const wrapper = mount(QuestionBlockRenderer, {
        props: { block },
      });
      expect(wrapper.find('table').exists()).toBe(true);
      expect(wrapper.text()).toContain('Buyruq');
      expect(wrapper.text()).toContain('Split');
      expect(wrapper.text()).toContain('Videoni ikkiga ajratish');
    });

    it('renders code block with mono styling', () => {
      const block: QuestionBlock = {
        type: 'code',
        code: 'const time = 40 * 60;',
      };
      const wrapper = mount(QuestionBlockRenderer, {
        props: { block },
      });
      expect(wrapper.find('code').exists()).toBe(true);
      expect(wrapper.text()).toContain('const time = 40 * 60;');
    });
  });

  describe('useAssessmentStore Engine', () => {
    it('initializes 15 questions, 40 points, and 40-minute timer', async () => {
      const store = useAssessmentStore();
      const success = await store.startAssessment(
        'tenant-al-xorazmiy',
        'chsb-inf-11-q1',
        'rec-ax-101'
      );

      expect(success).toBe(true);
      expect(store.totalQuestions).toBe(15);
      expect(store.assessment?.maxScore).toBe(40);
      expect(store.remainingSeconds).toBe(2400);
      expect(store.formattedTime).toBe('40:00');
      expect(store.currentQuestionIndex).toBe(0);
      expect(store.currentQuestion?.id).toBe('q-1');
      store.stopTimer();
    });

    it('selects answers and tracks answered/unanswered count', async () => {
      const store = useAssessmentStore();
      await store.startAssessment('tenant-al-xorazmiy', 'chsb-inf-11-q1', 'rec-ax-101');

      expect(store.answeredCount).toBe(0);
      expect(store.unansweredCount).toBe(15);

      store.selectAnswer('q-1', 'B');
      expect(store.answeredCount).toBe(1);
      expect(store.unansweredCount).toBe(14);
      expect(store.answers['q-1']).toBe('B');

      store.selectAnswer('q-2', 'A');
      expect(store.answeredCount).toBe(2);
      expect(store.answers['q-2']).toBe('A');
      store.stopTimer();
    });

    it('navigates between questions without losing selected answers', async () => {
      const store = useAssessmentStore();
      await store.startAssessment('tenant-al-xorazmiy', 'chsb-inf-11-q1', 'rec-ax-101');

      store.selectAnswer('q-1', 'C');
      store.nextQuestion();
      expect(store.currentQuestionIndex).toBe(1);
      expect(store.currentQuestion?.id).toBe('q-2');

      store.selectAnswer('q-2', 'D');
      store.goToQuestion(14); // 15th question
      expect(store.currentQuestionIndex).toBe(14);
      expect(store.currentQuestion?.id).toBe('q-15');

      // Go back to first question
      store.goToQuestion(0);
      expect(store.answers['q-1']).toBe('C');
      expect(store.answers['q-2']).toBe('D');
      store.stopTimer();
    });

    it('submits assessment and obtains submission receipt', async () => {
      const store = useAssessmentStore();
      await store.startAssessment('tenant-al-xorazmiy', 'chsb-inf-11-q1', 'rec-ax-101');

      store.selectAnswer('q-1', 'A');
      const submitted = await store.submitAssessment('tenant-al-xorazmiy');

      expect(submitted).toBe(true);
      expect(store.receipt).not.toBeNull();
      expect(store.receipt?.status).toBe('received_demo');
      expect(store.result).not.toBeNull();
      expect(store.result?.score).toBe(35);
      expect(store.result?.maxScore).toBe(40);
      expect(store.result?.teacherNote).toContain('o\'qituvchi tomonidan tekshiriladi');
    });
  });
});

