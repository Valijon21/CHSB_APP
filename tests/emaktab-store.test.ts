import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useEmaktabSyncStore } from '../src/features/emaktab/store/emaktabSyncStore';

describe('TASK-EM.5: Pinia eMaktab Sync Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with default context and candidates', () => {
    const store = useEmaktabSyncStore();
    store.setAssessmentContext({
      assessmentId: 'asm-algebra-1',
      className: '9-B',
      subjectName: 'Algebra',
    });

    expect(store.assessmentId).toBe('asm-algebra-1');
    expect(store.className).toBe('9-B');
    expect(store.candidates.length).toBeGreaterThan(0);
  });

  it('imports roster text, triggers auto-reconciliation, and computes statistics', () => {
    const store = useEmaktabSyncStore();
    store.setAssessmentContext({ assessmentId: 'asm-101' });

    const rawRoster = `\uFEFFT/r,eMaktab ID,O'quvchi F.I.SH
1,EMK-1,O'ktamov Jasurbek
2,EMK-2,Aliyeva Madina
3,EMK-3,Yo'q O'quvchi`;

    store.importRosterFromText(rawRoster, '9-A');

    expect(store.emaktabStudents.length).toBe(3);
    expect(store.matchPairs.length).toBeGreaterThanOrEqual(3);

    const stats = store.stats;
    expect(stats.total).toBeGreaterThanOrEqual(3);
    expect(stats.gradesCount[5]).toBeGreaterThanOrEqual(1); // O'ktamov scored 95% -> 5
    expect(stats.reconciliationRate).toBeGreaterThan(0);
  });

  it('allows manual match override and updates grade and status', () => {
    const store = useEmaktabSyncStore();
    store.setAssessmentContext({ assessmentId: 'asm-101' });

    const rawRoster = `1,EMK-88,O'quvchi Yangi`;
    store.importRosterFromText(rawRoster);

    // Initial state: unmatched
    const pairBefore = store.matchPairs.find((p) => p.emaktabStudent?.emaktabId === 'EMK-88');
    expect(pairBefore?.status).toBe('unmatched_emaktab');

    // Manually match with cand-01 (score 95% -> 5)
    store.setManualMatch('EMK-88', 'cand-01');

    const pairAfter = store.matchPairs.find((p) => p.emaktabStudent?.emaktabId === 'EMK-88');
    expect(pairAfter?.manualOverride).toBe(true);
    expect(pairAfter?.status).toBe('exact');
    expect(pairAfter?.finalGrade5).toBe(5);

    // Manually remove match
    store.setManualMatch('EMK-88', null);
    expect(pairAfter?.status).toBe('unmatched_emaktab');
    expect(pairAfter?.finalGrade5).toBeNull();
    expect(pairAfter?.absenceReason).toBe('sababsiz');
  });

  it('recalculates grades when thresholds are updated', () => {
    const store = useEmaktabSyncStore();
    store.setAssessmentContext({ assessmentId: 'asm-101' });

    // Roster containing student with 77.5% score (normally grade 4)
    const rawRoster = `1,EMK-2,Aliyeva Madina`;
    store.importRosterFromText(rawRoster);

    const pair = store.matchPairs.find((p) => p.emaktabStudent?.emaktabId === 'EMK-2');
    expect(pair?.finalGrade5).toBe(4);

    // Make thresholds very strict: Grade 5 starts at 75%
    store.updateThresholds({
      grade5Min: 75,
      grade4Min: 65,
      grade3Min: 50,
      grade2Max: 49,
    });

    // Now 77.5% should become 5
    expect(pair?.finalGrade5).toBe(5);
  });

  it('filters pairs based on selected filter status', () => {
    const store = useEmaktabSyncStore();
    store.setAssessmentContext({ assessmentId: 'asm-101' });

    const rawRoster = `1,EMK-1,O'ktamov Jasurbek\n2,EMK-99,Topilmaydigan Bola`;
    store.importRosterFromText(rawRoster);

    store.setFilter('unmatched_emaktab');
    expect(store.filteredPairs.every((p) => p.status === 'unmatched_emaktab')).toBe(true);

    store.setFilter('all');
    expect(store.filteredPairs.length).toBe(store.matchPairs.length);
  });

  it('updates absence reason on absent students', () => {
    const store = useEmaktabSyncStore();
    store.setAssessmentContext({ assessmentId: 'asm-101' });

    const rawRoster = `1,EMK-99,G'oyib O'quvchi`;
    store.importRosterFromText(rawRoster);

    const pair = store.matchPairs.find((p) => p.emaktabStudent?.emaktabId === 'EMK-99');
    expect(pair).toBeDefined();

    store.setAbsenceReason(pair!.matchId, 'sababli');
    expect(pair!.absenceReason).toBe('sababli');
  });
});
