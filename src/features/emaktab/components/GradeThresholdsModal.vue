<script setup lang="ts">
import { ref, watch } from 'vue';
import type { GradeScaleThresholds } from '../../../entities/emaktab/model';
import { DEFAULT_GRADE_THRESHOLDS } from '../../../entities/emaktab/model';

const props = defineProps<{
  isOpen: boolean;
  thresholds: GradeScaleThresholds;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', newThresholds: GradeScaleThresholds): void;
}>();

const form = ref<GradeScaleThresholds>({ ...props.thresholds });
const errorMessage = ref<string | null>(null);

watch(
  () => props.thresholds,
  (val) => {
    form.value = { ...val };
  },
  { deep: true }
);

function handleSave() {
  errorMessage.value = null;

  if (
    form.value.grade5Min <= form.value.grade4Min ||
    form.value.grade4Min <= form.value.grade3Min ||
    form.value.grade3Min <= form.value.grade2Max
  ) {
    errorMessage.value =
      "Mezonlar qat'iy kamayish tartibida bo'lishi kerak: 5-baho > 4-baho > 3-baho > 2-baho!";
    return;
  }

  emit('save', { ...form.value });
  emit('close');
}

function handleReset() {
  form.value = { ...DEFAULT_GRADE_THRESHOLDS };
  errorMessage.value = null;
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
  >
    <div
      class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 shadow-xl space-y-4"
    >
      <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
        <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <svg class="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          5 Ballik Baholash Mezonlarini Moslash
        </h3>
        <button
          type="button"
          @click="$emit('close')"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p class="text-xs text-slate-500 dark:text-slate-400">
        Vazirlik mezonlari bo'yicha foiz chegaralari (CHSB natijasi ushbu shkala asosida 5, 4, 3, 2 ga aylanadi).
      </p>

      <div v-if="errorMessage" class="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
        {{ errorMessage }}
      </div>

      <div class="space-y-3">
        <!-- 5-baho -->
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-sm flex items-center justify-center">5</span>
            <span class="text-xs font-bold text-slate-800 dark:text-slate-200">A'lo (5 baho)</span>
          </div>
          <div class="flex items-center gap-1.5 text-xs font-mono">
            <span>&ge;</span>
            <input
              v-model.number="form.grade5Min"
              type="number"
              min="0"
              max="100"
              class="w-16 p-1 text-center font-bold border rounded-md dark:bg-slate-700 dark:border-slate-600"
            />
            <span>%</span>
          </div>
        </div>

        <!-- 4-baho -->
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-800/40">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg bg-teal-600 text-white font-black text-sm flex items-center justify-center">4</span>
            <span class="text-xs font-bold text-slate-800 dark:text-slate-200">Yaxshi (4 baho)</span>
          </div>
          <div class="flex items-center gap-1.5 text-xs font-mono">
            <span>&ge;</span>
            <input
              v-model.number="form.grade4Min"
              type="number"
              min="0"
              max="100"
              class="w-16 p-1 text-center font-bold border rounded-md dark:bg-slate-700 dark:border-slate-600"
            />
            <span>%</span>
          </div>
        </div>

        <!-- 3-baho -->
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/40">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg bg-amber-500 text-white font-black text-sm flex items-center justify-center">3</span>
            <span class="text-xs font-bold text-slate-800 dark:text-slate-200">Qoniqarli (3 baho)</span>
          </div>
          <div class="flex items-center gap-1.5 text-xs font-mono">
            <span>&ge;</span>
            <input
              v-model.number="form.grade3Min"
              type="number"
              min="0"
              max="100"
              class="w-16 p-1 text-center font-bold border rounded-md dark:bg-slate-700 dark:border-slate-600"
            />
            <span>%</span>
          </div>
        </div>

        <!-- 2-baho -->
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-800/40">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg bg-rose-500 text-white font-black text-sm flex items-center justify-center">2</span>
            <span class="text-xs font-bold text-slate-800 dark:text-slate-200">Qoniqarsiz (2 baho)</span>
          </div>
          <div class="flex items-center gap-1.5 text-xs font-mono">
            <span>&le;</span>
            <input
              v-model.number="form.grade2Max"
              type="number"
              min="0"
              max="100"
              class="w-16 p-1 text-center font-bold border rounded-md dark:bg-slate-700 dark:border-slate-600"
            />
            <span>%</span>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
        <button
          type="button"
          @click="handleReset"
          class="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          Odatiy holatga qaytarish
        </button>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="$emit('close')"
            class="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            @click="handleSave"
            class="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
          >
            Saqlash
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
