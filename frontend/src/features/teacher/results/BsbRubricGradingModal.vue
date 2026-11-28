<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import type { AssessmentResult } from '../../../entities/result/model';
import { getBsbStandardByGrade } from '../../../entities/assessment/officialBsbData';
import type { Question } from '../../../entities/assessment/model';
import { GRADING_SCALE_PRESETS, type GradingPresetKey } from '../../../entities/emaktab/model';
import { api } from '../../../shared/api';

const props = defineProps<{
  isOpen: boolean;
  result: AssessmentResult | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (
    e: 'save',
    payload: {
      attemptId: string;
      totalScore: number;
      rubricScores: Record<string, number>;
      feedback: string;
      preset: GradingPresetKey;
    }
  ): void;
}>();

// Reactive map of scores per task / subquestion
const scores = ref<Record<string, number>>({});
const feedback = ref('');
const activePreset = ref<GradingPresetKey>('MMTV_STANDARD');
const loadedAssessmentQuestions = ref<Question[]>([]);
const loadedMaxScore = ref<number | null>(null);

// Extract grade from class name (e.g. "9-A sinf" -> 9, default 9)
const inferredGrade = computed(() => {
  if (!props.result) return 9;
  const match = props.result.className.match(/^(\d+)/);
  return match && match[1] ? parseInt(match[1], 10) : 9;
});

const standard = computed(() => getBsbStandardByGrade(inferredGrade.value));
const effectiveMaxScore = computed(() => {
  return props.result?.maxScore || loadedMaxScore.value || standard.value.maxScore;
});
const questions = computed<Question[]>(() => {
  if (loadedAssessmentQuestions.value.length > 0) {
    return loadedAssessmentQuestions.value;
  }
  return standard.value.sampleQuestions;
});

function formatStudentAnswerForQuestion(q: Question, subId?: string): string {
  const ansMap = props.result?.answers;
  if (!ansMap) return "O'quvchi javobi saqlanmagan.";
  const raw = ansMap[q.id] ?? ansMap[String(q.order)];
  if (raw === undefined || raw === null || raw === '') {
    return "Javob kiritilmagan.";
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (parsed && typeof parsed === 'object') {
        if (subId && parsed[subId] !== undefined) return String(parsed[subId] || "Javob kiritilmagan.");
        return Object.entries(parsed)
          .map(([k, v]) => `${k}: ${String(v)}`)
          .join(' | ');
      }
    } catch {
      return raw;
    }
    return raw;
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (subId && obj[subId] !== undefined) return String(obj[subId] || "Javob kiritilmagan.");
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join(' | ');
  }
  return String(raw);
}

async function loadAssessmentDefinition() {
  loadedAssessmentQuestions.value = [];
  loadedMaxScore.value = null;
  if (!props.result?.assessmentId) return;
  try {
    const tenantId = props.result.tenantId || 'al-xorazmiy';
    const asm = api?.assessment?.getAssessmentById
      ? await api.assessment.getAssessmentById(tenantId, props.result.assessmentId)
      : null;
    if (asm) {
      loadedMaxScore.value = asm.maxScore;
      if (asm.questions && asm.questions.length > 0) {
        loadedAssessmentQuestions.value = asm.questions;
      }
    }
  } catch {
    // Fall back to standard BSB template if assessment detail fetch fails
  }
}

// Reactive state is initialized on mount and whenever selected result changes
watch(
  () => [props.isOpen, props.result?.attemptId],
  async ([open]) => {
    if (open && props.result) {
      feedback.value = props.result.teacherFeedback || props.result.teacherNote || '';
      await loadAssessmentDefinition();
      initScores();
    }
  },
  { immediate: true }
);

onMounted(() => {
  initScores();
});

function initScores() {
  scores.value = {};
  if (!props.result) return;

  const savedRubric = props.result.rubricScores || {};
  const maxS = effectiveMaxScore.value || 50;
  const initialRatio = maxS > 0 ? props.result.score / maxS : 0;

  for (const q of questions.value) {
    if (q.subQuestions && q.subQuestions.length > 0) {
      for (const sub of q.subQuestions) {
        scores.value[sub.id] =
          typeof savedRubric[sub.id] === 'number'
            ? savedRubric[sub.id]!
            : Number((sub.points * initialRatio).toFixed(1));
      }
    } else {
      scores.value[q.id] =
        typeof savedRubric[q.id] === 'number'
          ? savedRubric[q.id]!
          : Number((q.points * initialRatio).toFixed(1));
    }
  }
}

function setScore(key: string, val: number) {
  scores.value[key] = val;
}

const totalCalculatedScore = computed(() => {
  const sum = Object.values(scores.value).reduce((acc, val) => acc + (val || 0), 0);
  return Math.min(effectiveMaxScore.value, Math.max(0, Number(sum.toFixed(1))));
});

const percentage = computed(() => {
  if (effectiveMaxScore.value === 0) return 0;
  return Math.round((totalCalculatedScore.value / effectiveMaxScore.value) * 100);
});

const gradeLevel = computed(() => {
  const pct = percentage.value;
  const thresholds = GRADING_SCALE_PRESETS[activePreset.value].thresholds;
  if (pct >= thresholds.grade5Min) return { label: "A‘lo (5)", color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' };
  if (pct >= thresholds.grade4Min) return { label: 'Yaxshi (4)', color: 'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800' };
  if (pct >= thresholds.grade3Min) return { label: 'Qoniqarli (3)', color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800' };
  return { label: 'Qoniqarsiz (2)', color: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800' };
});

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close');
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown));
onUnmounted(() => window.removeEventListener('keydown', handleKeydown));

function handleSave() {
  if (!props.result) return;
  emit('save', {
    attemptId: props.result.attemptId,
    totalScore: totalCalculatedScore.value,
    rubricScores: { ...scores.value },
    feedback: feedback.value,
    preset: activePreset.value,
  });
}
</script>

<template>
  <div
    v-if="isOpen && result"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    role="dialog"
    aria-modal="true"
    aria-labelledby="rubric-modal-title"
  >
    <div
      class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto transition-colors"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/40">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-xl shrink-0">
            🏛️
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400">
                Pedagogik mahorat markazi rasmiy mezoni
              </span>
              <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {{ result.className }}
              </span>
            </div>
            <h2 id="rubric-modal-title" class="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {{ result.studentName }} — {{ result.assessmentTitle || 'BSB Baholash Varakasi' }}
            </h2>
          </div>
        </div>

        <button
          @click="emit('close')"
          aria-label="Yopish"
          class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Live Score Floating Sticky Banner -->
      <div class="px-5 py-3 bg-teal-50/90 dark:bg-teal-950/60 border-b border-teal-200/80 dark:border-teal-800/80 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-teal-900 dark:text-teal-200">Umumiy ball:</span>
          <span class="font-mono font-bold text-lg text-teal-950 dark:text-teal-100">
            {{ totalCalculatedScore }}
          </span>
          <span class="text-xs text-teal-700 dark:text-teal-400">/ {{ effectiveMaxScore }} ball</span>
          <span class="ml-2 font-semibold text-xs text-slate-600 dark:text-slate-300">
            ({{ percentage }}%)
          </span>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <select
            v-model="activePreset"
            aria-label="Baholash mezoni standarti"
            class="px-2 py-1 rounded-md text-xs font-semibold border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
          >
            <option value="MMTV_STANDARD">MMTV (86/66/30)</option>
            <option value="SPECIALIZED">Ixtisos (86/71/56)</option>
          </select>
          <span class="text-xs text-slate-500 dark:text-slate-400">Baholash darajasi:</span>
          <span :class="['px-2.5 py-1 rounded-md text-xs font-bold border', gradeLevel.color]">
            {{ gradeLevel.label }}
          </span>
        </div>
      </div>

      <!-- Tasks and Rubric Criteria List (Scrollable body) -->
      <div class="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 divide-y divide-slate-100 dark:divide-slate-700/80">
        <div
          v-for="q in questions"
          :key="q.id"
          class="pt-5 first:pt-0 space-y-3.5"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <span class="text-xs font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wide">
                {{ q.order }}-topshiriq [{{ q.points }} ball]
              </span>
              <p class="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                {{ q.blocks[0]?.type === 'paragraph' ? q.blocks[0].text : '' }}
              </p>
            </div>
            <span class="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
              {{ q.cognitiveLevel }}
            </span>
          </div>

          <!-- Multi-subquestions evaluation pills -->
          <div v-if="q.subQuestions && q.subQuestions.length > 0" class="space-y-3 pl-2 sm:pl-3 border-l-2 border-teal-200 dark:border-teal-800">
            <div
              v-for="sub in q.subQuestions"
              :key="sub.id"
              class="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/80 dark:border-slate-600/80 space-y-2"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="text-xs font-medium text-slate-700 dark:text-slate-200">
                  <span class="font-bold text-teal-700 dark:text-teal-300 mr-1">{{ sub.label }}</span>
                  <span>{{ sub.prompt }}</span>
                </div>
                <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                  Max: {{ sub.points }}b
                </span>
              </div>

              <!-- Student Submitted Answer -->
              <div class="text-[11px] text-slate-700 dark:text-slate-200 bg-teal-50/50 dark:bg-teal-950/30 p-2 rounded-lg border border-teal-200/60 dark:border-teal-800/60">
                <span class="font-bold text-teal-800 dark:text-teal-300">O'quvchi javobi:</span>
                <span class="ml-1 whitespace-pre-wrap">{{ formatStudentAnswerForQuestion(q, sub.id) }}</span>
              </div>

              <!-- Rubric standard description -->
              <div v-if="sub.rubric" class="text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <span class="font-bold text-teal-700 dark:text-teal-400">Mezon:</span>
                <span class="ml-1">{{ sub.rubric }}</span>
              </div>

              <!-- 1-Click Grading Buttons -->
              <div class="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  @click="setScore(sub.id, sub.points)"
                  :class="[
                    'px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer border',
                    scores[sub.id] === sub.points
                      ? 'bg-emerald-700 text-white border-emerald-700 ring-2 ring-emerald-500/30'
                      : 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  ]"
                >
                  ✓ To‘liq ({{ sub.points }}b)
                </button>

                <button
                  type="button"
                  @click="setScore(sub.id, Number((sub.points / 2).toFixed(1)))"
                  :class="[
                    'px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer border',
                    scores[sub.id] === Number((sub.points / 2).toFixed(1))
                      ? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-500/30'
                      : 'bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                  ]"
                >
                  ◐ Qisman ({{ Number((sub.points / 2).toFixed(1)) }}b)
                </button>

                <button
                  type="button"
                  @click="setScore(sub.id, 0)"
                  :class="[
                    'px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer border',
                    scores[sub.id] === 0
                      ? 'bg-rose-700 text-white border-rose-700 ring-2 ring-rose-500/30'
                      : 'bg-white dark:bg-slate-800 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  ]"
                >
                  ✕ 0 ball
                </button>

                <!-- Custom stepper -->
                <div class="flex items-center gap-1 ml-auto text-xs">
                  <span class="text-slate-400">Ball:</span>
                  <input
                    type="number"
                    :value="scores[sub.id] ?? 0"
                    @input="setScore(sub.id, Math.min(sub.points, Math.max(0, Number(($event.target as HTMLInputElement).value))))"
                    step="0.5"
                    min="0"
                    :max="sub.points"
                    class="w-16 px-2 py-0.5 rounded text-xs font-mono font-bold text-center border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Single task evaluation pills (if no subquestions) -->
          <div v-else class="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/80 dark:border-slate-600/80 space-y-2">
            <div class="text-[11px] text-slate-700 dark:text-slate-200 bg-teal-50/50 dark:bg-teal-950/30 p-2 rounded-lg border border-teal-200/60 dark:border-teal-800/60">
              <span class="font-bold text-teal-800 dark:text-teal-300">O'quvchi javobi:</span>
              <span class="ml-1 whitespace-pre-wrap">{{ formatStudentAnswerForQuestion(q) }}</span>
            </div>
            <div v-if="q.rubricCriteria && q.rubricCriteria.length > 0" class="text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <span class="font-bold text-teal-700 dark:text-teal-400">Mezon:</span>
              <span class="ml-1">{{ q.rubricCriteria.map((c) => c.guideline || c.criterion).join(' • ') }}</span>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                @click="setScore(q.id, q.points)"
                :class="[
                  'px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer border',
                  scores[q.id] === q.points
                    ? 'bg-emerald-700 text-white border-emerald-700 ring-2 ring-emerald-500/30'
                    : 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                ]"
              >
                ✓ To‘liq ({{ q.points }}b)
              </button>
              <button
                type="button"
                @click="setScore(q.id, Number((q.points / 2).toFixed(1)))"
                :class="[
                  'px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer border',
                  scores[q.id] === Number((q.points / 2).toFixed(1))
                    ? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-500/30'
                    : 'bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                ]"
              >
                ◐ Qisman ({{ Number((q.points / 2).toFixed(1)) }}b)
              </button>
              <button
                type="button"
                @click="setScore(q.id, 0)"
                :class="[
                  'px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer border',
                  scores[q.id] === 0
                    ? 'bg-rose-700 text-white border-rose-700 ring-2 ring-rose-500/30'
                    : 'bg-white dark:bg-slate-800 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                ]"
              >
                ✕ 0 ball
              </button>
              <div class="flex items-center gap-1 ml-auto text-xs">
                <span class="text-slate-400">Ball:</span>
                <input
                  type="number"
                  :value="scores[q.id] ?? 0"
                  @input="setScore(q.id, Math.min(q.points, Math.max(0, Number(($event.target as HTMLInputElement).value))))"
                  step="0.5"
                  min="0"
                  :max="q.points"
                  class="w-16 px-2 py-0.5 rounded text-xs font-mono font-bold text-center border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Teacher's optional comment -->
        <div class="pt-4 space-y-1.5">
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            O‘qituvchi xulosasi va izohi (Ixtiyoriy):
          </label>
          <textarea
            v-model="feedback"
            rows="2"
            placeholder="O‘quvchining javoblari bo‘yicha metodik tavsiya yoki izoh yozing..."
            class="w-full p-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
          ></textarea>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-3">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition cursor-pointer min-h-[38px]"
        >
          Bekor qilish
        </button>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="initScores"
            class="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer min-h-[38px]"
          >
            Qayta hisoblash
          </button>
          <button
            type="button"
            @click="handleSave"
            class="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white text-xs font-semibold shadow-xs transition cursor-pointer min-h-[38px] flex items-center gap-1.5"
          >
            <span>✓</span>
            <span>Saqlash va Tasdiqlash</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
