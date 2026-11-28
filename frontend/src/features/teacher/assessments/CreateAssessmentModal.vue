<script setup lang="ts">
import { ref, toRef, computed } from 'vue';
import { useModalA11y } from '../../../shared/composables/useModalA11y';
import { getActivePinia } from 'pinia';
import { useOrganizationStore } from '../../organization/store/organizationStore';
import type { CreateAssessmentInput } from '../../../entities/assessment/model';
import { getBsbStandardByGrade } from '../../../entities/assessment/officialBsbData';

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

interface BsbPdfTaskConfig {
  number: number;
  points: number;
  subCount: number;
}

const MAX_PDF_BYTES = 15 * 1024 * 1024;
const OMR_OPTIONS = ['A', 'B', 'C', 'D'] as const;
const SUB_LABELS = ['a', 'b', 'c', 'd', 'e', 'f'] as const;

const activeTab = ref<'params' | 'questions'>('params');
const title = ref('');
const subject = ref(availableSubjects.value[0] || 'Informatika va AT');
const gradeLevel = ref<number>(9);
const quarter = ref<number>(1);
const assessmentType = ref<'CHSB' | 'BSB' | 'PROJECT'>('CHSB');
const durationMinutes = ref<number>(40);
const totalQuestions = ref<number>(15);
const maxScore = ref<number>(40);
const targetGroup = ref<string>('all');
const errorMessage = ref<string | null>(null);
const isSubmitting = ref<boolean>(false);

// Question creation mode: Original Split-PDF mode is primary
const questionMode = ref<'pdf' | 'auto' | 'custom'>('pdf');
const customQuestionsText = ref('');

// Original PDF upload state (no client-side text extraction)
const selectedPdfFile = ref<File | null>(null);
const pdfFileName = ref('');
const pdfFileSize = ref('');
const pdfDropzoneActive = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

// Right-pane Answer Sheet state for CHSB (OMR answer key)
const chsbAnswerKeys = ref<Record<number, string>>({});
const answerKeyText = ref('');

function buildDefaultBsbTasks(count: number, totalMax: number): BsbPdfTaskConfig[] {
  const safeCount = Math.max(1, Math.min(20, count));
  const basePts = Math.floor((totalMax / safeCount) * 10) / 10;
  let remaining = Number(totalMax);
  const items: BsbPdfTaskConfig[] = [];
  for (let i = 1; i <= safeCount; i++) {
    const pts = i === safeCount ? Math.max(1, Math.round(remaining * 10) / 10) : Math.max(1, basePts);
    remaining = Math.max(0, Math.round((remaining - pts) * 10) / 10);
    items.push({ number: i, points: pts, subCount: 0 });
  }
  return items;
}

// Right-pane Answer Sheet tasks for BSB / PROJECT
const bsbPdfTasks = ref<BsbPdfTaskConfig[]>(buildDefaultBsbTasks(5, 50));

const chsbQuestionNumbers = computed(() => {
  const count = Math.max(1, Math.min(100, Number(totalQuestions.value) || 1));
  return Array.from({ length: count }, (_, i) => i + 1);
});

const bsbTotalPoints = computed(() =>
  Math.round(bsbPdfTasks.value.reduce((acc, t) => acc + (Number(t.points) || 0), 0) * 10) / 10
);

function syncAnswerKeyTextFromMap() {
  const count = Math.max(1, Math.min(100, Number(totalQuestions.value) || 1));
  const pairs: string[] = [];
  for (let i = 1; i <= count; i++) {
    const letter = chsbAnswerKeys.value[i];
    if (letter) {
      pairs.push(`${i}-${letter}`);
    }
  }
  answerKeyText.value = pairs.join(', ');
}

function setChsbQuestionKey(num: number, letter: string) {
  chsbAnswerKeys.value = { ...chsbAnswerKeys.value, [num]: letter.toUpperCase() };
  syncAnswerKeyTextFromMap();
}

function handleAnswerKeyTextInput(val: string) {
  answerKeyText.value = val;
  const parsed: Record<number, string> = {};
  const pairRegex = /(\d+)\s*[-:.)]?\s*([A-Da-d])/g;
  let match: RegExpExecArray | null = pairRegex.exec(val);
  let foundPairs = false;
  while (match !== null) {
    foundPairs = true;
    const num = Number(match[1]);
    const letter = match[2]?.toUpperCase();
    if (num >= 1 && num <= 100 && letter) {
      parsed[num] = letter;
    }
    match = pairRegex.exec(val);
  }
  if (!foundPairs) {
    const letters = val.match(/\b([A-Da-d])\b/g) || [];
    letters.forEach((letter, idx) => {
      parsed[idx + 1] = letter.toUpperCase();
    });
  }
  chsbAnswerKeys.value = parsed;
}

function fillDefaultAnswerKeys(letter: string = 'A') {
  const count = Math.max(1, Math.min(100, Number(totalQuestions.value) || 1));
  const next: Record<number, string> = {};
  for (let i = 1; i <= count; i++) {
    next[i] = letter;
  }
  chsbAnswerKeys.value = next;
  syncAnswerKeyTextFromMap();
}

function addBsbTaskRow() {
  const nextNum = bsbPdfTasks.value.length + 1;
  bsbPdfTasks.value.push({ number: nextNum, points: 5, subCount: 0 });
  totalQuestions.value = bsbPdfTasks.value.length;
}

function removeBsbTaskRow(idx: number) {
  if (bsbPdfTasks.value.length <= 1) return;
  bsbPdfTasks.value.splice(idx, 1);
  bsbPdfTasks.value.forEach((t, i) => {
    t.number = i + 1;
  });
  totalQuestions.value = bsbPdfTasks.value.length;
}

function loadOfficialBsbSheet() {
  applyBsbStandard();
  const std = getBsbStandardByGrade(gradeLevel.value);
  bsbPdfTasks.value = std.sampleQuestions.map((q, idx) => ({
    number: q.order || idx + 1,
    points: q.points,
    subCount: q.subQuestions ? q.subQuestions.length : 0,
  }));
  totalQuestions.value = bsbPdfTasks.value.length;
}

function handlePdfFile(file: File) {
  if (!file) return;
  const isPdfExt = file.name.toLowerCase().endsWith('.pdf');
  const isPdfMime = file.type === 'application/pdf';
  if (!isPdfExt && !isPdfMime) {
    errorMessage.value = "Iltimos, faqat .pdf formatidagi faylni yuklang!";
    return;
  }
  if (file.size > MAX_PDF_BYTES) {
    errorMessage.value = "PDF fayl hajmi 15 MB dan oshmasligi kerak!";
    return;
  }
  errorMessage.value = null;
  selectedPdfFile.value = file;
  pdfFileName.value = file.name;
  pdfFileSize.value = file.size >= 1024 * 1024
    ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    : `${Math.max(1, Math.round(file.size / 1024))} KB`;
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
  selectedPdfFile.value = null;
  pdfFileName.value = '';
  pdfFileSize.value = '';
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
  const blocks = raw.split(/\n\s*(?=(?:\d+[.)]|[Qq]\d+[:.)]))/g);
  const questions: ParsedQuestion[] = [];
  const pts = Number((maxScore.value / Math.max(1, totalQuestions.value)).toFixed(1));

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const firstLine = lines[0] ?? '';
    const prompt = firstLine.replace(/^(\d+[.)]|[Qq]\d+[:.)])\s*/, '');
    const options: Array<{ id: string; label: string; text: string }> = [];
    let correctId = 'opt-a';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const optMatch = line.match(/^([A-Da-d])[.)]\s*(.*)$/);
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
  assessmentType.value = 'BSB';
  const g = grade ?? Number(gradeLevel.value);
  gradeLevel.value = g;
  const std = getBsbStandardByGrade(g);
  const nextMax = g <= 7 ? 25 : 50;
  maxScore.value = nextMax;
  totalQuestions.value = std.sampleQuestions.length || 5;
  bsbPdfTasks.value = std.sampleQuestions.map((q, idx) => ({
    number: q.order || idx + 1,
    points: q.points,
    subCount: q.subQuestions ? q.subQuestions.length : 0,
  }));
  durationMinutes.value = 40;
  title.value = `${subject.value}, ${g}-sinf. ${quarter.value}-BSB (Rasmiy ${maxScore.value} ball mezon)`;
}

function onAssessmentTypeChange() {
  if (assessmentType.value === 'BSB' || assessmentType.value === 'PROJECT') {
    const g = Number(gradeLevel.value);
    const nextMax = g <= 7 ? 25 : 50;
    maxScore.value = nextMax;
    const std = getBsbStandardByGrade(g);
    totalQuestions.value = std.sampleQuestions.length || 5;
    bsbPdfTasks.value = std.sampleQuestions.length
      ? std.sampleQuestions.map((q, idx) => ({
          number: q.order || idx + 1,
          points: q.points,
          subCount: q.subQuestions ? q.subQuestions.length : 0,
        }))
      : buildDefaultBsbTasks(totalQuestions.value, nextMax);
  } else {
    maxScore.value = 40;
    totalQuestions.value = 15;
  }
  autoGenerateTitle();
}

function onGradeChange() {
  if (assessmentType.value === 'BSB' || assessmentType.value === 'PROJECT') {
    applyBsbStandard();
  } else {
    autoGenerateTitle();
  }
}

function handleClose() {
  resetForm();
  emit('close');
}

useModalA11y(toRef(props, 'isOpen'), handleClose);

function autoGenerateTitle() {
  if (subject.value && gradeLevel.value && quarter.value) {
    const label =
      assessmentType.value === 'BSB'
        ? `${quarter.value}-BSB`
        : assessmentType.value === 'PROJECT'
          ? `${quarter.value}-chorak Loyiha ishi`
          : `${quarter.value}-ChSB`;
    title.value = `${subject.value}, ${gradeLevel.value}-sinf. ${label}`;
  }
}

function buildBsbQuestionsPayload(): CreateAssessmentInput['questions'] {
  return bsbPdfTasks.value.map((task) => {
    const hasSubs = task.subCount > 0;
    const subCount = Math.min(SUB_LABELS.length, Math.max(0, task.subCount));
    const perSub = hasSubs ? Math.round((Number(task.points) / subCount) * 10) / 10 : 0;
    const subQuestions = hasSubs
      ? SUB_LABELS.slice(0, subCount).map((lbl, idx) => ({
          id: `q${task.number}-${lbl}`,
          label: `${lbl})`,
          prompt: `Asl PDF hujjatdagi ${task.number}-topshiriq ${lbl}) bandi javobi`,
          points: idx === subCount - 1
            ? Math.max(0.5, Math.round((Number(task.points) - perSub * (subCount - 1)) * 10) / 10)
            : perSub,
        }))
      : undefined;

    return {
      prompt: `${task.number}-topshiriq (Chap tomondagi asl PDF hujjatga qarang)`,
      options: [],
      points: Number(task.points) || 5,
      taskType: hasSubs ? 'subquestions' : 'open_text',
      subQuestions,
    };
  });
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
  let finalAnswerKey: string | undefined = undefined;
  let finalPdfFile: File | undefined = undefined;

  if (questionMode.value === 'pdf') {
    if (!selectedPdfFile.value) {
      errorMessage.value = "Asl PDF rejimida imtihon PDF fayli yuklanishi shart!";
      activeTab.value = 'questions';
      return;
    }
    finalPdfFile = selectedPdfFile.value;

    if (assessmentType.value === 'CHSB') {
      if (totalQuestions.value < 1 || totalQuestions.value > 100) {
        errorMessage.value = "Savollar soni 1 dan 100 tagacha bo'lishi kerak!";
        return;
      }
      const pairs: string[] = [];
      for (let i = 1; i <= Number(totalQuestions.value); i++) {
        pairs.push(`${i}-${chsbAnswerKeys.value[i] || 'A'}`);
      }
      finalAnswerKey = pairs.join(', ');
    } else {
      if (bsbPdfTasks.value.length === 0) {
        errorMessage.value = "BSB / Loyiha javob varaqasida kamida bitta topshiriq bo'lishi shart!";
        activeTab.value = 'questions';
        return;
      }
      finalQuestions = buildBsbQuestionsPayload();
      totalQuestions.value = finalQuestions.length;
    }
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
    assessmentType: assessmentType.value,
    gradeLevel: Number(gradeLevel.value),
    quarter: Number(quarter.value),
    durationMinutes: Number(durationMinutes.value),
    totalQuestions: Number(totalQuestions.value),
    maxScore: Number(maxScore.value),
    targetGroup: targetGroup.value,
    answerKey: finalAnswerKey,
    pdfFile: finalPdfFile,
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
  assessmentType.value = 'CHSB';
  durationMinutes.value = 40;
  totalQuestions.value = 15;
  maxScore.value = 40;
  targetGroup.value = 'all';
  activeTab.value = 'params';
  questionMode.value = 'pdf';
  customQuestionsText.value = '';
  chsbAnswerKeys.value = {};
  answerKeyText.value = '';
  bsbPdfTasks.value = buildDefaultBsbTasks(5, 50);
  removePdf();
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
      class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[92vh] overflow-y-auto"
    >
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
        <div>
          <h3 id="create-assessment-modal-title" class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <svg class="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Yangi Imtihon Qo'shish ({{ assessmentType }})
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            O'qituvchilar uchun asl PDF yoki raqamli baholash topshirig'ini yaratish
          </p>
        </div>

        <button
          type="button"
          @click="handleClose"
          aria-label="Modalni yopish"
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
            'flex-1 py-1.5 px-3 rounded-lg transition-all text-center cursor-pointer',
            activeTab === 'params'
              ? 'bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          ]"
        >
          ⚙️ 1. Asosiy Parametrlar
        </button>
        <button
          type="button"
          @click="activeTab = 'questions'"
          :class="[
            'flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer',
            activeTab === 'questions'
              ? 'bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          ]"
        >
          <span>📄 2. PDF va Javoblar Varaqasi</span>
          <span
            v-if="questionMode === 'pdf' && selectedPdfFile"
            class="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px]"
          >
            PDF biriktirildi
          </span>
          <span
            v-else-if="questionMode === 'custom' && parsedQuestions.length > 0"
            class="px-1.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 text-[10px]"
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

          <!-- Baholash turi, Chorak va Imtihon Nomi -->
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Baholash turi *</label>
              <select
                v-model="assessmentType"
                @change="onAssessmentTypeChange"
                class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="CHSB">ChSB (40 ball)</option>
                <option value="BSB">BSB (25/50 ball)</option>
                <option value="PROJECT">Loyiha ishi</option>
              </select>
            </div>

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

          <!-- Mo'ljallangan Guruh -->
          <div class="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <div class="flex items-center justify-between mb-1.5">
              <label class="font-bold text-slate-700 dark:text-slate-300 text-xs">
                Mo'ljallangan Guruh (Guruhga bo'lingan fanlar uchun):
              </label>
              <span class="text-[11px] text-slate-500 dark:text-slate-400">Informatika, Chet tili, Texnologiya</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <label
                :class="[
                  'flex items-center justify-center p-2 rounded-lg border text-xs font-semibold cursor-pointer transition',
                  targetGroup === 'all'
                    ? 'border-teal-700 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                ]"
              >
                <input type="radio" value="all" v-model="targetGroup" class="sr-only" />
                <span>Butun sinf (Barchasi)</span>
              </label>

              <label
                :class="[
                  'flex items-center justify-center p-2 rounded-lg border text-xs font-semibold cursor-pointer transition',
                  targetGroup === '1-guruh'
                    ? 'border-teal-700 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                ]"
              >
                <input type="radio" value="1-guruh" v-model="targetGroup" class="sr-only" />
                <span>1-guruh</span>
              </label>

              <label
                :class="[
                  'flex items-center justify-center p-2 rounded-lg border text-xs font-semibold cursor-pointer transition',
                  targetGroup === '2-guruh'
                    ? 'border-teal-700 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                ]"
              >
                <input type="radio" value="2-guruh" v-model="targetGroup" class="sr-only" />
                <span>2-guruh</span>
              </label>
            </div>
          </div>

          <!-- Parametrlar: Davomiyligi, Savollar soni, Max ball -->
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Vaqt (daqiqa)</label>
              <input
                v-model.number="durationMinutes"
                type="number"
                min="10"
                max="180"
                class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium font-mono"
              />
            </div>

            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Savollar / topshiriqlar</label>
              <input
                v-model.number="totalQuestions"
                type="number"
                min="1"
                max="100"
                class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium font-mono"
              />
            </div>

            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Maksimal ball</label>
              <input
                v-model.number="maxScore"
                type="number"
                min="1"
                max="100"
                class="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium font-mono"
              />
            </div>
          </div>

          <div class="flex justify-end">
            <button
              type="button"
              @click="activeTab = 'questions'"
              class="px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-bold text-xs hover:bg-teal-100 dark:hover:bg-teal-900/60 transition cursor-pointer"
            >
              2-qadam: Asl PDF faylni biriktirish →
            </button>
          </div>
        </div>

        <!-- TAB 2: PDF VA JAVOBLAR VARAQASI -->
        <div v-show="activeTab === 'questions'" class="space-y-3.5">
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Imtihon shakli:</label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                :class="[
                  'p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition',
                  questionMode === 'pdf'
                    ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-teal-950 dark:text-teal-100 shadow-xs ring-1 ring-teal-600/30'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-700 dark:text-slate-300'
                ]"
              >
                <input type="radio" value="pdf" v-model="questionMode" class="mt-0.5 text-teal-600" />
                <div>
                  <span class="font-bold block text-xs flex items-center gap-1">
                    <span>📄 Asl PDF</span>
                    <span class="px-1.5 py-0.2 bg-teal-700 text-white rounded text-[9px] font-mono">Asosiy</span>
                  </span>
                  <span class="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                    Chapda PDF + O'ngda Javoblar varaqasi
                  </span>
                </div>
              </label>

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
            </div>
          </div>

          <!-- PRIMARY MODE: ORIGINAL PDF + RIGHT ANSWER SHEET -->
          <div v-if="questionMode === 'pdf'" class="space-y-3.5">
            <input
              ref="fileInputRef"
              type="file"
              accept=".pdf,application/pdf"
              @change="onFileSelect"
              class="hidden"
            />

            <!-- Info Banner -->
            <div class="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-[11px] leading-relaxed">
              <strong>Asl PDF rejimi:</strong> Yuklangan PDF fayl matnga ajratilmaydi va o'zgartirilmaydi — o'quvchi ekranining
              <strong>chap tomonida asl holicha</strong> ko'rsatiladi (rasm, jadval, chizma va formulalari bilan).
              <strong>O'ng tomonda</strong> esa javoblar varaqasi chiqadi.
            </div>

            <!-- PDF Dropzone / Attached File Card -->
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
              <div class="w-11 h-11 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-700 dark:text-teal-300">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p class="font-bold text-sm text-slate-800 dark:text-slate-200">
                Asl CHSB / BSB PDF hujjatini bu yerga tashlang yoki tanlang
              </p>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">
                Faqat .pdf formati (maksimal 15 MB) • Ma'lumotlar bazasida xavfsiz saqlanadi
              </p>
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-800 text-white text-xs font-semibold mt-1">
                PDF faylni tanlash
              </span>
            </div>

            <div
              v-else
              class="flex items-center justify-between p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex-wrap gap-2"
            >
              <div class="flex items-center gap-2.5">
                <span class="text-lg">📄</span>
                <div>
                  <span class="text-xs font-bold text-emerald-950 dark:text-emerald-200 block truncate max-w-[240px] sm:max-w-xs">
                    {{ pdfFileName }}
                  </span>
                  <span class="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                    {{ pdfFileSize }} • Asl ko'rinishda saqlashga tayyor
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  @click="fileInputRef?.click()"
                  class="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Almashtirish
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

            <!-- Answer Sheet Configurator: CHSB OMR Key vs BSB Written Tasks -->
            <div v-if="assessmentType === 'CHSB'" class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 space-y-3">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 class="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    O'ng panel: CHSB Javoblar kaliti ({{ totalQuestions }} ta savol)
                  </h4>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400">
                    Avtomatik tekshirish uchun har bir test savolining to'g'ri javobini (A/B/C/D) belgilang
                  </p>
                </div>
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    @click="fillDefaultAnswerKeys('A')"
                    class="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                  >
                    Hammasini A
                  </button>
                </div>
              </div>

              <div>
                <input
                  :value="answerKeyText"
                  @input="handleAnswerKeyTextInput(($event.target as HTMLInputElement).value)"
                  type="text"
                  placeholder="Tezkor kiritish: 1-A, 2-B, 3-C, 4-D..."
                  aria-label="CHSB javoblar kaliti matni"
                  class="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs"
                />
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                <div
                  v-for="qNum in chsbQuestionNumbers"
                  :key="qNum"
                  class="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <span class="font-mono font-bold text-slate-700 dark:text-slate-300 w-7">{{ qNum }}.</span>
                  <div class="flex items-center gap-1">
                    <button
                      v-for="letter in OMR_OPTIONS"
                      :key="letter"
                      type="button"
                      @click="setChsbQuestionKey(qNum, letter)"
                      :class="[
                        'w-6 h-6 rounded text-[11px] font-bold transition cursor-pointer',
                        (chsbAnswerKeys[qNum] || 'A') === letter
                          ? 'bg-teal-700 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      ]"
                    >
                      {{ letter }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- BSB / PROJECT Answer Sheet Builder -->
            <div v-else class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 space-y-3">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 class="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    O'ng panel: {{ assessmentType }} Topshiriqlar varaqasi ({{ bsbPdfTasks.length }} ta topshiriq • {{ bsbTotalPoints }} ball)
                  </h4>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400">
                    PDF dagi har bir topshiriq uchun yozma javob katakchalari (va a, b, c, d bandlari) sonini sozlang
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    @click="loadOfficialBsbSheet"
                    class="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-[11px] font-bold cursor-pointer hover:bg-teal-100"
                  >
                    🏛️ {{ gradeLevel }}-sinf standarti
                  </button>
                  <button
                    type="button"
                    @click="addBsbTaskRow"
                    class="px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold cursor-pointer"
                  >
                    + Topshiriq
                  </button>
                </div>
              </div>

              <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
                <div
                  v-for="(task, tIdx) in bsbPdfTasks"
                  :key="task.number"
                  class="grid grid-cols-12 items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <span class="col-span-4 font-bold text-slate-800 dark:text-slate-200">
                    {{ task.number }}-topshiriq
                  </span>
                  <div class="col-span-3 flex items-center gap-1">
                    <input
                      v-model.number="task.points"
                      type="number"
                      min="1"
                      max="50"
                      step="0.5"
                      :aria-label="`${task.number}-topshiriq balli`"
                      class="w-full p-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs"
                    />
                    <span class="text-[11px] text-slate-400">b</span>
                  </div>
                  <div class="col-span-4">
                    <select
                      v-model.number="task.subCount"
                      :aria-label="`${task.number}-topshiriq bandlari`"
                      class="w-full p-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px]"
                    >
                      <option :value="0">Ochiq javob</option>
                      <option :value="2">2 band (a, b)</option>
                      <option :value="3">3 band (a, b, c)</option>
                      <option :value="4">4 band (a, b, c, d)</option>
                      <option :value="5">5 band (a..e)</option>
                    </select>
                  </div>
                  <div class="col-span-1 text-right">
                    <button
                      type="button"
                      @click="removeBsbTaskRow(tIdx)"
                      :disabled="bsbPdfTasks.length <= 1"
                      title="O'chirish"
                      class="text-rose-500 hover:text-rose-700 disabled:opacity-30 font-bold cursor-pointer px-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- CUSTOM QUESTIONS TEXTAREA MODE -->
          <div v-else-if="questionMode === 'custom'" class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-700 dark:text-slate-300">
                Savollar matni (Aniqlangan: <strong class="text-teal-700 dark:text-teal-300">{{ parsedQuestions.length }} ta</strong>)
              </span>
              <button
                type="button"
                @click="loadSampleQuestions"
                class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
              >
                📋 Oddiy test namuna
              </button>
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
