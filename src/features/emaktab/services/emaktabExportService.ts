import type { StudentMatchPair } from '../../../entities/emaktab/model';

export interface AssessmentExportMeta {
  subjectName?: string;
  className?: string;
  date?: string;
  quarter?: number;
}

/**
 * eMaktab tizimi uchun standart CSV formatini shakllantiradi.
 * UTF-8 BOM (\uFEFF) bilan boshlanadi, shunda MS Excel va boshqa dasturlarda
 * o'zbek harflari (o‘, g‘, sh, ch) to'g'ri ochiladi.
 */
export function generateEmaktabCsv(
  pairs: StudentMatchPair[],
  meta?: AssessmentExportMeta
): string {
  const BOM = '\uFEFF';
  const rows: string[] = [];

  // Metadata izohlari (ixtiyoriy)
  if (meta?.subjectName || meta?.className) {
    const metaParts: string[] = [];
    if (meta.className) metaParts.push(`Sinf: ${meta.className}`);
    if (meta.subjectName) metaParts.push(`Fan: ${meta.subjectName}`);
    if (meta.quarter) metaParts.push(`Chorak: ${meta.quarter}`);
    if (meta.date) metaParts.push(`Sana: ${meta.date}`);
    rows.push(`# ${metaParts.join(' | ')}`);
  }

  // Ustunlar sarlavhasi
  rows.push(
    [
      'T/r',
      'eMaktab ID',
      "O'quvchi F.I.SH",
      'CHSB Balli',
      'Foiz',
      'eMaktab Bahosi (5)',
      'Holati',
    ]
      .map(escapeCsvValue)
      .join(',')
  );

  let fallbackIndex = 1;

  for (const pair of pairs) {
    const orderIndex = pair.emaktabStudent?.orderIndex ?? fallbackIndex++;
    const emaktabId = pair.emaktabStudent?.emaktabId ?? 'CHSB-NOMZOD';
    const fullName =
      pair.emaktabStudent?.fullName ?? pair.chsbCandidate?.fullName ?? "Noma'lum";

    let scoreStr = '-';
    let percentageStr = '-';
    let gradeStr = '';
    let statusNote = "Qatnashmadi (sababsiz)";

    if (pair.chsbCandidate && pair.chsbCandidate.status === 'submitted') {
      scoreStr = `${pair.chsbCandidate.score}/${pair.chsbCandidate.maxScore}`;
      percentageStr = `${pair.chsbCandidate.percentage}%`;
      gradeStr = pair.finalGrade5 !== null ? String(pair.finalGrade5) : '';
      statusNote =
        pair.status === 'exact'
          ? "100% mos (Topshirdi)"
          : pair.status === 'fuzzy'
          ? `O'xshash moslik (${Math.round(pair.confidenceScore * 100)}%)`
          : 'CHSB topshirgan (eMaktabda yo‘q)';
    } else if (pair.absenceReason === 'sababli') {
      statusNote = 'Qatnashmadi (sababli)';
    }

    rows.push(
      [
        String(orderIndex),
        emaktabId,
        fullName,
        scoreStr,
        percentageStr,
        gradeStr,
        statusNote,
      ]
        .map(escapeCsvValue)
        .join(',')
    );
  }

  return BOM + rows.join('\r\n');
}

/**
 * eMaktab veb-sahifasidagi baholar ustuniga bitta Ctrl+V bilan
 * to'g'ridan-to'g'ri joylashtirish uchun vertikal ustun formatini generatsiya qiladi.
 */
export function generateClipboardColumn(pairs: StudentMatchPair[]): string {
  // Faqat eMaktab ro'yxatidagi o'quvchilar tartibi bo'yicha ketma-ket
  const emaktabPairs = pairs.filter((p) => p.emaktabStudent !== undefined);

  return emaktabPairs
    .map((p) => {
      if (p.finalGrade5 !== null && p.finalGrade5 !== undefined) {
        return String(p.finalGrade5);
      }
      // Agar qatnashmagan bo'lsa, eMaktab katakchasi bo'sh qoldiriladi
      return '';
    })
    .join('\r\n');
}

/**
 * Kelgusida rasmiy eMaktab API / Davlat ta'lim tizimi bilan
 * integratsiya qilish uchun to'liq tuzilmali JSON payloadi.
 */
export function generateEmaktabSyncPayload(
  pairs: StudentMatchPair[],
  meta: { assessmentId: string; subject: string; quarter: number; tenantSlug?: string }
) {
  return {
    source: 'CHSB_PLATFORM_V2',
    timestamp: new Date().toISOString(),
    assessment: {
      id: meta.assessmentId,
      subject: meta.subject,
      quarter: meta.quarter,
      tenant: meta.tenantSlug ?? 'default',
    },
    grades: pairs
      .filter((p) => p.emaktabStudent !== undefined)
      .map((p) => ({
        emaktabId: p.emaktabStudent!.emaktabId,
        fullName: p.emaktabStudent!.fullName,
        chsbCandidateId: p.chsbCandidate?.candidateId ?? null,
        score: p.chsbCandidate?.score ?? 0,
        percentage: p.chsbCandidate?.percentage ?? 0,
        grade5: p.finalGrade5,
        matchStatus: p.status,
        confidence: p.confidenceScore,
        isAbsent: p.chsbCandidate === undefined || p.chsbCandidate.status !== 'submitted',
        absenceReason: p.absenceReason ?? 'none',
      })),
  };
}

/**
 * CSV qatoridagi qiymatlarni vergul va qo'shtirnoqlardan himoyalash
 */
function escapeCsvValue(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

