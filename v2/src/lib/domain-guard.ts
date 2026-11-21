/**
 * Domain & Scope Guardrail for CHSB School AI
 * Ensures all queries are strictly related to school assessments, students, classes, and pedagogical analytics.
 * Rejects out-of-domain questions (weather, crypto, general chatting) before any database or LLM invocation.
 */

export interface DomainCheckResult {
  isAllowed: boolean;
  reason?: string;
  suggestedPrompt?: string;
}

const SCHOOL_KEYWORDS = [
  'maktab', 'sinf', 'o‘quvchi', "o'quvchi", 'student', 'class', 'school',
  'chsb', 'bsb', 'baho', 'ball', 'foiz', 'percentage', 'grade', 'score',
  'pisa', 'bloom', 'kognitiv', 'savol', 'imtihon', 'test', 'natija',
  'reyting', 'ranking', 'o‘zlashtirish', "o'zlashtirish", 'sifat',
  'qoniqarsiz', 'a‘lochi', "a'lochi", 'xavf', 'roster', 'fan', 'attestatsiya',
  'mmto', 'vazirlik', 'emaktab', 'kundalik'
];

const PROHIBITED_OUT_OF_DOMAIN_PATTERNS = [
  /\b(ob-havo|ob havo|weather)\b/i,
  /\b(dollar|valyuta|kurs|kripto|bitcoin|narx|narxi)\b/i,
  /\b(retsept|ovqat|pishirish|taom)\b/i,
  /\b(she['’`]?r|qo['’`]?shiq|musiqa|kino|film)\b/i,
  /\b(siyosat|prezident|saylov)\b/i,
  /\b(dasturlash|python yoz|javascript yoz|hack|kod yozib ber)\b/i,
];

export function validateDomainScope(userPrompt: string): DomainCheckResult {
  const normalized = userPrompt.toLowerCase().trim();

  // 1. Check for explicit out-of-domain patterns
  for (const pattern of PROHIBITED_OUT_OF_DOMAIN_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        isAllowed: false,
        reason: 'Ushbu tizim faqat CHSB/BSB maktab baholashlari, sinflar va o‘quvchilar tahliliga ixtisoslashgan. Ta’limdan tashqari boshqa mavzular bo‘yicha tahlil o‘tkazilmaydi.',
        suggestedPrompt: 'Masalan: "11-sinflar kesimida CHSB natijalari" yoki "Past o‘zlashtirgan o‘quvchilar ro‘yxati".',
      };
    }
  }

  // 2. Check for relevant educational keywords or if it contains class numbers (e.g. "11-a", "9-sinf")
  const hasSchoolKeyword = SCHOOL_KEYWORDS.some((kw) => normalized.includes(kw));
  const hasClassNumberPattern = /\b\d{1,2}[-\s]?[a-zа-яA-ZА-Я]?\b/.test(normalized);

  if (!hasSchoolKeyword && !hasClassNumberPattern && normalized.length > 5) {
    // If the prompt is too generic or unrelated
    return {
      isAllowed: false,
      reason: 'Savolingiz maktab ta’limi yoki imtihonlariga oid emasdek ko‘rinmoqda. Iltimos, aniqroq maktab, sinf, fan yoki baholar haqida savol bering.',
      suggestedPrompt: 'Masalan: "Umumiy maktablar va CHSB ko‘rsatkichlarini ko‘rsat".',
    };
  }

  return { isAllowed: true };
}
