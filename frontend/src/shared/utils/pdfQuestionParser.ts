export interface ParsedOption {
  id: string;
  label: string;
  text: string;
}

export interface ParsedSubQuestion {
  id: string;
  label: string;
  prompt: string;
  points: number;
  rubric?: string;
}

export interface ParsedQuestionItem {
  id: string;
  number: number;
  prompt: string;
  options: ParsedOption[];
  correctOptionId: string;
  points: number;
  bloomLevel: string;
  taskType?: 'multiple_choice' | 'subquestions' | 'table_completion' | 'case_study' | 'open_text';
  subQuestions?: ParsedSubQuestion[];
  rubric?: string;
  sourceExcerpt?: string;
}

export interface ParseQuestionsResult {
  success: boolean;
  totalFound: number;
  questions: ParsedQuestionItem[];
  warnings: string[];
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;

/**
 * Normalizes Unicode Mathematical Italic/Bold/Sans characters (e.g. 𝑎 -> a, 𝑏 -> b)
 * often emitted by PDF equation/italic font encodings in official BSB PDFs.
 */
export function normalizeMathUnicodeLetters(text: string): string {
  let out = '';
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    // Mathematical Italic Small: 𝑎 (0x1D44E) .. 𝑧 (0x1D467)
    if (cp >= 0x1d44e && cp <= 0x1d467) {
      out += String.fromCharCode(97 + (cp - 0x1d44e));
    } else if (cp === 0x210e) {
      // Planck constant ℎ
      out += 'h';
    } else if (cp >= 0x1d434 && cp <= 0x1d44d) {
      // Mathematical Italic Capital: 𝐴 .. 𝑍
      out += String.fromCharCode(65 + (cp - 0x1d434));
    } else {
      out += ch;
    }
  }
  return out;
}

function normalizePdfArtifacts(text: string): string {
  return normalizeMathUnicodeLetters(text)
    .replace(/\r\n/g, '\n')
    // Collapse broken spaces inside bracketed or inline scores like "[ 1 0   ball ]" or "1 2   ball"
    .replace(/\[\s*(\d)\s+(\d)\s*(ball|b\.?)\s*\]/gi, '[$1$2 ball]')
    .replace(/\b(\d)\s+(\d)\s+(ball)\b/gi, '$1$2 $3')
    .replace(/(\d)\s*-\s*topshiriq\b/gi, '$1-topshiriq')
    .replace(/T\s+opshiriq\s*:/g, 'Topshiriq:');
}

function isWatermarkLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  // Repeating eMaktab diagonal watermark fragments: "1000011303702 eMaktab", "1000011303702 e", "10000113"
  if (/^\d{6,16}(?:\s+(?:e|em|ema|emak|emakta|emaktab))?$/i.test(t)) return true;
  if (/^eMaktab(?:\s+\d{6,16})?$/i.test(t)) return true;
  return false;
}

/**
 * Cleans handwriting fill lines ("____", "- ____", "....", leading ": [10 ball]") from BSB prompts.
 */
export function cleanBsbFillLines(text: string): string {
  if (!text) return '';
  let cleaned = normalizeMathUnicodeLetters(text)
    // Leading ": [10 ball]" or "[ 10 ball ]" score prefixes attached to prompt/subquestion
    .replace(/^[:\s]*\[\s*\d+(?:[.,]\d+)?\s*(?:ball|b\.?)?\s*\]\s*/i, '')
    // Repeating handwriting underscores / dots
    .replace(/[_\u2014\u2013-]*_{2,}[_\s\u2014\u2013.-]*/g, ' ')
    .replace(/(?:\s*\.\s*){3,}/g, ' ')
    // Trailing dash / arrow left after stripping fill lines: "Kiritish qurilmasi –"
    .replace(/\s*[–—\->→]+\s*$/g, '')
    // Leading lone dash left when line started with "– __ __"
    .replace(/^\s*[–—\-:]+\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (/^[\s_.\-–—:]+$/.test(cleaned)) {
    cleaned = '';
  }
  return cleaned;
}

/**
 * Returns true when a line is purely blank lines/underscores meant for paper handwriting.
 */
export function isPureBlankLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (isWatermarkLine(trimmed)) return true;
  const cleaned = cleanBsbFillLines(trimmed);
  return cleaned.length === 0;
}

interface RubricTableEntry {
  points?: number;
  rubric: string;
}

/**
 * Extracts the trailing official PMM "Baholash mezoni" rubric table if present,
 * returning both the truncated body text (without rubric table / Izoh footer)
 * and per-task points + criteria.
 */
function extractTrailingRubricTable(normalizedText: string): {
  bodyText: string;
  rubricByTask: Map<number, RubricTableEntry>;
} {
  const rubricByTask = new Map<number, RubricTableEntry>();
  const lines = normalizedText.split('\n');

  // Trailing rubric table starts with a standalone "Baholash mezoni" heading (no inline colon)
  // followed closely by table columns ("Bob", "Mavzu", "Namunaviy", "Ajratilgan ball") or multiple N-topshiriq rows.
  let tableStartIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] || '').trim();
    if (/^Baholash\s+mezoni\s*$/i.test(line)) {
      const lookahead = lines.slice(i, i + 12).join(' ');
      if (/Bob|Mavzu|Namunaviy|Ajratilgan\s+ball/i.test(lookahead)) {
        tableStartIdx = i;
        break;
      }
    }
  }

  if (tableStartIdx === -1) {
    return { bodyText: normalizedText, rubricByTask };
  }

  const bodyText = lines.slice(0, tableStartIdx).join('\n');
  const tableLines = lines.slice(tableStartIdx);

  let currentTaskNum: number | null = null;
  let currentPoints: number | undefined = undefined;
  let currentCriteria: string[] = [];

  const flushTask = () => {
    if (currentTaskNum !== null) {
      const rubric = currentCriteria.join(' ').replace(/\s{2,}/g, ' ').trim();
      rubricByTask.set(currentTaskNum, {
        points: currentPoints,
        rubric,
      });
    }
  };

  for (const rawLine of tableLines) {
    const line = rawLine.trim();
    if (!line || isWatermarkLine(line)) continue;
    if (/^Jami\s+\d+\s*ball\b/i.test(line) || /^Izoh\s*:/i.test(line)) {
      flushTask();
      currentTaskNum = null;
      break;
    }

    // Match task reference inside rubric row: "1-topshiriq 4 ball" or "5-topshiriq 5 ball"
    const rowTaskMatch = line.match(/\b(\d{1,2})\s*-\s*topshiriq\b(?:\s+(\d+(?:[.,]\d+)?)\s*ball\b)?/i);
    if (rowTaskMatch && rowTaskMatch[1]) {
      flushTask();
      currentTaskNum = Number(rowTaskMatch[1]);
      currentPoints = rowTaskMatch[2] ? Number(rowTaskMatch[2].replace(',', '.')) : undefined;
      currentCriteria = [];
      const after = line.slice((rowTaskMatch.index ?? 0) + rowTaskMatch[0].length).trim();
      if (after) currentCriteria.push(after);
      continue;
    }

    if (currentTaskNum !== null) {
      // Only collect rubric criteria lines once inside a task's criteria column (skip next row's Bob/Mavzu lines if recognizable)
      if (/^(?:[IVX]+\s+bob\.|Jami\b)/i.test(line)) {
        flushTask();
        currentTaskNum = null;
        continue;
      }
      // Collapse broken digit spaces like "1 - 4 ball" -> "1-4 ball"
      const normCrit = line.replace(/(\d)\s*-\s*(\d)\s*ball/gi, '$1-$2 ball');
      if (/^\d+\)/.test(normCrit) || currentCriteria.length > 0) {
        currentCriteria.push(normCrit);
      }
    }
  }
  flushTask();

  return { bodyText, rubricByTask };
}

function distributeSubQuestionPoints(subs: ParsedSubQuestion[], totalPoints: number): void {
  if (subs.length === 0) return;
  const explicitlyScored = subs.filter((s) => s.points > 0);
  const explicitSum = explicitlyScored.reduce((acc, s) => acc + s.points, 0);

  if (explicitlyScored.length === subs.length && explicitSum > 0) {
    return;
  }

  const perSub = Number((totalPoints / subs.length).toFixed(2));
  subs.forEach((s) => {
    if (s.points <= 0) {
      s.points = perSub;
    }
  });
}

function stripHeaderPreamble(text: string): string {
  const lines = text.split('\n');
  const firstTaskIdx = lines.findIndex((ln) => {
    const t = ln.trim();
    return /^\d{1,2}\s*-\s*topshiriq\b/i.test(t) || /^\d{1,2}\.\s+\S+/.test(t);
  });
  if (firstTaskIdx > 0) {
    // Only strip obvious BSB document cover header lines ("o'quv yilida", "I chorak", "Jami: [25 ball]")
    const preamble = lines.slice(0, firstTaskIdx).join(' ');
    if (/o[‘'‛]quv\s+yilida|savol\s+va\s+topshiriqlar|I+\s+chorak|Jami:\s*\[\s*\d+/i.test(preamble)) {
      return lines.slice(firstTaskIdx).join('\n');
    }
  }
  return text;
}

/**
 * Deterministic parser supporting both:
 * 1) Standard CHSB multiple-choice tests (1. Prompt / A) B) C) D) / Javob: A)
 * 2) Official PMM BSB structured tasks (1-topshiriq. / [10 ball] / a) b) c) d) / 1) 2) / Jadval / Baholash mezoni)
 */
export function parseExamQuestionsFromText(
  rawText: string,
  options: { maxScore?: number; defaultPoints?: number } = {}
): ParseQuestionsResult {
  const warnings: string[] = [];
  if (!rawText || !rawText.trim()) {
    return { success: false, totalFound: 0, questions: [], warnings: ["Matn bo'sh."] };
  }

  const normalized = normalizePdfArtifacts(rawText);
  const { bodyText: withoutRubricTable, rubricByTask } = extractTrailingRubricTable(normalized);
  const cleanedBody = stripHeaderPreamble(withoutRubricTable);

  // Extract trailing answer key table for MCQs if present ("Javoblar: 1-A, 2-B, ...")
  const answerKeyMap = new Map<number, string>();
  const keySectionMatch = cleanedBody.match(/(?:Javoblar|To'g'ri javoblar|Kalit|Answers)\s*[:\-]\s*([\s\S]+)$/i);
  let bodyText = cleanedBody;
  if (keySectionMatch && keySectionMatch[1]) {
    const pairs = Array.from(keySectionMatch[1].matchAll(/(\d+)\s*[-–:.]\s*([A-Ea-e])/g));
    if (pairs.length >= 2) {
      for (const m of pairs) {
        const qNum = Number(m[1]);
        const letter = (m[2] ?? 'A').toUpperCase();
        answerKeyMap.set(qNum, `opt-${letter.toLowerCase()}`);
      }
      bodyText = cleanedBody.slice(0, keySectionMatch.index).trim();
    }
  }

  const lines = bodyText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => !isWatermarkLine(l) && !isPureBlankLine(l));

  const questions: ParsedQuestionItem[] = [];
  const hasTopshiriqKeyword = /\b\d{1,2}\s*-\s*topshiriq\b/i.test(bodyText);

  // Split by question blocks ("1-topshiriq." or "1. ")
  const blocks: { num: number; isBsbTopshiriq: boolean; lines: string[] }[] = [];
  let currentBlock: { num: number; isBsbTopshiriq: boolean; lines: string[] } | null = null;

  for (const line of lines) {
    const topshiriqStart = line.match(/^(\d{1,2})\s*-\s*topshiriq[.:)\s]*(.*)$/i);
    // Avoid treating "10-sinf..." or table row "2 Portativ" as a new question
    const numberedStart = !hasTopshiriqKeyword ? line.match(/^(\d{1,2})\.\s+(.+)$/) : null;

    if (topshiriqStart) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = {
        num: Number(topshiriqStart[1]),
        isBsbTopshiriq: true,
        lines: topshiriqStart[2] ? [topshiriqStart[2].trim()] : [],
      };
    } else if (numberedStart && !/^\d+\.\d+/.test(line)) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = {
        num: Number(numberedStart[1]),
        isBsbTopshiriq: false,
        lines: [numberedStart[2]!.trim()],
      };
    } else if (currentBlock) {
      currentBlock.lines.push(line);
    }
  }
  if (currentBlock) blocks.push(currentBlock);

  for (const blk of blocks) {
    const qNum = blk.num;
    const promptLines: string[] = [];
    const parsedOptions: ParsedOption[] = [];
    const subQuestions: ParsedSubQuestion[] = [];
    let inlineAnswer: string | undefined = undefined;
    let extractedPoints: number | undefined = undefined;
    let rubricHint = '';
    let isTableTask = false;
    let inTableWordBank = false;

    for (const rawLine of blk.lines) {
      let line = rawLine;

      // 1. Check inline points tag like "[10 ball]" or trailing "– 5 ball." on task header
      const ptsMatch = line.match(/[:\s]*\[\s*(\d+(?:[.,]\d+)?)\s*(?:ball|b\.?)?\s*\]/i);
      if (ptsMatch && ptsMatch[1]) {
        extractedPoints = Number(ptsMatch[1].replace(',', '.'));
        line = line.replace(ptsMatch[0], ' ').trim();
      } else if (blk.isBsbTopshiriq && extractedPoints === undefined) {
        const dashPtsMatch = line.match(/\s+[–—-]\s*(\d+(?:[.,]\d+)?)\s*ball\.?\s*$/i);
        if (dashPtsMatch && dashPtsMatch[1]) {
          extractedPoints = Number(dashPtsMatch[1].replace(',', '.'));
          line = line.replace(dashPtsMatch[0], '').trim();
        }
      }

      // Check standalone line that only had points (now empty)
      if (!line) continue;

      // Check inline subquestion right after prompt/score tag on the SAME line:
      // e.g. ": [ 10 ball ] a ) Kiritish qurilmasi" or "izohlang a) Kiritish qurilmasi"
      const inlineSubMatch = line.match(/^(\S.*?)\s+\b([a-e])\s*\)\s+(.+)$/i);
      if (
        blk.isBsbTopshiriq &&
        inlineSubMatch &&
        parsedOptions.length === 0 &&
        !/\([a-e]\)\s*$/i.test(line)
      ) {
        const prefixClean = cleanBsbFillLines(inlineSubMatch[1] || '');
        if (prefixClean && !/^\([a-e]\)$/i.test(prefixClean)) {
          promptLines.push(prefixClean);
        }
        const subLetter = (inlineSubMatch[2] || 'a').toLowerCase();
        const rawSub = inlineSubMatch[3] || '';
        const subPtsMatch = rawSub.match(/\((\d+(?:[.,]\d+)?)\s*ball\)/i);
        const subPts = subPtsMatch && subPtsMatch[1] ? Number(subPtsMatch[1].replace(',', '.')) : 0;
        const cleanSub = cleanBsbFillLines(subPtsMatch ? rawSub.replace(subPtsMatch[0], '') : rawSub);
        if (cleanSub) {
          subQuestions.push({
            id: `${qNum}-${subQuestions.length + 1}`,
            label: `${subLetter})`,
            prompt: cleanSub,
            points: subPts,
          });
        }
        continue;
      }

      // 2. Check inline answer hint: "Javob: B", "To'g'ri javob: A", "Ans: C"
      const ansMatch = line.match(/^(?:To'g'ri javob|Javob|Kalit|Ans|Answer)\s*[:\-]\s*([A-Ea-e])\b/i);
      if (ansMatch && ansMatch[1]) {
        inlineAnswer = `opt-${ansMatch[1].toLowerCase()}`;
        continue;
      }

      // 3. Check inline rubric hint: "Baholash mezoni: ..."
      const rubricMatch = line.match(/^Baholash mezoni\s*[:\-]\s*(.+)$/i);
      if (rubricMatch) {
        rubricHint = cleanBsbFillLines(rubricMatch[1] || line);
        continue;
      }

      // 4. Detect table completion tasks ("Jadvaldagi bo'sh o'rinlarni...", "Bo'sh joylarga...")
      if (/jadvaldagi\s+bo[’']sh|bo[’']sh\s+o[’']rinlar|bo[’']sh\s+joylarga/i.test(line)) {
        isTableTask = true;
        if (/bo[’']sh\s+joylarga/i.test(line)) {
          inTableWordBank = true;
        }
        promptLines.push(cleanBsbFillLines(line));
        continue;
      }

      // 5. Check MCQ option "A) text" or "A. text"
      const optMatch = line.match(/^([A-E])\s*[\).]\s+(.+)$/);
      if (optMatch && optMatch[1] && OPTION_LETTERS.includes(optMatch[1] as typeof OPTION_LETTERS[number])) {
        parsedOptions.push({
          id: `opt-${optMatch[1].toLowerCase()}`,
          label: optMatch[1],
          text: cleanBsbFillLines(optMatch[2] || ''),
        });
        continue;
      }

      // 6. Check BSB lettered subquestion: "a) ..." or "b) ____" (lowercase only so MCQ "A)" doesn't collide)
      const subMatch = line.match(/^([a-e])\s*\)\s*(.*)$/);
      if (subMatch && parsedOptions.length === 0) {
        const subLetter = (subMatch[1] || 'a').toLowerCase();
        const rawSub = subMatch[2] || '';
        const subPtsMatch = rawSub.match(/\((\d+(?:[.,]\d+)?)\s*ball\)/i);
        const subPts = subPtsMatch && subPtsMatch[1] ? Number(subPtsMatch[1].replace(',', '.')) : 0;
        const cleanSub = cleanBsbFillLines(subPtsMatch ? rawSub.replace(subPtsMatch[0], '') : rawSub);
        subQuestions.push({
          id: `${qNum}-${subQuestions.length + 1}`,
          label: `${subLetter})`,
          prompt: cleanSub || `${subLetter}) band bo'yicha javob`,
          points: subPts,
        });
        continue;
      }

      // 7. Check BSB numbered subquestion inside a "-topshiriq" block: "1) Sarlavhani..."
      // (Only if it contains meaningful prompt words, NOT empty "1) ____")
      const numSubMatch = blk.isBsbTopshiriq ? line.match(/^(\d+)\s*\)\s*(.+)$/) : null;
      if (numSubMatch && parsedOptions.length === 0) {
        const rawSub = numSubMatch[2] || '';
        const subPtsMatch = rawSub.match(/\((\d+(?:[.,]\d+)?)\s*ball\)/i);
        const subPts = subPtsMatch && subPtsMatch[1] ? Number(subPtsMatch[1].replace(',', '.')) : 0;
        const cleanSub = cleanBsbFillLines(subPtsMatch ? rawSub.replace(subPtsMatch[0], '') : rawSub);
        if (cleanSub.length >= 4 && subQuestions.length > 0 && /^1\)/.test(line) && subQuestions[subQuestions.length - 1]!.label.endsWith(')')) {
          // e.g. 7-sinf 1-topshiriq: a) has nested 1) 2) 3) lines -> ignore if empty, keep if text
          const lastSub = subQuestions[subQuestions.length - 1]!;
          lastSub.prompt = cleanBsbFillLines(`${lastSub.prompt} (${line})`);
        } else if (cleanSub.length >= 4) {
          subQuestions.push({
            id: `${qNum}-${subQuestions.length + 1}`,
            label: `${numSubMatch[1]})`,
            prompt: cleanSub,
            points: subPts,
          });
        }
        continue;
      }

      // 8. Handle Afzalligi / Kamchiligi sub-prompts attached to previous subquestion (e.g. 9-sinf 2-topshiriq)
      if (/^(?:Afzalligi|Kamchiligi)\s*[–—-]/i.test(line) && subQuestions.length > 0) {
        const lastSub = subQuestions[subQuestions.length - 1]!;
        const aspect = /^Afzalligi/i.test(line) ? 'Afzalligi' : 'Kamchiligi';
        if (!lastSub.prompt.includes(aspect)) {
          lastSub.prompt = `${lastSub.prompt} (${aspect})`.trim();
        }
        continue;
      }

      // Skip bare "Topshiriq:" divider line in 6-sinf Task 2
      if (/^Topshiriq\s*:?$/i.test(line)) {
        continue;
      }

      // 9. Continuation lines
      if (parsedOptions.length > 0 && !rubricHint) {
        const lastOpt = parsedOptions[parsedOptions.length - 1]!;
        const cleanedPart = cleanBsbFillLines(line);
        if (cleanedPart) {
          lastOpt.text = cleanBsbFillLines(`${lastOpt.text} ${cleanedPart}`);
        }
      } else if (subQuestions.length > 0 && !inTableWordBank && !rubricHint) {
        const lastSub = subQuestions[subQuestions.length - 1]!;
        const cleanedPart = cleanBsbFillLines(line);
        if (cleanedPart) {
          lastSub.prompt = cleanBsbFillLines(`${lastSub.prompt} ${cleanedPart}`);
        }
      } else {
        const cleanedPromptLine = cleanBsbFillLines(line);
        if (cleanedPromptLine) {
          promptLines.push(cleanedPromptLine);
        }
      }
    }

    const fullPrompt = cleanBsbFillLines(promptLines.join(' ').trim()) || `${qNum}-topshiriq`;
    const tableRubric = rubricByTask.get(qNum);
    const resolvedPoints = extractedPoints ?? tableRubric?.points ?? 0;
    const resolvedRubric = rubricHint || tableRubric?.rubric || undefined;
    const sourceExcerpt = cleanBsbFillLines(blk.lines.join(' ')).slice(0, 300) || fullPrompt;

    if (parsedOptions.length >= 2) {
      const resolvedCorrect =
        inlineAnswer && parsedOptions.some((o) => o.id === inlineAnswer)
          ? inlineAnswer
          : answerKeyMap.get(qNum) || parsedOptions[0]!.id;

      questions.push({
        id: `parsed-q-${qNum}`,
        number: qNum,
        prompt: fullPrompt,
        options: parsedOptions,
        correctOptionId: resolvedCorrect,
        points: resolvedPoints,
        bloomLevel: '(B)',
        taskType: 'multiple_choice',
        sourceExcerpt,
      });
    } else if (blk.isBsbTopshiriq || subQuestions.length > 0 || Boolean(resolvedRubric) || isTableTask) {
      const taskType = isTableTask
        ? 'table_completion'
        : subQuestions.length > 0
          ? 'subquestions'
          : 'open_text';

      questions.push({
        id: `parsed-q-${qNum}`,
        number: qNum,
        prompt: fullPrompt,
        options: [],
        correctOptionId: '',
        points: resolvedPoints,
        bloomLevel: taskType === 'table_completion' ? '(M)' : '(Q)',
        taskType,
        subQuestions: subQuestions.length > 0 ? subQuestions : undefined,
        rubric: resolvedRubric,
        sourceExcerpt,
      });
    } else {
      warnings.push(`#${qNum}-savolda yetarli variantlar (A, B...) topilmadi va o'tkazib yuborildi.`);
    }
  }

  // Distribute points for questions that still have points === 0
  if (questions.length > 0) {
    const missingPointsCount = questions.filter((q) => !q.points || q.points <= 0).length;
    if (missingPointsCount > 0) {
      const sumAssigned = questions.reduce((acc, q) => acc + (q.points || 0), 0);
      const targetMax = options.maxScore || 40;
      const remaining = Math.max(0, targetMax - sumAssigned);
      const fallbackPts =
        options.defaultPoints ??
        (remaining > 0 ? Number((remaining / missingPointsCount).toFixed(1)) : Number((targetMax / questions.length).toFixed(1)));
      questions.forEach((q) => {
        if (!q.points || q.points <= 0) {
          q.points = fallbackPts;
        }
      });
    }

    // Ensure every question's subQuestions share its exact total points cleanly
    questions.forEach((q) => {
      if (q.subQuestions && q.subQuestions.length > 0) {
        distributeSubQuestionPoints(q.subQuestions, q.points);
      }
    });
  }

  return {
    success: questions.length > 0,
    totalFound: questions.length,
    questions,
    warnings,
  };
}
