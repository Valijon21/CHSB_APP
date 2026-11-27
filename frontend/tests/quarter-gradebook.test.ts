import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTeacherStore } from '@/features/teacher/teacherStore';
import { api } from '@/shared/api';

describe('Quarter 100-Point Gradebook & Rubric Persistence (TASK-2.3)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('loads quarter gradebook rows and recalculates total100 + grade5 on formative score save', async () => {
    const store = useTeacherStore();
    await store.loadQuarterGradebook('tenant-al-xorazmiy', { quarter: 1, subjectCode: 'INF' });

    expect(store.quarterGradebookRows.length).toBeGreaterThan(0);
    const first = store.quarterGradebookRows[0]!;
    const spySave = vi.spyOn(api.teacher, 'saveFormativeScore');

    await store.saveFormativeScore({
      studentId: first.studentId,
      subjectCode: 'INF',
      quarter: 1,
      classwork: 6,
      homework: 4,
    });

    expect(spySave).toHaveBeenCalledTimes(1);
    const updated = store.quarterGradebookRows.find((r) => r.studentId === first.studentId)!;
    expect(updated.formativeScore).toBe(10);
    expect(updated.totalScore100).toBe(Number((10 + first.bsbScore + first.chsbScore).toFixed(1)));
    spySave.mockRestore();
  });

  it('persists rubric grading via teacherStore.gradeStudentResult', async () => {
    const store = useTeacherStore();
    await store.loadTeacherData('tenant-al-xorazmiy');
    expect(store.results.length).toBeGreaterThan(0);

    const target = store.results[0]!;
    const spyGrade = vi.spyOn(api.teacher, 'gradeResult');

    await store.gradeStudentResult(target.attemptId, {
      score: 38,
      rubricScores: { 'q-1': 38 },
      feedback: "A'lo daraja",
      verifiedByTeacher: true,
    });

    expect(spyGrade).toHaveBeenCalledWith(target.attemptId, expect.objectContaining({ score: 38 }));
    const updated = store.results.find((r) => r.attemptId === target.attemptId)!;
    expect(updated.score).toBe(38);
    expect(updated.verifiedByTeacher).toBe(true);
    spyGrade.mockRestore();
  });
});
