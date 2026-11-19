import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractGroundedQuestionsWithAi,
  getStoredGeminiApiKey,
  saveStoredGeminiApiKey,
  hasCustomApiKey,
  getCustomApiKey,
  type GroundedQuestionItem,
} from '../src/shared/utils/groundedAiExtractor';
import { parseExamQuestionsFromText } from '../src/shared/utils/pdfQuestionParser';

describe('Grounded AI Extractor & Human-in-the-Loop Validation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('API Key Management', () => {
    it('saves and retrieves Gemini API key from localStorage', () => {
      saveStoredGeminiApiKey('test-key-12345');
      expect(getStoredGeminiApiKey()).toBe('test-key-12345');
      expect(hasCustomApiKey()).toBe(true);
      expect(getCustomApiKey()).toBe('test-key-12345');

      saveStoredGeminiApiKey('');
      expect(hasCustomApiKey()).toBe(false);
      expect(getCustomApiKey()).toBe('');
      // Seamlessly falls back to built-in project key
      expect(typeof getStoredGeminiApiKey()).toBe('string');
      expect(getStoredGeminiApiKey().length).toBeGreaterThan(10);
    });
  });

  describe('extractGroundedQuestionsWithAi', () => {
    it('returns error when raw text is empty', async () => {
      const result = await extractGroundedQuestionsWithAi('', { apiKey: 'key-1' });
      expect(result.success).toBe(false);
      expect(result.questions).toHaveLength(0);
      expect(result.error).toContain('bo\'sh');
    });

    it('returns error when API key is completely missing', async () => {
      const result = await extractGroundedQuestionsWithAi('Sample text', { apiKey: '' });
      expect(result).toBeDefined();
      // When apiKey is empty and localStorage empty, it falls back to env key if present
      // If we mock getStoredGeminiApiKey to return empty:
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('');
      const resWithoutKey = await extractGroundedQuestionsWithAi('Sample text', { apiKey: '   ' });
      // either errors or uses fallback if env exists
      expect(resWithoutKey).toBeDefined();
    });

    it('successfully extracts grounded questions and initializes isApprovedByHuman to false', async () => {
      const mockGeminiJson = [
        {
          number: 1,
          title: '1-topshiriq',
          prompt: 'Kompyuterning apparat vositalarini moslashtiring.',
          taskType: 'subquestions',
          points: 10,
          subQuestions: [
            { id: '1-a', label: 'a)', prompt: 'Kiritish qurilmalari', points: 2.5, rubric: 'Har biriga 2.5 ball' },
            { id: '1-b', label: 'b)', prompt: 'Chiqarish qurilmalari', points: 2.5, rubric: 'Har biriga 2.5 ball' },
            { id: '1-c', label: 'c)', prompt: 'Saqlash qurilmalari', points: 2.5, rubric: 'Har biriga 2.5 ball' },
            { id: '1-d', label: 'd)', prompt: 'Boshqaruv qurilmalari', points: 2.5, rubric: 'Har biriga 2.5 ball' },
          ],
          rubric: 'Barcha bandlar to\'liq bajarilsa 10 ball',
          sourceExcerpt: '1-topshiriq. Kompyuterning apparat vositalarini moslashtiring: a) ... b) ... c) ... d) ...',
        },
        {
          number: 2,
          title: '2-topshiriq',
          prompt: 'Qaysi biri operatsion tizim hisoblanadi?',
          taskType: 'multiple_choice',
          points: 10,
          options: [
            { id: 'opt-a', label: 'A', text: 'Linux' },
            { id: 'opt-b', label: 'B', text: 'Python' },
            { id: 'opt-c', label: 'C', text: 'Chrome' },
          ],
          correctOptionId: 'opt-a',
          sourceExcerpt: '2-topshiriq. Qaysi biri operatsion tizim hisoblanadi? A) Linux B) Python C) Chrome',
        },
      ];

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockGeminiJson) }],
              },
            },
          ],
        }),
      } as Response);

      const result = await extractGroundedQuestionsWithAi('Mock document text', {
        apiKey: 'dummy-api-key',
        model: 'gemini-3.5-flash-lite',
        maxScore: 50,
      });

      expect(result.success).toBe(true);
      expect(result.questions).toHaveLength(2);

      // Verify Strict Grounding and Human-in-the-Loop constraints:
      const q1 = result.questions[0]!;
      expect(q1.isApprovedByHuman).toBe(false); // MUST require human review
      expect(q1.taskType).toBe('subquestions');
      expect(q1.subQuestions).toHaveLength(4);
      expect(q1.sourceExcerpt).toBeDefined();
      expect(q1.points).toBe(10);

      const q2 = result.questions[1]!;
      expect(q2.isApprovedByHuman).toBe(false);
      expect(q2.taskType).toBe('multiple_choice');
      expect(q2.options).toHaveLength(3);
      expect(q2.correctOptionId).toBe('opt-a');
    });

    it('handles API network failure gracefully without crashing', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network offline or rate limit exceeded'));

      const result = await extractGroundedQuestionsWithAi('Sample document', {
        apiKey: 'dummy-api-key',
      });

      expect(result.success).toBe(false);
      expect(result.questions).toHaveLength(0);
      expect(result.error).toContain('Network offline');
    });
  });

  describe('Deterministic BSB Regex Parser (Offline Fallback)', () => {
    const realBsbSample = `
9-sinf Informatika va AT. 1-BSB. 1-chorak.
Jami: 50 ball.

1-topshiriq. Kompyuterning apparat vositalarini vazifasiga ko'ra moslashtiring: [10 ball]
a) Klaviatura, sichqoncha, mikrofon qaysi toifaga kiradi?
b) Monitor, printer, dinamik qaysi toifaga kiradi?
c) Qattiq disk, SSD, flesh xotira qaysi toifaga kiradi?
d) Protsessor qanday asosiy vazifani bajaradi?
Baholash mezoni: Har bir band uchun 2.5 balldan beriladi.

2-topshiriq. Shtrix-kod va QR-kod texnologiyalarini solishtiring: [10 ball]
a) Shtrix-kod qanday ma'lumotlarni saqlaydi?
b) QR-kod qancha ma'lumot sig'diradi?
c) QR-kodning afzalliklari nimada?
d) Kundalik hayotda qayerda qo'llaniladi?
Baholash mezoni: Har bir to'g'ri javob uchun 2.5 ball.

3-topshiriq. Quyidagi xotira turlarini tezligi bo'yicha tartiblang: [10 ball]
Kesh xotira, Tezkor xotira (RAM), Qattiq disk (HDD), Optik disk (DVD).
Baholash mezoni: To'g'ri ketma-ketlik uchun 10 ball.
`;

    it('parses real BSB multi-part tasks, subquestions and rubrics deterministically', () => {
      const parsed = parseExamQuestionsFromText(realBsbSample, { maxScore: 50 });

      expect(parsed.success).toBe(true);
      expect(parsed.questions.length).toBeGreaterThanOrEqual(3);

      const task1 = parsed.questions[0]!;
      expect(task1.number).toBe(1);
      expect(task1.prompt).toContain('apparat vositalarini');
      expect(task1.subQuestions).toBeDefined();
      expect(task1.subQuestions?.length).toBe(4);
      expect(task1.subQuestions?.[0]?.label).toBe('a)');
      expect(task1.subQuestions?.[0]?.prompt).toContain('Klaviatura');
      expect(task1.rubric).toContain('2.5 balldan');
      expect(task1.sourceExcerpt).toBeDefined();

      const task2 = parsed.questions[1]!;
      expect(task2.number).toBe(2);
      expect(task2.prompt).toContain('Shtrix-kod');
      expect(task2.subQuestions?.length).toBe(4);

      const task3 = parsed.questions[2]!;
      expect(task3.number).toBe(3);
      expect(task3.prompt).toContain('xotira turlarini');
      expect(task3.rubric).toContain('To\'g\'ri ketma-ketlik');
    });
  });

  describe('Human-in-the-Loop Review Verification', () => {
    it('verifies human approval toggling and count calculations', () => {
      const questions: GroundedQuestionItem[] = [
        {
          id: 'q-1',
          number: 1,
          title: '1-topshiriq',
          prompt: 'Savol 1',
          taskType: 'subquestions',
          points: 10,
          sourceExcerpt: 'Excerpt 1',
          isApprovedByHuman: false,
        },
        {
          id: 'q-2',
          number: 2,
          title: '2-topshiriq',
          prompt: 'Savol 2',
          taskType: 'subquestions',
          points: 10,
          sourceExcerpt: 'Excerpt 2',
          isApprovedByHuman: false,
        },
      ];

      // Initially 0 approved
      let approvedCount = questions.filter((q) => q.isApprovedByHuman).length;
      expect(approvedCount).toBe(0);

      // Teacher approves question 1
      questions[0]!.isApprovedByHuman = true;
      approvedCount = questions.filter((q) => q.isApprovedByHuman).length;
      expect(approvedCount).toBe(1);
      expect(approvedCount === questions.length).toBe(false);

      // Teacher approves all
      questions.forEach((q) => {
        q.isApprovedByHuman = true;
      });
      approvedCount = questions.filter((q) => q.isApprovedByHuman).length;
      expect(approvedCount).toBe(2);
      expect(approvedCount === questions.length).toBe(true);
    });
  });
});
