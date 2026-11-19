<script setup lang="ts">
import { ref, toRef, computed } from 'vue';
import { useModalA11y } from '../../../shared/composables/useModalA11y';
import { getActivePinia } from 'pinia';
import { useOrganizationStore } from '../../organization/store/organizationStore';
import type { CreateAssessmentInput } from '../../../entities/assessment/model';
import { extractTextFromPdf } from '../../../shared/utils/pdfExtractor';
import { parseExamQuestionsFromText, type ParsedQuestionItem } from '../../../shared/utils/pdfQuestionParser';
import { getBsbStandardByGrade } from '../../../entities/assessment/officialBsbData';
import {
  extractGroundedQuestionsWithAi,
  getStoredGeminiApiKey,
  type GroundedQuestionItem,
} from '../../../shared/utils/groundedAiExtractor';
import AiQuestionReviewCard from './components/AiQuestionReviewCard.vue';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'create', input: CreateAssessmentInput): void;
}>();

const orgStore = getActivePinia() ? useOrganizationStore() : null;

const availableSubjects = computed(() => {
  if (orgStore?.subjects && orgStore.subjects.length > 0) {
    return orgStore.subjects.map((s) => s.name);
  }
  return [
    'Matematika',
    'Informatika va AT',
    'Fizika',
    'Kimyo',
    'Biologiya',
    'Ona tili va adabiyot',
    'Ingliz tili',
    'Tarix',
    'Geografiya',
  ];
});

const activeTab = ref<'params' | 'questions'>('params');
const title = ref('');
const subject = ref(availableSubjects.value[0] || 'Informatika va AT');
const gradeLevel = ref<number>(9);
const quarter = ref<number>(1);
const durationMinutes = ref<number>(40);
const totalQuestions = ref<number>(15);
const maxScore = ref<number>(40);
const errorMessage = ref<string | null>(null);
const isSubmitting = ref<boolean>(false);

// Question creation mode
const questionMode = ref<'auto' | 'custom' | 'pdf'>('auto');
const customQuestionsText = ref('');

// PDF Upload & Grounded AI Extraction State
const isPdfProcessing = ref(false);
const pdfFileName = ref('');
const pdfFileSize = ref('');
const pdfQuestions = ref<ParsedQuestionItem[]>([]);
const pdfGroundedQuestions = ref<GroundedQuestionItem[]>([]);
const pdfWarnings = ref<string[]>([]);
const pdfDropzoneActive = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const aiExtractionMode = ref<'gemini' | 'local'>('gemini');
const lastExtractionSource = ref<'ai' | 'local'>('ai');

const approvedCount = computed(() => pdfGroundedQuestions.value.filter((q) => q.isApprovedByHuman).length);
const allApproved = computed(
  () => pdfGroundedQuestions.value.length > 0 && approvedCount.value === pdfGroundedQuestions.value.length
);

function approveAllQuestions() {
  pdfGroundedQuestions.value.forEach((q) => {
    q.isApprovedByHuman = true;
  });
}

function toggleApproval(idx: number) {
  const item = pdfGroundedQuestions.value[idx];
  if (item) {
    item.isApprovedByHuman = !item.isApprovedByHuman;
  }
}

function updateGroundedQuestion(idx: number, updated: GroundedQuestionItem) {
  pdfGroundedQuestions.value[idx] = updated;
}

function deleteGroundedQuestion(idx: number) {
  pdfGroundedQuestions.value.splice(idx, 1);
  totalQuestions.value = pdfGroundedQuestions.value.length;
}

async function handlePdfFile(file: File) {
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    errorMessage.value = "Iltimos, faqat .pdf formatidagi faylni yuklang!";
    return;
  }
  isPdfProcessing.value = true;
  errorMessage.value = null;
  pdfFileName.value = file.name;
  pdfFileSize.value = `${(file.size / 1024).toFixed(1)} KB`;
  pdfGroundedQuestions.value = [];
  pdfWarnings.value = [];

  try {
    const rawText = await extractTextFromPdf(file);
    let extracted: GroundedQuestionItem[] = [];

    // Mode 1: Sun'iy intellekt (Gemini 3.5 Flash Lite) with Strict Grounding
    // Uses profile key if provided by user, otherwise project built-in key
    if (aiExtractionMode.value === 'gemini') {
      const activeKey = getStoredGeminiApiKey();
      if (activeKey) {
        const aiRes = await extractGroundedQuestionsWithAi(rawText, {
          apiKey: activeKey,
          model: 'gemini-3.5-flash-lite',
          maxScore: Number(maxScore.value),
        });

        if (aiRes.success && aiRes.questions.length > 0) {
          extracted = aiRes.questions;
          lastExtractionSource.value = 'ai';
        } else if (aiRes.error) {
          pdfWarnings.value.push(`Sun'iy intellekt: ${aiRes.error}. Standart BSB algoritmi orqali savollar ajratildi.`);
        }
      }
    }

    // Mode 2: Local BSB deterministic parser (Fallback or direct)
    if (extracted.length === 0) {
      const localParsed = parseExamQuestionsFromText(rawText, {
        maxScore: Number(maxScore.value),
      });

      if (localParsed.success && localParsed.questions.length > 0) {
        extracted = localParsed.questions.map((q, idx) => ({
          id: `local-q-${q.number || idx + 1}`,
          number: q.number || idx + 1,
          title: `${q.number || idx + 1}-topshiriq`,
          prompt: q.prompt,
          taskType: (q.taskType || (q.options && q.options.length >= 2 ? 'multiple_choice' : 'subquestions')) as GroundedQuestionItem['taskType'],
          points: q.points,
          options: q.options,
          correctOptionId: q.correctOptionId,
          subQuestions: q.subQuestions?.map((s) => ({
            id: s.id,
            label: s.label,
            prompt: s.prompt,
            points: s.points,
            rubric: s.rubric,
          })),
          rubric: q.rubric,
          sourceExcerpt: q.sourceExcerpt || q.prompt,
          isApprovedByHuman: false,
        }));
        lastExtractionSource.value = 'local';
      }
    }

    if (extracted.length === 0) {
      errorMessage.value = "PDF fayldan topshiriqlar ajratib olinmadi. Iltimos, fayl matni to'liq ekanligini tekshiring.";
      pdfGroundedQuestions.value = [];
    } else {
      pdfGroundedQuestions.value = extracted;
      totalQuestions.value = extracted.length;
    }
  } catch (err: unknown) {
    const msg = (err as Error)?.message || "PDF faylni tahlil qilishda xatolik yuz berdi.";
    errorMessage.value = msg;
  } finally {
    isPdfProcessing.value = false;
  }
}

function onFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    handlePdfFile(file);
  }
}

function onDrop(event: DragEvent) {
  pdfDropzoneActive.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    handlePdfFile(file);
  }
}

function removePdf() {
  pdfFileName.value = '';
  pdfFileSize.value = '';
  pdfQuestions.value = [];
  pdfGroundedQuestions.value = [];
  pdfWarnings.value = [];
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}


interface ParsedQuestion {
  prompt: string;
  options: Array<{ id: string; label: string; text: string }>;
  correctOptionId: string;
  points: number;
}

const parsedQuestions = computed<ParsedQuestion[]>(() => {
  if (!customQuestionsText.value.trim()) return [];
  const raw = customQuestionsText.value.trim();
  const blocks = raw.split(/\n\s*(?=(?:\d+[\.\)]|[Qq]\d+[:\.\)]))/g);
  const questions: ParsedQuestion[] = [];
  const pts = Number((maxScore.value / Math.max(1, totalQuestions.value)).toFixed(1));

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const firstLine = lines[0] ?? '';
    const prompt = firstLine.replace(/^(\d+[\.\)]|[Qq]\d+[:\.\)])\s*/, '');
    const options: Array<{ id: string; label: string; text: string }> = [];
    let correctId = 'opt-a';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const optMatch = line.match(/^([A-Da-d])[\.\)]\s*(.*)$/);
      const ansMatch = line.match(/^(?:Javob|To'g'ri|Correct|Ans)[:\s]*([A-Da-d])/i);

      if (ansMatch && ansMatch[1]) {
        const letter = ansMatch[1].toLowerCase();
        correctId = `opt-${letter}`;
      } else if (optMatch && optMatch[1]) {
        const label = optMatch[1].toUpperCase();
        const id = `opt-${label.toLowerCase()}`;
        options.push({
          id,
          label,
          text: optMatch[2] || `Variant ${label}`,
        });
      }
    }

    if (options.length >= 2) {
      questions.push({
        prompt: prompt || 'Test topshirig\'i',
        options,
        correctOptionId: correctId,
        points: pts,
      });
    }
  }

  return questions;
});

function loadSampleQuestions() {
  customQuestionsText.value = `1. Axborotning eng kichik o'lchov birligi qaysi?
A) Bayt
B) Bit
C) Kilobayt
D) Megabayt
Javob: B

2. Quyidagilardan qaysi biri operatsion tizim hisoblanadi?
A) Linux
B) Python
C) Google Chrome
D) HTML
Javob: A

3. Kompyuterning tezkor asosiy xotirasi qanday ataladi?
A) HDD
B) RAM
C) CD-ROM
D) Flash
Javob: B`;
  totalQuestions.value = 3;
}

function applyBsbStandard(grade?: number) {
  const g = grade ?? Number(gradeLevel.value);
  gradeLevel.value = g;
  if (g <= 7) {
    maxScore.value = 25;
    totalQuestions.value = 5;
    durationMinutes.value = 40;
    title.value = `${subject.value}, ${g}-sinf. ${quarter.value}-BSB (Rasmiy 25 ball mezon)`;
  } else {
    maxScore.value = 50;
    totalQuestions.value = 5;
    durationMinutes.value = 40;
    title.value = `${subject.value}, ${g}-sinf. ${quarter.value}-BSB (Pedagogik Mahorat Markazi 50 ball mezon)`;
  }
}

function onGradeChange() {
  applyBsbStandard();
}

function loadOfficialBsbQuestions() {
  applyBsbStandard();
  const std = getBsbStandardByGrade(gradeLevel.value);
  let text = '';
  std.sampleQuestions.forEach((q) => {
    text += `${q.order}. ${q.blocks[0]?.type === 'paragraph' ? q.blocks[0].text : 'Topshiriq'} [${q.points} ball]\n`;
    if (q.subQuestions && q.subQuestions.length > 0) {
      q.subQuestions.forEach((sub) => {
        text += `  ${sub.label} ${sub.prompt} (${sub.points} ball)\n`;
      });
    }
    if (q.rubricCriteria && q.rubricCriteria.length > 0) {
      text += `  Baholash mezoni: ${q.rubricCriteria[0]?.guideline || ''}\n`;
    }
    text += '\n';
  });
  customQuestionsText.value = text.trim();
  totalQuestions.value = std.sampleQuestions.length;
  questionMode.value = 'custom';
}

function handleClose() {
  resetForm();
  emit('close');
}

useModalA11y(toRef(props, 'isOpen'), handleClose);

function autoGenerateTitle() {
  if (subject.value && gradeLevel.value && quarter.value) {
    title.value = `${subject.value}, ${gradeLevel.value}-sinf. ${quarter.value}-ChSB`;
  }
}

function handleSubmit() {
  errorMessage.value = null;

  if (title.value.trim().length < 3) {
    errorMessage.value = "Imtihon nomi kamida 3 ta belgidan iborat bo'lishi shart!";
    return;
  }
  if (!subject.value.trim()) {
    errorMessage.value = "Fan tanlanishi shart!";
    return;
  }
  if (durationMinutes.value < 10 || durationMinutes.value > 180) {
    errorMessage.value = "Imtihon davomiyligi 10 dan 180 daqiqagacha bo'lishi kerak!";
    return;
  }

  let finalQuestions: CreateAssessmentInput['questions'] | undefined = undefined;

  if (questionMode.value === 'pdf') {
    if (pdfGroundedQuestions.value.length === 0) {
      errorMessage.value = "PDF rejimida kamida bitta topshiriq aniqlangan bo'lishi shart!";
      activeTab.value = 'questions';
      return;
    }
    if (!allApproved.value) {
      errorMessage.value = `Inson nazorati talab etiladi: Barcha topshiriqlar (${pdfGroundedQuestions.value.length} tadan ${approvedCount.value} tasi tasdiqlangan) inson tomonidan ko'rib chiqilib tasdiqlanishi shart! ("Barchasini tasdiqlash" tugmasini bosing yoki har birini alohida tekshiring).`;
      activeTab.value = 'questions';
      return;
    }
    finalQuestions = pdfGroundedQuestions.value.map((q) => ({
      prompt: q.prompt,
      options: q.options || [],
      correctOptionId: q.correctOptionId || 'opt-a',
      points: q.points,
      taskType: q.taskType,
      subQuestions: q.subQuestions?.map((sub) => ({
        id: sub.id,
        label: sub.label,
        prompt: sub.prompt,
        points: sub.points,
        rubric: sub.rubric,
      })),
      rubric: q.rubric,
      sourceExcerpt: q.sourceExcerpt,
    }));
    totalQuestions.value = pdfGroundedQuestions.value.length;
  } else if (questionMode.value === 'custom') {
    if (parsedQuestions.value.length === 0) {
      errorMessage.value = "Maxsus savollar rejimida kamida bitta to'liq test savoli (savol matni va kamida 2 ta variant) kiritilishi shart!";
      activeTab.value = 'questions';
      return;
    }
    finalQuestions = parsedQuestions.value;
    totalQuestions.value = parsedQuestions.value.length;
  } else {
    if (totalQuestions.value < 1 || totalQuestions.value > 100) {
      errorMessage.value = "Savollar soni 1 dan 100 tagacha bo'lishi kerak!";
      return;
    }
  }

  isSubmitting.value = true;
  emit('create', {
    title: title.value.trim(),
    subject: subject.value.trim(),
    gradeLevel: Number(gradeLevel.value),
    quarter: Number(quarter.value),
    durationMinutes: Number(durationMinutes.value),
    totalQuestions: Number(totalQuestions.value),
    maxScore: Number(maxScore.value),
    questions: finalQuestions,
  });

  resetForm();
  emit('close');
}

function resetForm() {
  title.value = '';
  subject.value = availableSubjects.value[0] || 'Informatika va AT';
  gradeLevel.value = 9;
  quarter.value = 1;
  durationMinutes.value = 40;
  totalQuestions.value = 15;
  maxScore.value = 40;
  activeTab.value = 'params';
  questionMode.value = 'auto';
  customQuestionsText.value = '';
  pdfFileName.value = '';
  pdfFileSize.value = '';
  pdfQuestions.value = [];
  pdfGroundedQuestions.value = [];
  pdfWarnings.value = [];
  isPdfProcessing.value = false;
  lastExtractionSource.value = 'ai';
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
  errorMessage.value = null;
  isSubmitting.value = false;
}
</script>

<template>
  <div
    v-if="isOpen"
    role="dialog"
    aria-modal="true"
    aria-labelledby="create-assessment-modal-title"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans"
  >
    <div
      class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[92vh] overflow-y-auto"
    >
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
        <div>
          <h3 id="create-assessment-modal-title" class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <svg class="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Yangi Imtihon Qo'shish (CHSB)
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            O'qituvchilar va maktab ma'muriyati uchun yangi baholash testini yaratish
          </p>
        </div>

        <button
          type="button"
          @click="handleClose"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Tab Switcher -->
      <div class="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-700/60 rounded-xl text-xs font-semibold">
        <button
          type="button"
          @click="activeTab = 'params'"
          :class="[
            'flex-1 py-1.5 px-3 rounded-lg transition-all text-center',
            activeTab === 'params'
              ? 'bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          ]"
        >
          ⚙️ 1. Asosiy Parametrlar
        </button>
        <button
          type="button"
          @click="activeTab = 'questions'"
          :class="[
            'flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5',
            activeTab === 'questions'
              ? 'bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          ]"
        >
          <span>❓ 2. Test Savollari</span>
          <span
            v-if="questionMode === 'custom' && parsedQuestions.length > 0"
            class="px-1.5 py-0.2 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 text-[10px]"
          >
            {{ parsedQuestions.length }} ta
          </span>
        </button>
      </div>

      <div v-if="errorMessage" class="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-medium">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-3.5 text-xs">
        <!-- TAB 1: ASOSIY PARAMETRLAR -->
        <div v-show="activeTab === 'params'" class="space-y-3.5">
          <!-- Fan va Sinf -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Fan nomi *</label>
              <select
                v-model="subject"
                @change="autoGenerateTitle"
                class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium"
              >
                <option v-for="sub in availableSubjects" :key="sub" :value="sub">
                  {{ sub }}
                </option>
              </select>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="font-bold text-slate-700 dark:text-slate-300">Sinf darajasi *</label>
                <button
                  type="button"
                  @click="applyBsbStandard()"
                  class="text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer flex items-center gap-1"
                  title="Rasmiy Vazirlik mezonini avtomatik sozlash"
                >
                  <span>🏛️</span>
                  <span>BSB mezonini qo‘llash ({{ Number(gradeLevel) <= 7 ? '25 ball' : '50 ball' }})</span>
                </button>
              </div>
              <select
                v-model="gradeLevel"
                @change="onGradeChange"
                class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium"
              >
                <option v-for="g in [5, 6, 7, 8, 9, 10, 11]" :key="g" :value="g">
                  {{ g }}-sinf
                </option>
              </select>
            </div>
          </div>

          <!-- Chorak va Imtihon Nomi -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Chorak *</label>
              <select
                v-model="quarter"
                @change="autoGenerateTitle"
                class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium"
              >
                <option :value="1">1-Chorak</option>
                <option :value="2">2-Chorak</option>
                <option :value="3">3-Chorak</option>
                <option :value="4">4-Chorak</option>
              </select>
            </div>

            <div class="sm:col-span-2">
              <div class="flex items-center justify-between mb-1">
                <label class="font-bold text-slate-700 dark:text-slate-300">Imtihon sarlavhasi *</label>
                <button
                  type="button"
                  @click="autoGenerateTitle"
                  class="text-[11px] text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  Avto-shakllantirish
                </button>
              </div>
              <input
                v-model="title"
                type="text"
                placeholder="Masalan: Informatika va AT, 9-sinf. 1-ChSB"
                class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium"
              />
            </div>
          </div>

          <!-- Parametrlar: Davomiyligi, Savollar soni, Max ball -->
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Vaqt (daqiqa)</label>
              <input
                v-model="durationMinutes"
                type="number"
                min="10"
                max="180"
                class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium font-mono"
              />
            </div>

            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Savollar soni</label>
              <input
                v-model="totalQuestions"
                type="number"
                min="1"
                max="100"
                class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium font-mono"
              />
            </div>

            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Maksimal ball</label>
              <input
                v-model="maxScore"
                type="number"
                min="1"
                max="100"
                class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium font-mono"
              />
            </div>
          </div>
        </div>

        <!-- TAB 2: TEST SAVOLLARI -->
        <div v-show="activeTab === 'questions'" class="space-y-3.5">
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Savollar shakllantirish usuli:</label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                :class="[
                  'p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition',
                  questionMode === 'auto'
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-700 dark:text-slate-300'
                ]"
              >
                <input type="radio" value="auto" v-model="questionMode" class="mt-0.5 text-teal-600" />
                <div>
                  <span class="font-bold block text-xs">Standart Shablon</span>
                  <span class="text-[11px] text-slate-500 dark:text-slate-400">Avtomatik {{ totalQuestions }} ta test</span>
                </div>
              </label>

              <label
                :class="[
                  'p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition',
                  questionMode === 'custom'
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-700 dark:text-slate-300'
                ]"
              >
                <input type="radio" value="custom" v-model="questionMode" class="mt-0.5 text-teal-600" />
                <div>
                  <span class="font-bold block text-xs">Matn Orqali</span>
                  <span class="text-[11px] text-slate-500 dark:text-slate-400">Nusxalangan matn</span>
                </div>
              </label>

              <label
                :class="[
                  'p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition',
                  questionMode === 'pdf'
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-700 dark:text-slate-300'
                ]"
              >
                <input type="radio" value="pdf" v-model="questionMode" class="mt-0.5 text-teal-600" />
                <div>
                  <span class="font-bold block text-xs flex items-center gap-1">
                    <span>📄 PDF Yuklash</span>
                    <span class="px-1.5 py-0.2 bg-teal-600 text-white rounded text-[9px] font-mono">Yangi</span>
                  </span>
                  <span class="text-[11px] text-slate-500 dark:text-slate-400">PDF hujjatdan avto-tahlil</span>
                </div>
              </label>
            </div>
          </div>

          <!-- PDF UPLOAD & REVIEW MODE -->
          <div v-if="questionMode === 'pdf'" class="space-y-3">
            <input
              ref="fileInputRef"
              type="file"
              accept=".pdf,application/pdf"
              @change="onFileSelect"
              class="hidden"
            />

            <!-- Top AI Mode Selector -->
            <div class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 flex-wrap">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Tahlil usuli:</span>
              <button
                type="button"
                @click="aiExtractionMode = 'gemini'"
                :class="[
                  'px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer',
                  aiExtractionMode === 'gemini'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                ]"
              >
                <span>🤖 Sun'iy intellekt</span>
              </button>
              <button
                type="button"
                @click="aiExtractionMode = 'local'"
                :class="[
                  'px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer',
                  aiExtractionMode === 'local'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                ]"
              >
                <span>🧠 BSB algoritmi (Oflayn)</span>
              </button>
            </div>

            <!-- Drag & Drop Dropzone -->
            <div
              v-if="!pdfFileName"
              @dragover.prevent="pdfDropzoneActive = true"
              @dragleave.prevent="pdfDropzoneActive = false"
              @drop.prevent="onDrop"
              @click="fileInputRef?.click()"
              :class="[
                'border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2',
                pdfDropzoneActive
                  ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40'
                  : 'border-slate-300 dark:border-slate-600 hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-700/30'
              ]"
            >
              <div class="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-700 dark:text-teal-300 mb-1">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p class="font-bold text-sm text-slate-800 dark:text-slate-200">
                PDF test yoki BSB hujjatini bu yerga tashlang yoki tanlash uchun bosing
              </p>
              <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Pedagogik Mahorat Markazi BSB topshiriqlari (1-topshiriq, a, b, c, d bandlari, rubrikalar) va standart testlar qo'llab-quvvatlanadi
              </p>
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-800 text-white text-xs font-semibold mt-1">
                PDF faylni tanlash
              </span>
            </div>

            <!-- Processing Spinner -->
            <div v-else-if="isPdfProcessing" class="p-8 text-center bg-slate-50 dark:bg-slate-700/40 rounded-2xl border border-slate-200 dark:border-slate-600">
              <div class="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p class="text-xs font-bold text-slate-800 dark:text-slate-200">
                PDF fayl o'qilmoqda va topshiriqlar qat'iy nazorat (Strict Grounding) bilan tahlil qilinmoqda...
              </p>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{{ pdfFileName }}</p>
            </div>

            <!-- Parsed Questions Review & Control -->
            <div v-else class="space-y-3">
              <!-- Header with file info & reset -->
              <div class="flex items-center justify-between p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex-wrap gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-lg">📄</span>
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-xs font-bold text-teal-950 dark:text-teal-200 block truncate max-w-[200px] sm:max-w-xs">{{ pdfFileName }}</span>
                      <span
                        v-if="lastExtractionSource === 'ai'"
                        class="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 font-bold text-[10px]"
                      >
                        🤖 Sun'iy intellekt
                      </span>
                      <span
                        v-else
                        class="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold text-[10px]"
                      >
                        🧠 BSB algoritmi
                      </span>
                    </div>
                    <span class="text-[11px] text-teal-700 dark:text-teal-400 font-mono">
                      {{ pdfFileSize }} • <strong>{{ pdfGroundedQuestions.length }} ta topshiriq aniqlandi</strong>
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    @click="fileInputRef?.click()"
                    class="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 cursor-pointer"
                  >
                    Boshqa fayl
                  </button>
                  <button
                    type="button"
                    @click="removePdf"
                    class="text-xs px-2 py-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold cursor-pointer"
                  >
                    O'chirish
                  </button>
                </div>
              </div>

              <!-- Warnings Alert if any -->
              <div v-if="pdfWarnings.length > 0" class="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
                <span v-for="(warn, wIdx) in pdfWarnings" :key="wIdx" class="block">
                  ⚠️ {{ warn }}
                </span>
              </div>

              <!-- Human-in-the-Loop Approval Banner -->
              <div
                :class="[
                  'p-3 rounded-xl border flex items-center justify-between gap-2 flex-wrap transition',
                  allApproved
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                ]"
              >
                <div class="flex items-center gap-2">
                  <span class="text-base">{{ allApproved ? '✅' : '🛡️' }}</span>
                  <div>
                    <span
                      class="text-xs font-bold block"
                      :class="allApproved ? 'text-emerald-900 dark:text-emerald-200' : 'text-amber-900 dark:text-amber-200'"
                    >
                      Inson nazorati: {{ approvedCount }} / {{ pdfGroundedQuestions.length }} ta topshiriq tasdiqlandi
                    </span>
                    <span
                      class="text-[11px]"
                      :class="allApproved ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'"
                    >
                      {{ allApproved ? "Barcha topshiriqlar o'qituvchi tomonidan tekshirildi va tasdiqlandi" : "Savollarni ko'rib chiqing va har birini alohida tasdiqlang yoki barchasini birdan tasdiqlang" }}
                    </span>
                  </div>
                </div>

                <button
                  v-if="!allApproved"
                  type="button"
                  @click="approveAllQuestions"
                  class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>✓</span>
                  <span>Barchasini tasdiqlash</span>
                </button>
                <div v-else class="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <span>✓ Imtihonni saqlashga ruxsat berildi</span>
                </div>
              </div>

              <!-- Question Cards List -->
              <div class="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                <AiQuestionReviewCard
                  v-for="(q, qIdx) in pdfGroundedQuestions"
                  :key="q.id || qIdx"
                  :question="q"
                  :index="qIdx"
                  @update:question="updateGroundedQuestion(qIdx, $event)"
                  @delete="deleteGroundedQuestion(qIdx)"
                  @toggle-approval="toggleApproval(qIdx)"
                />
              </div>
            </div>
          </div>

          <!-- CUSTOM QUESTIONS TEXTAREA MODE -->
          <div v-else-if="questionMode === 'custom'" class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-700 dark:text-slate-300">
                Savollar matni (Aniqlangan: <strong class="text-teal-700 dark:text-teal-300">{{ parsedQuestions.length }} ta</strong>)
              </span>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="loadOfficialBsbQuestions"
                  class="text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>🏛️</span>
                  <span>Rasmiy BSB topshiriqlari ({{ gradeLevel }}-sinf)</span>
                </button>
                <button
                  type="button"
                  @click="loadSampleQuestions"
                  class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
                >
                  📋 Oddiy test namuna
                </button>
              </div>
            </div>

            <textarea
              v-model="customQuestionsText"
              rows="7"
              placeholder="1. Savol matni?&#10;A) Variant 1&#10;B) Variant 2&#10;C) Variant 3&#10;D) Variant 4&#10;Javob: A"
              class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs leading-relaxed"
            ></textarea>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">
              💡 Har bir savol raqam bilan boshlanishi (`1.`, `2.`), variantlar `A)`, `B)`, `C)`, `D)` shaklida va to'g'ri javob `Javob: B` deb ko'rsatilishi kerak.
            </p>
          </div>

          <div v-else class="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-teal-800 dark:text-teal-300 text-[11px] leading-relaxed">
            ℹ️ Avtomatik rejimda fan standarti bo'yicha Bloom taksonomiyasiga (Bilish, Qo'llash, Mulohaza) mos {{ totalQuestions }} ta test topshirig'i generatsiya qilinadi.
          </div>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            @click="handleClose"
            class="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold transition cursor-pointer min-h-[38px]"
          >
            Bekor qilish
          </button>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[38px]"
          >
            <span>Yangi Imtihonni Saqlash</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
