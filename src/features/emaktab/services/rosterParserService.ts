import type { EmaktabStudent } from '../../../entities/emaktab/model';
import { normalizeUzbekName } from './reconciliationService';

/**
 * eMaktabdan eksport qilingan CSV, matnli ro'yxat yoki buferdan
 * nusxalangan o'quvchilar ro'yxatini tahlil qiladi va tozalaydi.
 */
export function parseEmaktabRoster(
  rawInput: string,
  className?: string
): EmaktabStudent[] {
  if (!rawInput || typeof rawInput !== 'string') {
    return [];
  }

  // UTF-8 BOM belgisini tozalash
  const cleanedInput = rawInput.replace(/^\uFEFF/, '').trim();
  if (!cleanedInput) return [];

  // Qatorlarga ajratish
  const lines = cleanedInput
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // Birinchi qator sarlavha (header) ekanligini aniqlash
  let startIndex = 0;
  const firstLineLower = lines[0]?.toLowerCase() ?? '';
  const isHeader =
    firstLineLower.includes('f.i.sh') ||
    firstLineLower.includes('fish') ||
    firstLineLower.includes('familiya') ||
    firstLineLower.includes('ism') ||
    firstLineLower.includes('name') ||
    firstLineLower.includes('t/r') ||
    firstLineLower.includes('emaktab');

  if (isHeader) {
    startIndex = 1;
  }

  const students: EmaktabStudent[] = [];
  let currentOrder = 1;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.startsWith('#')) continue;

    const student = parseLineToStudent(line, currentOrder, className);
    if (student) {
      students.push(student);
      currentOrder++;
    }
  }

  return students;
}

/**
 * Yagona qatorni o'quvchi ma'lumotiga aylantirish
 */
function parseLineToStudent(
  line: string,
  orderIndex: number,
  className?: string
): EmaktabStudent | null {
  // 1. Agar ajratuvchi bo'lsa (CSV: vergul, nuqtali vergul yoki tab)
  const delimiter = detectDelimiter(line);

  if (delimiter) {
    const parts = splitCsvLine(line, delimiter).map((p) => p.trim());
    if (parts.length >= 2) {
      const part0 = parts[0] ?? '';
      const part1 = parts[1] ?? '';
      const part2 = parts[2] ?? '';
      const part3 = parts[3];

      let id = `emk-${orderIndex}`;
      let name = '';
      let gender: 'M' | 'F' | undefined = undefined;

      // Agar birinchi ustun raqam bo'lsa (1, 2, 3...)
      if (/^\d+$/.test(part0) && parts.length >= 3) {
        id = part1 || `emk-${orderIndex}`;
        name = part2;
        if (part3 && (part3 === 'M' || part3 === 'F')) {
          gender = part3;
        }
      } else if (part0.includes('emk') || /^\d+$/.test(part0)) {
        // "emk-101, O'ktamov Jasur"
        id = part0;
        name = part1;
      } else {
        // "O'ktamov Jasur, emk-101" yoki "O'ktamov Jasur, M"
        name = part0;
        if (part1 === 'M' || part1 === 'F') {
          gender = part1;
        } else if (part1) {
          id = part1;
        }
      }

      name = cleanNamePrefix(name);
      if (name.length > 0) {
        return {
          emaktabId: id,
          fullName: name,
          normalizedName: normalizeUzbekName(name),
          gender,
          orderIndex,
          className,
        };
      }
    }
  }

  // 2. Agar oddiy matnli ro'yxat bo'lsa: "1. O'ktamov Jasur" yoki "O'ktamov Jasur"
  const cleanedName = cleanNamePrefix(line);
  if (cleanedName.length >= 2) {
    return {
      emaktabId: `emk-${orderIndex}`,
      fullName: cleanedName,
      normalizedName: normalizeUzbekName(cleanedName),
      orderIndex,
      className,
    };
  }

  return null;
}

/**
 * Raqamlangan prefikslar va qo'shtirnoqlarni tozalaydi: "1. ", "2) ", "1 - "
 */
function cleanNamePrefix(name: string): string {
  return name
    .replace(/^"+|"+$/g, '') // faqat qo'shtirnoqlarni olib tashlash (apostrof ' o'zbek harfi bo'lgani uchun saqlanadi)
    .replace(/^\d+[\s.)-]+/, '') // "1. ", "1) ", "1 - " larni tozalash
    .trim();
}

/**
 * Satrdagi ajratuvchi belgini aniqlaydi (vergul, nuqtali vergul, tab)
 */
function detectDelimiter(line: string): string | null {
  if (line.includes('\t')) return '\t';
  if (line.includes(';')) return ';';
  if (line.includes(',')) return ',';
  return null;
}

/**
 * Qo'shtirnoq ichidagi belgilarni inobatga olgan holda CSV qatorini bo'lish.
 * Eslatma: O'zbek tilidagi apostrof (') qator bo'lish uchun ishlatilmaydi, faqat qo'shtirnoq (") tekshiriladi.
 */
function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * O'qituvchilar yuklab olib, o'z sinflarini to'ldirishi uchun namuna CSV shabloni
 */
export function generateSampleRosterCsv(): string {
  return (
    '\uFEFF' +
    [
      'T/r,eMaktab ID,O\'quvchi F.I.SH,Jinsi',
      "1,EMK-1001,O'ktamov Jasurbek Anvar o'g'li,M",
      '2,EMK-1002,Aliyeva Madina Rustam qizi,F',
      '3,EMK-1003,Boboyev Sardor Ilhomovich,M',
      '4,EMK-1004,G\'aniyeva Dilnoza Alisher qizi,F',
    ].join('\r\n')
  );
}
