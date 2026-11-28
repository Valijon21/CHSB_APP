/**
 * Grounded RAG AI Extractor for Uzbek EdTech Assessments.
 * Routes all AI calls through the backend `/api/v1/ai/*` proxy so no API keys
 * are ever bundled or exposed in client-side JavaScript.
 */

export interface GroundedSubQuestion {
  id: string;
  label: string;
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

const DEFAULT_MODEL = 'gemini-2.0-flash';

function getAuthToken(): string | null {
  try {
    const raw = sessionStorage.getItem('chsb_auth_session') || localStorage.getItem('chsb_auth_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.token || parsed?.user?.token || null;
    }
  } catch {
    // Ignore storage access errors
  }
  return null;
}

function getApiBaseUrl(): string {
  const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.port === '5173');
  if (isLocal) return '/api/v1';
  const envBase = (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL;
  return envBase || '/api/v1';
}

export function hasCustomApiKey(): boolean {
  return false;
}

export function getCustomApiKey(): string {
  return '';
}

export function getStoredGeminiApiKey(): string {
  return '';
}

export function saveStoredGeminiApiKey(_key: string): void {
  // Server-managed GEMINI_API_KEY only; browser storage is disabled for security.
}

/**
 * Translates Google Gemini API errors into clean, professional Uzbek messages.
 */
export function translateAiErrorMessage(rawError: string): string {
  if (!rawError) return "Sun'iy intellekt bilan bog'lanishda noma'lum xatolik yuz berdi.";
  const lower = rawError.toLowerCase();

  if (lower.includes('high demand') || lower.includes('spikes in demand') || lower.includes('503')) {
    return "Google serverlarida ayni daqiqalarda yuqori yuklama yuz berdi (talab juda yuqori). Bu vaqtinchalik holat bo'lib, birozdan so'ng qayta urinib ko'rishingiz mumkin";
  }
  if (lower.includes('quota') || lower.includes('rate limit') || lower.includes('resource_exhausted') || lower.includes('429')) {
    return "Bepul so'rovlar limiti vaqtinchalik to'ldi. Iltimos, 1 daqiqadan so'ng qayta urinib ko'ring";
  }
  if (lower.includes('api_key_invalid') || lower.includes('invalid api key') || lower.includes('api key not found') || lower.includes('400')) {
    return "API kalit noto'g'ri yoki faollashtirilmagan";
  }
  if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('offline') || lower.includes('load failed')) {
    return "Internetga ulanishda uzilish yuz berdi";
  }
  if (lower.includes('not found') || lower.includes('404')) {
    return "Tanlangan AI modeli mavjud emas yoki yangilanishda";
  }
  return rawError;
}

/**
 * Extracts structured questions from PDF text via backend AI proxy.
 */
export async function extractGroundedQuestionsWithAi(
  rawPdfText: string,
  options: { apiKey?: string; model?: string; maxScore?: number } = {}
): Promise<GroundedExtractionResult> {
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

  const endpoint = `${getApiBaseUrl().replace(/\/$/, '')}/ai/extract-questions`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        rawText: rawPdfText,
        model,
        maxScore,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      const rawErrMsg = errJson?.detail || errJson?.error || `Status: ${response.status}`;
      throw new Error(translateAiErrorMessage(rawErrMsg));
    }

    const data = (await response.json()) as GroundedExtractionResult;
    return {
      success: Boolean(data.success),
      questions: (data.questions || []).map((q) => ({
        ...q,
        isApprovedByHuman: false,
      })),
      modelUsed: data.modelUsed || model,
      sourceTextLength: data.sourceTextLength ?? rawPdfText.length,
      warnings: data.warnings || [],
      error: data.error,
    };
  } catch (err: unknown) {
    const rawMessage = (err as Error)?.message || "Sun'iy intellekt tahlilida kutilmagan xatolik yuz berdi.";
    return {
      success: false,
      questions: [],
      modelUsed: model,
      sourceTextLength: rawPdfText.length,
      warnings: [],
      error: translateAiErrorMessage(rawMessage),
    };
  }
}

export interface GroundedStudentItem {
  orderIndex: number;
  fullName: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  emaktabId?: string;
  gender: 'M' | 'F';
  group: '1-guruh' | '2-guruh';
  birthDate?: string;
}

export interface GroundedRosterExtractionResult {
  success: boolean;
  students: GroundedStudentItem[];
  modelUsed: string;
  detectedGroup: string;
  error?: string;
}

/**
 * Extracts student roster via backend AI proxy.
 */
export async function extractStudentsRosterWithAi(
  rawTableText: string,
  options?: { defaultGroup?: string }
): Promise<GroundedRosterExtractionResult> {
  const model = DEFAULT_MODEL;
  const defaultGroup = (options?.defaultGroup || (rawTableText.includes('2-gur') ? '2-guruh' : '1-guruh')) as '1-guruh' | '2-guruh';

  if (!rawTableText || !rawTableText.trim()) {
    return {
      success: false,
      students: [],
      modelUsed: model,
      detectedGroup: defaultGroup,
      error: "Tahlil qilish uchun matn yoki jadval ma'lumoti bo'sh.",
    };
  }

  const endpoint = `${getApiBaseUrl().replace(/\/$/, '')}/ai/extract-roster`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        rawText: rawTableText,
        defaultGroup,
        model,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      throw new Error(translateAiErrorMessage(errJson?.detail || errJson?.error || `Status: ${response.status}`));
    }

    const data = (await response.json()) as GroundedRosterExtractionResult;
    return {
      success: Boolean(data.success),
      students: data.students || [],
      modelUsed: data.modelUsed || model,
      detectedGroup: data.detectedGroup || defaultGroup,
      error: data.error,
    };
  } catch (err: unknown) {
    const rawMsg = (err as Error)?.message || "AI tahlilida xatolik yuz berdi";
    return {
      success: false,
      students: [],
      modelUsed: model,
      detectedGroup: defaultGroup,
      error: translateAiErrorMessage(rawMsg),
    };
  }
}
