import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { hashStringToSeed, createSeededRandom, seededShuffle } from '../src/shared/utils/cryptoShuffle';
import { useExamProctor } from '../src/shared/composables/useExamProctor';
import { useAssessmentStore } from '../src/features/assessment/assessmentStore';

describe('Anti-Cheat Engine: Seeded Deterministic Shuffle', () => {
  it('produces a non-zero 32-bit unsigned integer seed from a string', () => {
    const seed1 = hashStringToSeed('student-101_test-55');
    const seed2 = hashStringToSeed('student-101_test-55');
    const seed3 = hashStringToSeed('student-102_test-55');

    expect(seed1).toBeGreaterThan(0);
    expect(seed1).toBe(seed2); // Deterministic
    expect(seed1).not.toBe(seed3); // Different strings yield different seeds
  });

  it('generates reproducible pseudo-random numbers with Mulberry32', () => {
    const rng1 = createSeededRandom(123456);
    const rng2 = createSeededRandom(123456);

    const sequence1 = [rng1(), rng1(), rng1()];
    const sequence2 = [rng2(), rng2(), rng2()];

    expect(sequence1).toEqual(sequence2);
    sequence1.forEach((num) => {
      expect(num).toBeGreaterThanOrEqual(0);
      expect(num).toBeLessThan(1);
    });
  });

  it('deterministically shuffles an array without mutating the original', () => {
    const original = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'];
    const originalCopy = [...original];

    const shuffledA = seededShuffle(original, 'student-42_exam-01');
    const shuffledB = seededShuffle(original, 'student-42_exam-01');

    // Original array remains unmodified
    expect(original).toEqual(originalCopy);

    // Same seed yields exact same shuffled order (critical for page refresh resilience)
    expect(shuffledA).toEqual(shuffledB);

    // Elements are preserved
    expect(shuffledA.length).toBe(original.length);
    expect([...shuffledA].sort()).toEqual([...original].sort());
  });

  it('produces different permutations for different student seeds', () => {
    const questions = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10'];

    const studentAShuffle = seededShuffle(questions, 'student-alice_exam-01');
    const studentBShuffle = seededShuffle(questions, 'student-bob_exam-01');

    // It is mathematically near impossible for 10 elements to match across distinct seeds
    expect(studentAShuffle).not.toEqual(studentBShuffle);
    expect([...studentAShuffle].sort()).toEqual([...studentBShuffle].sort());
  });

  it('handles edge cases gracefully (empty and single-item arrays)', () => {
    expect(seededShuffle([], 'seed')).toEqual([]);
    expect(seededShuffle(['single'], 'seed')).toEqual(['single']);
  });
});

describe('Anti-Cheat Engine: Exam Proctoring Composable', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default zero violations and clean state', () => {
    const proctor = useExamProctor(3);

    expect(proctor.violationCount.value).toBe(0);
    expect(proctor.maxViolations).toBe(3);
    expect(proctor.isWarningModalOpen.value).toBe(false);
    expect(proctor.violationLogs.value).toEqual([]);
    expect(proctor.lastWarningMessage.value).toBe('');
  });

  it('tracks violations when proctoring is active', () => {
    const proctor = useExamProctor(3);
    proctor.startProctoring();

    proctor.recordViolation('tab_hidden', 'Tab yashirildi');

    expect(proctor.violationCount.value).toBe(1);
    expect(proctor.isWarningModalOpen.value).toBe(true);
    expect(proctor.lastWarningMessage.value).toBe('Tab yashirildi');
    expect(proctor.violationLogs.value.length).toBe(1);
    expect(proctor.violationLogs.value[0]?.type).toBe('tab_hidden');

    proctor.dismissWarning();
    expect(proctor.isWarningModalOpen.value).toBe(false);

    proctor.stopProctoring();
  });

  it('ignores violations when proctoring is stopped', () => {
    const proctor = useExamProctor(3);
    proctor.startProctoring();
    proctor.stopProctoring();

    proctor.recordViolation('window_blur', "Oyna o'zgartirildi");

    expect(proctor.violationCount.value).toBe(0);
    expect(proctor.isWarningModalOpen.value).toBe(false);
    expect(proctor.violationLogs.value.length).toBe(0);
  });

  it('accumulates multiple violations with accurate audit log timestamps', () => {
    const proctor = useExamProctor(3);
    proctor.startProctoring();

    proctor.recordViolation('tab_hidden', '1-ogohlantirish');
    proctor.recordViolation('window_blur', '2-ogohlantirish');
    proctor.recordViolation('fullscreen_exit', '3-ogohlantirish');

    expect(proctor.violationCount.value).toBe(3);
    expect(proctor.violationLogs.value).toHaveLength(3);
    expect(proctor.violationLogs.value.map((l) => l.type)).toEqual([
      'tab_hidden',
      'window_blur',
      'fullscreen_exit',
    ]);

    proctor.stopProctoring();
  });
});

describe('Anti-Cheat Engine: Store Integration with Seeded Shuffling', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('keeps default question order when shuffle is not enabled', async () => {
    const store = useAssessmentStore();
    await store.startAssessment('tenant-al-xorazmiy', 'chsb-inf-11-q1', 'rec-ax-101');

    expect(store.assessment?.questions[0]?.id).toBe('q-1');
    expect(store.assessment?.questions[1]?.id).toBe('q-2');
    store.stopTimer();
  });

  it('shuffles questions and options deterministically when shuffle is true', async () => {
    const storeStudentA = useAssessmentStore();
    await storeStudentA.startAssessment(
      'tenant-al-xorazmiy',
      'chsb-inf-11-q1',
      'rec-ax-101',
      { shuffle: true }
    );
    const questionsStudentA = storeStudentA.assessment!.questions.map((q) => q.id);
    storeStudentA.stopTimer();

    // Re-run for the SAME student: must produce the EXACT same order (refresh resilience)
    setActivePinia(createPinia());
    const storeStudentARefresh = useAssessmentStore();
    await storeStudentARefresh.startAssessment(
      'tenant-al-xorazmiy',
      'chsb-inf-11-q1',
      'rec-ax-101',
      { shuffle: true }
    );
    const questionsStudentARefresh = storeStudentARefresh.assessment!.questions.map((q) => q.id);
    expect(questionsStudentA).toEqual(questionsStudentARefresh);
    storeStudentARefresh.stopTimer();

    // Run for a DIFFERENT student: must produce a DIFFERENT question sequence
    setActivePinia(createPinia());
    const storeStudentB = useAssessmentStore();
    await storeStudentB.startAssessment(
      'tenant-al-xorazmiy',
      'chsb-inf-11-q1',
      'rec-ax-999',
      { shuffle: true }
    );
    const questionsStudentB = storeStudentB.assessment!.questions.map((q) => q.id);
    expect(questionsStudentA).not.toEqual(questionsStudentB);
    storeStudentB.stopTimer();
  });
});
