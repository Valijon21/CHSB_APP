import { describe, it, expect } from 'vitest';
import { parseExamQuestionsFromText } from '../src/shared/utils/pdfQuestionParser';

describe('PDF Exam Question Parser Engine', () => {
  it('handles empty or whitespace raw text gracefully', () => {
    const res1 = parseExamQuestionsFromText('');
    expect(res1.success).toBe(false);
    expect(res1.totalFound).toBe(0);
    expect(res1.questions).toHaveLength(0);

    const res2 = parseExamQuestionsFromText('   \n  \t  ');
    expect(res2.success).toBe(false);
  });

  it('parses standard multiple-choice questions with inline answers', () => {
    const raw = `
1. Axborotning eng kichik o'lchov birligi qaysi?
A) Bayt
B) Bit
C) Kilobayt
D) Megabayt
Javob: B

2. Linux qanday dasturiy ta'minot turiga kiradi?
A) Amaliy dastur
B) Tizimli dastur (Operatsion tizim)
C) Uskunaviy vosita
D) Dasturlash tili
To'g'ri javob: B

3. HTML qisqartmasining to'liq ma'nosi nima?
A) Hyper Text Markup Language
B) High Tech Modern Language
C) Home Tool Markup Language
D) Hyperlinks Text Mode
Ans: A
`;

    const result = parseExamQuestionsFromText(raw, { maxScore: 30 });
    expect(result.success).toBe(true);
    expect(result.totalFound).toBe(3);
    expect(result.questions).toHaveLength(3);

    // Q1
    expect(result.questions[0]?.number).toBe(1);
    expect(result.questions[0]?.prompt).toContain("Axborotning eng kichik o'lchov birligi");
    expect(result.questions[0]?.options).toHaveLength(4);
    expect(result.questions[0]?.options[1]?.text).toBe('Bit');
    expect(result.questions[0]?.correctOptionId).toBe('opt-b');
    expect(result.questions[0]?.points).toBe(10); // 30 / 3

    // Q2
    expect(result.questions[1]?.number).toBe(2);
    expect(result.questions[1]?.correctOptionId).toBe('opt-b');

    // Q3
    expect(result.questions[2]?.number).toBe(3);
    expect(result.questions[2]?.correctOptionId).toBe('opt-a');
  });

  it('parses questions when answers are declared in a trailing key table', () => {
    const raw = `
1. Algoritmning asosiy xossalaridan birini toping.
A) Aniqlik va tushunarlilik
B) Tezlik
C) Rang-baranglik
D) Hajm

2. Python tilida chop etish operatori qaysi?
A) echo
B) console.log
C) print
D) printf

Javoblar: 1-A, 2-C
`;

    const result = parseExamQuestionsFromText(raw, { maxScore: 20 });
    expect(result.success).toBe(true);
    expect(result.totalFound).toBe(2);
    expect(result.questions[0]?.correctOptionId).toBe('opt-a');
    expect(result.questions[1]?.correctOptionId).toBe('opt-c');
    expect(result.questions[0]?.points).toBe(10);
  });

  it('handles multi-line prompts and multi-line option text', () => {
    const raw = `
1. Kompyuter tarmoqlarida OSI modeli 7 ta sathdan iborat bo'lib,
ulardan eng yuqori foydalanuvchi bilan ishlaydigan sathi qaysi hisoblanadi?
A) Amaliy sath (Application layer) - foydalanuvchi ilovalari bilan
bevosita muloqot qiluvchi yuqori darajadagi sath
B) Kanal sathi
C) Tarmoq sathi
D) Fizik sath
Javob: A
`;

    const result = parseExamQuestionsFromText(raw);
    expect(result.success).toBe(true);
    expect(result.totalFound).toBe(1);
    expect(result.questions[0]?.prompt).toContain('OSI modeli 7 ta sathdan');
    expect(result.questions[0]?.prompt).toContain('foydalanuvchi bilan ishlaydigan');
    expect(result.questions[0]?.options[0]?.text).toContain('foydalanuvchi ilovalari bilan bevosita muloqot');
    expect(result.questions[0]?.correctOptionId).toBe('opt-a');
  });

  it('ignores invalid non-question text or blocks with fewer than 2 options', () => {
    const raw = `
Respublika Ta'lim Markazi
11-sinf Informatika CHSB Test Savollari

1. Bu savol faqat bitta variantga ega:
A) Yagona variant
Javob: A

2. Haqiqiy to'liq savol:
A) Variant 1
B) Variant 2
C) Variant 3
Javob: B
`;

    const result = parseExamQuestionsFromText(raw);
    expect(result.success).toBe(true);
    expect(result.totalFound).toBe(1); // Only question #2 is valid
    expect(result.questions[0]?.number).toBe(2);
  });
});
