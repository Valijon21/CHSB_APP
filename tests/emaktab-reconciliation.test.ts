import { describe, it, expect } from 'vitest';
import {
  normalizeUzbekName,
  calculateLevenshteinDistance,
  calculateNameSimilarity,
  calculateGrade5,
  reconcileRosterWithCandidates,
} from '../src/features/emaktab/services/reconciliationService';
import type { EmaktabStudent, AssessmentCandidate } from '../src/entities/emaktab/model';

describe('TASK-EM.2: Uzbek Name Normalizer & Fuzzy Reconciliation Engine', () => {
  it('normalizes Uzbek names by stripping diverse apostrophes and extra spaces', () => {
    expect(normalizeUzbekName("Oʻktamov   Jasur  O'g'li")).toBe('oktamov jasur ogli');
    expect(normalizeUzbekName("To‘xtayev Yo`ldosh")).toBe('toxtayev yoldosh');
    expect(normalizeUzbekName("G'aniyev-Alijon")).toBe('ganiyev alijon');
  });

  it('calculates correct Levenshtein distance', () => {
    expect(calculateLevenshteinDistance('kitob', 'kitob')).toBe(0);
    expect(calculateLevenshteinDistance('kitob', 'maktab')).toBe(4);
    expect(calculateLevenshteinDistance('olma', 'olcha')).toBe(2);
    expect(calculateLevenshteinDistance('', 'salom')).toBe(5);
  });

  it('accurately identifies name similarity even with inverted word order or slight typos', () => {
    // Exact same name
    expect(calculateNameSimilarity('Aliyeva Madina', 'Aliyeva Madina')).toBe(1.0);

    // Inverted name order: Familiya Ism vs Ism Familiya
    const invertedSim = calculateNameSimilarity('Madina Aliyeva', 'Aliyeva Madina');
    expect(invertedSim).toBeGreaterThanOrEqual(0.98);

    // Minor typo / phonetic difference (Javoxir vs Javohir)
    const typoSim = calculateNameSimilarity('Javoxir Karimov', 'Javohir Karimov');
    expect(typoSim).toBeGreaterThanOrEqual(0.85);

    // Diverse apostrophe variants (O'ktamov vs Oʻktamov)
    const apostropheSim = calculateNameSimilarity("O'ktamov Jasur", 'Oʻktamov Jasur');
    expect(apostropheSim).toBe(1.0);

    // Completely different people
    const diffSim = calculateNameSimilarity('Aliyeva Madina', 'Sobirov Jamshid');
    expect(diffSim).toBeLessThan(0.4);
  });

  it('converts percentages to 5-grade scale based on thresholds', () => {
    expect(calculateGrade5(95)).toBe(5);
    expect(calculateGrade5(86)).toBe(5);
    expect(calculateGrade5(85)).toBe(4);
    expect(calculateGrade5(71)).toBe(4);
    expect(calculateGrade5(70)).toBe(3);
    expect(calculateGrade5(56)).toBe(3);
    expect(calculateGrade5(55)).toBe(2);
    expect(calculateGrade5(10)).toBe(2);
  });

  it('reconciles class roster with candidates, detecting exact, fuzzy, and absent students', () => {
    const emaktabRoster: EmaktabStudent[] = [
      {
        emaktabId: 'e-1',
        fullName: "O'ktamov Jasurbek",
        normalizedName: 'oktamov jasurbek',
        orderIndex: 1,
      },
      {
        emaktabId: 'e-2',
        fullName: 'Aliyeva Gulnoza Anvar qizi',
        normalizedName: 'aliyeva gulnoza anvar qizi',
        orderIndex: 2,
      },
      {
        emaktabId: 'e-3',
        fullName: 'Boboyev Sardor',
        normalizedName: 'boboyev sardor',
        orderIndex: 3,
      },
    ];

    const candidates: AssessmentCandidate[] = [
      // Exact / very close match with inverted order and apostrophe
      {
        candidateId: 'c-1',
        fullName: 'Jasurbek Oʻktamov',
        normalizedName: 'jasurbek oktamov',
        score: 38,
        maxScore: 40,
        percentage: 95,
        status: 'submitted',
      },
      // Fuzzy match (short name vs full name)
      {
        candidateId: 'c-2',
        fullName: 'Gulnoza Aliyeva',
        normalizedName: 'gulnoza aliyeva',
        score: 30,
        maxScore: 40,
        percentage: 75,
        status: 'submitted',
      },
      // Student who is not on eMaktab roster
      {
        candidateId: 'c-99',
        fullName: 'Mehmon Oʻquvchi',
        normalizedName: 'mehmon oquvchi',
        score: 25,
        maxScore: 40,
        percentage: 62.5,
        status: 'submitted',
      },
    ];

    const pairs = reconcileRosterWithCandidates(emaktabRoster, candidates);

    // e-1 should match c-1
    const pair1 = pairs.find((p) => p.emaktabStudent?.emaktabId === 'e-1');
    expect(pair1).toBeDefined();
    expect(pair1?.chsbCandidate?.candidateId).toBe('c-1');
    expect(pair1?.finalGrade5).toBe(5);
    expect(['exact', 'fuzzy']).toContain(pair1?.status);

    // e-2 should match c-2 with fuzzy
    const pair2 = pairs.find((p) => p.emaktabStudent?.emaktabId === 'e-2');
    expect(pair2).toBeDefined();
    expect(pair2?.chsbCandidate?.candidateId).toBe('c-2');
    expect(pair2?.finalGrade5).toBe(4);

    // e-3 was absent (no test candidate)
    const pair3 = pairs.find((p) => p.emaktabStudent?.emaktabId === 'e-3');
    expect(pair3).toBeDefined();
    expect(pair3?.status).toBe('unmatched_emaktab');
    expect(pair3?.finalGrade5).toBeNull();
    expect(pair3?.absenceReason).toBe('sababsiz');

    // c-99 was not on the roster
    const extraPair = pairs.find((p) => p.chsbCandidate?.candidateId === 'c-99');
    expect(extraPair).toBeDefined();
    expect(extraPair?.status).toBe('unmatched_chsb');
    expect(extraPair?.finalGrade5).toBe(3);
  });
});
