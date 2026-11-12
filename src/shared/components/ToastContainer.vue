<script setup lang="ts">
import { useToast, type ToastType } from '../composables/useToast';

const { toasts, removeToast } = useToast();

function getToastStyles(type: ToastType) {
  switch (type) {
    case 'success':
      return {
        border: 'border-emerald-500/40 dark:border-emerald-500/50',
        bg: 'bg-emerald-50/95 dark:bg-emerald-950/90',
        iconBg: 'bg-emerald-500 text-white',
        text: 'text-emerald-900 dark:text-emerald-100',
        icon: '✓',
      };
    case 'error':
      return {
        border: 'border-rose-500/40 dark:border-rose-500/50',
        bg: 'bg-rose-50/95 dark:bg-rose-950/90',
        iconBg: 'bg-rose-500 text-white',
        text: 'text-rose-900 dark:text-rose-100',
        icon: '✕',
      };
    case 'warning':
      return {
        border: 'border-amber-500/40 dark:border-amber-500/50',
        bg: 'bg-amber-50/95 dark:bg-amber-950/90',
        iconBg: 'bg-amber-500 text-white',
        text: 'text-amber-900 dark:text-amber-100',
        icon: '!',
      };
    case 'info':
    default:
      return {
        border: 'border-teal-500/40 dark:border-teal-500/50',
        bg: 'bg-teal-50/95 dark:bg-teal-950/90',
        iconBg: 'bg-teal-600 text-white',
        text: 'text-teal-900 dark:text-teal-100',
        icon: 'ℹ',
      };
  }
}
</script>

<template>
  <div
    aria-label="Tizim xabarnomalari"
    role="region"
    class="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-4 sm:p-0"
  >
    <transition-group
      enter-active-class="transform ease-out duration-200 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        role="status"
        aria-live="polite"
        :class="[
          'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-xs transition-all',
          getToastStyles(toast.type).bg,
          getToastStyles(toast.type).border,
        ]"
      >
        <!-- Icon Badge -->
        <span
          :class="[
            'w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs',
            getToastStyles(toast.type).iconBg,
          ]"
        >
          {{ getToastStyles(toast.type).icon }}
        </span>

        <!-- Message Body -->
        <div class="flex-1 min-w-0 pt-0.5">
          <h4
            v-if="toast.title"
            :class="['text-xs font-bold mb-0.5', getToastStyles(toast.type).text]"
          >
            {{ toast.title }}
          </h4>
          <p :class="['text-xs font-medium leading-relaxed', getToastStyles(toast.type).text]">
            {{ toast.message }}
          </p>
        </div>

        <!-- Dismiss Button -->
        <button
          type="button"
          @click="removeToast(toast.id)"
          aria-label="Xabarni yopish"
          class="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition cursor-pointer min-h-[28px] flex items-center justify-center"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </transition-group>
  </div>
</template>
