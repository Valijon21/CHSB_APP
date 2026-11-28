import { describe, it, expect } from 'vitest';
import {
  parseEmaktabRoster,
  generateSampleRosterCsv,
} from '../src/features/emaktab/services/rosterParserService';

describe('TASK-EM.4: eMaktab Roster Parser Service', () => {
  it('parses standard comma-separated CSV with headers and IDs', () => {
    const csvContent = `\uFEFFT/r,eMaktab ID,O'quvchi F.I.SH,Jinsi
1,EMK-501,O'ktamov Jasurbek,M
2,EMK-502,Aliyeva Madina,F
3,EMK-503,Boboyev Sardor,M`;

    const students = parseEmaktabRoster(csvContent, '9-A');
    expect(students.length).toBe(3);
    expect(students[0]?.emaktabId).toBe('EMK-501');
    expect(students[0]?.fullName).toBe("O'ktamov Jasurbek");
    expect(students[0]?.gender).toBe('M');
    expect(students[0]?.className).toBe('9-A');
    expect(students[0]?.orderIndex).toBe(1);

    expect(students[1]?.emaktabId).toBe('EMK-502');
    expect(students[1]?.fullName).toBe('Aliyeva Madina');
    expect(students[1]?.gender).toBe('F');
  });

  it('parses semicolon-delimited CSV often exported on European / Russian locale Windows', () => {
    const csvSemicolon = `№;ID;F.I.SH
1;ID-881;G'aniyev Jamshid
2;ID-882;To'xtayeva Laylo`;

    const students = parseEmaktabRoster(csvSemicolon);
    expect(students.length).toBe(2);
    expect(students[0]?.emaktabId).toBe('ID-881');
    expect(students[0]?.fullName).toBe("G'aniyev Jamshid");
    expect(students[1]?.emaktabId).toBe('ID-882');
    expect(students[1]?.fullName).toBe("To'xtayeva Laylo");
  });

  it('parses plain numbered text pasted from documents or chat', () => {
    const plainText = `
1. O'ktamov Jasurbek
2) Aliyeva Madina
3 - Boboyev Sardor
    `;

    const students = parseEmaktabRoster(plainText);
    expect(students.length).toBe(3);
    expect(students[0]?.orderIndex).toBe(1);
    expect(students[0]?.fullName).toBe("O'ktamov Jasurbek");
    expect(students[0]?.emaktabId).toBe('emk-1');

    expect(students[1]?.orderIndex).toBe(2);
    expect(students[1]?.fullName).toBe('Aliyeva Madina');
  });

  it('handles empty strings and comments gracefully', () => {
    expect(parseEmaktabRoster('')).toEqual([]);
    expect(parseEmaktabRoster('   \n\n  ')).toEqual([]);

    const commentedText = `
# Bu sinf ro'yxati izohi
1. Alisher Navoiy
# Boshqa izoh
2. Bobur Mirzo
    `;
    const students = parseEmaktabRoster(commentedText);
    expect(students.length).toBe(2);
    expect(students[0]?.fullName).toBe('Alisher Navoiy');
    expect(students[1]?.fullName).toBe('Bobur Mirzo');
  });

  it('generates sample CSV template with BOM and headers', () => {
    const sample = generateSampleRosterCsv();
    expect(sample.startsWith('\uFEFF')).toBe(true);
    expect(sample).toContain('EMK-1001');
    expect(sample).toContain("O'ktamov Jasurbek");
  });

  it('parses real UTF-8 BOM semicolon Quarter Gradebook CSV and BahoLab PIN rows cleanly', () => {
    const quarterCsv = `\uFEFF№;F.I.Sh.;eMaktab ID;FB (10);BSB (50);ChSB (40);Jami (100);Baho;Izoh
1;Abdullayeva Dilafro‘z;1000003546584;;;34;;;kundalik baho yo'q, BSB-1 baholanmagan
2;Иброхимова Азиза;1000001984711;;;;;;kundalik baho yo'q, BSB-1 baholanmagan, ChSB yo'q`;

    const parsedQ = parseEmaktabRoster(quarterCsv, '10-A', '1-guruh');
    expect(parsedQ).toHaveLength(2);
    expect(parsedQ[0]?.fullName).toBe('Abdullayeva Dilafro‘z');
    expect(parsedQ[0]?.emaktabId).toBe('1000003546584');
    expect(parsedQ[1]?.fullName).toBe('Иброхимова Азиза');
    expect(parsedQ[1]?.emaktabId).toBe('1000001984711');

    const pinCsv = `BahoLab · 10-A (1-gurux) · Informatika
№,O'quvchi,PIN
1.0,Abdullayeva Dilafro‘z,8663
2.0,Akbaraliyeva Shahlo,6731`;
    const parsedPin = parseEmaktabRoster(pinCsv, '10-A');
    expect(parsedPin).toHaveLength(2);
    expect(parsedPin[0]?.fullName).toBe('Abdullayeva Dilafro‘z');
    expect(parsedPin[0]?.emaktabId).toBe('8663');
    expect(parsedPin[0]?.group).toBe('1-guruh');
  });
});
