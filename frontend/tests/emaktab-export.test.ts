import { describe, it, expect } from 'vitest';
import {
  generateEmaktabCsv,
  generateClipboardColumn,
  generateEmaktabSyncPayload,
} from '../src/features/emaktab/services/emaktabExportService';
import type { StudentMatchPair } from '../src/entities/emaktab/model';

describe('TASK-EM.3: eMaktab Grade Converter & Export Generator', () => {
  const samplePairs: StudentMatchPair[] = [
    {
      matchId: 'm-1',
      emaktabStudent: {
        emaktabId: 'emk-101',
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
    {
      matchId: 'm-2',
      emaktabStudent: {
        emaktabId: 'emk-102',
        fullName: 'Aliyeva Madina, Gulom qizi', // Has comma in name
        normalizedName: 'aliyeva madina gulom qizi',
        orderIndex: 2,
      },
      chsbCandidate: {
        candidateId: 'c-2',
        fullName: 'Madina Aliyeva',
        normalizedName: 'madina aliyeva',
        score: 30,
        maxScore: 40,
        percentage: 75,
        status: 'submitted',
      },
      confidenceScore: 0.88,
      status: 'fuzzy',
      manualOverride: false,
      finalGrade5: 4,
      absenceReason: 'none',
    },
    {
      matchId: 'm-3',
      emaktabStudent: {
        emaktabId: 'emk-103',
        fullName: 'Qodirov Bobur',
        normalizedName: 'qodirov bobur',
        orderIndex: 3,
      },
      confidenceScore: 0,
      status: 'unmatched_emaktab',
      manualOverride: false,
      finalGrade5: null,
      absenceReason: 'sababli',
    },
  ];

  it('generates eMaktab CSV with UTF-8 BOM, headers, and properly formatted rows', () => {
    const csv = generateEmaktabCsv(samplePairs, {
      className: '9-A',
      subjectName: 'Matematika',
      quarter: 2,
    });

    // Check BOM
    expect(csv.startsWith('\uFEFF')).toBe(true);

    // Check headers
    expect(csv).toContain('eMaktab ID');
    expect(csv).toContain("O'quvchi F.I.SH");
    expect(csv).toContain('eMaktab Bahosi (5)');

    // Check row 1
    expect(csv).toContain('emk-101');
    expect(csv).toContain("O'ktamov Jasur");
    expect(csv).toContain('38/40');
    expect(csv).toContain('95%');
    expect(csv).toContain('5');

    // Check comma escaping for row 2
    expect(csv).toContain('"Aliyeva Madina, Gulom qizi"');
    expect(csv).toContain('4');

    // Check absent student
    expect(csv).toContain('emk-103');
    expect(csv).toContain('Qatnashmadi (sababli)');
  });

  it('generates a clipboard column string formatted for Ctrl+V in eMaktab web journal', () => {
    const clipboard = generateClipboardColumn(samplePairs);
    const lines = clipboard.split('\r\n');

    expect(lines.length).toBe(3);
    expect(lines[0]).toBe('5');
    expect(lines[1]).toBe('4');
    expect(lines[2]).toBe(''); // Absent student has empty line
  });

  it('generates structured JSON payload for external API sync', () => {
    const payload = generateEmaktabSyncPayload(samplePairs, {
      assessmentId: 'asm-algebra-01',
      subject: 'Algebra',
      quarter: 2,
      tenantSlug: 'maktab-50',
    });

    expect(payload.source).toBe('CHSB_PLATFORM_V2');
    expect(payload.assessment.id).toBe('asm-algebra-01');
    expect(payload.assessment.subject).toBe('Algebra');
    expect(payload.grades.length).toBe(3);
    expect(payload.grades[0]?.grade5).toBe(5);
    expect(payload.grades[2]?.isAbsent).toBe(true);
    expect(payload.grades[2]?.absenceReason).toBe('sababli');
  });

  it('generates UTF-8 BOM semicolon-delimited 10+50+40 quarter journal CSV matching production exports', async () => {
    const { generateQuarterJournalCsv } = await import('../src/features/emaktab/services/emaktabExportService');
    const csv = generateQuarterJournalCsv([
      {
        orderIndex: 1,
        studentName: 'Abdullayeva Dilafro‘z',
        emaktabId: '1000003546584',
        formativeScore: null,
        bsbScore: null,
        chsbScore: 34,
        totalScore100: null,
        grade5: null,
        note: "kundalik baho yo'q, BSB-1 baholanmagan",
      },
    ]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    const lines = csv.slice(1).split('\r\n');
    expect(lines[0]).toBe('№;F.I.Sh.;eMaktab ID;FB (10);BSB (50);ChSB (40);Jami (100);Baho;Izoh');
    expect(lines[1]).toBe("1;Abdullayeva Dilafro‘z;1000003546584;;;34;;;kundalik baho yo'q, BSB-1 baholanmagan");
  });
});
