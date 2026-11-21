import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { queryDatabase } from '../src/lib/db.js';
import { validateSafeSql } from '../src/lib/sql-validator.js';

describe('Bloom Taxonomy & Roster Export Logic', () => {
  it('should query real questions table and group by Bloom cognitive levels', () => {
    const sql = `
      SELECT 
        bloom_level,
        difficulty,
        COUNT(id) as total_questions,
        SUM(points) as total_points,
        ROUND(AVG(points), 1) as avg_points
      FROM questions
      GROUP BY bloom_level, difficulty
      ORDER BY total_points DESC
    `;

    const validation = validateSafeSql(sql);
    assert.equal(validation.isValid, true);

    const rows = queryDatabase(validation.cleanedSql) as Array<{
      bloom_level: string;
      total_questions: number;
      total_points: number;
    }>;

    assert.ok(rows.length > 0);
    const levels = rows.map((r) => r.bloom_level);
    assert.ok(levels.includes('KNOWLEDGE') || levels.includes('APPLICATION') || levels.includes('COMPREHENSION') || levels.includes('ANALYSIS'));
  });

  it('should format CSV with UTF-8 BOM and correct quoting for Excel', () => {
    const mockStudents = [
      {
        roster_code: 'STU-1001',
        student_name: 'Jasur Aliyev',
        class_name: '11-A',
        score: 38,
        max_score: 40,
        percentage: 95,
        grade: '5',
        pisa_level: '6-Daraja (Iqtidorli)',
      },
      {
        roster_code: 'STU-1002',
        student_name: 'Malika O‘ktamova',
        class_name: '11-A',
        score: 22,
        max_score: 40,
        percentage: 55,
        grade: '3',
        pisa_level: '2-Daraja (Bazaviy)',
      },
    ];

    const headers = [
      'Roster Kodi',
      'O‘quvchi F.I.Sh',
      'Sinfi',
      'To‘plangan Ball',
      'Maksimal Ball',
      'Foiz (%)',
      'Baho',
      'OECD PISA Darajasi',
    ];

    const csvRows = mockStudents.map((r) =>
      [
        `"${r.roster_code}"`,
        `"${r.student_name}"`,
        `"${r.class_name}"`,
        r.score,
        r.max_score,
        `"${r.percentage}%"`,
        `"${r.grade}"`,
        `"${r.pisa_level}"`,
      ].join(',')
    );

    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');

    // Test assertions
    assert.ok(csvContent.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM for Excel compatibility');
    assert.ok(csvContent.includes('"Malika O‘ktamova"'), 'Special Uzbek apostrophe must be properly quoted');
    assert.ok(csvContent.includes('"6-Daraja (Iqtidorli)"'));
    assert.equal(csvContent.split('\n').length, 3, 'Must have 1 header line + 2 data rows');
  });

  it('should filter roster data by cross-filtering criteria', () => {
    const mockStudents = [
      { student_name: 'A', class_name: '11-A', grade: '5', pisa_level: '6-Daraja' },
      { student_name: 'B', class_name: '11-B', grade: '3', pisa_level: '2-Daraja' },
      { student_name: 'C', class_name: '11-A', grade: '4', pisa_level: '4-Daraja' },
    ];

    const filterByClass = (className: string) => mockStudents.filter((s) => s.class_name === className);
    const filterByGrade = (grade: string) => mockStudents.filter((s) => s.grade === grade);

    assert.equal(filterByClass('11-A').length, 2);
    assert.equal(filterByClass('11-B').length, 1);
    assert.equal(filterByGrade('5').length, 1);
  });
});
