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

  it('parses PMM 5-sinf BSB PDF text with unicode italics, eMaktab watermarks and trailing Baholash mezoni rubric table', () => {
    const raw5th = `
2026 - 2027 - o‘quv yilida 5 - sinf o‘quvchilarining I chorakda
“Informatika va axborot texnologiyalari” fanidan o‘zlashtirish darajasini
aniqlash uchun savol va topshiriqlar
I chorak 1 - BSB ( Original )
Jami: [ 25 ball ]
1 - topshiriq.
“informatika” so‘zini Informatika va INFORMATIKA ko‘rinishida yozish uchun
klaviaturadagi qaysi tugmalardan foydalanish kerak?
𝑎 ) __________________________________________________________________
𝑏 ) __________________________________________________________________
2 - topshiriq.
Matndagi birinchi va ikkinchi gaplarning o‘rnini almashtirish uchun qanday amallar bajarish kerak?
____________________________________________________________________
1000011303702 eMaktab
1000011303702 e
3 - topshiriq.
Ziyoda MS Word dasturida "soat" so‘zini nusxalab joylashtirmoqchi. Qanday amallarni bajarishi kerak?
____________________________________________________________________
4 - topshiriq.
Hujjatni saqlashning 2 ta usulini sanab bering. Ular bir-biridan qanday farq qiladi?
____________________________________________________________________
5 - topshiriq.
Matnni xatosiz va to‘g‘ri yozilganiga ishonch hosil qilish uchun uni tekshirishda nimalarga e’tibor berish kerak?
____________________________________________________________________
Baholash mezoni
Bob Mavzu Baholanadigan ko‘nikma Namunaviy topshiriq Ajratilgan ball Baholash mezoni
I bob. Matnli hujjat bilan ishlash
Sichqoncha va klaviaturadan foydalanish
1 - topshiriq 4 ball
1) “Informatika” uchun Shift tugmasini to‘g‘ri ko‘rsatsa 2 ball;
2) “INFORMATIKA” uchun Caps Lock tugmasini to‘g‘ri ko‘rsatsa 2 ball;
2 - topshiriq 5 ball
1) Cut va Paste amalini bajarsa 5 ball;
3 - topshiriq 5 ball
1) Copy va Paste amalini bajarsa 5 ball;
4 - topshiriq 6 ball
1) Save va Save As usullarini tushuntirsa 6 ball;
5 - topshiriq 5 ball
1) to‘g‘ri berilgan javob uchun 5 ball;
Jami 25 ball
Izoh: Ushbu materiallar o‘qituvchiga BSB topshiriqlarining qaysi bob va mavzudan ekanligi haqidagi ma’lumotni beradi.
`;

    const res = parseExamQuestionsFromText(raw5th, { maxScore: 25 });
    expect(res.success).toBe(true);
    expect(res.totalFound).toBe(5);
    expect(res.questions.reduce((acc, q) => acc + q.points, 0)).toBe(25);
    expect(res.questions[0]?.points).toBe(4);
    expect(res.questions[0]?.subQuestions?.length).toBe(2);
    expect(res.questions[0]?.subQuestions?.[0]?.label).toBe('a)');
    expect(res.questions[3]?.points).toBe(6);
    expect(res.questions[4]?.points).toBe(5);
    expect(res.questions[4]?.prompt).not.toContain('Jami 25 ball');
    expect(res.questions[4]?.prompt).not.toContain('eMaktab');
    expect(res.questions[4]?.rubric).toContain('to‘g‘ri berilgan javob uchun 5 ball');
  });

  it('parses PMM 6-sinf numbered subquestions and 9-sinf duplicate labels & table completion', () => {
    const rawMixed = `
1 - topshiriq. Matn stili va Wrap Text – 5 ball.
a) "Kelajak texnologiyalari" matnida qo‘llanilgan uchta formatlash xususiyatini yozing. (3 ball)
1) __________________________________________________________________
2) __________________________________________________________________
b) Rasm atrofida matn joylashishi uchun qaysi Wrap Text sozlamasidan foydalanilgan? (2 ball)
2 - topshiriq. Quyida berilgan qurilmalarning bittadan afzallik va kamchiligini yozing. [ 1 0 ball ]
a) Shtrix kod rider →
Afzalligi – _________________________________________________________
Kamchiligi – ________________________________________________________
a) Chip va PIN rider →
Afzalligi – _________________________________________________________
Kamchiligi – ________________________________________________________
3 - topshiriq. Quyida turli xotira qurilmalarining xususiyatlari haqida jadval berilgan. Jadvaldagi bo’sh o’rinlarni to’g’ri to’ldiring. [ 1 2 ball ]
Bo’sh joylarga quyidagilardan biri yozilishi shart: sekin, tez, juda tez
`;

    const res = parseExamQuestionsFromText(rawMixed, { maxScore: 50 });
    expect(res.success).toBe(true);
    expect(res.totalFound).toBe(3);
    expect(res.questions[0]?.points).toBe(5);
    expect(res.questions[0]?.subQuestions?.map((s) => s.points)).toEqual([3, 2]);
    expect(res.questions[1]?.points).toBe(10);
    expect(res.questions[1]?.subQuestions?.length).toBe(2);
    expect(res.questions[1]?.subQuestions?.[0]?.id).not.toBe(res.questions[1]?.subQuestions?.[1]?.id);
    expect(res.questions[2]?.taskType).toBe('table_completion');
    expect(res.questions[2]?.points).toBe(12);
  });

  it('rejects non-exam scientific conference text with zero questions', () => {
    const conferenceText = `
O‘ZBEKISTON RESPUBLIKASI NAMANGAN MUHANDISLIK-QURILISH INSTITUTI
24-25-sentyabr 2021 yil
1. KIRISH
Mamlakatimizda ohirgi besh yilda barcha sohalarda islohotlar o‘tkazilmoqda.
2. XULOSA
Ilmiy tadqiqot natijalari keltirilgan.
`;
    const res = parseExamQuestionsFromText(conferenceText);
    expect(res.success).toBe(false);
    expect(res.totalFound).toBe(0);
  });
});
