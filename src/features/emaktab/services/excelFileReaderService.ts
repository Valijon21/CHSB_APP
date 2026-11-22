import * as XLSX from 'xlsx';

/**
 * Universal Excel / CSV / TXT fayllarni o'qish xizmati.
 * .xls (BIFF8 binar), .xlsx (OpenXML), .csv va .txt fayllarni
 * matn (CSV) ko'rinishida o'qib, eMaktab parseriga taqdim etadi.
 */
export async function readSpreadsheetFile(file: File): Promise<string> {
  const extension = getFileExtension(file.name);

  // 1. Agar oddiy CSV yoki TXT fayl bo'lsa
  if (extension === 'csv' || extension === 'txt') {
    return await readTextFile(file);
  }

  // 2. Agar Excel fayl bo'lsa (.xls yoki .xlsx)
  if (extension === 'xls' || extension === 'xlsx') {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    return parseSpreadsheetBuffer(arrayBuffer);
  }

  // 3. Noma'lum kengaytma bo'lsa, avval Excel sifatida o'qishga urinish, bo'lmasa matn
  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    return parseSpreadsheetBuffer(arrayBuffer);
  } catch {
    return await readTextFile(file);
  }
}

/**
 * ArrayBuffer dagi Excel ma'lumotini CSV matniga aylantiradi
 */
export function parseSpreadsheetBuffer(buffer: ArrayBuffer | Uint8Array): string {
  const workbook = XLSX.read(buffer, {
    type: 'array',
    raw: true,
    cellDates: true,
  });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Excel faylida biron bir sahifa (sheet) topilmadi.');
  }

  // Bir nechta sahifa bo'lsa, eMaktab sahifasini yoki birinchi sahifani tanlash
  const primarySheetName =
    workbook.SheetNames.find((name) =>
      name.toLowerCase().includes('jurnal') ||
      name.toLowerCase().includes('fan') ||
      name.toLowerCase().includes('sheet')
    ) || workbook.SheetNames[0] || '';

  const worksheet = workbook.Sheets[primarySheetName];
  if (!worksheet) {
    throw new Error(`Sahifa ochilmadi: ${primarySheetName}`);
  }

  // Varag'ni vergul bilan ajratilgan CSV ga aylantirish
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet, {
    FS: ',',
    RS: '\n',
    blankrows: false,
  });

  return csvOutput.trim();
}

/**
 * Matnli fayllarni UTF-8 kodirovkasida o'qish
 */
function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      // UTF-8 BOM tozalash
      resolve(text.replace(/^\uFEFF/, '').trim());
    };
    reader.onerror = () => {
      reject(new Error(`Faylni matn sifatida o'qishda xatolik yuz berdi: ${file.name}`));
    };
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Binar fayllarni ArrayBuffer sifatida o'qish
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (buffer) {
        resolve(buffer);
      } else {
        reject(new Error(`Bo'sh fayl: ${file.name}`));
      }
    };
    reader.onerror = () => {
      reject(new Error(`Faylni binar o'qishda xatolik yuz berdi: ${file.name}`));
    };
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Fayl kengaytmasini aniqlash (.xls, .xlsx, .csv...)
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length <= 1) return '';
  return (parts.pop() || '').toLowerCase().trim();
}
