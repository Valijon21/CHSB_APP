<script setup lang="ts">
import { ref } from 'vue';
import type { GroundedQuestionItem } from '../../../../shared/utils/groundedAiExtractor';

const props = defineProps<{
  question: GroundedQuestionItem;
  index: number;
}>();

const emit = defineEmits<{
  (e: 'update:question', updated: GroundedQuestionItem): void;
  (e: 'delete', index: number): void;
  (e: 'toggleApproval', index: number): void;
}>();

const showSource = ref(false);

function toggleApproved() {
  emit('toggleApproval', props.index);
}

function updatePrompt(val: string) {
  emit('update:question', {
    ...props.question,
    prompt: val,
  });
}

function updatePoints(pts: number) {
  emit('update:question', {
    ...props.question,
    points: pts,
  });
}

function updateSubPrompt(subIdx: number, val: string) {
  if (!props.question.subQuestions) return;
  const copy = [...props.question.subQuestions];
  if (copy[subIdx]) {
    copy[subIdx] = { ...copy[subIdx]!, prompt: val };
    emit('update:question', {
      ...props.question,
      subQuestions: copy,
    });
  }
}

function updateSubPoints(subIdx: number, pts: number) {
  if (!props.question.subQuestions) return;
  const copy = [...props.question.subQuestions];
  if (copy[subIdx]) {
    copy[subIdx] = { ...copy[subIdx]!, points: pts };
    emit('update:question', {
      ...props.question,
      subQuestions: copy,
    });
  }
}

function updateRubric(val: string) {
  emit('update:question', {
    ...props.question,
    rubric: val,
  });
}
</script>

<template>
  <div
    :class="[
      'p-4 sm:p-5 rounded-2xl border transition-all duration-200 shadow-2xs space-y-3.5',
      question.isApprovedByHuman
        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
        : 'bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-700/80'
    ]"
  >
    <!-- Card Header -->
    <div class="flex items-start justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="w-7 h-7 rounded-lg bg-teal-800 dark:bg-teal-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
          {{ question.number }}
        </span>
        <span class="font-bold text-slate-900 dark:text-white text-sm">
          {{ question.title }}
        </span>
        <span
          :class="[
            'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
            question.taskType === 'subquestions'
              ? 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300'
              : question.taskType === 'multiple_choice'
                ? 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300'
                : 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300'
          ]"
        >
          {{
            question.taskType === 'subquestions'
              ? 'BSB Bandli Savol (a, b, c, d)'
              : question.taskType === 'multiple_choice'
                ? 'Test (Variantli)'
                : 'Keys / Amaliy topshiriq'
          }}
        </span>
      </div>

      <!-- Action buttons & Approval status -->
      <div class="flex items-center gap-2">
        <!-- Human Approval Toggle Button -->
        <button
          type="button"
          @click="toggleApproved"
          :class="[
            'px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border',
            question.isApprovedByHuman
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 hover:bg-amber-200'
          ]"
          :title="question.isApprovedByHuman ? 'Tasdiqlangan holatni bekor qilish' : 'Topshiriqni inson sifatida tasdiqlash'"
        >
          <span>{{ question.isApprovedByHuman ? '✓ Inson tasdiqladi' : '⏳ Tasdiqlash talab etiladi' }}</span>
        </button>

        <button
          type="button"
          @click="emit('delete', index)"
          aria-label="Savolni o'chirish"
          class="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition cursor-pointer"
          title="O'chirish"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Question Prompt Input -->
    <div>
      <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
        Topshiriq / Savol matni:
      </label>
      <textarea
        :value="question.prompt"
        @input="updatePrompt(($event.target as HTMLTextAreaElement).value)"
        rows="2"
        class="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
      ></textarea>
    </div>

    <!-- Subquestions list (a, b, c, d) -->
    <div v-if="question.subQuestions && question.subQuestions.length > 0" class="space-y-2 pt-1">
      <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
        Bandlar (a, b, c, d) va ballar taqsimoti:
      </label>
      <div
        v-for="(sub, sIdx) in question.subQuestions"
        :key="sub.id"
        class="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-700/80"
      >
        <span class="w-6 font-bold text-xs text-teal-800 dark:text-teal-400 text-center shrink-0">
          {{ sub.label }}
        </span>
        <input
          type="text"
          :value="sub.prompt"
          @input="updateSubPrompt(sIdx, ($event.target as HTMLInputElement).value)"
          class="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-600"
          placeholder="Band savoli..."
        />
        <div class="flex items-center gap-1 shrink-0">
          <input
            type="number"
            step="0.5"
            min="0.5"
            max="25"
            :value="sub.points"
            @input="updateSubPoints(sIdx, parseFloat(($event.target as HTMLInputElement).value) || 1)"
            class="w-14 px-1.5 py-1 text-xs font-mono font-bold text-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
          />
          <span class="text-[11px] text-slate-500">ball</span>
        </div>
      </div>
    </div>

    <!-- Multiple choice options review -->
    <div v-else-if="question.options && question.options.length > 0" class="space-y-1.5 pt-1">
      <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
        Variantlar:
      </label>
      <div
        v-for="opt in question.options"
        :key="opt.id"
        class="flex items-center gap-2 p-1.5 rounded-lg text-xs"
        :class="question.correctOptionId === opt.id ? 'bg-emerald-50 dark:bg-emerald-950/40 font-semibold text-emerald-900 dark:text-emerald-200' : 'text-slate-700 dark:text-slate-300'"
      >
        <span class="w-5 font-mono text-center font-bold">{{ opt.label }})</span>
        <span class="flex-1">{{ opt.text }}</span>
        <span v-if="question.correctOptionId === opt.id" class="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
          ✓ To'g'ri
        </span>
      </div>
    </div>

    <!-- Points and Rubrics row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
      <div>
        <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
          Maksimal ball:
        </label>
        <input
          type="number"
          step="0.5"
          min="1"
          max="50"
          :value="question.points"
          @input="updatePoints(parseFloat(($event.target as HTMLInputElement).value) || 1)"
          class="w-full px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
        />
      </div>

      <div class="sm:col-span-2">
        <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
          Baholash mezoni (Rubrika):
        </label>
        <input
          type="text"
          :value="question.rubric || ''"
          @input="updateRubric(($event.target as HTMLInputElement).value)"
          placeholder="To'liq javob, qisman ball mezonlari..."
          class="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
        />
      </div>
    </div>

    <!-- Strict Grounding Source Excerpt (Zero-Hallucination Proof) -->
    <div class="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
      <button
        type="button"
        @click="showSource = !showSource"
        class="text-[11px] text-teal-700 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
      >
        <span>🛡️</span>
        <span>{{ showSource ? 'Asl PDF iqtibosini berkitish' : 'Asl PDF iqtibosini ko‘rish (To‘qima yo‘qligini tekshirish)' }}</span>
      </button>

      <div
        v-if="showSource"
        class="mt-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 text-xs font-mono leading-relaxed whitespace-pre-wrap border border-slate-200 dark:border-slate-700"
      >
        {{ question.sourceExcerpt }}
      </div>
    </div>
  </div>
</template>
