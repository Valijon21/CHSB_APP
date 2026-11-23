import type { StudentInput, StudentGender } from '../../../entities/organization/model';
import { cyrillicToLatin, isCyrillic } from '../../emaktab/services/transliterationService';

export interface SmartParserContext {
  tenantSlug: string;
  schoolId: string;
  classGroupId: string;
  className: string;
}

const HEADER_KEYWORDS = [
  'f.i.sh',
  'familiya',
  'ism',
  'jinsi',
  "o'g'il",
  'tug\'ilgan',
  'o\'chirish',
  't/r',
  'x/x',
  'emaktab',
  'id raqami',
  'status',
];

/**
 * Matn yoki Excel/Jadvaldan nusxalangan satrlarni aqlli tahlil qiladi.
 * Ustunlar tartibi ixtiyoriy bo'lsa ham (qator raqami, F.I.SH, ID, Jinsi, Sana)
 * ularni to'g'ri aniqlaydi va qator raqamini ism deb xato hisoblashning oldini oladi.
 */
export function parseSmartTableText(
  rawText: string,
  context: SmartParserContext
): StudentInput[] {
  if (!rawText || typeof rawText !== 'string') {
    return [];
  }

  // Binar fayl (masalan .xls OLE baytlari) xato tashlanganda tekshirish
  if (rawText.includes('\u0000') || /[\uD800-\uDFFF]/.test(rawText) || rawText.includes('ࡱ')) {
    return [];
  }

  const cleanText = rawText.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];

  const lines = cleanText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const result: StudentInput[] = [];

  for (const line of lines) {
    if (isHeaderLine(line)) {
      continue;
    }

    // Delimiterni aniqlash: tab ustuvor, keyin nuqtali vergul, keyin vergul
    let delimiter = '\t';
    if (!line.includes('\t')) {
      delimiter = line.includes(';') ? ';' : ',';
    }

    const rawCells = line.split(delimiter).map((c) => c.trim()).filter((c) => c.length > 0);
    if (rawCells.length === 0) continue;

    let detectedGender: StudentGender | null = null;
    let detectedBirthDate: string | null = null;
    let detectedEmaktabId: string | null = null;
    const nameCandidates: string[] = [];

    for (const cell of rawCells) {
      // 1. O'chirish yoki xoch belgilari
      if (cell === '✕' || cell.toLowerCase() === 'x' || cell.toLowerCase() === "o'chirish") {
        continue;
      }

      // 2. Qator indeksi (1, 2, 3., №1, 1-)
      if (/^№?\s*\d{1,4}[.)-]?$/.test(cell)) {
        continue;
      }

      // 3. eMaktab ID raqami (7 dan 20 gacha raqamlar)
      if (/^\d{7,20}$/.test(cell)) {
        detectedEmaktabId = cell;
        continue;
      }

      // 4. Jinsi tekshiruvi
      const parsedGender = matchGender(cell);
      if (parsedGender) {
        detectedGender = parsedGender;
        continue;
      }

      // 5. Tug'ilgan sana tekshiruvi
      const parsedDate = matchDate(cell);
      if (parsedDate) {
        detectedBirthDate = parsedDate;
        continue;
      }

      // 6. Qolgan matn ism qismlari hisoblanadi
      // Tozalash: oldidagi raqamlarni olib tashlash (masalan "1. Aliyev" -> "Aliyev")
      const cleaned = cleanLeadingIndex(cell);
      if (cleaned.length >= 2 && !/^\d+$/.test(cleaned)) {
        nameCandidates.push(cleaned);
      }
    }

    if (nameCandidates.length === 0) {
      continue;
    }

    let fullName = nameCandidates.join(' ');
    // Tutuq belgilarini standartlashtirish
    fullName = fullName.replace(/[‘’`ʻʼ]/g, "'").trim();

    if (isCyrillic(fullName)) {
      fullName = cyrillicToLatin(fullName);
    }

    const tokens = fullName.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;

    const lastName = tokens[0] || 'Familiyasiz';
    const firstName = tokens[1] || 'Ismsiz';
    const middleName = tokens.slice(2).join(' ') || undefined;

    // Agar jinsi ko'rsatilmagan bo'lsa, familiya yoki sharifdan aniqlash
    const finalGender = detectedGender || deduceGender(lastName, middleName || '');
    const finalBirthDate = detectedBirthDate || '2009-01-01';

    result.push({
      tenantSlug: context.tenantSlug,
      schoolId: context.schoolId,
      classGroupId: context.classGroupId,
      className: context.className,
      lastName,
      firstName,
      middleName,
      gender: finalGender,
      birthDate: finalBirthDate,
      emaktabId: detectedEmaktabId || undefined,
      status: 'eligible',
    });
  }

  return result;
}

function isHeaderLine(line: string): boolean {
  const lower = line.toLowerCase();
  let matchCount = 0;
  for (const kw of HEADER_KEYWORDS) {
    if (lower.includes(kw)) matchCount++;
  }
  // Agar kamida 2 ta sarlavha so'zi bo'lsa yoki № / T/r bilan boshlansa
  if (matchCount >= 2) return true;
  if (/^(№|t\/r|x\/x|son|fio|familiya\s+va\s+ism)/i.test(lower)) return true;
  return false;
}

function cleanLeadingIndex(text: string): string {
  return text.replace(/^№?\s*\d+[\s.)-]+/, '').trim();
}

function matchGender(cell: string): StudentGender | null {
  const normalized = cell.toLowerCase().replace(/['‘’`ʻʼ]/g, '');
  if (['m', 'ogil', 'erkak', 'муж', 'м', 'male', 'boy'].includes(normalized)) {
    return 'M';
  }
  if (['f', 'qiz', 'ayol', 'жен', 'ж', 'female', 'girl'].includes(normalized)) {
    return 'F';
  }
  return null;
}

function matchDate(cell: string): string | null {
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cell)) {
    return cell;
  }
  // DD.MM.YYYY
  const dotMatch = cell.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotMatch && dotMatch[1] && dotMatch[2] && dotMatch[3]) {
    const d = dotMatch[1].padStart(2, '0');
    const m = dotMatch[2].padStart(2, '0');
    const y = dotMatch[3];
    return `${y}-${m}-${d}`;
  }
  // DD/MM/YYYY
  const slashMatch = cell.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch && slashMatch[1] && slashMatch[2] && slashMatch[3]) {
    const d = slashMatch[1].padStart(2, '0');
    const m = slashMatch[2].padStart(2, '0');
    const y = slashMatch[3];
    return `${y}-${m}-${d}`;
  }
  return null;
}

function deduceGender(lastName: string, middleName: string): StudentGender {
  const last = lastName.toLowerCase();
  const mid = middleName.toLowerCase();
  if (
    mid.includes('qizi') ||
    mid.endsWith('na') ||
    mid.endsWith('yevna') ||
    mid.endsWith('ovna') ||
    mid.endsWith('evna') ||
    last.endsWith('eva') ||
    last.endsWith('ova') ||
    last.endsWith('yeva')
  ) {
    return 'F';
  }
  return 'M';
}
