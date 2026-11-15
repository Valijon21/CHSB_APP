<script setup lang="ts">
import { ref, toRef } from 'vue';
import { useModalA11y } from '../../../shared/composables/useModalA11y';
import {
  SubjectInputSchema,
  type SubjectInput,
} from '../../../entities/organization/model';

const props = defineProps<{
  isOpen: boolean;
  tenantSlug: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'create', input: SubjectInput): void;
}>();

useModalA11y(toRef(props, 'isOpen'), handleClose);

const name = ref('');
const code = ref('');
const description = ref('');
const selectedGrades = ref<number[]>([5, 6, 7, 8, 9, 10, 11]);
const isActive = ref(true);
const errorMessage = ref<string | null>(null);
const isSubmitting = ref(false);

const AVAILABLE_GRADES = [5, 6, 7, 8, 9, 10, 11];

function toggleGrade(grade: number) {
  if (selectedGrades.value.includes(grade)) {
    if (selectedGrades.value.length > 1) {
      selectedGrades.value = selectedGrades.value.filter((g) => g !== grade);
    }
  } else {
    selectedGrades.value.push(grade);
    selectedGrades.value.sort((a, b) => a - b);
  }
}

function selectAllGrades() {
  selectedGrades.value = [...AVAILABLE_GRADES];
}

function resetForm() {
  name.value = '';
  code.value = '';
  description.value = '';
  selectedGrades.value = [5, 6, 7, 8, 9, 10, 11];
  isActive.value = true;
  errorMessage.value = null;
  isSubmitting.value = false;
}

function handleClose() {
  resetForm();
  emit('close');
}

async function handleSubmit() {
  errorMessage.value = null;

  if (selectedGrades.value.length === 0) {
    errorMessage.value = "Kamida bitta sinf tanlanishi shart.";
    return;
  }

  const rawInput = {
    tenantSlug: props.tenantSlug,
    name: name.value.trim(),
    code: code.value.trim().toUpperCase(),
    gradeLevels: selectedGrades.value.join(','),
    description: description.value.trim() || undefined,
    isActive: isActive.value,
  };

  const parseResult = SubjectInputSchema.safeParse(rawInput);
  if (!parseResult.success) {
    errorMessage.value = parseResult.error.errors[0]?.message || "Ma'lumotlar to'liq kiritilmadi.";
    return;
  }

  try {
    isSubmitting.value = true;
    emit('create', parseResult.data);
    handleClose();
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : "Fan qo'shishda xatolik yuz berdi.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
    role="dialog"
    aria-modal="true"
    aria-labelledby="subject-modal-title"
  >
    <div
      class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden transition-all text-slate-800 dark:text-slate-100"
    >
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
        <div>
          <h3 id="subject-modal-title" class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>📚</span>
            <span>Yangi Fan Qo'shish</span>
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Muassasa o'quv dasturi va CHSB imtihonlari uchun yangi fan kiritish
          </p>
        </div>
        <button
          type="button"
          @click="handleClose"
          aria-label="Modalni yopish"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Modal Body Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <!-- Error Alert -->
        <div
          v-if="errorMessage"
          class="p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/60 flex items-center gap-2"
          role="alert"
        >
          <span>⚠️</span>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Fan Nomi -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Fan Nomi <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="name"
            type="text"
            required
            placeholder="Masalan: Robototexnika va Sun'iy Intellekt"
            class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
          />
        </div>

        <!-- Fan Kodi -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Fan Kodi (Identifikator) <span class="text-rose-500">*</span>
          </label>
          <div class="relative">
            <input
              v-model="code"
              type="text"
              required
              placeholder="Masalan: ROBOT yoki AI_AT"
              class="w-full px-3.5 py-2 text-xs font-mono uppercase rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />
          </div>
          <span class="text-[11px] text-slate-400 mt-1 block">
            Faqat lotin harflari va raqamlar (tizimda takrorlanmasligi kerak).
          </span>
        </div>

        <!-- Qamrab olingan sinflar -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              O'qitiladigan Sinflar <span class="text-rose-500">*</span>
            </label>
            <button
              type="button"
              @click="selectAllGrades"
              class="text-[11px] text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
            >
              Barcha sinflarni tanlash (5-11)
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="grade in AVAILABLE_GRADES"
              :key="grade"
              type="button"
              @click="toggleGrade(grade)"
              class="px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border"
              :class="
                selectedGrades.includes(grade)
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-teal-400'
              "
            >
              {{ grade }}-sinf
            </button>
          </div>
        </div>

        <!-- Tavsif / Izoh -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Qisqacha Tavsif (Ixtiyoriy)
          </label>
          <textarea
            v-model="description"
            rows="2"
            placeholder="Fan yo'nalishi, laboratoriya talablari yoki izohlar..."
            class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition resize-none"
          ></textarea>
        </div>

        <!-- Holat (Faol) -->
        <div class="flex items-center gap-2 pt-1">
          <input
            id="subject-is-active"
            v-model="isActive"
            type="checkbox"
            class="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500 cursor-pointer"
          />
          <label for="subject-is-active" class="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            Fanni zudlik bilan faollashtirish (O'qituvchilar va imtihonlarda ko'rinadi)
          </label>
        </div>

        <!-- Modal Footer Actions -->
        <div class="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            @click="handleClose"
            class="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>Qo'shish</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
