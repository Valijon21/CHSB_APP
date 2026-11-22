import type {
  EmaktabStudent,
  AssessmentCandidate,
  StudentMatchPair,
  GradeScaleThresholds,
  MatchStatus,
} from '../../../entities/emaktab/model';
import { DEFAULT_GRADE_THRESHOLDS } from '../../../entities/emaktab/model';

import { isCyrillic, cyrillicToLatin } from './transliterationService';

/**
 * O'zbek tili harflari, apostroflari, Kirill/Lotin va bo'sh joylarni unifikatsiya qiladi.
 * Masalan: "Озодов Озодбек" -> "ozodov ozodbek"
 *          "Oʻktamov   Jasurbek  O'g'li" -> "oktamov jasurbek ogli"
 */
export function normalizeUzbekName(input: string): string {
  if (!input) return '';

  let converted = input.trim();
  if (isCyrillic(converted)) {
    converted = cyrillicToLatin(converted);
  }

  return converted
    .toLowerCase()
    .trim()
    // Har xil apostrof va urg'u belgilarini tozalash: ‘, ’, `, ʻ, ʼ, '
    .replace(/[ʻʼ'`‘’]/g, '')
    // Tire va keraksiz belgilarni bo'sh joyga almashtirish
    .replace(/[-_./\\,]/g, ' ')
    // Bir nechta bo'sh joylarni bitta bo'sh joyga keltirish
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Ikki satr orasidagi Levenshteyn masofasini hisoblaydi (Dynamic Programming).
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) {
    const row = dp[i];
    if (row) row[0] = i;
  }
  const firstRow = dp[0];
  if (firstRow) {
    for (let j = 0; j <= n; j++) firstRow[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    const currRow = dp[i];
    const prevRow = dp[i - 1];
    if (!currRow || !prevRow) continue;

    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const del = (prevRow[j] ?? 0) + 1;
      const ins = (currRow[j - 1] ?? 0) + 1;
      const sub = (prevRow[j - 1] ?? 0) + cost;
      currRow[j] = Math.min(del, ins, sub);
    }
  }

  return dp[m]?.[n] ?? 0;
}

/**
 * Ikki satr o'rtasidagi Levenshteyn asosidagi o'xshashlik koeffitsiyenti (0.00 dan 1.00 gacha)
 */
export function calculateStringSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const distance = calculateLevenshteinDistance(a, b);
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Ismlar so'zlari (tokenlari) bo'yicha aqlli solishtirish:
 * Masalan: "Aliyeva Madina" va "Madina Aliyeva" 100% mos keladi.
 * "Karimov Jasur" va "Karimov Jasur Anvar ogli" ham yuqori moslik oladi.
 */
export function calculateNameSimilarity(rawNameA: string, rawNameB: string): number {
  const normA = normalizeUzbekName(rawNameA);
  const normB = normalizeUzbekName(rawNameB);

  if (normA === normB) return 1.0;

  const tokensA = normA.split(' ').filter(Boolean);
  const tokensB = normB.split(' ').filter(Boolean);

  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  // Agar so'zlar to'plami bir xil bo'lsa (familiya-ism o'rni almashgan bo'lsa)
  const sortedA = [...tokensA].sort().join(' ');
  const sortedB = [...tokensB].sort().join(' ');
  if (sortedA === sortedB) return 0.99;

  // Qisqa va uzun nomlarni ajratish (masalan: "Gulnoza Aliyeva" vs "Aliyeva Gulnoza Anvar qizi")
  const shorterTokens = tokensA.length <= tokensB.length ? tokensA : tokensB;
  const longerTokens = tokensA.length <= tokensB.length ? tokensB : tokensA;

  // Qisqa nomdagi har bir so'zning uzun nomdagi eng yaxshi mosligi
  let shortTokensMatchSum = 0;
  for (const shortToken of shorterTokens) {
    let bestTokenSim = 0;
    for (const longToken of longerTokens) {
      const sim = calculateStringSimilarity(shortToken, longToken);
      if (sim > bestTokenSim) bestTokenSim = sim;
    }
    shortTokensMatchSum += bestTokenSim;
  }

  // Qisqa nomdagi so'zlarning qamrovi (coverage):
  // Masalan, 2 ta so'zdan 2 tasi to'liq topsa (Familiya + Ism), coverage = 1.0
  const shortCoverage = shortTokensMatchSum / shorterTokens.length;

  // Umumiy so'zlar nisbati (patronimika borligi sababli yengil penalti)
  const lengthRatio = shorterTokens.length / longerTokens.length;
  // Agar qisqa nom to'liq mos kelsa (masalan otasining ismi yo'q bo'lsa), ishonchlilik 0.80 - 0.92 bo'ladi
  const tokenSubsetSim = shortCoverage >= 0.85
    ? shortCoverage * (0.75 + 0.25 * lengthRatio)
    : (shortTokensMatchSum / longerTokens.length);

  // To'g'ridan-to'g'ri string similarity
  const directSim = calculateStringSimilarity(normA, normB);

  return Math.round(Math.max(directSim, tokenSubsetSim) * 100) / 100;
}

/**
 * Foizni 5 ballik baholash shkalasiga o'tkazadi
 */
export function calculateGrade5(
  percentage: number,
  thresholds: GradeScaleThresholds = DEFAULT_GRADE_THRESHOLDS
): number {
  if (percentage >= thresholds.grade5Min) return 5;
  if (percentage >= thresholds.grade4Min) return 4;
  if (percentage >= thresholds.grade3Min) return 3;
  return 2;
}

/**
 * eMaktab sinf ro'yxati va CHSB topshiruvchilarini avtomatik moslashtirish (Reconciliation)
 */
export function reconcileRosterWithCandidates(
  emaktabStudents: EmaktabStudent[],
  candidates: AssessmentCandidate[],
  thresholds: GradeScaleThresholds = DEFAULT_GRADE_THRESHOLDS
): StudentMatchPair[] {
  const result: StudentMatchPair[] = [];
  const matchedCandidateIds = new Set<string>();

  // Har bir eMaktab o'quvchisi uchun nomzodlarni qiyoslash
  const sortedStudents = [...emaktabStudents].sort((a, b) => a.orderIndex - b.orderIndex);

  // Barcha mumkin bo'lgan juftliklar bahosini hisoblash
  interface CandidateMatchScore {
    student: EmaktabStudent;
    candidate: AssessmentCandidate;
    score: number;
  }

  const allPairs: CandidateMatchScore[] = [];

  for (const student of sortedStudents) {
    for (const candidate of candidates) {
      const sim = calculateNameSimilarity(student.fullName, candidate.fullName);
      allPairs.push({ student, candidate, score: sim });
    }
  }

  // Eng yuqori ballga ega juftliklar bo'yicha saralash (Greedy Best-First Match)
  allPairs.sort((a, b) => b.score - a.score);

  const matchedStudentIds = new Set<string>();

  for (const pair of allPairs) {
    if (
      !matchedStudentIds.has(pair.student.emaktabId) &&
      !matchedCandidateIds.has(pair.candidate.candidateId) &&
      pair.score >= 0.7
    ) {
      matchedStudentIds.add(pair.student.emaktabId);
      matchedCandidateIds.add(pair.candidate.candidateId);

      const status: MatchStatus = pair.score >= 0.98 ? 'exact' : 'fuzzy';
      const grade =
        pair.candidate.status === 'submitted'
          ? calculateGrade5(pair.candidate.percentage, thresholds)
          : null;

      result.push({
        matchId: `match-${pair.student.emaktabId}`,
        emaktabStudent: pair.student,
        chsbCandidate: pair.candidate,
        confidenceScore: pair.score,
        status,
        manualOverride: false,
        finalGrade5: grade,
        absenceReason: pair.candidate.status === 'absent' ? 'sababli' : 'none',
      });
    }
  }

  // Mos kelmagan (CHSB topshirmagan) eMaktab o'quvchilari
  for (const student of sortedStudents) {
    if (!matchedStudentIds.has(student.emaktabId)) {
      result.push({
        matchId: `unmatched-emk-${student.emaktabId}`,
        emaktabStudent: student,
        chsbCandidate: undefined,
        confidenceScore: 0,
        status: 'unmatched_emaktab',
        manualOverride: false,
        finalGrade5: null,
        absenceReason: 'sababsiz',
      });
    }
  }

  // eMaktab ro'yxatida bo'lmagan, lekin CHSB topshirgan nomzodlar
  for (const candidate of candidates) {
    if (!matchedCandidateIds.has(candidate.candidateId)) {
      const grade =
        candidate.status === 'submitted'
          ? calculateGrade5(candidate.percentage, thresholds)
          : null;

      result.push({
        matchId: `unmatched-chsb-${candidate.candidateId}`,
        emaktabStudent: undefined,
        chsbCandidate: candidate,
        confidenceScore: 0,
        status: 'unmatched_chsb',
        manualOverride: false,
        finalGrade5: grade,
        absenceReason: 'none',
      });
    }
  }

  // Jurnaldagi tartib bo'yicha saralash
  return result.sort((a, b) => {
    const orderA = a.emaktabStudent?.orderIndex ?? 999;
    const orderB = b.emaktabStudent?.orderIndex ?? 999;
    return orderA - orderB;
  });
}
