import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  EmaktabStudent,
  AssessmentCandidate,
  StudentMatchPair,
  GradeScaleThresholds,
  MatchStatus,
  AbsenceReason,
} from '../../../entities/emaktab/model';
import { DEFAULT_GRADE_THRESHOLDS } from '../../../entities/emaktab/model';
import {
  reconcileRosterWithCandidates,
  calculateGrade5,
} from '../services/reconciliationService';
import { parseEmaktabRoster } from '../services/rosterParserService';
import {
  generateEmaktabCsv,
  generateClipboardColumn,
} from '../services/emaktabExportService';

export const useEmaktabSyncStore = defineStore('emaktabSync', () => {
  // State
  const assessmentId = ref<string>('asm-001');
  const className = ref<string>('9-A');
  const subjectName = ref<string>('Matematika');
  const quarter = ref<number>(2);

  const emaktabStudents = ref<EmaktabStudent[]>([]);
  const candidates = ref<AssessmentCandidate[]>([]);
  const matchPairs = ref<StudentMatchPair[]>([]);
  const thresholds = ref<GradeScaleThresholds>({ ...DEFAULT_GRADE_THRESHOLDS });

  const selectedFilter = ref<'all' | MatchStatus>('all');
  const isReconciling = ref<boolean>(false);
  const clipboardCopied = ref<boolean>(false);
  const lastExportedAt = ref<string | null>(null);

  // Getters
  const filteredPairs = computed(() => {
    if (selectedFilter.value === 'all') {
      return matchPairs.value;
    }
    return matchPairs.value.filter((p) => p.status === selectedFilter.value);
  });

  const stats = computed(() => {
    const total = matchPairs.value.length;
    let exact = 0;
    let fuzzy = 0;
    let unmatchedEmaktab = 0;
    let unmatchedChsb = 0;

    const gradesCount: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0 };
    let absentCount = 0;
    let totalScoreSum = 0;
    let scoredCandidatesCount = 0;

    for (const pair of matchPairs.value) {
      if (pair.status === 'exact') exact++;
      if (pair.status === 'fuzzy') fuzzy++;
      if (pair.status === 'unmatched_emaktab') unmatchedEmaktab++;
      if (pair.status === 'unmatched_chsb') unmatchedChsb++;

      if (pair.finalGrade5 !== null) {
        gradesCount[pair.finalGrade5] = (gradesCount[pair.finalGrade5] ?? 0) + 1;
      } else {
        absentCount++;
      }

      if (pair.chsbCandidate && pair.chsbCandidate.status === 'submitted') {
        totalScoreSum += pair.chsbCandidate.percentage;
        scoredCandidatesCount++;
      }
    }

    const averagePercentage =
      scoredCandidatesCount > 0 ? Math.round(totalScoreSum / scoredCandidatesCount) : 0;

    return {
      total,
      exact,
      fuzzy,
      unmatchedEmaktab,
      unmatchedChsb,
      gradesCount,
      absentCount,
      averagePercentage,
      reconciliationRate:
        total > 0 ? Math.round(((exact + fuzzy) / Math.max(1, emaktabStudents.value.length)) * 100) : 0,
    };
  });

  const generatedCsv = computed(() => {
    return generateEmaktabCsv(matchPairs.value, {
      className: className.value,
      subjectName: subjectName.value,
      quarter: quarter.value,
    });
  });

  const clipboardText = computed(() => {
    return generateClipboardColumn(matchPairs.value);
  });

  // Actions
  function setAssessmentContext(params: {
    assessmentId: string;
    className?: string;
    subjectName?: string;
    quarter?: number;
    initialCandidates?: AssessmentCandidate[];
  }) {
    assessmentId.value = params.assessmentId;
    if (params.className) className.value = params.className;
    if (params.subjectName) subjectName.value = params.subjectName;
    if (params.quarter) quarter.value = params.quarter;

    if (params.initialCandidates && params.initialCandidates.length > 0) {
      candidates.value = params.initialCandidates;
    } else if (candidates.value.length === 0) {
      candidates.value = createMockCandidates();
    }
  }

  function importRosterFromText(rawText: string, targetClassName?: string) {
    const parsed = parseEmaktabRoster(rawText, targetClassName || className.value);
    emaktabStudents.value = parsed;
    runReconciliation();
  }

  function runReconciliation() {
    isReconciling.value = true;
    try {
      matchPairs.value = reconcileRosterWithCandidates(
        emaktabStudents.value,
        candidates.value,
        thresholds.value
      );
    } finally {
      isReconciling.value = false;
    }
  }

  function setManualMatch(emaktabId: string, candidateId: string | null) {
    const pair = matchPairs.value.find((p) => p.emaktabStudent?.emaktabId === emaktabId);
    if (!pair) return;

    if (candidateId === null) {
      // Nomzodni olib tashlash (talaba qatnashmagan qilib belgilash)
      pair.chsbCandidate = undefined;
      pair.status = 'unmatched_emaktab';
      pair.confidenceScore = 0;
      pair.manualOverride = true;
      pair.finalGrade5 = null;
      pair.absenceReason = 'sababsiz';
    } else {
      const candidate = candidates.value.find((c) => c.candidateId === candidateId);
      if (candidate) {
        pair.chsbCandidate = candidate;
        pair.status = 'exact';
        pair.confidenceScore = 1.0;
        pair.manualOverride = true;
        pair.finalGrade5 =
          candidate.status === 'submitted'
            ? calculateGrade5(candidate.percentage, thresholds.value)
            : null;
        pair.absenceReason = 'none';
      }
    }
  }

  function setAbsenceReason(matchId: string, reason: AbsenceReason) {
    const pair = matchPairs.value.find((p) => p.matchId === matchId);
    if (pair) {
      pair.absenceReason = reason;
    }
  }

  function updateThresholds(newThresholds: GradeScaleThresholds) {
    thresholds.value = { ...newThresholds };

    // Barcha juftliklarning baholarini yangi shkala bo'yicha qayta hisoblash
    for (const pair of matchPairs.value) {
      if (pair.chsbCandidate && pair.chsbCandidate.status === 'submitted') {
        pair.finalGrade5 = calculateGrade5(pair.chsbCandidate.percentage, thresholds.value);
      }
    }
  }

  function setFilter(filter: 'all' | MatchStatus) {
    selectedFilter.value = filter;
  }

  async function copyClipboardGrades(): Promise<boolean> {
    const text = clipboardText.value;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      clipboardCopied.value = true;
      setTimeout(() => {
        clipboardCopied.value = false;
      }, 3000);
      return true;
    } catch {
      clipboardCopied.value = false;
      return false;
    }
  }

  function downloadCsv() {
    const csv = generatedCsv.value;
    lastExportedAt.value = new Date().toISOString();

    if (typeof document !== 'undefined') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `eMaktab_${className.value}_${subjectName.value}_CHSB.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  // Yordamchi mock nomzodlar generatori
  function createMockCandidates(): AssessmentCandidate[] {
    return [
      {
        candidateId: 'cand-01',
        fullName: "Jasurbek O'ktamov",
        normalizedName: 'jasurbek oktamov',
        score: 38,
        maxScore: 40,
        percentage: 95,
        status: 'submitted',
      },
      {
        candidateId: 'cand-02',
        fullName: 'Madina Aliyeva',
        normalizedName: 'madina aliyeva',
        score: 31,
        maxScore: 40,
        percentage: 77.5,
        status: 'submitted',
      },
      {
        candidateId: 'cand-03',
        fullName: 'Sardor Boboyev',
        normalizedName: 'sardor boboyev',
        score: 25,
        maxScore: 40,
        percentage: 62.5,
        status: 'submitted',
      },
      {
        candidateId: 'cand-04',
        fullName: "Dilnoza G'aniyeva",
        normalizedName: 'dilnoza ganiyeva',
        score: 20,
        maxScore: 40,
        percentage: 50,
        status: 'submitted',
      },
    ];
  }

  return {
    // State
    assessmentId,
    className,
    subjectName,
    quarter,
    emaktabStudents,
    candidates,
    matchPairs,
    thresholds,
    selectedFilter,
    isReconciling,
    clipboardCopied,
    lastExportedAt,

    // Getters
    filteredPairs,
    stats,
    generatedCsv,
    clipboardText,

    // Actions
    setAssessmentContext,
    importRosterFromText,
    runReconciliation,
    setManualMatch,
    setAbsenceReason,
    updateThresholds,
    setFilter,
    copyClipboardGrades,
    downloadCsv,
  };
});
