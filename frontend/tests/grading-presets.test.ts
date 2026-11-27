import { describe, it, expect } from 'vitest';
import {
  MMTV_STANDARD_THRESHOLDS,
  SPECIALIZED_GRADE_THRESHOLDS,
  GRADING_SCALE_PRESETS,
} from '../src/entities/emaktab/model';
import { calculateGrade5 } from '../src/features/emaktab/services/reconciliationService';

describe('TASK-2.2: Uzbekistan MMTV & Specialized Grading Presets', () => {
  it('supports MMTV standard thresholds (86 / 66 / 30 / 29)', () => {
    expect(calculateGrade5(86, MMTV_STANDARD_THRESHOLDS)).toBe(5);
    expect(calculateGrade5(85, MMTV_STANDARD_THRESHOLDS)).toBe(4);
    expect(calculateGrade5(66, MMTV_STANDARD_THRESHOLDS)).toBe(4);
    expect(calculateGrade5(65, MMTV_STANDARD_THRESHOLDS)).toBe(3);
    expect(calculateGrade5(30, MMTV_STANDARD_THRESHOLDS)).toBe(3);
    expect(calculateGrade5(29, MMTV_STANDARD_THRESHOLDS)).toBe(2);
  });

  it('supports specialized school thresholds (86 / 71 / 56 / 55)', () => {
    expect(calculateGrade5(86, SPECIALIZED_GRADE_THRESHOLDS)).toBe(5);
    expect(calculateGrade5(71, SPECIALIZED_GRADE_THRESHOLDS)).toBe(4);
    expect(calculateGrade5(70, SPECIALIZED_GRADE_THRESHOLDS)).toBe(3);
    expect(calculateGrade5(56, SPECIALIZED_GRADE_THRESHOLDS)).toBe(3);
    expect(calculateGrade5(55, SPECIALIZED_GRADE_THRESHOLDS)).toBe(2);
  });

  it('exposes both official presets cleanly', () => {
    expect(GRADING_SCALE_PRESETS.MMTV_STANDARD.thresholds.grade3Min).toBe(30);
    expect(GRADING_SCALE_PRESETS.SPECIALIZED.thresholds.grade3Min).toBe(56);
  });
});

