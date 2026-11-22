/**
 * O'zbek tili Kirill <-> Lotin alifbolari uchun transliteratsiya xizmati.
 * Rasmiy mezonlar: Sh, Ch, O', G', Yo, Yu, Ya, E/Ye, Q, H, X, O'zbek apostroflari.
 */

const CYRILLIC_TO_LATIN_MAP: Record<string, string> = {
  // Bosh harflar
  А: 'A',
  Б: 'B',
  В: 'V',
  Г: 'G',
  Д: 'D',
  Е: 'E',
  Ё: 'Yo',
  Ж: 'J',
  З: 'Z',
  И: 'I',
  Й: 'Y',
  К: 'K',
  Л: 'L',
  М: 'M',
  Н: 'N',
  О: 'O',
  П: 'P',
  Р: 'R',
  С: 'S',
  Т: 'T',
  У: 'U',
  Ф: 'F',
  Х: 'X',
  Ц: 'Ts',
  Ч: 'Ch',
  Ш: 'Sh',
  Щ: 'Sh',
  Ъ: "'",
  Ь: '',
  Э: 'E',
  Ю: 'Yu',
  Я: 'Ya',
  Ў: "O'",
  Қ: 'Q',
  Ғ: "G'",
  Ҳ: 'H',

  // Kichik harflar
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'j',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'x',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sh',
  ъ: "'",
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  ў: "o'",
  қ: 'q',
  ғ: "g'",
  ҳ: 'h',
};

/**
 * Matn Kirill alifbosida yozilganligini tekshiradi
 */
export function isCyrillic(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

/**
 * Kirill matnini Lotin alifbosiga o'tkazadi
 * Masalan: "Озодов Озодбек" -> "Ozodov Ozodbek"
 *          "Турғунов Бобоназар" -> "Turg'unov Bobonazar"
 *          "Жўнашова Мохинур" -> "Jo'nashova Moxinur"
 */
export function cyrillicToLatin(text: string): string {
  if (!text) return '';

  let result = '';
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const char = text[i]!;
    const prevChar = i > 0 ? text[i - 1] : '';

    // So'z boshida yoki unlidan keyin 'Е' harfi 'Ye/ye' tarzida o'qiladi
    if (char === 'Е' || char === 'е') {
      const isWordStart = i === 0 || /\s|[.,/#!$%^&*;:{}=\-_`~()+-]/.test(prevChar ?? '');
      const isVowelBefore = prevChar ? /[АЕЁИОУЭЮЯаеёиоуэюяЎў]/.test(prevChar) : false;

      if (isWordStart || isVowelBefore) {
        result += char === 'Е' ? 'Ye' : 'ye';
        continue;
      }
    }

    // Maxsus: Ж harfi ayrim hollarda J, ba'zan Jo' kabi kelishi
    const mapped = CYRILLIC_TO_LATIN_MAP[char];
    if (mapped !== undefined) {
      result += mapped;
    } else {
      result += char;
    }
  }

  // Apostroflarni unifikatsiya qilish: ‘, ’, `, ʻ, ʼ -> '
  return result.replace(/[ʻʼ'`‘’]/g, "'");
}

/**
 * Ismni unifikatsiya qiladi va agar kirillcha bo'lsa lotinchaga o'tkazadi.
 * Masalan: "Озодов Озодбек" -> "ozodov ozodbek"
 *          "Abdug‘afforova  Madinabonu" -> "abdugafforova madinabonu"
 */
export function normalizeUnifiedName(rawName: string): string {
  if (!rawName) return '';

  let converted = rawName.trim();
  if (isCyrillic(converted)) {
    converted = cyrillicToLatin(converted);
  }

  return converted
    .toLowerCase()
    .replace(/[ʻʼ'`‘’]/g, '')
    .replace(/[-_./\\,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

