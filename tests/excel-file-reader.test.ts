import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import fs from 'fs';
import {
  getFileExtension,
  parseSpreadsheetBuffer,
} from '../src/features/emaktab/services/excelFileReaderService';
import { parseEmaktabJournal } from '../src/features/emaktab/services/emaktabJournalParser';

describe('TASK-XLS.2..3: Excel File Reader Service', () => {
  it('correctly extracts file extensions', () => {
    expect(getFileExtension('11-A-Informatika.xls')).toBe('xls');
    expect(getFileExtension('journal_export.XLSX')).toBe('xlsx');
    expect(getFileExtension('data.csv')).toBe('csv');
    expect(getFileExtension('my.custom.file.txt')).toBe('txt');
    expect(getFileExtension('noextension')).toBe('');
  });

  it('parses a generated Excel workbook buffer into CSV text', () => {
    const wb = XLSX.utils.book_new();
    const data = [
      ['T/r', 'eMaktab ID', "O'quvchi F.I.SH", 'Jinsi'],
      ['1', '1000001990090', 'Abduraximova Zuxra', 'F'],
      ['2', '1000003598248', 'Abdusattorova Xayrixon', 'F'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Fan jurnali');

    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const csv = parseSpreadsheetBuffer(buffer);

    expect(csv).toContain('Abduraximova Zuxra');
    expect(csv).toContain('1000001990090');
    expect(csv).toContain('Abdusattorova Xayrixon');
  });

  it('parses a full eMaktab journal Excel workbook and connects to journal parser', () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['Sinf: 10-A (1-gurux) 2026/2027 o‘quv yili'],
      ['Fan: Informatika va axbarotlar texnologiyasi'],
      ['o‘qituvchining FIO: Dilmurod Rahmataliyevich Yunusov'],
      ['X/X №', 'Oy', 'Noyabr', 'FB', 'Ballar'],
      ['', 'Son', '13.0', '14.0', ''],
      ['1.0', 'Abdullayeva Dilafro‘z', '1000003546584', '8.0', ''],
      ['2.0', 'Иброхимова Азиза', '1000001984711', '9.0', ''],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Fan jurnali');

    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xls' });
    const csv = parseSpreadsheetBuffer(buffer);

    const journal = parseEmaktabJournal(csv);
    expect(journal.metadata.className).toBe('10-A');
    expect(journal.metadata.groupName).toBe('1-gurux');
    expect(journal.metadata.teacherFio).toContain('Dilmurod');
    expect(journal.students.length).toBe(2);
    expect(journal.students[0]?.fullName).toBe('Abdullayeva Dilafro‘z');
    expect(journal.students[1]?.fullName).toBe('Иброхимова Азиза');
    expect(journal.students[1]?.fullNameLatin).toBe('Ibroximova Aziza');
  });

  it('reads and parses the real eMaktab .xls export file uploaded by user', () => {
    const realFilePath =
      'C:/Users/nout.plus/.gemini/antigravity/brain/8e2c816c-8a8d-4669-97ab-f50cfd0079c4/.user_uploaded/media_1795337782377_9bc82136.xls';

    if (fs.existsSync(realFilePath)) {
      const buffer = fs.readFileSync(realFilePath);
      const csv = parseSpreadsheetBuffer(buffer);
      const journal = parseEmaktabJournal(csv);

      expect(journal.metadata.className).toBe('11-A');
      expect(journal.metadata.groupName).toBe('2-gurux');
      expect(journal.metadata.teacherFio).toContain('Dilrabo Turdialiyevna Sharafxonova');
      expect(journal.students.length).toBe(16);
      expect(journal.students[0]?.fullName).toBe('Davlatova Nurjaxonbegim');
      expect(journal.students[0]?.emaktabId).toBe('1000001990097');

      // Check Cyrillic student transliteration
      const ozodov = journal.students.find((s) => s.emaktabId === '1000001990108');
      expect(ozodov?.fullName).toBe('Озодов Озодbek'.replace('bek', 'бек'));
      expect(ozodov?.fullNameLatin).toBe('Ozodov Ozodbek');
    }
  });
});
