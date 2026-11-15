import type { Question, QuestionBlock, QuestionOption } from '@/entities/assessment/model';
import rawQuestionsData from './raw_questions.json';

interface RawQuestion {
  b: string;
  t: string;
  o: string[];
}

function parseBlocks(rawText: string): QuestionBlock[] {
  const blocks: QuestionBlock[] = [];

  // Parse HTML tables if present
  if (rawText.includes('<table')) {
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/i;
    const match = rawText.match(tableRegex);
    if (match && match[1]) {
      const beforeTable = rawText.slice(0, match.index).trim();
      if (beforeTable) {
        blocks.push({ type: 'paragraph', text: beforeTable });
      }

      // Simple table row parser
      const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      const rows: string[][] = [];
      let rowMatch;
      while ((rowMatch = rowRegex.exec(match[1])) !== null) {
        const rowContent = rowMatch[1];
        if (!rowContent) continue;
        const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
        const cells: string[] = [];
        let cellMatch;
        while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
          const cellContent = cellMatch[1];
          if (cellContent !== undefined) {
            const cleanText = cellContent.replace(/<[^>]+>/g, '').trim();
            cells.push(cleanText);
          }
        }
        if (cells.length > 0) {
          rows.push(cells);
        }
      }

      const firstRow = rows[0];
      if (firstRow) {
        const columns = firstRow;
        const bodyRows = rows.slice(1);
        blocks.push({
          type: 'table',
          columns,
          rows: bodyRows.length > 0 ? bodyRows : [columns],
        });
      }

      const matchIndex = match.index ?? 0;
      const afterTable = rawText.slice(matchIndex + match[0].length).trim();
      if (afterTable) {
        blocks.push({ type: 'paragraph', text: afterTable });
      }
      return blocks;
    }
  }

  // Parse Images if present
  if (rawText.includes('<img')) {
    const imgRegex = /<img[^>]*src=['"]([^'"]+)['"][^>]*alt=['"]([^'"]*)['"][^>]*>/i;
    const match = rawText.match(imgRegex);
    if (match && match[1]) {
      const beforeImg = rawText.slice(0, match.index).trim();
      if (beforeImg) {
        blocks.push({ type: 'paragraph', text: beforeImg });
      }

      blocks.push({
        type: 'image',
        assetId: match[1],
        alt: match[2] || 'Savol rasmi',
      });

      const matchIndex = match.index ?? 0;
      const afterImg = rawText.slice(matchIndex + match[0].length).trim();
      if (afterImg) {
        blocks.push({ type: 'paragraph', text: afterImg });
      }
      return blocks;
    }
  }

  // Default: single paragraph block
  blocks.push({
    type: 'paragraph',
    text: rawText,
  });

  return blocks;
}

export const chsbAssessmentQuestions: Question[] = (rawQuestionsData as RawQuestion[]).map((raw, index) => {
  const options: QuestionOption[] = raw.o.map((optText, optIdx) => {
    const letters = ['A', 'B', 'C', 'D'];
    return {
      id: letters[optIdx] ?? String(optIdx + 1),
      text: optText,
    };
  });

  // Points distribution: 15 questions = 40 points total
  // Q1-Q10: 2.5 points each (25 points)
  // Q11-Q15: 3 points each (15 points)
  // Total: 25 + 15 = 40 points
  const points = index < 10 ? 2.5 : 3.0;

  return {
    id: `q-${index + 1}`,
    order: index + 1,
    cognitiveLevel: raw.b,
    points,
    blocks: parseBlocks(raw.t),
    options,
  };
});
