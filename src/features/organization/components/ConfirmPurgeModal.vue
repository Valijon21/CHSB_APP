<script setup lang="ts">
import { toRef } from 'vue';
import { useModalA11y } from '../../../shared/composables/useModalA11y';

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    title: string;
    description: string;
    targetName?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    danger?: boolean;
    isLoading?: boolean;
  }>(),
  {
    targetName: '',
    confirmButtonText: "Ha, o'chirilsin",
    cancelButtonText: 'Bekor qilish',
    danger: true,
    isLoading: false,
  }
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();

useModalA11y(toRef(props, 'isOpen'), () => {
  if (!props.isLoading) {
    emit('close');
  }
});
</script>

<template>
  <div
    v-if="isOpen"
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-purge-modal-title"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
  >
    <div
      class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Modal Header -->
      <div class="flex items-start gap-4">
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          :class="
            danger
              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
              : 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'
          "
        >
          <svg v-if="danger" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <div class="flex-1 min-w-0">
          <h3
            id="confirm-purge-modal-title"
            class="text-base font-bold text-slate-900 dark:text-white"
          >
            {{ title }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {{ description }}
          </p>
        </div>
      </div>

      <!-- Target Info Card (if provided) -->
      <div
        v-if="targetName"
        class="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
      >
        <span class="text-slate-500 dark:text-slate-400">Tanlangan ob'ekt:</span>
        <span class="font-bold text-slate-800 dark:text-slate-200 font-mono">{{ targetName }}</span>
      </div>

      <!-- Warning Note -->
      <div
        class="p-3 rounded-xl text-xs flex items-center gap-2"
        :class="
          danger
            ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
            : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300'
        "
      >
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span class="font-medium">
          {{
            danger
              ? "Diqqat: Ushbu amalni ortga qaytarib bo'lmaydi. Barcha bog'liq ma'lumotlar o'chib ketadi."
              : "Diqqat: Ushbu sinfdagi barcha o'quvchilar ro'yxati 0 ga tushiriladi."
          }}
        </span>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
        <button
          type="button"
          :disabled="isLoading"
          @click="$emit('close')"
          class="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer disabled:opacity-50"
        >
          {{ cancelButtonText }}
        </button>

        <button
          type="button"
          :disabled="isLoading"
          @click="$emit('confirm')"
          class="px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          :class="
            danger
              ? 'bg-rose-600 hover:bg-rose-700 focus:ring-2 focus:ring-rose-500'
              : 'bg-amber-600 hover:bg-amber-700 focus:ring-2 focus:ring-amber-500'
          "
        >
          <svg
            v-if="isLoading"
            class="animate-spin -ml-1 mr-1 h-3.5 w-3.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>{{ confirmButtonText }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
