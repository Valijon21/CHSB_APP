import { describe, it, expect } from 'vitest';
import {
  officialBsbAssessments,
  officialBsb5GradeQuestions,
  officialBsb6GradeQuestions,
  officialBsb7GradeQuestions,
  officialBsb9GradeQuestions,
  officialBsb10GradeQuestions,
  officialBsb11GradeQuestions,
  getBsbStandardByGrade,
} from '../src/entities/assessment/officialBsbData';
import { QuestionSchema, AssessmentSchema } from '../src/entities/assessment/model';

describe('Official Ministry BSB Curriculum Integrity Tests', () => {
  it('should have official assessments for all required grades', () => {
    expect(officialBsbAssessments.length).toBeGreaterThanOrEqual(6);
    const grades = officialBsbAssessments.map((a) => a.grade);
    expect(grades).toContain(5);
    expect(grades).toContain(6);
    expect(grades).toContain(7);
    expect(grades).toContain(9);
    expect(grades).toContain(10);
    expect(grades).toContain(11);
  });

  it('should enforce 25 points standard for grades 5, 6, 7', () => {
    const grades5to7 = [5, 6, 7];
    for (const g of grades5to7) {
      const standard = getBsbStandardByGrade(g);
      expect(standard.maxScore).toBe(25);
      expect(standard.questionCount).toBe(5);
      expect(standard.durationMinutes).toBe(40);
      expect(standard.sampleQuestions).toHaveLength(5);

      const totalSum = standard.sampleQuestions.reduce((acc, q) => acc + q.points, 0);
      expect(totalSum).toBe(25);
    }
  });

  it('should enforce 50 points standard for grades 8, 9, 10, 11', () => {
    const grades8to11 = [8, 9, 10, 11];
    for (const g of grades8to11) {
      const standard = getBsbStandardByGrade(g);
      expect(standard.maxScore).toBe(50);
      expect(standard.questionCount).toBe(5);
      expect(standard.durationMinutes).toBe(40);
      expect(standard.sampleQuestions).toHaveLength(5);

      const totalSum = standard.sampleQuestions.reduce((acc, q) => acc + q.points, 0);
      expect(totalSum).toBe(50);
    }
  });

  it('should validate 9-sinf 1-BSB real PDF task structure', () => {
    const q9 = officialBsb9GradeQuestions;
    expect(q9).toHaveLength(5);

    // Q1: Apparat ta'minoti 4 ta qismi (2.5 balldan = 10 ball)
    expect(q9[0]!.points).toBe(10);
    expect(q9[0]!.subQuestions).toHaveLength(4);
    expect(q9[0]!.subQuestions?.reduce((acc, s) => acc + s.points, 0)).toBe(10);

    // Q2: Shtrix-kod va PIN rider (5 + 5 = 10 ball)
    expect(q9[1]!.points).toBe(10);
    expect(q9[1]!.subQuestions).toHaveLength(2);

    // Q3: Xotira qurilmalari tahlili jadvali (12 ball)
    expect(q9[2]!.points).toBe(12);
    expect(q9[2]!.taskType).toBe('table_completion');
    expect(q9[2]!.tableData?.rows).toHaveLength(4);

    // Q4: Tarmoq texnologiyalari keysi (8 ball)
    expect(q9[3]!.points).toBe(8);
    expect(q9[3]!.taskType).toBe('case_study');

    // Q5: URL tahlili (10 ball)
    expect(q9[4]!.points).toBe(10);
    expect(q9[4]!.subQuestions).toHaveLength(4);

    // Total 10 + 10 + 12 + 8 + 10 = 50 ball
    const sum = q9.reduce((acc, q) => acc + q.points, 0);
    expect(sum).toBe(50);
  });

  it('should validate 10-sinf 1-BSB real PDF task structure (Caesar Cipher, Phishing)', () => {
    const q10 = officialBsb10GradeQuestions;
    expect(q10).toHaveLength(5);

    // Q2: Caesar Cipher
    expect(q10[1]!.taskType).toBe('case_study');
    const block1 = q10[1]!.blocks[0];
    if (block1 && block1.type === 'paragraph') {
      expect(block1.text).toContain('fvzfynh kqtbjw');
    }

    // Q5: Phishing attack case study
    expect(q10[4]!.taskType).toBe('case_study');
    const block4 = q10[4]!.blocks[0];
    if (block4 && block4.type === 'paragraph') {
      expect(block4.text).toContain('10,000,000');
    }
    expect(q10[4]!.subQuestions?.some((s) => s.rubric?.includes('Fishing'))).toBe(true);

    const sum = q10.reduce((acc, q) => acc + q.points, 0);
    expect(sum).toBe(50);
  });

  it('should pass Zod QuestionSchema validation for all official questions', () => {
    const allQuestions = [
      ...officialBsb5GradeQuestions,
      ...officialBsb6GradeQuestions,
      ...officialBsb7GradeQuestions,
      ...officialBsb9GradeQuestions,
      ...officialBsb10GradeQuestions,
      ...officialBsb11GradeQuestions,
    ];

    for (const q of allQuestions) {
      const parsed = QuestionSchema.safeParse(q);
      expect(parsed.success).toBe(true);
    }
  });

  it('should pass Zod AssessmentSchema validation for all official assessments', () => {
    for (const assessment of officialBsbAssessments) {
      const parsed = AssessmentSchema.safeParse(assessment);
      expect(parsed.success).toBe(true);
    }
  });

  it('should correctly serialize and parse multi-part BSB student responses', () => {
    const studentAnswerPayload = {
      '9-1-a': 'Ma’lumotlarni kiritish uchun xizmat qiladi',
      '9-1-b': 'Arifmetik va mantiqiy amallarni hisoblaydi',
      '9-1-c': 'Natijalarni ekranga chiqaradi',
      '9-1-d': 'Ma’lumotlarni saqlaydi',
    };

    const serialized = JSON.stringify(studentAnswerPayload);
    expect(typeof serialized).toBe('string');

    const parsed = JSON.parse(serialized);
    expect(parsed['9-1-a']).toBe('Ma’lumotlarni kiritish uchun xizmat qiladi');
    expect(Object.keys(parsed)).toHaveLength(4);
  });
});
