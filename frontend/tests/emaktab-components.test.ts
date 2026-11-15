import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RosterUploadCard from '../src/features/emaktab/components/RosterUploadCard.vue';
import GradeThresholdsModal from '../src/features/emaktab/components/GradeThresholdsModal.vue';
import ReconciliationGrid from '../src/features/emaktab/components/ReconciliationGrid.vue';
import SyncActionsBar from '../src/features/emaktab/components/SyncActionsBar.vue';
import { DEFAULT_GRADE_THRESHOLDS } from '../src/entities/emaktab/model';
import type { StudentMatchPair, AssessmentCandidate } from '../src/entities/emaktab/model';

describe('TASK-EM.6: eMaktab UI Components', () => {
  it('mounts RosterUploadCard and emits import-roster when text is submitted', async () => {
    const wrapper = mount(RosterUploadCard);

    // Switch to text tab
    const textTabBtn = wrapper.findAll('button').find((b) => b.text().includes('Matn nusxasi'));
    expect(textTabBtn).toBeDefined();
    await textTabBtn!.trigger('click');

    const textarea = wrapper.find('textarea');
    expect(textarea.exists()).toBe(true);

    await textarea.setValue('1. O\'ktamov Jasur\n2. Aliyeva Madina');
    const submitBtn = wrapper.findAll('button').find((b) => b.text().includes('Tahlil Qilish'));
    expect(submitBtn).toBeDefined();
    await submitBtn!.trigger('click');

    expect(wrapper.emitted('import-roster')).toBeTruthy();
    const emittedRoster = wrapper.emitted('import-roster');
    expect(emittedRoster?.[0]?.[0]).toContain("O'ktamov Jasur");
  });

  it('mounts GradeThresholdsModal, validates order, and emits save', async () => {
    const wrapper = mount(GradeThresholdsModal, {
      props: {
        isOpen: true,
        thresholds: DEFAULT_GRADE_THRESHOLDS,
      },
    });

    expect(wrapper.text()).toContain('5 Ballik Baholash Mezonlarini Moslash');

    // Trigger save
    const saveBtn = wrapper.findAll('button').find((b) => b.text() === 'Saqlash');
    await saveBtn!.trigger('click');

    expect(wrapper.emitted('save')).toBeTruthy();
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('mounts ReconciliationGrid and displays match pairs and filters', async () => {
    const pairs: StudentMatchPair[] = [
      {
        matchId: 'm-1',
        emaktabStudent: {
          emaktabId: 'emk-1',
          fullName: "O'ktamov Jasur",
          normalizedName: 'oktamov jasur',
          orderIndex: 1,
        },
        chsbCandidate: {
          candidateId: 'c-1',
          fullName: "Jasur O'ktamov",
          normalizedName: 'jasur oktamov',
          score: 38,
          maxScore: 40,
          percentage: 95,
          status: 'submitted',
        },
        confidenceScore: 0.98,
        status: 'exact',
        manualOverride: false,
        finalGrade5: 5,
        absenceReason: 'none',
      },
    ];

    const candidates: AssessmentCandidate[] = [
      {
        candidateId: 'c-1',
        fullName: "Jasur O'ktamov",
        normalizedName: 'jasur oktamov',
        score: 38,
        maxScore: 40,
        percentage: 95,
        status: 'submitted',
      },
    ];

    const wrapper = mount(ReconciliationGrid, {
      props: {
        pairs,
        allCandidates: candidates,
        activeFilter: 'all',
      },
    });

    expect(wrapper.text()).toContain("O'ktamov Jasur");
    expect(wrapper.text()).toContain('100% Aniq Mos');
    expect(wrapper.text()).toContain('95%');
    expect(wrapper.text()).toContain('5');

    // Filter change emit
    const exactFilterBtn = wrapper.findAll('button').find((b) => b.text().includes('100% Aniq Mos'));
    await exactFilterBtn!.trigger('click');
    expect(wrapper.emitted('change-filter')).toBeTruthy();
    const emittedFilter = wrapper.emitted('change-filter');
    expect(emittedFilter?.[0]?.[0]).toBe('exact');
  });

  it('mounts SyncActionsBar and emits copy and download actions', async () => {
    const stats = {
      total: 30,
      exact: 25,
      fuzzy: 3,
      unmatchedEmaktab: 2,
      unmatchedChsb: 0,
      gradesCount: { 5: 12, 4: 10, 3: 5, 2: 1 },
      absentCount: 2,
      averagePercentage: 82,
      reconciliationRate: 93,
    };

    const wrapper = mount(SyncActionsBar, {
      props: {
        stats,
        clipboardCopied: false,
      },
    });

    expect(wrapper.text()).toContain('30');
    expect(wrapper.text()).toContain('93%');
    expect(wrapper.text()).toContain('82%');

    const copyBtn = wrapper.findAll('button').find((b) => b.text().includes('Jurnalga nusxalash'));
    await copyBtn!.trigger('click');
    expect(wrapper.emitted('copy-clipboard')).toBeTruthy();

    const downloadBtn = wrapper.findAll('button').find((b) => b.text().includes('CSV Yuklab olish'));
    await downloadBtn!.trigger('click');
    expect(wrapper.emitted('download-csv')).toBeTruthy();
  });
});
