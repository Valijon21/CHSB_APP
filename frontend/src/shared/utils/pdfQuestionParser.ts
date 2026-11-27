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
  number: number;
  prompt: string;
  options: ParsedOption[];
  correctOptionId: string;
  points: number;
  taskType?: 'multiple_choice' | 'subquestions' | 'case_study' | 'table_completion' | 'open_text';
  subQuestions?: ParsedSubQuestion[];
  rubric?: string;
  sourceExcerpt?: string;
}

export interface ParseQuestionsResult {
  success: boolean;
  totalFound: number;
  questions: ParsedQuestionItem[];
  rawTextLength: number;
  warnings: string[];
}

/**
 * Extracts a trailing answer key map if present (e.g., "Javoblar: 1-A, 2-B, 3-C" or "Kalitlar: 1.A 2.B")
 */
function extractAnswerKeysMap(text: string): Map<number, string> {
  const map = new Map<number, string>();
  const keySectionRegex = /(?:Javoblar|Kalitlar|Test\s+javoblari|Answers|Answer\s+keys)[:\s]+([\s\S]+)$/i;
  const match = text.match(keySectionRegex);

  if (match && match[1]) {
    const keyText = match[1];
    const pairRegex = /(\d+)[.\-):\s]+([A-Da-d])/g;
    let pair;
    while ((pair = pairRegex.exec(keyText)) !== null) {
      const qNum = parseInt(pair[1] || '0', 10);
      const optLetter = (pair[2] || '').toUpperCase();
      if (qNum > 0 && optLetter) {
        map.set(qNum, `opt-${optLetter.toLowerCase()}`);
      }
    }
  }

  return map;
}

/**
 * Cleans fill-in-the-blank printed paper lines (underscores, dots, dashes),
 * score annotations, and trailing/leading punctuation from question prompts and options.
 */
export function cleanBsbFillLines(text: string): string {
  if (!text) return '';
  return text
    // 1. Remove underscores and underscore-dash combos e.g. "– __ __ ______", "___", "____"
    .replace(/[\s–—-]*_{2,}[\s_–—-]*/g, ' ')
    // 2. Remove dotted fill-in lines e.g. "....." or ". . . . ."
    .replace(/(?:\.\s*){4,}/g, ' ')
    // 3. Remove bracketed score tags e.g. ": [ 10 ball ]", "[10 ball]", "(2.5 ball)", or standalone ": 10 ball"
    .replace(/(?:[:\s]*[[(]\s*\d+(?:\.\d+)?\s*ball\s*[\])]|:\s*\d+(?:\.\d+)?\s*ball\b)/gi, ' ')
    // 4. Remove lingering trailing dashes, colons, hyphens, or dots: "Kiritish qurilmasi –" -> "Kiritish qurilmasi"
    .replace(/[\s–—\-:.]+$/, '')
    // 5. Remove lingering leading dashes or colons
    .replace(/^[\s–—\-:]+/, '')
    // 6. Normalize multiple spaces/tabs
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Checks if a line is purely a student handwriting blank line (e.g. "______________________________")
 */
export function isPureBlankLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  return /^[\s_–—\-.:]+$/.test(trimmed);
}

/**
 * Parses raw text extracted from PDF into structured exam questions and options.
 * Handles both multiple-choice tests and Uzbekistan official BSB/ChSB open tasks,
 * sub-questions (a, b, c, d), practical case studies, and rubrics.
 */
export function parseExamQuestionsFromText(
  rawText: string,
  options: { maxScore?: number; defaultPoints?: number } = {}
): ParseQuestionsResult {
  const warnings: string[] = [];
  if (!rawText || !rawText.trim()) {
    return {
      success: false,
      totalFound: 0,
      questions: [],
      rawTextLength: 0,
      warnings: ["Fayl matni bo'sh yoki o'qib bo'lmadi."],
    };
  }

  const cleanText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const trailingKeys = extractAnswerKeysMap(cleanText);

  // Split into question blocks: lines starting with "1.", "1)", "1-topshiriq", "Topshiriq 1:", "1-savol"
  const questionDelimiter = /\n\s*(?=(?:(?:(?:Savol|Topshiriq|Vazifa)\s+\d+)|(?:\d+\s*[.-]\s*(?:topshiriq|savol|vazifa))|(?:\d+[.)]\s+)))/i;
  const rawBlocks = cleanText.split(questionDelimiter).map((b) => b.trim()).filter(Boolean);

  const parsedList: ParsedQuestionItem[] = [];

  for (let blockIdx = 0; blockIdx < rawBlocks.length; blockIdx++) {
    const block = rawBlocks[blockIdx];
    if (!block) continue;

    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const firstLine = lines[0] || '';

    // Ignore preamble / header lines (e.g. "9-sinf Informatika", "1-BSB 1-chorak", "Jami: 50 ball")
    if (/^\s*(?:\d+[\s-]*sinf|bsb|chsb|jami|umumiy)/i.test(firstLine) && !/(?:topshiriq|savol|vazifa)/i.test(firstLine)) {
      continue;
    }

    // Match question number and prompt start (e.g. "1-topshiriq [10 ball].", "Topshiriq 1:", "1. Savol")
    const isTaskHeader = /^(?:(?:Savol|Topshiriq|Vazifa)\s+(\d+)|(\d+)\s*[.-]\s*(?:topshiriq|savol|vazifa)|(\d+)[.)])/i.test(firstLine);
    if (!isTaskHeader) {
      continue;
    }

    const numMatch = firstLine.match(
      /^(?:(?:Savol|Topshiriq|Vazifa)\s+(\d+)|(\d+)\s*[.-]\s*(?:topshiriq|savol|vazifa)|(\d+)[.)])(?:\s*[:\s]*[[(]?\s*(\d+(?:\.\d+)?)\s*ball\s*[\])]?)?[.: \s-]*(.*)$/i
    );

    if (!numMatch) {
      continue;
    }

    const matchedNumStr = numMatch[1] || numMatch[2] || numMatch[3];
    const qNum = matchedNumStr ? parseInt(matchedNumStr, 10) : parsedList.length + 1;
    let explicitPoints = numMatch[4] ? parseFloat(numMatch[4]) : undefined;
    let initialPrompt = (numMatch[5] || '').trim();

    // If explicitPoints wasn't in the task header, check if initialPrompt begins with score tag
    if (!explicitPoints) {
      const ptsInPrompt = initialPrompt.match(/^[:\s]*[[(]?\s*(\d+(?:\.\d+)?)\s*ball\s*[\])]?/i);
      if (ptsInPrompt && ptsInPrompt[1]) {
        explicitPoints = parseFloat(ptsInPrompt[1]);
        initialPrompt = initialPrompt.replace(ptsInPrompt[0], ' ').trim();
      }
    }

    const promptLines: string[] = [];
    const extractedOptions: ParsedOption[] = [];
    const extractedSubs: ParsedSubQuestion[] = [];
    let rubricHint: string | undefined;
    let inlineCorrectId: string | null = null;
    let readingOptions = false;
    let readingSubs = false;

    // Check if initialPrompt contains an inline subquestion (e.g. "a) Kiritish qurilmasi")
    const inlineSubMatch = initialPrompt.match(/^(.*?)(?:^|[:\s]+)([a-e])\s*[.)]\s*(.*)$/i);
    if (inlineSubMatch && inlineSubMatch[2]) {
      const promptPrefix = cleanBsbFillLines(inlineSubMatch[1] || '');
      if (promptPrefix) {
        promptLines.push(promptPrefix);
      }
      const firstSubLabel = inlineSubMatch[2].toLowerCase() + ')';
      const firstSubRaw = inlineSubMatch[3] || '';
      const subPtsMatch = firstSubRaw.match(/[[(]?\s*(\d+(?:\.\d+)?)\s*ball\s*[\])]?/i);
      const subPts = subPtsMatch && subPtsMatch[1] ? parseFloat(subPtsMatch[1]) : 2.5;
      const cleanSub = cleanBsbFillLines(firstSubRaw);
      extractedSubs.push({
        id: `${qNum}-${inlineSubMatch[2].toLowerCase()}`,
        label: firstSubLabel,
        prompt: cleanSub || `Band ${inlineSubMatch[2].toLowerCase()}`,
        points: subPts,
      });
      readingSubs = true;
    } else {
      const cleanedInitial = cleanBsbFillLines(initialPrompt);
      if (cleanedInitial) {
        promptLines.push(cleanedInitial);
      }
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // Skip lines that are purely blank answer fill lines for paper exams
      if (isPureBlankLine(line)) {
        continue;
      }

      // Check if line is a standalone points tag like ": [ 10 ball ]"
      const standalonePtsMatch = line.match(/^[:\s]*[[(]?\s*(\d+(?:\.\d+)?)\s*ball\s*[\])]?[:\s]*$/i);
      if (standalonePtsMatch && standalonePtsMatch[1]) {
        if (!explicitPoints) {
          explicitPoints = parseFloat(standalonePtsMatch[1]);
        }
        continue;
      }

      // Check inline answer key (e.g. "Javob: B")
      const ansMatch = line.match(/^(?:Javob|Javobi|To['’`]?g['’`]?ri\s+javob|Correct|Ans|Kalit)[:\s]*([A-Da-d])/i);
      if (ansMatch && ansMatch[1]) {
        inlineCorrectId = `opt-${ansMatch[1].toLowerCase()}`;
        continue;
      }

      // Check rubric line
      const rubricMatch = line.match(/^(?:Baholash\s+mezoni|Mezon|Rubric|Mezoni)[:\s]*(.*)$/i);
      if (rubricMatch) {
        rubricHint = cleanBsbFillLines(rubricMatch[1] || line);
        continue;
      }

      // Check option pattern: UPPERCASE A) text, A. text
      const optMatch = line.match(/^([A-D])\s*[.)\-\]]\s*(.*)$/);
      if (optMatch && optMatch[1]) {
        readingOptions = true;
        readingSubs = false;
        const letter = optMatch[1].toUpperCase();
        extractedOptions.push({
          id: `opt-${letter.toLowerCase()}`,
          label: letter,
          text: cleanBsbFillLines(optMatch[2] || ''),
        });
        continue;
      }

      // Check sub-question pattern: LOWERCASE a) text, b) text, with optional score prefix like ": [ 10 ball ] a ) ..."
      const subMatch = line.match(/^(?:[:\s]*[[(]?\s*(\d+(?:\.\d+)?)\s*ball\s*[\])]?[:\s]*)?([a-e])\s*[.)]\s*(.*)$/i);
      if (subMatch && subMatch[2]) {
        readingSubs = true;
        readingOptions = false;
        if (subMatch[1] && !explicitPoints) {
          explicitPoints = parseFloat(subMatch[1]);
        }
        const subLabel = subMatch[2].toLowerCase() + ')';
        const subTextRaw = subMatch[3] || '';
        const subPtsMatch = subTextRaw.match(/[[(]?\s*(\d+(?:\.\d+)?)\s*ball\s*[\])]?/i);
        const subPts = subPtsMatch && subPtsMatch[1] ? parseFloat(subPtsMatch[1]) : 2.5;
        const cleanSub = cleanBsbFillLines(subTextRaw);

        extractedSubs.push({
          id: `${qNum}-${subMatch[2].toLowerCase()}`,
          label: subLabel,
          prompt: cleanSub || `Band ${subMatch[2].toLowerCase()}`,
          points: subPts,
        });
        continue;
      }

      // Continuation of sub-question
      if (readingSubs && extractedSubs.length > 0) {
        const lastSub = extractedSubs[extractedSubs.length - 1];
        if (lastSub) {
          const cleanedPart = cleanBsbFillLines(line);
          if (cleanedPart) {
            lastSub.prompt = cleanBsbFillLines(`${lastSub.prompt} ${cleanedPart}`);
          }
        }
        continue;
      }

      // Continuation of option
      if (readingOptions && extractedOptions.length > 0) {
        const lastOpt = extractedOptions[extractedOptions.length - 1];
        if (lastOpt) {
          const cleanedPart = cleanBsbFillLines(line);
          if (cleanedPart) {
            lastOpt.text = cleanBsbFillLines(`${lastOpt.text} ${cleanedPart}`);
          }
        }
        continue;
      }

      // Main question prompt continuation
      const cleanedPromptLine = cleanBsbFillLines(line);
      if (cleanedPromptLine) {
        promptLines.push(cleanedPromptLine);
      }
    }

    const fullPrompt = cleanBsbFillLines(promptLines.join(' ').trim()) || `${qNum}-topshiriq`;

    // Case 1: Multiple choice test (has A, B, C, D)
    if (extractedOptions.length >= 2) {
      const correctId = inlineCorrectId || trailingKeys.get(qNum) || 'opt-a';
      if (!inlineCorrectId && !trailingKeys.has(qNum)) {
        warnings.push(`${qNum}-savol uchun to'g'ri javob ko'rsatilmagan (standart A varianti belgilandi).`);
      }

      parsedList.push({
        number: qNum,
        prompt: fullPrompt,
        options: extractedOptions,
        correctOptionId: correctId,
        points: explicitPoints || 1,
        taskType: 'multiple_choice',
        sourceExcerpt: block,
      });
    }
    // Case 2: Multi-part subquestions (a, b, c, d)
    else if (extractedSubs.length > 0) {
      if (explicitPoints && explicitPoints > 0) {
        const hasExplicitSubPts = extractedSubs.some((s) => s.points !== 2.5);
        if (!hasExplicitSubPts) {
          const perSub = Math.round((explicitPoints / extractedSubs.length) * 10) / 10;
          extractedSubs.forEach((s) => {
            s.points = perSub;
          });
        }
      }

      const totalSubPts = extractedSubs.reduce((acc, s) => acc + s.points, 0);
      parsedList.push({
        number: qNum,
        prompt: fullPrompt,
        options: [],
        correctOptionId: '',
        points: explicitPoints || totalSubPts || 10,
        taskType: 'subquestions',
        subQuestions: extractedSubs,
        rubric: rubricHint,
        sourceExcerpt: block,
      });
    }
    // Case 3: Open BSB task / Practical problem (only if no incomplete option list, and has task keyword, rubric, or explicit points)
    else if (extractedOptions.length === 0 && fullPrompt.length > 8 && (rubricHint || /(?:topshiriq|vazifa|keys|amaliy)/i.test(firstLine) || explicitPoints)) {
      parsedList.push({
        number: qNum,
        prompt: fullPrompt,
        options: [],
        correctOptionId: '',
        points: explicitPoints || 5,
        taskType: 'open_text',
        rubric: rubricHint,
        sourceExcerpt: block,
      });
    }
  }

  // Calculate points per question if not explicitly set
  const maxScore = options.maxScore || (parsedList.length <= 5 ? 50 : 40);
  const totalExplicit = parsedList.reduce((acc, q) => acc + (q.points || 0), 0);

  if (totalExplicit === 0 || totalExplicit === parsedList.length) {
    const pts = parsedList.length > 0
      ? Number((maxScore / parsedList.length).toFixed(1))
      : (options.defaultPoints || 2.5);

    parsedList.forEach((q) => {
      q.points = pts;
    });
  }

  return {
    success: parsedList.length > 0,
    totalFound: parsedList.length,
    questions: parsedList,
    rawTextLength: rawText.length,
    warnings,
  };
}
