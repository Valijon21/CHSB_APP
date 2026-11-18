export interface ParsedOption {
  id: string;
  label: string;
  text: string;
}

export interface ParsedQuestionItem {
  number: number;
  prompt: string;
  options: ParsedOption[];
  correctOptionId: string;
  points: number;
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
  
  // Look for sections like "Javoblar:", "Kalitlar:", "Test javoblari:"
  const keySectionRegex = /(?:Javoblar|Kalitlar|Test\s+javoblari|Answers|Answer\s+keys)[:\s]+([\s\S]+)$/i;
  const match = text.match(keySectionRegex);
  
  if (match && match[1]) {
    const keyText = match[1];
    // Match pairs like 1-A, 1. A, 1)A, 1:A
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
 * Handles diverse Uzbek EdTech exam layouts (MNO, Attestatsiya, OECD PISA test format).
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

  // Split into question blocks: lines starting with number + delimiter, e.g. "1.", "1)", "1-savol:"
  const questionDelimiter = /\n\s*(?=(?:(?:Savol\s+)?\d+[\.\)\-:]|[№#]\s*\d+[\.\)\-:]))/i;
  const blocks = cleanText.split(questionDelimiter).map((b) => b.trim()).filter(Boolean);

  const parsedList: ParsedQuestionItem[] = [];

  for (let blockIdx = 0; blockIdx < blocks.length; blockIdx++) {
    const block = blocks[blockIdx];
    if (!block) continue;

    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const firstLine = lines[0] || '';
    
    // Extract question number from first line
    const numMatch = firstLine.match(/^(?:Savol\s+|[№#]\s*)?(\d+)[\.\)\-:]\s*(.*)$/i);
    if (!numMatch) {
      continue; // Not a recognized question start
    }

    const qNum = parseInt(numMatch[1] || `${parsedList.length + 1}`, 10);
    const initialPrompt = numMatch[2] || '';

    let promptLines: string[] = [initialPrompt];
    const extractedOptions: ParsedOption[] = [];
    let inlineCorrectId: string | null = null;
    let readingOptions = false;

    // Scan subsequent lines for options and inline answer declarations
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // Check inline answer key (e.g. "Javob: B" or "To'g'ri javob: C")
      const ansMatch = line.match(/^(?:Javob|Javobi|To['’`]?g['’`]?ri\s+javob|Correct|Ans|Kalit)[:\s]*([A-Da-d])/i);
      if (ansMatch && ansMatch[1]) {
        inlineCorrectId = `opt-${ansMatch[1].toLowerCase()}`;
        continue;
      }

      // Check option pattern: A) text, A. text, [A] text
      const optMatch = line.match(/^([A-Da-d])[\.\)\-\]]\s*(.*)$/);
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

      // If we haven't started reading options yet, it's multi-line question prompt
      if (!readingOptions) {
        promptLines.push(line);
      } else if (extractedOptions.length > 0) {
        // Multi-line option text continuation
        const lastOpt = extractedOptions[extractedOptions.length - 1];
        if (lastOpt) {
          lastOpt.text += ' ' + line;
        }
      }
    }

    // Require at least 2 options to qualify as a valid multiple-choice question
    if (extractedOptions.length >= 2) {
      // Determine correct answer
      let correctId = inlineCorrectId || trailingKeys.get(qNum) || 'opt-a';
      if (!inlineCorrectId && !trailingKeys.has(qNum)) {
        warnings.push(`${qNum}-savol uchun to'g'ri javob ko'rsatilmagan (standart A varianti belgilandi).`);
      }

      const fullPrompt = promptLines.filter(Boolean).join(' ').trim() || `${qNum}-savol`;

      parsedList.push({
        number: qNum,
        prompt: fullPrompt,
        options: extractedOptions,
        correctOptionId: correctId,
        points: 1, // Will be scaled below
      });
    }
  }

  // Calculate points per question
  const maxScore = options.maxScore || 40;
  const pts = parsedList.length > 0
    ? Number((maxScore / parsedList.length).toFixed(1))
    : (options.defaultPoints || 2.5);

  parsedList.forEach((q) => {
    q.points = pts;
  });

  return {
    success: parsedList.length > 0,
    totalFound: parsedList.length,
    questions: parsedList,
    rawTextLength: cleanText.length,
    warnings,
  };
}
