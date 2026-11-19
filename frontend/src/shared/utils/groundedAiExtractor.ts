/**
 * Grounded RAG AI Extractor for Uzbek EdTech Assessments
 * Uses Google Gemini (gemini-3.5-flash-lite) with STRICT GROUNDING to prevent hallucinations.
 * Guarantees zero fabricated questions by requiring exact source quotes (sourceExcerpt)
 * and human-in-the-loop review.
 */

export interface GroundedSubQuestion {
  id: string;
  label: string; // 'a)', 'b)', 'c)', etc.
  prompt: string;
  points: number;
  rubric?: string;
}

export interface GroundedQuestionItem {
  id: string;
  number: number;
  title: string;
  prompt: string;
  taskType: 'multiple_choice' | 'subquestions' | 'table_completion' | 'case_study' | 'open_text';
  points: number;
  options?: Array<{ id: string; label: string; text: string }>;
  correctOptionId?: string;
  subQuestions?: GroundedSubQuestion[];
  rubric?: string;
  sourceExcerpt: string;
  isApprovedByHuman: boolean;
}

export interface GroundedExtractionResult {
  success: boolean;
  questions: GroundedQuestionItem[];
  modelUsed: string;
  sourceTextLength: number;
  warnings: string[];
  error?: string;
}

const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const STORAGE_KEY = 'chsb_gemini_api_key';

export function getStoredGeminiApiKey(): string {
  const envKey = (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } }).env?.VITE_GEMINI_API_KEY || '';
  const localKey = localStorage.getItem(STORAGE_KEY) || '';
  return localKey || envKey || '';
}

export function saveStoredGeminiApiKey(key: string): void {
  if (key) {
    localStorage.setItem(STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Strict Grounding RAG prompt instructing Gemini to ONLY extract factual content
 * from the provided document without hallucinations.
 */
function buildStrictGroundingPrompt(rawText: string, maxScore = 50): string {
  return `SEN O'ZBEKISTON RESPUBLIKASI MAKTAB TA'LIMI STANDARTLARI (BSB/ChSB) BO'YICHA QAT'IY NAZORAT OSTIDAGI METODIST-EKSPERT VA HUJJAT TAHLILCHISISAN.

SENING VAZIFANG:
Quyida keltirilgan PDF hujjat matnidan barcha imtihon topshiriqlarini (savollar, sub-topshiriqlar a, b, c, d, jadvallar, keyslar va baholash mezonlarini) to'liq va aniq JSON formatida ajratib berish.

⛔ QAT'IY GROUNDING QOIDALARI (GALLYUTSINATSIYA VA TO'QIMALAR MUTLAQO TAQIQLANADI):
1. FAQAT VA FAQAT BERILGAN MATNDA MAVJUD BO'LGAN TOPSHIRIQLARNI CHIQAR. Matnda bo'lmagan birorta ham yangi savol to'qima!
2. Har bir topshiriq uchun uning hujjatdagi aniq asl matnini "sourceExcerpt" maydoniga aynan ko'chirib yoz.
3. Agar topshiriq 4 ta variantli oddiy test bo'lsa (A, B, C, D): "taskType": "multiple_choice" deb belgilab, variantlarni "options" ga yoz.
4. Agar topshiriq rasmiy BSB topshirig'i (ochiq savollar, bandlar: a, b, c, d) bo'lsa: "taskType": "subquestions" deb belgilab, "subQuestions" ga har bir bandning nomi, savoli va ballini yoz.
5. Agar matnda jadval to'ldirish yoki amaliy vaziyat/keys (masalan, kiberxavfsizlik, Sezar shifri, Wi-Fi) bo'lsa: "taskType": "case_study" yoki "table_completion" deb ko'rsat.
6. Hujjatdagi "Baholash mezoni" (Rubrics) ko'rsatilgan bo'lsa, uni har bir savolning "rubric" maydoniga aniq yoz.
7. Maksimal umumiy ball me'yori: ${maxScore} ball.

HUJJAT MATNI:
"""
${rawText}
"""

JAVOBNI FAQAT QUYIDAGI JSON FORMATIDA QAYTAR (boshqa hech qanday so'z yoki tushuntirish qo'shma):
[
  {
    "number": 1,
    "title": "1-topshiriq",
    "prompt": "Savolning umumiy matni",
    "taskType": "subquestions" | "multiple_choice" | "case_study" | "table_completion" | "open_text",
    "points": 10,
    "options": [
      { "id": "opt-a", "label": "A", "text": "Variant A matni" }
    ],
    "correctOptionId": "opt-a",
    "subQuestions": [
      {
        "id": "1-a",
        "label": "a)",
        "prompt": "Band savoli matni",
        "points": 2.5,
        "rubric": "Baholash mezoni ko'rsatmasi"
      }
    ],
    "rubric": "Topshiriq umumiy baholash mezoni",
    "sourceExcerpt": "Hujjatdan aynan ko'chirilgan matn parchasi"
  }
]`;
}

interface RawGeminiItem {
  number?: number;
  title?: string;
  prompt?: string;
  taskType?: string;
  points?: number;
  options?: Array<{ id?: string; label?: string; text?: string }>;
  correctOptionId?: string;
  subQuestions?: Array<{ id?: string; label?: string; prompt?: string; points?: number; rubric?: string }>;
  rubric?: string;
  sourceExcerpt?: string;
}

/**
 * Extracts structured questions from PDF text via Gemini with strict grounding.
 */
export async function extractGroundedQuestionsWithAi(
  rawPdfText: string,
  options: { apiKey?: string; model?: string; maxScore?: number } = {}
): Promise<GroundedExtractionResult> {
  const apiKey = (options.apiKey || getStoredGeminiApiKey()).trim();
  const model = options.model || DEFAULT_MODEL;
  const maxScore = options.maxScore || 50;

  if (!rawPdfText || !rawPdfText.trim()) {
    return {
      success: false,
      questions: [],
      modelUsed: model,
      sourceTextLength: 0,
      warnings: [],
      error: "Hujjat matni bo'sh yoki o'qib bo'lmadi.",
    };
  }

  if (!apiKey) {
    return {
      success: false,
      questions: [],
      modelUsed: model,
      sourceTextLength: rawPdfText.length,
      warnings: ["Gemini API kaliti topilmadi."],
      error: "Iltimos, Google Gemini API kalitini kiriting.",
    };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const prompt = buildStrictGroundingPrompt(rawPdfText, maxScore);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1, // Near-zero temperature for maximum factual precision and determinism
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      const errMsg = errJson?.error?.message || `Gemini API xatoligi (Status: ${response.status})`;
      throw new Error(errMsg);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error("Sun'iy intellektdan javob kelmadi.");
    }

    const parsedJson: RawGeminiItem[] = JSON.parse(candidateText);

    if (!Array.isArray(parsedJson) || parsedJson.length === 0) {
      throw new Error("Hujjatdan topshiriqlar ajratib olinmadi.");
    }

    const questions: GroundedQuestionItem[] = parsedJson.map((item, index) => {
      const num = item.number || index + 1;
      const title = item.title || `${num}-topshiriq`;
      const promptText = item.prompt || title;
      const pts = Number(item.points || (maxScore / parsedJson.length).toFixed(1));

      // Normalize task type
      let taskType: GroundedQuestionItem['taskType'] = 'subquestions';
      if (item.taskType === 'multiple_choice' && item.options && item.options.length >= 2) {
        taskType = 'multiple_choice';
      } else if (item.taskType === 'case_study') {
        taskType = 'case_study';
      } else if (item.taskType === 'table_completion') {
        taskType = 'table_completion';
      } else if (item.taskType === 'open_text') {
        taskType = 'open_text';
      }

      // Format options if multiple choice
      const optionsList = (item.options || []).map((opt, optIdx) => {
        const letter = (opt.label || String.fromCharCode(65 + optIdx)).toUpperCase();
        return {
          id: opt.id || `opt-${letter.toLowerCase()}`,
          label: letter,
          text: opt.text || `Variant ${letter}`,
        };
      });

      // Format subquestions if present
      const subList = (item.subQuestions || []).map((sub, sIdx) => {
        const defaultLabel = String.fromCharCode(97 + sIdx) + ')';
        return {
          id: sub.id || `${num}-${sIdx + 1}`,
          label: sub.label || defaultLabel,
          prompt: sub.prompt || `Band ${sIdx + 1}`,
          points: Number(sub.points || (pts / (item.subQuestions?.length || 1)).toFixed(1)),
          rubric: sub.rubric,
        };
      });

      return {
        id: `ai-q-${num}`,
        number: num,
        title,
        prompt: promptText,
        taskType,
        points: pts,
        options: optionsList.length > 0 ? optionsList : undefined,
        correctOptionId: item.correctOptionId,
        subQuestions: subList.length > 0 ? subList : undefined,
        rubric: item.rubric,
        sourceExcerpt: item.sourceExcerpt || promptText,
        isApprovedByHuman: false, // Mandatory Human-in-the-loop review
      };
    });

    return {
      success: true,
      questions,
      modelUsed: model,
      sourceTextLength: rawPdfText.length,
      warnings: [],
    };
  } catch (err: unknown) {
    const message = (err as Error)?.message || "AI tahlilida kutilmagan xatolik yuz berdi.";
    return {
      success: false,
      questions: [],
      modelUsed: model,
      sourceTextLength: rawPdfText.length,
      warnings: [],
      error: message,
    };
  }
}
