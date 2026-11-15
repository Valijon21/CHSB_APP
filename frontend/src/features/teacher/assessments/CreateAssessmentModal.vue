<script setup lang="ts">
import { ref, toRef, computed } from 'vue';
import { useModalA11y } from '../../../shared/composables/useModalA11y';
import { useOrganizationStore } from '../../organization/store/organizationStore';
import { getActivePinia } from 'pinia';
import type { CreateAssessmentInput } from '../../../entities/assessment/model';

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
const questionMode = ref<'auto' | 'custom'>('auto');
const customQuestionsText = ref('');

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

  let finalQuestions: ParsedQuestion[] | undefined = undefined;

  if (questionMode.value === 'custom') {
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
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sinf darajasi *</label>
              <select
                v-model="gradeLevel"
                @change="autoGenerateTitle"
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
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                :class="[
                  'p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition',
                  questionMode === 'auto'
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-700 dark:text-slate-300'
                ]"
              >
                <input type="radio" value="auto" v-model="questionMode" class="mt-0.5 text-teal-600" />
                <div>
                  <span class="font-bold block">Avtomatik Standart Shablon</span>
                  <span class="text-[11px] text-slate-500 dark:text-slate-400">Tizim belgilangan {{ totalQuestions }} ta savol va 4 ta variantni avtomatik tuzadi</span>
                </div>
              </label>

              <label
                :class="[
                  'p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition',
                  questionMode === 'custom'
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-700 dark:text-slate-300'
                ]"
              >
                <input type="radio" value="custom" v-model="questionMode" class="mt-0.5 text-teal-600" />
                <div>
                  <span class="font-bold block">O'qituvchi Test Savollari</span>
                  <span class="text-[11px] text-slate-500 dark:text-slate-400">Savollar, variantlar va to'g'ri javoblarni matn orqali kiritish</span>
                </div>
              </label>
            </div>
          </div>

          <div v-if="questionMode === 'custom'" class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-700 dark:text-slate-300">
                Savollar matni (Aniqlangan: <strong class="text-teal-700 dark:text-teal-300">{{ parsedQuestions.length }} ta</strong>)
              </span>
              <button
                type="button"
                @click="loadSampleQuestions"
                class="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
              >
                📋 Namunaviy savollarni kiritish
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
