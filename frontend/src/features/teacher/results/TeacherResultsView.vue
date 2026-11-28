<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useTenantStore } from '../../tenant-context/tenantStore';
import { useTeacherStore } from '../teacherStore';
import BsbRubricGradingModal from './BsbRubricGradingModal.vue';
import { useOrganizationStore } from '../../organization/store/organizationStore';
import { httpClient } from '../../../shared/api/httpClient';
import { generateQuarterJournalCsv } from '../../emaktab/services/emaktabExportService';
import type { AssessmentResult } from '../../../entities/result/model';
import type { GradingPresetKey } from '../../../entities/emaktab/model';

const route = useRoute();
const tenantStore = useTenantStore();
const teacherStore = useTeacherStore();
const orgStore = useOrganizationStore();

const tenantSlug = (route.params.tenantSlug as string) || 'al-xorazmiy';
const activeTab = ref<'submissions' | 'quarter'>('submissions');
const searchQuery = ref('');
const selectedClass = ref('');
const selectedQuarter = ref(1);
const selectedSubject = ref('INF');
const isExporting = ref(false);
const gradingResult = ref<AssessmentResult | null>(null);
const isGradingModalOpen = ref(false);
const savingStudentId = ref<string | null>(null);
const draftFormative = ref<Record<string, { classwork: number; homework: number }>>({});

const subjectOptions = computed(() => {
  if (orgStore.subjects.length > 0) {
    return orgStore.subjects.map((s) => ({
      code: (s.code || s.name.slice(0, 3)).toUpperCase(),
      name: s.name,
    }));
  }
  return [
    { code: 'INF', name: 'Informatika' },
    { code: 'MAT', name: 'Matematika' },
    { code: 'FIZ', name: 'Fizika' },
  ];
});

function openGradingModal(res: AssessmentResult) {
  gradingResult.value = res;
  isGradingModalOpen.value = true;
}

async function handleSaveGrading(payload: {
  attemptId: string;
  totalScore: number;
  rubricScores: Record<string, number>;
  feedback: string;
  preset: GradingPresetKey;
}) {
  await teacherStore.gradeStudentResult(payload.attemptId, {
    score: payload.totalScore,
    rubricScores: payload.rubricScores,
    feedback: payload.feedback,
    verifiedByTeacher: true,
  });
  isGradingModalOpen.value = false;
  gradingResult.value = null;
}

function getResolvedTenantId(): string {
  return (
    tenantStore.currentTenant?.tenantId ||
    (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy')
  );
}

async function refreshGradebook() {
  const clsObj = teacherStore.classes.find((c) => c.name === selectedClass.value);
  await teacherStore.loadQuarterGradebook(getResolvedTenantId(), {
    classGroupId: clsObj?.id,
    subjectCode: selectedSubject.value,
    quarter: selectedQuarter.value,
  });
  const nextDrafts: Record<string, { classwork: number; homework: number }> = {};
  for (const row of teacherStore.quarterGradebookRows) {
    nextDrafts[row.studentId] = { classwork: row.classwork, homework: row.homework };
  }
  draftFormative.value = nextDrafts;
}

watch([activeTab, selectedQuarter, selectedSubject, selectedClass], () => {
  if (activeTab.value === 'quarter') {
    void refreshGradebook();
  }
});

async function handleSaveFormative(studentId: string) {
  const entry = draftFormative.value[studentId];
  if (!entry) return;
  savingStudentId.value = studentId;
  try {
    await teacherStore.saveFormativeScore({
      studentId,
      subjectCode: selectedSubject.value,
      quarter: selectedQuarter.value,
      classwork: Number(entry.classwork) || 0,
      homework: Number(entry.homework) || 0,
    });
  } finally {
    savingStudentId.value = null;
  }
}

onMounted(async () => {
  await tenantStore.loadTenant(tenantSlug);
  const tenantId = getResolvedTenantId();
  await Promise.all([
    teacherStore.loadTeacherData(tenantId),
    orgStore.loadSchoolContext(tenantSlug).catch(() => undefined),
  ]);
  await refreshGradebook();
});

async function handleMarkAbsence(attemptId: string) {
  try {
    await httpClient.post(`/assessments/attempts/${attemptId}/absence`, { reason: 'EXCUSED' });
    await teacherStore.loadTeacherData(getResolvedTenantId(), true);
  } catch (err) {
    console.error('Failed to mark absence:', err);
  }
}

async function handleReopenAttempt(attemptId: string) {
  try {
    await httpClient.post(`/assessments/attempts/${attemptId}/reopen`, {});
    await teacherStore.loadTeacherData(getResolvedTenantId(), true);
  } catch (err) {
    console.error('Failed to reopen attempt:', err);
  }
}

const filteredGradebookRows = computed(() => {
  let rows = teacherStore.quarterGradebookRows;
  if (selectedClass.value) {
    rows = rows.filter((r) => r.className === selectedClass.value || r.className?.startsWith(selectedClass.value));
  }
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    rows = rows.filter((r) => r.studentName.toLowerCase().includes(q) || r.rosterCode.toLowerCase().includes(q));
  }
  return rows;
});

const filteredResults = computed(() => {
  let list = teacherStore.results;
  if (selectedClass.value) {
    list = list.filter((r) => r.className === selectedClass.value || r.className?.startsWith(selectedClass.value) || selectedClass.value.startsWith(r.className));
  }
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter((r) => r.studentName.toLowerCase().includes(q));
  }
  return list;
});

function handleExportCSV() {
  isExporting.value = true;
  const classLabel = selectedClass.value ? selectedClass.value.replace(/\s+/g, '_') : 'Barcha_Sinflar';
  const csvContent =
    activeTab.value === 'quarter'
      ? generateQuarterJournalCsv(
          filteredGradebookRows.value.map((row, idx) => ({
            orderIndex: idx + 1,
            studentName: row.studentName,
            emaktabId: row.rosterCode,
            formativeScore: row.formativeScore,
            bsbScore: row.bsbScore,
            chsbScore: row.chsbScore,
            totalScore100: row.totalScore100,
            grade5: row.grade5,
            note: row.annualGrade5 ? `Yillik baho: ${row.annualGrade5}` : '',
          }))
        )
      : '\uFEFF' + teacherStore.exportResultsCSV();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const prefix = activeTab.value === 'quarter' ? `${selectedQuarter.value}-chorak_${selectedSubject.value}` : 'CHSB';
  link.setAttribute('download', `${prefix}_${classLabel}_${tenantSlug}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    isExporting.value = false;
  }, 500);
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div>
        <h1 class="text-xl font-bold text-slate-900 dark:text-white">Natijalar Boshqaruvi (Results Management)</h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          1-CHSB topshirgan o'quvchilar natijalari, ballari va baholash statusi.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="handleExportCSV"
          :disabled="isExporting"
          aria-label="Excel va CSV formatida yuklab olish"
          class="px-4 py-2 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white font-medium rounded-lg text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:bg-slate-400 min-h-[38px]"
        >
          <span>📥 Excel / CSV ga yuklab olish</span>
        </button>
      </div>
    </div>

    <!-- Mode Tabs: Submissions vs Quarter 100-Point Gradebook -->
    <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
      <button
        type="button"
        @click="activeTab = 'submissions'"
        :class="[
          'px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer min-h-[36px]',
          activeTab === 'submissions'
            ? 'bg-teal-800 text-white shadow-xs'
            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
        ]"
      >
        📝 Topshirilgan Ishlar (BSB / CHSB)
      </button>
      <button
        type="button"
        @click="activeTab = 'quarter'"
        :class="[
          'px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer min-h-[36px]',
          activeTab === 'quarter'
            ? 'bg-teal-800 text-white shadow-xs'
            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
        ]"
      >
        📊 Choraklik 100-Ballik Jurnal (10+50+40)
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-wrap items-center justify-between gap-3 transition-colors">
      <div class="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
        <input
          v-model="searchQuery"
          type="text"
          aria-label="O'quvchi ismi bo'yicha qidirish"
          placeholder="O'quvchi ismi bo'yicha qidirish..."
          class="px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-700 flex-1 min-w-[200px]"
        />

        <select
          v-model="selectedClass"
          aria-label="Sinf bo'yicha filtrlash"
          class="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-700 cursor-pointer min-h-[36px]"
        >
          <option value="">Barcha sinflar</option>
          <option v-for="cls in teacherStore.classes" :key="cls.id" :value="cls.name">
            {{ cls.name }}
          </option>
        </select>

        <template v-if="activeTab === 'quarter'">
          <select
            v-model.number="selectedQuarter"
            aria-label="Chorakni tanlash"
            class="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer min-h-[36px]"
          >
            <option :value="1">1-chorak</option>
            <option :value="2">2-chorak</option>
            <option :value="3">3-chorak</option>
            <option :value="4">4-chorak</option>
          </select>

          <select
            v-model="selectedSubject"
            aria-label="Fanni tanlash"
            class="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer min-h-[36px]"
          >
            <option v-for="sub in subjectOptions" :key="sub.code" :value="sub.code">
              {{ sub.name }}
            </option>
            <option value="ALL">Barcha fanlar</option>
          </select>
        </template>
      </div>

      <div class="text-xs font-semibold text-slate-500 dark:text-slate-400">
        {{ activeTab === 'submissions' ? `Topshirilgan ishlar: ${filteredResults.length} ta` : `O'quvchilar: ${filteredGradebookRows.length} ta` }}
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="teacherStore.isLoading || (activeTab === 'quarter' && teacherStore.isGradebookLoading)" class="text-center py-12">
      <div class="w-8 h-8 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Ma'lumotlar yuklanmoqda...</p>
    </div>

    <!-- Quarter 100-Point Gradebook Tab -->
    <div
      v-else-if="activeTab === 'quarter'"
      class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden transition-colors"
    >
      <div class="px-4 py-2.5 bg-teal-50/70 dark:bg-teal-950/40 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span class="font-semibold text-teal-900 dark:text-teal-200">
          MMTV Baholash Formulasi: Formativ (max 10) + BSB/Loyiha (max 50) + CHSB (max 40) = 100 ball
        </span>
        <span class="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800 font-mono text-[11px] text-teal-800 dark:text-teal-300">
          Standart: {{ teacherStore.gradebookPreset }}
        </span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="p-3">№</th>
              <th class="p-3">O'quvchi</th>
              <th class="p-3">Sinf</th>
              <th class="p-3">Sinf ishi (0–6)</th>
              <th class="p-3">Uy ishi (0–4)</th>
              <th class="p-3">FB (10)</th>
              <th class="p-3">BSB (50)</th>
              <th class="p-3">CHSB (40)</th>
              <th class="p-3">Jami (100)</th>
              <th class="p-3">Baho (2–5)</th>
              <th class="p-3 text-right">Saqlash</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/80">
            <tr v-for="(row, idx) in filteredGradebookRows" :key="row.studentId" class="hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition">
              <td class="p-3 text-slate-400 font-mono">{{ idx + 1 }}</td>
              <td class="p-3 font-bold text-slate-900 dark:text-white">{{ row.studentName }}</td>
              <td class="p-3 text-slate-600 dark:text-slate-300">{{ row.className }}</td>
              <td class="p-3">
                <input
                  v-if="draftFormative[row.studentId]"
                  v-model.number="draftFormative[row.studentId]!.classwork"
                  type="number"
                  min="0"
                  max="6"
                  step="0.5"
                  aria-label="Sinf ishi balli"
                  class="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 font-mono text-center text-slate-900 dark:text-white"
                />
              </td>
              <td class="p-3">
                <input
                  v-if="draftFormative[row.studentId]"
                  v-model.number="draftFormative[row.studentId]!.homework"
                  type="number"
                  min="0"
                  max="4"
                  step="0.5"
                  aria-label="Uy ishi balli"
                  class="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 font-mono text-center text-slate-900 dark:text-white"
                />
              </td>
              <td class="p-3 font-mono font-semibold text-slate-700 dark:text-slate-200">{{ row.formativeScore }}</td>
              <td class="p-3 font-mono font-semibold text-slate-700 dark:text-slate-200">{{ row.bsbScore }}</td>
              <td class="p-3 font-mono font-semibold text-slate-700 dark:text-slate-200">{{ row.chsbScore }}</td>
              <td class="p-3 font-mono font-bold text-teal-800 dark:text-teal-300 text-sm">{{ row.totalScore100 }}</td>
              <td class="p-3">
                <span class="px-2 py-0.5 rounded font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {{ row.grade5 }}
                </span>
              </td>
              <td class="p-3 text-right">
                <button
                  type="button"
                  @click="handleSaveFormative(row.studentId)"
                  :disabled="savingStudentId === row.studentId"
                  class="px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold cursor-pointer disabled:bg-slate-400"
                >
                  {{ savingStudentId === row.studentId ? '...' : 'Saqlash' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredGradebookRows.length === 0" class="text-center py-10 text-xs text-slate-500 dark:text-slate-400">
        Jurnal uchun o'quvchilar topilmadi.
      </div>
    </div>

    <!-- Results Table -->
    <div v-else class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden transition-colors">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs sm:text-sm">
          <thead class="bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="p-3.5">№</th>
              <th class="p-3.5">O'quvchi F.I.SH.</th>
              <th class="p-3.5">Sinf</th>
              <th class="p-3.5">To'plangan Ball</th>
              <th class="p-3.5">Foiz (%)</th>
              <th class="p-3.5">Topshirilgan Vaqt</th>
              <th class="p-3.5">Holati</th>
              <th class="p-3.5 text-right">O'quvchi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/80">
            <tr
              v-for="(res, idx) in filteredResults"
              :key="res.attemptId"
              class="hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition"
            >
              <td class="p-3.5 text-slate-400 font-mono">{{ idx + 1 }}</td>
              <td class="p-3.5 font-bold text-slate-900 dark:text-white">{{ res.studentName }}</td>
              <td class="p-3.5 font-medium text-slate-700 dark:text-slate-300">{{ res.className }}</td>
              <td class="p-3.5">
                <span class="font-bold text-teal-800 dark:text-teal-400 text-sm">
                  {{ res.score }}
                </span>
                <span class="text-slate-400 dark:text-slate-400 text-xs"> / {{ res.maxScore }}</span>
              </td>
              <td class="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{{ res.percentage }}%</td>
              <td class="p-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs">
                {{ res.submittedAt.slice(0, 16).replace('T', ' ') }}
              </td>
              <td class="p-3.5">
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-[11px] font-semibold border',
                    res.status === 'absent'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      : res.verifiedByTeacher
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  ]"
                >
                  {{
                    res.status === 'absent'
                      ? (res.absenceReason || 'Qatnashmadi')
                      : res.verifiedByTeacher
                        ? 'Tasdiqlangan'
                        : res.status === 'pending_review'
                          ? 'Tekshirish kutilmoqda'
                          : 'Dastlabki'
                  }}
                </span>
              </td>
              <td class="p-3.5 text-right">
                <div class="flex items-center justify-end gap-1.5 flex-wrap">
                  <button
                    type="button"
                    @click="openGradingModal(res)"
                    class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition cursor-pointer min-h-[32px] inline-flex items-center gap-1"
                    title="Rasmiy mezon asosida baholash"
                  >
                    <span>🏛️</span>
                    <span>Baholash</span>
                  </button>
                  <button
                    type="button"
                    @click="handleMarkAbsence(res.attemptId)"
                    class="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition cursor-pointer min-h-[32px]"
                    title="Sababli/sababsiz qatnashmagan deb belgilash"
                  >
                    Kelmagan
                  </button>
                  <button
                    type="button"
                    @click="handleReopenAttempt(res.attemptId)"
                    class="px-2 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition cursor-pointer min-h-[32px]"
                    title="Imtihon urinishini qayta ochish"
                  >
                    Qayta ochish
                  </button>
                  <router-link
                    :to="`/t/${tenantSlug}/teacher/students/${res.rosterRecordId}`"
                    class="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline min-h-[32px] inline-flex items-center px-1"
                  >
                    Ko'rish →
                  </router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredResults.length === 0" class="text-center py-10 text-xs text-slate-500 dark:text-slate-400">
        Natijalar topilmadi.
      </div>
    </div>

    <!-- Rubric Grading Modal -->
    <BsbRubricGradingModal
      :is-open="isGradingModalOpen"
      :result="gradingResult"
      @close="isGradingModalOpen = false"
      @save="handleSaveGrading"
    />
  </div>
</template>

