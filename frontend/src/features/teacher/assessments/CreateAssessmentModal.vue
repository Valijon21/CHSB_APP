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

const title = ref('');
const subject = ref(availableSubjects.value[0] || 'Informatika va AT');
const gradeLevel = ref<number>(9);
const quarter = ref<number>(1);
const durationMinutes = ref<number>(40);
const totalQuestions = ref<number>(15);
const maxScore = ref<number>(40);
const errorMessage = ref<string | null>(null);
const isSubmitting = ref<boolean>(false);

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
  if (totalQuestions.value < 1 || totalQuestions.value > 100) {
    errorMessage.value = "Savollar soni 1 dan 100 tagacha bo'lishi kerak!";
    return;
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
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
  >
    <div
      class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
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
            O'qituvchilar va ma'muriyat uchun yangi baholash testini yaratish
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

      <div v-if="errorMessage" class="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-medium">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-3.5 text-xs">
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

        <div class="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-teal-800 dark:text-teal-300 text-[11px] leading-relaxed">
          ℹ️ Yangi imtihon saqlanganda, u avtomatik ravishda barcha sinflar va o'quvchilar uchun mavjud bo'ladi hamda test savollari shabloni shakllantiriladi.
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
