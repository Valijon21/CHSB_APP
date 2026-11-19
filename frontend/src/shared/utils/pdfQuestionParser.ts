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
    const pairRegex = /(\d+)[\.\-\)\:\s]+([A-Da-d])/g;
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
  const questionDelimiter = /\n\s*(?=(?:(?:(?:Savol|Topshiriq|Vazifa)\s+\d+)|(?:\d+\s*[\-\.]\s*(?:topshiriq|savol|vazifa))|(?:\d+[\.\)]\s+)))/i;
  const rawBlocks = cleanText.split(questionDelimiter).map((b) => b.trim()).filter(Boolean);

  const parsedList: ParsedQuestionItem[] = [];

  for (let blockIdx = 0; blockIdx < rawBlocks.length; blockIdx++) {
    const block = rawBlocks[blockIdx];
    if (!block) continue;

    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const firstLine = lines[0] || '';

    // Ignore preamble / header lines (e.g. "9-sinf Informatika", "1-BSB 1-chorak", "Jami: 50 ball")
    if (/^\s*(?:\d+[\s\-]*sinf|bsb|chsb|jami|umumiy)/i.test(firstLine) && !/(?:topshiriq|savol|vazifa)/i.test(firstLine)) {
      continue;
    }

    // Match question number and prompt start (e.g. "1-topshiriq [10 ball].", "Topshiriq 1:", "1. Savol")
    const isTaskHeader = /^(?:(?:Savol|Topshiriq|Vazifa)\s+(\d+)|(\d+)\s*[\-\.]\s*(?:topshiriq|savol|vazifa)|(\d+)[\.\)])/i.test(firstLine);
    if (!isTaskHeader) {
      continue;
    }

    const numMatch = firstLine.match(
      /^(?:(?:Savol|Topshiriq|Vazifa)\s+(\d+)|(\d+)\s*[\-\.]\s*(?:topshiriq|savol|vazifa)|(\d+)[\.\)])(?:\s*\[?(\d+(?:\.\d+)?)\s*ball\]?)?[\.\:\s\-]*(.*)$/i
    );

    if (!numMatch) {
      continue;
    }

    const matchedNumStr = numMatch[1] || numMatch[2] || numMatch[3];
    const qNum = matchedNumStr ? parseInt(matchedNumStr, 10) : parsedList.length + 1;
    const explicitPoints = numMatch[4] ? parseFloat(numMatch[4]) : undefined;
    const initialPrompt = numMatch[5] || '';

    let promptLines: string[] = [initialPrompt];
    const extractedOptions: ParsedOption[] = [];
    const extractedSubs: ParsedSubQuestion[] = [];
    let rubricHint: string | undefined;
    let inlineCorrectId: string | null = null;
    let readingOptions = false;
    let readingSubs = false;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // Check inline answer key (e.g. "Javob: B")
      const ansMatch = line.match(/^(?:Javob|Javobi|To['’`]?g['’`]?ri\s+javob|Correct|Ans|Kalit)[:\s]*([A-Da-d])/i);
      if (ansMatch && ansMatch[1]) {
        inlineCorrectId = `opt-${ansMatch[1].toLowerCase()}`;
        continue;
      }

      // Check rubric line
      const rubricMatch = line.match(/^(?:Baholash\s+mezoni|Mezon|Rubric|Mezoni)[:\s]*(.*)$/i);
      if (rubricMatch) {
        rubricHint = rubricMatch[1] || line;
        continue;
      }

      // Check option pattern: UPPERCASE A) text, A. text
      const optMatch = line.match(/^([A-D])[\.\)\-\]]\s*(.*)$/);
      if (optMatch && optMatch[1]) {
        readingOptions = true;
        const letter = optMatch[1].toUpperCase();
        extractedOptions.push({
          id: `opt-${letter.toLowerCase()}`,
          label: letter,
          text: (optMatch[2] || '').trim(),
        });
        continue;
      }

      // Check sub-question pattern: LOWERCASE a) text, b) text
      const subMatch = line.match(/^([a-e])[\.\)]\s*(.*)$/);
      if (subMatch && subMatch[1]) {
        readingSubs = true;
        const subLabel = subMatch[1].toLowerCase() + ')';
        const subText = (subMatch[2] || '').trim();
        const subPtsMatch = subText.match(/\(?(\d+(?:\.\d+)?)\s*ball\)?/i);
        const subPts = subPtsMatch && subPtsMatch[1] ? parseFloat(subPtsMatch[1]) : 2.5;

        extractedSubs.push({
          id: `${qNum}-${subMatch[1].toLowerCase()}`,
          label: subLabel,
          prompt: subText.replace(/\(?\d+(?:\.\d+)?\s*ball\)?/i, '').trim(),
          points: subPts,
        });
        continue;
      }

      // Continuation of sub-question
      if (readingSubs && extractedSubs.length > 0) {
        const lastSub = extractedSubs[extractedSubs.length - 1];
        if (lastSub) {
          lastSub.prompt += ' ' + line;
        }
        continue;
      }

      // Continuation of option
      if (readingOptions && extractedOptions.length > 0) {
        const lastOpt = extractedOptions[extractedOptions.length - 1];
        if (lastOpt) {
          lastOpt.text += ' ' + line;
        }
        continue;
      }

      // Main question prompt continuation
      promptLines.push(line);
    }

    const fullPrompt = promptLines.filter(Boolean).join(' ').trim() || `${qNum}-topshiriq`;

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
