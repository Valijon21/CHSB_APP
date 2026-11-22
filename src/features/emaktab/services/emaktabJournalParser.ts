import { normalizeUzbekName } from './reconciliationService';
import { cyrillicToLatin, isCyrillic } from './transliterationService';

export interface EmaktabJournalStudent {
  orderIndex: number;
  fullName: string;
  fullNameLatin: string;
  normalizedName: string;
  emaktabId: string;
  className: string;
  groupName?: string;
  subject: string;
  teacherFio?: string;
  grades: string[];
  attendanceAbsences: number; // 'k' belgisi qo'yilgan darslar soni
}

export interface EmaktabJournalMetadata {
  rawHeader: string;
  className: string;
  groupName?: string;
  academicYear: string;
  subject: string;
  journalEntityId?: string;
  teacherFio: string;
  lessonDates: string[];
}

export interface EmaktabJournalData {
  metadata: EmaktabJournalMetadata;
  students: EmaktabJournalStudent[];
}

/**
 * eMaktab rasmiy jurnalidan nusxalangan yoki CSV formatidagi matnni to'liq tahlil qiladi.
 * Ixtiyoriy sinf (masalan: 11-A, 10-A, 10-V), guruh va fanni avtomatik aniqlaydi.
 */
export function parseEmaktabJournal(rawInput: string): EmaktabJournalData {
  if (!rawInput || typeof rawInput !== 'string') {
    return createEmptyJournal();
  }

  const cleaned = rawInput.replace(/^\uFEFF/, '').trim();
  if (!cleaned) return createEmptyJournal();

  const lines = cleaned.split(/\r?\n/).map((l) => l.trim());

  // 1. Metadata ajratish (dastlabki 6 qatorda)
  const metadata: EmaktabJournalMetadata = {
    rawHeader: '',
    className: '',
    groupName: undefined,
    academicYear: '2026/2027',
    subject: '',
    journalEntityId: undefined,
    teacherFio: '',
    lessonDates: [],
  };

  let studentRowsStartIndex = -1;

  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const line = lines[i]!;
    const lineLower = line.toLowerCase();

    // Sinf: 11-A (2-gurux) 2026/2027 o‘quv yili
    if (lineLower.startsWith('sinf:') || lineLower.includes('sinf:')) {
      metadata.rawHeader = line;
      const sinfMatch = line.match(/sinf:\s*([0-9]+-[A-Za-zА-Яа-яЎўҚқҒғҲҳ]+)/i);
      if (sinfMatch && sinfMatch[1]) {
        metadata.className = sinfMatch[1].toUpperCase();
      }

      const guruxMatch = line.match(/\(([0-9]+-gur[u|u']x)\)/i);
      if (guruxMatch && guruxMatch[1]) {
        metadata.groupName = guruxMatch[1].toLowerCase();
      }

      const yearMatch = line.match(/(\d{4}\/\d{4})/);
      if (yearMatch && yearMatch[1]) {
        metadata.academicYear = yearMatch[1];
      }
    }

    // Fan: Informatika va axbarotlar texnologiyasi
    if (lineLower.startsWith('fan:') || lineLower.includes('fan:')) {
      const parts = line.split(/fan:\s*/i);
      if (parts[1]) {
        metadata.subject = parts[1].replace(/,+/g, '').trim();
      }
    }

    // O'qituvchi: o‘qituvchining FIO: Dilrabo Turdialiyevna Sharafxonova
    if (lineLower.includes('o‘qituvchining fio:') || lineLower.includes('fio:')) {
      const parts = line.split(/fio:\s*/i);
      if (parts[1]) {
        metadata.teacherFio = parts[1].replace(/,+/g, '').trim();
      }
    }

    // Fan/Jurnal unikal ID: 1691610383141616760
    if (/^\d{15,22}(,+)?$/.test(line.replace(/,/g, ''))) {
      metadata.journalEntityId = line.replace(/,/g, '').trim();
    }

    // Dars kunlari qatori: ",Son,,13.0,14.0,20.0..."
    if (lineLower.includes(',son,,') || lineLower.startsWith('son,')) {
      const parts = line.split(',');
      metadata.lessonDates = parts
        .map((p) => p.trim())
        .filter((p) => /^\d+(\.\d+)?$/.test(p))
        .map((p) => p.replace('.0', ''));
    }

    // O'quvchilar qatorlarining boshlanish nuqtasi:
    // Masalan: "1.0,Davlatova Nurjaxonbegim,1000001990097..."
    if (/^\d+(\.0)?,[A-Za-zА-Яа-яЎўҚқҒғҲҳ\s'ʻʼ`-]+,\d{7,15}/.test(line)) {
      studentRowsStartIndex = i;
      break;
    }
  }

  // 2. O'quvchilarni tahlil qilish
  const students: EmaktabJournalStudent[] = [];
  if (studentRowsStartIndex !== -1) {
    let order = 1;
    for (let i = studentRowsStartIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const student = parseStudentRow(line, order, metadata);
      if (student) {
        students.push(student);
        order++;
      }
    }
  }

  return {
    metadata,
    students,
  };
}

/**
 * Yagona o'quvchi qatorini tahlil qiladi
 * Masalan: "1.0,Davlatova Nurjaxonbegim,1000001990097,8.0,,,,,,,,,,,,,,0.0,0.0,0.0,,"
 */
function parseStudentRow(
  line: string,
  currentOrder: number,
  metadata: EmaktabJournalMetadata
): EmaktabJournalStudent | null {
  const parts = line.split(',').map((p) => p.trim());
  if (parts.length < 3) return null;

  // parts[0] -> Tartib raqami (1.0, 2.0...)
  const orderRaw = parts[0];
  const parsedOrder = orderRaw ? parseInt(orderRaw, 10) : currentOrder;
  const orderIndex = !isNaN(parsedOrder) ? parsedOrder : currentOrder;

  // parts[1] -> O'quvchining F.I.SH
  const rawFullName = parts[1] || '';
  if (!rawFullName || rawFullName.length < 2) return null;

  // parts[2] -> eMaktab ID raqami (1000001990097)
  const emaktabId = parts[2] || `EMK-${orderIndex}`;

  // parts[3 .. oxirigacha] -> Baholar va davomat
  const gradeParts = parts.slice(3);
  const grades: string[] = [];
  let absences = 0;

  for (const item of gradeParts) {
    if (!item) continue;
    const lower = item.toLowerCase();
    if (lower === 'k' || lower === 'н' || lower === 'q') {
      absences++;
      grades.push('k');
    } else if (/^\d+(\.\d+)?$/.test(item)) {
      const val = parseFloat(item);
      if (val > 0) {
        grades.push(String(val));
      }
    }
  }

  const latinName = isCyrillic(rawFullName) ? cyrillicToLatin(rawFullName) : rawFullName;
  const normalizedName = normalizeUzbekName(rawFullName);

  return {
    orderIndex,
    fullName: rawFullName,
    fullNameLatin: latinName,
    normalizedName,
    emaktabId,
    className: metadata.className || 'Noma\'lum',
    groupName: metadata.groupName,
    subject: metadata.subject || 'Informatika',
    teacherFio: metadata.teacherFio,
    grades,
    attendanceAbsences: absences,
  };
}

/**
 * Bir nechta eMaktab jurnallarini (masalan: 11-A 1-guruh, 11-A 2-guruh, 10-A, 10-V)
 * `^next_part^` yoki bo'sh qatorlar bilan ajratilgan yagona matndan to'liq parse qiladi.
 */
export function parseMultipleEmaktabJournals(rawInput: string): EmaktabJournalData[] {
  if (!rawInput) return [];

  // ^next_part^ bo'yicha ajratish
  const chunks = rawInput.split(/\^next_part\^/).map((c) => c.trim()).filter((c) => c.length > 0);

  if (chunks.length === 0) {
    const single = parseEmaktabJournal(rawInput);
    return single.students.length > 0 ? [single] : [];
  }

  const results: EmaktabJournalData[] = [];
  for (const chunk of chunks) {
    const journal = parseEmaktabJournal(chunk);
    if (journal.students.length > 0) {
      results.push(journal);
    }
  }

  return results;
}

function createEmptyJournal(): EmaktabJournalData {
  return {
    metadata: {
      rawHeader: '',
      className: '',
      groupName: undefined,
      academicYear: '2026/2027',
      subject: '',
      journalEntityId: undefined,
      teacherFio: '',
      lessonDates: [],
    },
    students: [],
  };
}

