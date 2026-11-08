import { describe, it, expect } from 'vitest';
import {
  EmaktabStudentSchema,
  AssessmentCandidateSchema,
  GradeScaleThresholdsSchema,
  DEFAULT_GRADE_THRESHOLDS,
  StudentMatchPairSchema,
  EmaktabSyncSessionSchema,
  ExportFormatSchema,
} from '../src/entities/emaktab/model';

describe('TASK-EM.1: eMaktab Data Schemas & Zod Validation', () => {
  it('validates a correct EmaktabStudent object', () => {
    const validStudent = {
      emaktabId: 'emk-1001',
      fullName: "O'ktamov Jasur Anvar o'g'li",
      normalizedName: 'oktamov jasur anvar ogli',
      gender: 'M',
      orderIndex: 1,
      className: '9-A',
    };

    const parsed = EmaktabStudentSchema.parse(validStudent);
    expect(parsed.emaktabId).toBe('emk-1001');
    expect(parsed.orderIndex).toBe(1);
    expect(parsed.gender).toBe('M');
  });

  it('rejects an invalid EmaktabStudent with empty ID or negative orderIndex', () => {
    expect(() =>
      EmaktabStudentSchema.parse({
        emaktabId: '',
        fullName: 'Test Student',
        normalizedName: 'test student',
        orderIndex: -1,
      })
    ).toThrow();
  });

  it('validates AssessmentCandidate with percentage and status', () => {
    const candidate = {
      candidateId: 'cand-01',
      fullName: 'Jasurbek Oʻktamov',
      normalizedName: 'jasurbek oktamov',
      score: 38,
      maxScore: 40,
      percentage: 95,
      submittedAt: '2026-11-08T10:00:00Z',
      status: 'submitted',
    };

    const parsed = AssessmentCandidateSchema.parse(candidate);
    expect(parsed.percentage).toBe(95);
    expect(parsed.status).toBe('submitted');
  });

  it('enforces GradeScaleThresholds order: 5 > 4 > 3 > 2', () => {
    expect(() =>
      GradeScaleThresholdsSchema.parse({
        grade5Min: 80,
        grade4Min: 85, // Xato: 4-baho 5-bahodan katta
        grade3Min: 60,
        grade2Max: 50,
      })
    ).toThrow();

    const valid = GradeScaleThresholdsSchema.parse(DEFAULT_GRADE_THRESHOLDS);
    expect(valid.grade5Min).toBe(86);
    expect(valid.grade4Min).toBe(71);
    expect(valid.grade3Min).toBe(56);
    expect(valid.grade2Max).toBe(55);
  });

  it('validates StudentMatchPair with exact, fuzzy, and unmatched statuses', () => {
    const pairExact = {
      matchId: 'match-1',
      emaktabStudent: {
        emaktabId: 'emk-1',
        fullName: 'Aliyeva Dilnoza',
        normalizedName: 'aliyeva dilnoza',
        orderIndex: 1,
      },
      chsbCandidate: {
        candidateId: 'c-1',
        fullName: 'Aliyeva Dilnoza',
        normalizedName: 'aliyeva dilnoza',
        score: 36,
        maxScore: 40,
        percentage: 90,
        status: 'submitted',
      },
      confidenceScore: 1.0,
      status: 'exact',
      manualOverride: false,
      finalGrade5: 5,
      absenceReason: 'none',
    };

    const parsed = StudentMatchPairSchema.parse(pairExact);
    expect(parsed.status).toBe('exact');
    expect(parsed.confidenceScore).toBe(1.0);
    expect(parsed.finalGrade5).toBe(5);

    // Unmatched candidate (e.g. absent student)
    const pairAbsent = {
      matchId: 'match-2',
      emaktabStudent: {
        emaktabId: 'emk-2',
        fullName: 'Karimov Bobur',
        normalizedName: 'karimov bobur',
        orderIndex: 2,
      },
      confidenceScore: 0,
      status: 'unmatched_emaktab',
      manualOverride: false,
      finalGrade5: null,
      absenceReason: 'sababli',
    };

    const parsedAbsent = StudentMatchPairSchema.parse(pairAbsent);
    expect(parsedAbsent.status).toBe('unmatched_emaktab');
    expect(parsedAbsent.finalGrade5).toBeNull();
    expect(parsedAbsent.absenceReason).toBe('sababli');
  });

  it('validates EmaktabSyncSession and export format enums', () => {
    const session = {
      sessionId: 'session-101',
      assessmentId: 'asm-001',
      className: '9-A',
      totalEmaktabStudents: 1,
      matchedCount: 1,
      unmatchedCount: 0,
      pairs: [
        {
          matchId: 'm-1',
          confidenceScore: 1.0,
          status: 'exact',
          manualOverride: false,
          finalGrade5: 5,
        },
      ],
      updatedAt: '2026-11-08T12:00:00Z',
    };

    const parsed = EmaktabSyncSessionSchema.parse(session);
    expect(parsed.sessionId).toBe('session-101');
    expect(parsed.thresholds.grade5Min).toBe(86);

    expect(ExportFormatSchema.parse('csv_standard')).toBe('csv_standard');
    expect(ExportFormatSchema.parse('clipboard_grid')).toBe('clipboard_grid');
    expect(() => ExportFormatSchema.parse('invalid_format')).toThrow();
  });
});
