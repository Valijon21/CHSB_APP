import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  inferGenderFromUzbekName,
  splitUzbekFullName,
  isHeaderOrMetadataCell,
  parseExcelFileClientSide,
} from '../src/features/emaktab/services/clientExcelParser';

describe('clientExcelParser', () => {
  describe('inferGenderFromUzbekName', () => {
    it('infers female gender from various suffixes and honorifics', () => {
      expect(inferGenderFromUzbekName('Abduraximova Zuxra')).toBe('F');
      expect(inferGenderFromUzbekName('Bozorova Dilfuza Sherzod qizi')).toBe('F');
      expect(inferGenderFromUzbekName('Юлдашалиева Муштарийбону')).toBe('F');
      expect(inferGenderFromUzbekName('Жўнашова Мохинур')).toBe('F');
      expect(inferGenderFromUzbekName('Комилжонова Мохинабону')).toBe('F');
    });

    it('infers male gender from various suffixes and honorifics', () => {
      expect(inferGenderFromUzbekName('Ergashev Jasur Akram o\'g\'li')).toBe('M');
      expect(inferGenderFromUzbekName('Давлаталиев Жахонгир')).toBe('M');
      expect(inferGenderFromUzbekName('Турғунов Бобоназар')).toBe('M');
      expect(inferGenderFromUzbekName('Alisher Zokirov')).toBe('M');
    });
  });

  describe('splitUzbekFullName', () => {
    it('splits into lastName, firstName and middleName', () => {
      const res = splitUzbekFullName('1. Abduraximova Zuxra Farxod qizi');
      expect(res.lastName).toBe('Abduraximova');
      expect(res.firstName).toBe('Zuxra');
      expect(res.middleName).toBe('Farxod qizi');
    });
  });

  describe('isHeaderOrMetadataCell', () => {
    it('identifies table header and metadata rows', () => {
      expect(isHeaderOrMetadataCell('Sinf: 10-V 2026/2027 o‘quv yili')).toBe(true);
      expect(isHeaderOrMetadataCell('Fan: Informatika')).toBe(true);
      expect(isHeaderOrMetadataCell('Tavsiya. Baho')).toBe(true);
      expect(isHeaderOrMetadataCell('2 Chorak')).toBe(true);
      expect(isHeaderOrMetadataCell('FB')).toBe(true);
      // Does NOT match actual student names containing Bahora or Bahodir
      expect(isHeaderOrMetadataCell('Abbosova Bahora')).toBe(false);
      expect(isHeaderOrMetadataCell('Ergashev Bahodir')).toBe(false);
    });
  });

  describe('parseExcelFileClientSide', () => {
    it('parses in-memory workbook for ungrouped class (returns null for detectedGroup)', async () => {
      const wb = XLSX.utils.book_new();
      const wsData = [
        ['^NEXT_PART^'],
        ['Sinf: 10-V 2026/2027 o‘quv yili'],
        ['Fan: Informatika va axborot texnologiyalari'],
        ['o‘qituvchining FIO: Dilmurod Rahmataliyevich Yunusov'],
        [],
        ['X/X №', 'Oy', '', 'Noyabr', '', 'FB', 'Ballar', 'Tavsiya. Baho', '2 Chorak'],
        ['', 'Son', '', 10, 16],
        ['', 'O‘quvchining ism va familiyasi'],
        ['', '', '', '2555715759661962397'],
        [1, 'Abbosova Bahora', '1000005839035', 8],
        [2, 'Abduraximov Azamatjon', '1000018350347', 8],
        [3, 'Давлаталиев Жахонгир', '1000011419188', 8],
        [4, 'Юлдашалиева Муштарийбону', '1000001361183', 8],
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Fan jurnali');
      const u8 = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

      const file = new File([u8], '10-V-Informatika-20_11_2026.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const res = await parseExcelFileClientSide(file);
      expect(res.success).toBe(true);
      expect(res.detectedClass).toBe('10-V');
      expect(res.detectedGroup).toBeNull();
      expect(res.totalParsed).toBe(4);

      expect(res.students[0]?.fullName).toBe('Abbosova Bahora');
      expect(res.students[0]?.emaktabId).toBe('1000005839035');
      expect(res.students[0]?.gender).toBe('F');
      expect(res.students[0]?.group).toBeNull();

      expect(res.students[1]?.fullName).toBe('Abduraximov Azamatjon');
      expect(res.students[1]?.gender).toBe('M');

      expect(res.students[2]?.fullName).toBe('Давлаталиев Жахонгир');
      expect(res.students[2]?.gender).toBe('M');

      expect(res.students[3]?.fullName).toBe('Юлдашалиева Муштарийбону');
      expect(res.students[3]?.gender).toBe('F');
    });

    it('parses in-memory workbook with (1-gurux) in header and detects 1-guruh', async () => {
      const wb = XLSX.utils.book_new();
      const wsData = [
        ['Sinf: 11-A (1-gurux) 2026/2027 o\'quv yili'],
        ['Fan: Informatika va axborotlar texnologiyasi'],
        [],
        ['T/r', 'Familiya va ism', 'Tizimdagi ID'],
        [1, 'Abduraximova Zuxra Farxod qizi', '1000001990090'],
        [2, 'Abdusattorova Xayrixon', '1000001990091'],
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const u8 = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

      const file = new File([u8], '11-A-Informatika.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const res = await parseExcelFileClientSide(file);
      expect(res.success).toBe(true);
      expect(res.detectedClass).toBe('11-A');
      expect(res.detectedGroup).toBe('1-guruh');
      expect(res.students.length).toBe(2);
      expect(res.students[0]?.group).toBe('1-guruh');
    });

    it('parses in-memory workbook with (2-gurux) in header and detects 2-guruh', async () => {
      const wb = XLSX.utils.book_new();
      const wsData = [
        ['Sinf: 11-A (2-gurux) 2026/2027 o\'quv yili'],
        ['Fan: Informatika va axborotlar texnologiyasi'],
        [],
        ['T/r', 'Familiya va ism', 'Tizimdagi ID'],
        [1, 'Ergashev Jasur Akram o\'g\'li', '1000001990092'],
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const u8 = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

      const file = new File([u8], '11-A-Informatika.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const res = await parseExcelFileClientSide(file);
      expect(res.success).toBe(true);
      expect(res.detectedClass).toBe('11-A');
      expect(res.detectedGroup).toBe('2-guruh');
      expect(res.students.length).toBe(1);
      expect(res.students[0]?.group).toBe('2-guruh');
    });

    it('parses real 11-A-Informatika-20_11_2026.xls file accurately if accessible', async () => {
      const fs = await import('fs');
      const filePath = '/Users/druswer/Documents/11-A-Informatika-20_11_2026.xls';
      try {
        if (!fs.existsSync(filePath)) return;
        const buffer = fs.readFileSync(filePath);
        const file = new File([buffer], '11-A-Informatika-20_11_2026.xls', {
          type: 'application/vnd.ms-excel',
        });

        const res = await parseExcelFileClientSide(file);
        expect(res.success).toBe(true);
        expect(res.detectedClass).toBe('11-A');
        expect(res.detectedGroup).toBe('1-guruh');
        expect(res.students.length).toBe(15);
        expect(res.students[0]?.fullName).toBe('Абдурасулов Мухаммаджон');
        expect(res.students[0]?.emaktabId).toBe('1000004921908');
        expect(res.students[0]?.gender).toBe('M');
      } catch (err: any) {
        if (err.code === 'EPERM' || err.code === 'ENOENT') return;
        throw err;
      }
    });

    it('parses real 10-V-Informatika-20_11_2026.xls file accurately if accessible', async () => {
      const fs = await import('fs');
      const filePath = '/Users/druswer/Downloads/10-V-Informatika-20_11_2026.xls';
      try {
        if (!fs.existsSync(filePath)) return;
        const buffer = fs.readFileSync(filePath);
        const file = new File([buffer], '10-V-Informatika-20_11_2026.xls', {
          type: 'application/vnd.ms-excel',
        });

        const res = await parseExcelFileClientSide(file);
        expect(res.success).toBe(true);
        expect(res.detectedClass).toBe('10-V');
        expect(res.detectedGroup).toBe('1-guruh');
        expect(res.students.length).toBe(27);
        expect(res.students[0]?.fullName).toBe('Abbosova Bahora');
        expect(res.students[0]?.emaktabId).toBe('1000005839035');
        expect(res.students[0]?.gender).toBe('F');
      } catch (err: any) {
        if (err.code === 'EPERM' || err.code === 'ENOENT') return;
        throw err;
      }
    });
  });
});
