import * as XLSX from 'xlsx';

export interface ClientParsedStudent {
  orderIndex: number;
  fullName: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  emaktabId?: string;
  gender: 'M' | 'F';
  birthDate: string;
  group?: '1-guruh' | '2-guruh' | null;
  status: 'eligible';
}

export interface ClientExcelParseResult {
  success: boolean;
  fileName: string;
  detectedClass?: string;
  detectedGroup?: '1-guruh' | '2-guruh' | null;
  totalParsed: number;
  students: ClientParsedStudent[];
  rawTextPreview: string;
  error?: string;
}

function cleanCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

export function inferGenderFromUzbekName(fullName: string): 'M' | 'F' {
  const lower = fullName.toLowerCase();
  const words = lower.split(/\s+/);
  for (const w of words) {
    if (['qizi', 'ayol', 'qiz', 'қизи', 'кизи', 'аёл', 'қиз'].includes(w)) return 'F';
    if (["o'g'li", "o‘g‘li", "og'li", 'erkak', 'ўғли', 'угли', 'эркак'].includes(w)) return 'M';
    if (
      w.endsWith('ova') ||
      w.endsWith('eva') ||
      w.endsWith('zoda') ||
      w.endsWith('bonu') ||
      w.endsWith('xon') ||
      w.endsWith('ова') ||
      w.endsWith('ева') ||
      w.endsWith('зода') ||
      w.endsWith('бону') ||
      w.endsWith('хон') ||
      w.endsWith('нур')
    ) {
      return 'F';
    }
    if (
      w.endsWith('ov') ||
      w.endsWith('ev') ||
      w.endsWith('bek') ||
      w.endsWith('jon') ||
      w.endsWith('boy') ||
      w.endsWith('ов') ||
      w.endsWith('ев') ||
      w.endsWith('бек') ||
      w.endsWith('жон') ||
      w.endsWith('бой') ||
      w.endsWith('назар')
    ) {
      return 'M';
    }
  }
  return 'M';
}

export function splitUzbekFullName(fullName: string): {
  lastName: string;
  firstName: string;
  middleName?: string;
} {
  const cleaned = fullName
    .replace(/^[\d\s.)-]+/, '')
    .replace(/["']+/g, '')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { lastName: "O'quvchi", firstName: 'Ism' };
  if (parts.length === 1) return { lastName: "O'quvchi", firstName: parts[0]! };
  if (parts.length === 2) return { lastName: parts[0]!, firstName: parts[1]! };
  return {
    lastName: parts[0]!,
    firstName: parts[1]!,
    middleName: parts.slice(2).join(' '),
  };
}

export function isHeaderOrMetadataCell(text: string): boolean {
  const l = text.toLowerCase().trim();
  if (!l || l.length < 2) return true;
  if (
    l.startsWith('sinf:') ||
    l.startsWith('fan:') ||
    l.startsWith('o‘qituvchi') ||
    l.startsWith("o'qituvchi") ||
    l.startsWith('fio:') ||
    l.startsWith('maktab:')
  ) {
    return true;
  }
  if (
    l.includes('^next_part^') ||
    l.includes('jurnal') ||
    l.includes('elektron') ||
    l.includes('chorak') ||
    l.includes('ballar') ||
    l.includes('tavsiya') ||
    l.includes('yillik')
  ) {
    return true;
  }
  if (/\b(baho|baholar|bahosi)\b/.test(l)) return true;
  if (
    [
      't/r',
      '№',
      'x/x №',
      'x/x',
      'oy',
      'son',
      'fb',
      'noyabr',
      'dekabr',
      'yanvar',
      'fevral',
      'mart',
      'aprel',
      'may',
    ].includes(l)
  ) {
    return true;
  }
  if (
    l.includes('o‘quvchining ism') ||
    l.includes("o'quvchining ism") ||
    l.includes('familiya va ism') ||
    l.includes('f.i.sh')
  ) {
    return true;
  }
  return false;
}

function readFileAsArrayBuffer(file: File | Blob): Promise<ArrayBuffer> {
  const maybeModern = file as Blob & { arrayBuffer?: () => Promise<ArrayBuffer> };
  if (typeof maybeModern.arrayBuffer === 'function') {
    return maybeModern.arrayBuffer();
  }
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }
  return Promise.reject(new Error("Faylni o'qish imkoni bo'lmadi: FileReader topilmadi"));
}

export async function parseExcelFileClientSide(
  file: File,
  forcedGroup?: '1-guruh' | '2-guruh' | null
): Promise<ClientExcelParseResult> {
  const fileName = file.name || 'fayl.xls';
  const arrayBuffer = await readFileAsArrayBuffer(file);

  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return {
      success: false,
      fileName,
      detectedGroup: null,
      totalParsed: 0,
      students: [],
      rawTextPreview: '',
      error: "Excel faylida varaqlar topilmadi.",
    };
  }

  const sheet = wb.Sheets[sheetName];
  if (!sheet) {
    return {
      success: false,
      fileName,
      detectedGroup: null,
      totalParsed: 0,
      students: [],
      rawTextPreview: '',
      error: "Varaq ma'lumotlarini o'qib bo'lmadi.",
    };
  }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (!rows || rows.length === 0) {
    return {
      success: false,
      fileName,
      detectedGroup: null,
      totalParsed: 0,
      students: [],
      rawTextPreview: '',
      error: "Fayl bo'sh.",
    };
  }

  let detectedClass: string | undefined = undefined;
  let detectedGroup: '1-guruh' | '2-guruh' | null = forcedGroup || null;

  // 1. Fayl nomidan guruh va sinfni aniqlash
  if (!forcedGroup) {
    if (/(?:2|II)[-_\s.]*(?:gurux|guruh)/i.test(fileName)) detectedGroup = '2-guruh';
    else if (/(?:1|I)[-_\s.]*(?:gurux|guruh)/i.test(fileName)) detectedGroup = '1-guruh';
  }

  const fnClassMatch = fileName.match(
    /(?:^|[^0-9])(1[0-1]|[1-9])[-_\s]*([A-Za-zА-Яа-я])(?=[^A-Za-zА-Яа-я0-9]|$)/i
  );
  if (fnClassMatch && fnClassMatch[1] && fnClassMatch[2]) {
    let letter = fnClassMatch[2].toUpperCase();
    const cyr: Record<string, string> = { 'А': 'A', 'В': 'V', 'Б': 'B', 'Г': 'G', 'Д': 'D' };
    letter = cyr[letter] || letter;
    detectedClass = `${fnClassMatch[1]}-${letter}`;
  }

  // 2. Metama'lumot qatorlarini skanerlash (ilk 10 qator)
  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const row = rows[r] || [];
    const rowStr = row.map(cleanCell).join(' ');
    if (!detectedClass) {
      const m = rowStr.match(
        /(?:^|[^0-9])(1[0-1]|[1-9])[-_\s]*([A-Za-zА-Яа-я])(?=[^A-Za-zА-Яа-я0-9]|$)/i
      );
      if (m && m[1] && m[2]) {
        let letter = m[2].toUpperCase();
        const cyr: Record<string, string> = { 'А': 'A', 'В': 'V', 'Б': 'B', 'Г': 'G', 'Д': 'D' };
        letter = cyr[letter] || letter;
        detectedClass = `${m[1]}-${letter}`;
      }
    }
    if (!forcedGroup && !detectedGroup) {
      if (/(?:2|II)[-_\s.]*(?:gurux|guruh)/i.test(rowStr)) detectedGroup = '2-guruh';
      else if (/(?:1|I)[-_\s.]*(?:gurux|guruh)/i.test(rowStr)) detectedGroup = '1-guruh';
    }
  }

  // 3. O'quvchilarni tahlil qilish
  const students: ClientParsedStudent[] = [];
  const textLines: string[] = [];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] || [];
    if (!row || row.length === 0) continue;

    let nameCandidate = '';
    let idCandidate = '';

    for (let c = 0; c < row.length; c++) {
      const cellVal = cleanCell(row[c]);
      if (!cellVal) continue;

      // 7 dan 14 xonagacha raqam = eMaktab ID
      if (!idCandidate && /^\d{7,14}$/.test(cellVal)) {
        idCandidate = cellVal;
      } else if (
        !nameCandidate &&
        !isHeaderOrMetadataCell(cellVal) &&
        !/^\d+(\.\d+)?$/.test(cellVal)
      ) {
        const cleaned = cellVal.replace(/^[\d\s.)-]+/, '').trim();
        const letters = cleaned.match(/[a-zA-Zа-яА-ЯoʻgʻshchOʻGʻSHCH]/g);
        if (letters && letters.length >= 3 && !cleaned.toLowerCase().includes('ismsiz')) {
          nameCandidate = cleaned;
        }
      }
    }

    // O'quvchi qatori deb hisoblash: nom topilgan va (ID mavjud yoki qatorda № raqami bor)
    const hasRowOrderNum = /^\d{1,3}(\.0)?$/.test(cleanCell(row[0]));
    if (nameCandidate && (idCandidate || hasRowOrderNum)) {
      const { lastName, firstName, middleName } = splitUzbekFullName(nameCandidate);
      const gender = inferGenderFromUzbekName(nameCandidate);

      const stu: ClientParsedStudent = {
        orderIndex: students.length + 1,
        fullName: nameCandidate,
        firstName,
        lastName,
        middleName,
        emaktabId: idCandidate || undefined,
        gender,
        birthDate: '2009-01-01',
        group: detectedGroup,
        status: 'eligible',
      };
      students.push(stu);

      textLines.push(
        `${stu.orderIndex}. ${stu.fullName}${idCandidate ? ', ' + idCandidate : ''}, ${gender}`
      );
    }
  }

  if (students.length === 0) {
    return {
      success: false,
      fileName,
      detectedClass,
      detectedGroup,
      totalParsed: 0,
      students: [],
      rawTextPreview: '',
      error: "Fayldan o'quvchilar ro'yxati topilmadi. Ustunlar va jurnaldagi ism-shariflarni tekshiring.",
    };
  }

  return {
    success: true,
    fileName,
    detectedClass,
    detectedGroup,
    totalParsed: students.length,
    students,
    rawTextPreview: textLines.join('\n'),
  };
}
