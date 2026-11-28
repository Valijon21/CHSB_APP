<script setup lang="ts">
import { computed } from 'vue';
import type { Assessment, Question } from '../../../entities/assessment/model';
import BsbTaskRenderer from './BsbTaskRenderer.vue';

const props = withDefaults(
  defineProps<{
    assessment: Assessment;
    answers: Record<string, string>;
    answeredCount: number;
    totalQuestions: number;
    isSubmitting: boolean;
    heightClass?: string;
  }>(),
  {
    heightClass: 'h-[74vh] min-h-[520px]',
  }
);

const emit = defineEmits<{
  (e: 'select-answer', questionId: string, value: string): void;
  (e: 'finish'): void;
}>();

const progressPercent = computed(() => {
  if (props.totalQuestions <= 0) return 0;
  return Math.round((props.answeredCount / props.totalQuestions) * 100);
});

function isQuestionBsb(q: Question): boolean {
  return Boolean(
    (q.subQuestions && q.subQuestions.length > 0) ||
      q.tableData ||
      q.taskType === 'case_study' ||
      q.taskType === 'subquestions' ||
      q.taskType === 'table_completion' ||
      q.taskType === 'open_text' ||
      !q.options ||
      q.options.length === 0
  );
}

function getOptionLabel(opt: { id: string; label?: string }, idx: number): string {
  if (opt.label && opt.label.trim().length > 0) {
    return opt.label.trim().toUpperCase();
  }
  if (opt.id.toLowerCase().startsWith('opt-')) {
    return opt.id.replace(/^opt-/, '').trim().toUpperCase();
  }
  return String.fromCharCode(65 + idx);
}

function isRowAnswered(q: Question): boolean {
  const ans = props.answers[q.id];
  if (!ans || !ans.trim()) return false;
  if (ans.startsWith('{')) {
    try {
      const obj = JSON.parse(ans) as Record<string, unknown>;
      return Object.values(obj).some((v) => typeof v === 'string' && v.trim().length > 0);
    } catch {
      return true;
    }
  }
  return true;
}
</script>

<template>
  <aside
    class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col overflow-hidden"
    :class="heightClass"
    aria-label="Javoblar varaqasi"
  >
    <!-- Header & Progress -->
    <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 space-y-2 shrink-0">
      <div class="flex items-center justify-between gap-2">
        <div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
            ✍️ Javoblar varaqasi
          </h3>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">
            Chapdagi PDF topshiriqlariga mos javoblarni kiriting
          </p>
        </div>
        <span class="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-xs font-mono font-bold text-teal-800 dark:text-teal-300">
          {{ answeredCount }} / {{ totalQuestions }}
        </span>
      </div>

      <div class="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          class="h-full bg-teal-700 dark:bg-teal-500 transition-all duration-300"
          :style="{ width: `${progressPercent}%` }"
        ></div>
      </div>
    </div>

    <!-- Scrollable Answer Items -->
    <div class="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3">
      <div
        v-for="q in assessment.questions"
        :key="q.id"
        :class="[
          'p-3 rounded-xl border transition-colors',
          isRowAnswered(q)
            ? 'border-teal-200 dark:border-teal-800/70 bg-teal-50/30 dark:bg-teal-950/20'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70'
        ]"
      >
        <!-- BSB / Written Task Row -->
        <template v-if="isQuestionBsb(q)">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-teal-800 dark:text-teal-300">
              {{ q.order }}-topshiriq
            </span>
            <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300">
              {{ q.points }} ball
            </span>
          </div>

          <BsbTaskRenderer
            :question="q"
            :model-value="answers[q.id] || ''"
            compact
            @update:model-value="emit('select-answer', q.id, $event)"
          />
        </template>

        <!-- CHSB MCQ / OMR Answer Bubble Row -->
        <template v-else>
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold',
                  isRowAnswered(q)
                    ? 'bg-teal-800 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                ]"
              >
                {{ q.order }}
              </span>
              <span class="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {{ q.points }} ball
              </span>
            </div>

            <div class="flex items-center gap-1.5">
              <button
                v-for="(opt, optIdx) in q.options"
                :key="opt.id"
                type="button"
                @click="emit('select-answer', q.id, opt.id)"
                :aria-label="`${q.order}-savol ${getOptionLabel(opt, optIdx)} varianti`"
                :class="[
                  'min-w-[38px] h-9 px-2.5 rounded-lg border text-xs font-bold transition cursor-pointer',
                  answers[q.id] === opt.id
                    ? 'bg-teal-800 dark:bg-teal-600 text-white border-teal-800 dark:border-teal-600 shadow-xs ring-2 ring-teal-700/30'
                    : 'bg-slate-50 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:border-teal-400'
                ]"
              >
                {{ getOptionLabel(opt, optIdx) }}
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Bottom Submit Bar -->
    <div class="p-3.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 shrink-0">
      <button
        type="button"
        @click="emit('finish')"
        :disabled="isSubmitting"
        aria-label="Imtihonni yakunlash va yuborish"
        class="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs sm:text-sm font-bold transition cursor-pointer shadow-xs disabled:bg-slate-400 min-h-[42px]"
      >
        {{ isSubmitting ? 'Topshirilmoqda...' : 'Yakunlash va yuborish' }}
      </button>
    </div>
  </aside>
</template>
