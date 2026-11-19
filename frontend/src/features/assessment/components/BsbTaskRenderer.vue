<script setup lang="ts">
import { computed } from 'vue';
import type { Question } from '../../../entities/assessment/model';

const props = defineProps<{
  question: Question;
  modelValue: string; // serialized JSON or raw string
  readOnly?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void;
}>();

// Parse structured answer state
const parsedAnswers = computed<Record<string, string>>(() => {
  if (!props.modelValue) return {};
  try {
    const val = JSON.parse(props.modelValue);
    if (typeof val === 'object' && val !== null) {
      return val as Record<string, string>;
    }
    return { general: props.modelValue };
  } catch {
    return { general: props.modelValue };
  }
});

function handleSubInput(key: string, value: string) {
  if (props.readOnly) return;
  const updated = { ...parsedAnswers.value, [key]: value };
  emit('update:modelValue', JSON.stringify(updated));
}

function getSubAnswer(key: string): string {
  return parsedAnswers.value[key] || '';
}
</script>

<template>
  <div class="space-y-6">
    <!-- Case Study / Context Banner if present -->
    <div
      v-if="question.taskType === 'case_study'"
      class="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3"
    >
      <div class="w-8 h-8 rounded-lg bg-amber-200/80 dark:bg-amber-800 flex items-center justify-center shrink-0 text-base">
        💡
      </div>
      <div>
        <h4 class="font-bold text-sm text-amber-950 dark:text-amber-100">
          Amaliy vaziyatli tahlil (Keys topshiriq)
        </h4>
        <p class="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5 leading-relaxed">
          Ushbu topshiriqda real hayotiy vaziyat berilgan. Savollarga asosli, to‘liq va mantiqiy xulosalar bilan javob bering.
        </p>
      </div>
    </div>

    <!-- Table Completion Task -->
    <div v-if="question.tableData" class="space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
          <span>📊</span>
          <span>Jadvalni to‘ldirish topshirig‘i</span>
        </span>
        <span class="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          Kataklarga mos javoblarni kiriting
        </span>
      </div>

      <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <table class="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr class="bg-slate-100/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700">
              <th
                v-for="(header, hIdx) in question.tableData.headers"
                :key="hIdx"
                class="p-3 border-r border-slate-200 dark:border-slate-700 last:border-r-0"
              >
                {{ header }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
            <tr
              v-for="(row, rIdx) in question.tableData.rows"
              :key="rIdx"
              class="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <td class="p-3 font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 w-1/4">
                {{ row.label }}
              </td>
              <td
                v-for="(cell, cIdx) in row.cells"
                :key="cIdx"
                class="p-2 border-r border-slate-200 dark:border-slate-700 last:border-r-0"
              >
                <input
                  type="text"
                  :value="getSubAnswer(cell.key)"
                  @input="handleSubInput(cell.key, ($event.target as HTMLInputElement).value)"
                  :placeholder="cell.placeholder || 'Javobni yozing...'"
                  :disabled="readOnly"
                  class="w-full px-2.5 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:focus:ring-teal-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Multi-Part Sub-Questions (a, b, c, d) -->
    <div v-if="question.subQuestions && question.subQuestions.length > 0" class="space-y-4">
      <div
        v-for="sub in question.subQuestions"
        :key="sub.id"
        class="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 shadow-2xs space-y-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-600"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-2.5 flex-1">
            <span class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 text-xs font-bold shrink-0 mt-0.5">
              {{ sub.label }}
            </span>
            <p class="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
              {{ sub.prompt }}
            </p>
          </div>
          <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0 border border-slate-200 dark:border-slate-600">
            {{ sub.points }} ball
          </span>
        </div>

        <!-- Student response input -->
        <div>
          <textarea
            :value="getSubAnswer(sub.id)"
            @input="handleSubInput(sub.id, ($event.target as HTMLTextAreaElement).value)"
            :placeholder="`${sub.label} savol bo‘yicha to‘liq javobingizni shu yerga yozing...`"
            :disabled="readOnly"
            rows="2"
            class="w-full p-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:focus:ring-teal-400 disabled:opacity-60 disabled:cursor-not-allowed transition resize-y min-h-[60px]"
          ></textarea>
        </div>

        <!-- Official Rubric hint / criteria -->
        <div
          v-if="sub.rubric"
          class="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700/60 flex items-start gap-1.5"
        >
          <span class="font-bold text-teal-700 dark:text-teal-400 shrink-0">Baholash mezoni:</span>
          <span>{{ sub.rubric }}</span>
        </div>
      </div>
    </div>

    <!-- Fallback Open Text Response if no subquestions or options -->
    <div
      v-else-if="(!question.options || question.options.length === 0) && !question.tableData"
      class="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2"
    >
      <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
        Topshiriq yechimi / javobingiz:
      </label>
      <textarea
        :value="getSubAnswer('general')"
        @input="handleSubInput('general', ($event.target as HTMLTextAreaElement).value)"
        placeholder="Topshiriq bo‘yicha yechim yoki fikringizni batafsil yozing..."
        :disabled="readOnly"
        rows="4"
        class="w-full p-3 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:focus:ring-teal-400 disabled:opacity-60 disabled:cursor-not-allowed transition resize-y min-h-[90px]"
      ></textarea>
    </div>

    <!-- Official Rubric Table (Pedagogik Mahorat Markazi) -->
    <div
      v-if="question.rubricCriteria && question.rubricCriteria.length > 0"
      class="p-4 rounded-xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/70 space-y-2.5"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5 uppercase tracking-wider">
          <span>🏛️</span>
          <span>Rasmiy Baholash Mezoni (Rubrika)</span>
        </span>
        <span class="text-[11px] font-semibold text-teal-700 dark:text-teal-300">
          Maksimal ball: {{ question.points }}
        </span>
      </div>

      <div class="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
        <div
          v-for="crit in question.rubricCriteria"
          :key="crit.id"
          class="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 rounded-lg bg-white/70 dark:bg-slate-800/70 border border-teal-100 dark:border-teal-900/60"
        >
          <div class="sm:col-span-2">
            <span class="font-bold text-slate-800 dark:text-slate-200">{{ crit.criterion }}:</span>
            <span class="ml-1 text-slate-600 dark:text-slate-400">{{ crit.guideline }}</span>
          </div>
          <div class="flex items-center gap-2 text-[11px] justify-start sm:justify-end shrink-0">
            <span class="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold">
              To‘liq: {{ crit.fullScore }}b
            </span>
            <span class="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-bold">
              Qisman: {{ crit.partialScore }}b
            </span>
            <span class="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 font-bold">
              0b
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
