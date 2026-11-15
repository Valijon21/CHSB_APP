<script setup lang="ts">
import { computed } from 'vue';
import type { LiveStudentSession } from '../../../../entities/proctor/model';

const props = defineProps<{
  session: LiveStudentSession;
}>();

const emit = defineEmits<{
  (e: 'action', studentId: string, actionType: 'grant_time' | 'send_warning' | 'force_submit'): void;
}>();

const formattedTime = computed(() => {
  const s = props.session.remainingSeconds;
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
});

const progressPercentage = computed(() => {
  return Math.round((props.session.answeredCount / props.session.totalQuestions) * 100);
});

const statusBadge = computed(() => {
  switch (props.session.status) {
    case 'active':
      return {
        label: 'Faol',
        bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
        pulse: false,
      };
    case 'idle':
      return {
        label: 'Kutish',
        bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
        pulse: false,
      };
    case 'warning':
      return {
        label: 'Xavf ostida',
        bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800',
        dot: 'bg-rose-500',
        pulse: true,
      };
    case 'offline':
      return {
        label: 'Oflayn',
        bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
        dot: 'bg-slate-400',
        pulse: false,
      };
    case 'submitted':
      return {
        label: 'Topshirdi',
        bg: 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
        dot: 'bg-teal-600',
        pulse: false,
      };
    default:
      return {
        label: 'Faol',
        bg: 'bg-slate-100 text-slate-700 border-slate-300',
        dot: 'bg-slate-400',
        pulse: false,
      };
  }
});
</script>

<template>
  <div
    :class="[
      'bg-white dark:bg-slate-800 rounded-xl border p-4 shadow-2xs transition hover:shadow-xs flex flex-col justify-between gap-3',
      session.status === 'warning'
        ? 'border-rose-300 dark:border-rose-700 ring-2 ring-rose-500/20'
        : 'border-slate-200 dark:border-slate-700'
    ]"
    :data-student-id="session.rosterRecordId"
  >
    <!-- Header: Name & Status -->
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <h4 class="font-bold text-sm text-slate-900 dark:text-white truncate">
          {{ session.studentName }}
        </h4>
        <span class="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          {{ session.className }}
        </span>
      </div>

      <!-- Status Pill -->
      <span
        :class="[
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0',
          statusBadge.bg,
          statusBadge.pulse ? 'animate-pulse' : ''
        ]"
      >
        <span :class="['w-1.5 h-1.5 rounded-full', statusBadge.dot]"></span>
        <span>{{ statusBadge.label }}</span>
      </span>
    </div>

    <!-- Telemetry Progress & Questions -->
    <div class="space-y-1.5">
      <div class="flex justify-between text-xs text-slate-600 dark:text-slate-400">
        <span>Savol: <strong class="text-slate-900 dark:text-slate-200 font-mono">{{ session.currentQuestion }}/{{ session.totalQuestions }}</strong></span>
        <span>Javob: <strong class="text-teal-700 dark:text-teal-400 font-mono">{{ session.answeredCount }}/{{ session.totalQuestions }}</strong></span>
      </div>

      <!-- Progress bar -->
      <div class="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
        <div
          class="bg-teal-700 h-full rounded-full transition-all duration-300"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>
    </div>

    <!-- Timer & Violations Bar -->
    <div class="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-700">
      <div class="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
        <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="font-mono font-bold">{{ formattedTime }}</span>
      </div>

      <!-- Violations count -->
      <div v-if="session.violationsCount > 0" class="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-bold">
        <span>Ogohlantirish: {{ session.violationsCount }}/3</span>
      </div>
      <div v-else class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
        ✓ Qoida buzilmadi
      </div>
    </div>

    <!-- Action Buttons for Proctor -->
    <div v-if="session.status !== 'submitted'" class="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700">
      <button
        type="button"
        @click="emit('action', session.rosterRecordId, 'grant_time')"
        class="py-1 px-1.5 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-[11px] font-medium transition cursor-pointer text-center"
        title="Vaqt qo'shish (+5 min)"
      >
        +5 min
      </button>

      <button
        type="button"
        @click="emit('action', session.rosterRecordId, 'send_warning')"
        class="py-1 px-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 rounded text-[11px] font-medium transition cursor-pointer text-center"
        title="Ogohlantirish berish"
      >
        Ogoh
      </button>

      <button
        type="button"
        @click="emit('action', session.rosterRecordId, 'force_submit')"
        class="py-1 px-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-800 dark:text-rose-300 rounded text-[11px] font-medium transition cursor-pointer text-center"
        title="Imtihonni majburiy yakunlash"
      >
        Yakun
      </button>
    </div>
  </div>
</template>
