/**
 * CHSB Domain Semantic Schema Catalog
 * Translates educational domain terms, PISA competencies, and CHSB database schema for LLM reasoning.
 */

export const CHSB_DATABASE_SCHEMA_SUMMARY = `
SQLite Database Schema for CHSB School Assessment Platform:

1. tenants (id, slug, name, region_id, is_active, created_at)
   - Tashkilot / Maktablar tarmog'i

2. schools (id, tenant_id, name, district_id, school_type, student_count, created_at)
   - Maktablar ma'lumotlari. district_id: tuman kodi.

3. class_groups (id, school_id, tenant_id, name, grade_level, shift, academic_year, student_count)
   - Sinflar (masalan: 11-A, 10-B). grade_level: 5 dan 11 gacha sinf raqami.

4. students (id, school_id, class_group_id, tenant_id, roster_code, first_name, last_name, middle_name, gender, birth_date, status)
   - O'quvchilar ro'yxati. roster_code: unikal kod (masalan: STU-1001).

5. assessments (id, code, title, subject, grade_level, duration_minutes, total_questions, max_score)
   - CHSB / BSB imtihonlari (masalan: CHSB-MATH-11). max_score: maksimal ball (masalan: 40.0).

6. questions (id, assessment_id, question_number, prompt, options_json, correct_option_id, bloom_level, difficulty, points)
   - Savollar va Bloom taksonomiyasi darajalari: 'KNOWLEDGE', 'COMPREHENSION', 'APPLICATION', 'ANALYSIS'.

7. assessment_attempts (id, assessment_id, student_id, started_at, submitted_at, answers_json, time_spent_seconds, status)
   - O'quvchilarning imtihon topshirish urinishlari.

8. assessment_results (id, attempt_id, student_id, score, max_score, percentage, grade, status, submitted_at)
   - Imtihon natijalari.
   - score: to'plangan ball
   - percentage: to'plangan foiz (0 - 100)
   - grade: Baho ('5', '4', '3', '2')

OECD PISA 2025 / 2026 Kognitiv Darajalari (foizlar bo'yicha):
- 1-Daraja (Past o'zlashtirish / At Risk): percentage < 40% (Baho: '2')
- 2-Daraja (Bazaviy savodxonlik): 40% <= percentage < 60% (Baho: '3')
- 3-Daraja (O'rta o'zlashtirish): 60% <= percentage < 75% (Baho: '4')
- 4-5 Daraja (Yuqori savodxonlik): 75% <= percentage < 90% (Baho: '5')
- 6-Daraja (Iqtidorli / Mukammal): percentage >= 90% (Baho: '5+')
`;

export const CHSB_SYSTEM_PROMPT = `
Siz O'zbekiston Respublikasi maktablaridagi CHSB (Choraklik Baholash) va BSB (Bo'lim bo'yicha baholash) tizimi bo'yicha yetakchi Pedagogik Analitika va Maktab Razvedkasi (School Intelligence) AI mutaxassisisiz.

Vazifangiz:
Foydalanuvchining (o'qituvchi, maktab direktori yoki viloyat MMTO inspektori) tabiiy tildagi so'roviga asosan ma'lumotlar bazasidan kerakli ma'lumotlarni chiqarish uchun toza va xavfsiz SQL (faqat SELECT) yozish, so'ngra olingan ma'lumotlarni OpenUI formatidagi interaktiv vidjetlar bilan tahlil qilish.

Qoidalar:
1. Faqat SELECT yoki WITH bilan boshlanuvchi SQL generatsiya qiling.
2. Natijalarni foydalanuvchiga tushunarli, pedagogik asoslangan va OECD PISA standartlariga mos holda tushuntiring.
3. Baholar va o'zlashtirish ko'rsatkichlarini hisoblashda:
   - Sifat ko'rsatkichi (Sifat %) = ("4" va "5" baho olganlar soni / Jami qatnashganlar) * 100
   - O'zlashtirish ko'rsatkichi (O'zlashtirish %) = ("3", "4" va "5" baho olganlar soni / Jami qatnashganlar) * 100
4. Har bir tahlil yakunida o'qituvchilar uchun aniq metodik tavsiya (Actionable Pedagogical Recommendation) bering.
`;
