<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEmaktabSyncStore } from '../store/emaktabSyncStore';
import { useTeacherStore } from '../../teacher/teacherStore';
import { useTenantStore } from '../../tenant-context/tenantStore';
import RosterUploadCard from '../components/RosterUploadCard.vue';
import ReconciliationGrid from '../components/ReconciliationGrid.vue';
import GradeThresholdsModal from '../components/GradeThresholdsModal.vue';
import SyncActionsBar from '../components/SyncActionsBar.vue';
import type { MatchStatus, AbsenceReason, GradeScaleThresholds, AssessmentCandidate } from '../../../entities/emaktab/model';

const route = useRoute();
const router = useRouter();
const store = useEmaktabSyncStore();
const teacherStore = useTeacherStore();
const tenantStore = useTenantStore();

const isThresholdsModalOpen = ref<boolean>(false);
const selectedGroup = ref<'ALL' | '1-guruh' | '2-guruh'>('ALL');

function loadGroupCandidates() {
  const assessmentId = (route?.params?.assessmentId as string) || 'asm-algebra-01';
  const asm = teacherStore.assessments.find(
    (a) => a.id === assessmentId || a.title.includes(assessmentId)
  );

  // Respect assessment targetGroup on initial load if not explicitly switched
  const groupLabel = selectedGroup.value === 'ALL' ? 'Butun sinf' : selectedGroup.value;

  // Only match results belonging to THIS assessment (never bleed results from other exams)
  const matchingResults = teacherStore.results.filter((r) => r.assessmentId === assessmentId);

  const gradeClasses = asm
    ? teacherStore.classes.filter((c) => c.grade === asm.grade)
    : teacherStore.classes;
  const gradeClassIds = new Set(gradeClasses.map((c) => c.id));
  const gradeClassMap = new Map(gradeClasses.map((c) => [c.id, c.name]));

  const targetStudents = teacherStore.roster.filter((s) => {
    if (asm && gradeClassIds.size > 0 && !gradeClassIds.has(s.classGroupId)) {
      return false;
    }
    if (asm && gradeClassIds.size === 0) {
      return false;
    }
    if (selectedGroup.value === 'ALL') return true;
    return (s.group || '1-guruh') === selectedGroup.value;
  });

  const targetIds = new Set(targetStudents.map((s) => s.id));
  const groupFilteredResults =
    targetStudents.length > 0
      ? matchingResults.filter((r) => targetIds.has(r.rosterRecordId))
      : matchingResults;

  const realCandidates: AssessmentCandidate[] = groupFilteredResults.map((r) => ({
    candidateId: r.attemptId,
    fullName: r.studentName,
    normalizedName: r.studentName.toLowerCase().replace(/['`ʻ’]/g, ''),
    score: r.score,
    maxScore: r.maxScore,
    percentage: r.percentage,
    status: 'submitted',
  }));

  const activeClassName = asm
    ? `${asm.grade}-sinf (${groupLabel})`
    : gradeClasses[0]?.name
      ? `${gradeClasses[0].name} (${groupLabel})`
      : `Sinf (${groupLabel})`;
  const activeSubject = asm ? asm.subject : 'Fan';
  const activeQuarter = asm ? asm.quarter : 1;

  store.setAssessmentContext({
    assessmentId,
    className: activeClassName,
    subjectName: activeSubject,
    quarter: activeQuarter,
    initialCandidates: realCandidates,
  });

  if (targetStudents.length > 0) {
    const csvLines = ["T/r,eMaktab ID,O'quvchi F.I.SH,Jinsi"];
    targetStudents.forEach((s, idx) => {
      const fullName = `${s.lastName} ${s.firstName}`.trim();
      const emkId = s.emaktabId || s.rosterCode;
      csvLines.push(`${idx + 1},${emkId},${fullName},M`);
    });
    const firstClass = gradeClassMap.get(targetStudents[0]!.classGroupId) || activeClassName;
    store.importRosterFromText(csvLines.join('\n'), firstClass);
  } else {
    store.emaktabStudents = [];
    store.runReconciliation();
  }
}

function selectGroup(grp: 'ALL' | '1-guruh' | '2-guruh') {
  selectedGroup.value = grp;
  loadGroupCandidates();
}

onMounted(async () => {
  const routeAsmId = route?.params?.assessmentId as string | undefined;
  const initialAsmId = routeAsmId || teacherStore.assessments[0]?.id || 'chsb-inf-11-q1';
  if (initialAsmId === 'asm-algebra-01' && store.emaktabStudents.length === 0) {
    store.setAssessmentContext({
      assessmentId: initialAsmId,
      className: '9-A',
      subjectName: 'Matematika',
      quarter: 2,
    });
    const defaultRoster = `T/r,eMaktab ID,O'quvchi F.I.SH,Jinsi
1,EMK-1001,O'ktamov Jasurbek,M
2,EMK-1002,Aliyeva Madina,F
3,EMK-1003,Boboyev Sardor,M
4,EMK-1004,G'aniyeva Dilnoza,F
5,EMK-1005,Yo'ldoshev Bekzod,M`;
    store.importRosterFromText(defaultRoster, '9-A');
  }

  const tenantSlug = (route?.params?.tenantSlug as string) || 'al-xorazmiy';
  try {
    await tenantStore.loadTenant(tenantSlug);
    const tenantId =
      tenantStore.currentTenant?.tenantId ||
      (tenantSlug === 'temurbeklar-maktabi' ? 'tenant-temurbeklar' : 'tenant-al-xorazmiy');

    await teacherStore.loadTeacherData(tenantId);
    if (initialAsmId !== 'asm-algebra-01') {
      const asm = teacherStore.assessments.find((a) => a.id === initialAsmId || a.title.includes(initialAsmId));
      if (asm?.targetGroup === '1-guruh' || asm?.targetGroup === '2-guruh') {
        selectedGroup.value = asm.targetGroup;
      } else {
        selectedGroup.value = 'ALL';
      }
      loadGroupCandidates();
    }
  } catch {
    // Keep current state
  }
});

function handleImportRoster(content: string) {
  store.importRosterFromText(content);
}

function handleFilterChange(filter: 'all' | MatchStatus) {
  store.setFilter(filter);
}

function handleManualMatch(payload: { emaktabId: string; candidateId: string | null }) {
  store.setManualMatch(payload.emaktabId, payload.candidateId);
}

function handleSetAbsence(payload: { matchId: string; reason: AbsenceReason }) {
  store.setAbsenceReason(payload.matchId, payload.reason);
}

function handleSaveThresholds(newThresholds: GradeScaleThresholds) {
  store.updateThresholds(newThresholds);
}

function goBack() {
  if (router) {
    router.back();
  }
}
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans">
    <!-- Header va Navigatsiya -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div class="space-y-1">
        <div class="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <button
            type="button"
            @click="goBack"
            class="hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Ortga qaytish
          </button>
          <span>/</span>
          <span>Baholashlar</span>
          <span>/</span>
          <span class="text-teal-700 dark:text-teal-400">eMaktab Sinxronizatsiyasi</span>
        </div>

        <div class="flex items-center gap-3">
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            eMaktab (Kundalik) Baholarni O'tkazish
          </h1>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
            {{ store.className }} &bull; {{ store.subjectName }}
          </span>

          <!-- Guruh tanlash tugmalari -->
          <div class="inline-flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              @click="selectGroup('ALL')"
              :class="[
                'px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer',
                selectedGroup === 'ALL'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              ]"
            >
              Butun sinf
            </button>
            <button
              type="button"
              @click="selectGroup('1-guruh')"
              :class="[
                'px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer',
                selectedGroup === '1-guruh'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              ]"
            >
              1-guruh
            </button>
            <button
              type="button"
              @click="selectGroup('2-guruh')"
              :class="[
                'px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer',
                selectedGroup === '2-guruh'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              ]"
            >
              2-guruh
            </button>
          </div>
        </div>

        <p class="text-xs text-slate-500 dark:text-slate-400">
          CHSB natijalarini eMaktab jurnaliga avtomatik solishtirish, 5 ballik baholash shkalasiga o'tkazish va 1-bosishda eksport qilish
        </p>
      </div>

      <!-- Live Room ga o'tish tugmasi -->
      <router-link
        :to="`/t/${route?.params?.tenantSlug ?? 'al-xorazmiy'}/teacher/assessments/${store.assessmentId}/live`"
        class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
      >
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Jonli Nazorat Zali
      </router-link>
    </div>

    <!-- eMaktab Maqsadi va Avtomatik Holat Banneri -->
    <div class="p-4 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 text-xs leading-relaxed flex items-start gap-3">
      <span class="text-lg">💡</span>
      <div class="space-y-1">
        <h4 class="font-bold text-slate-900 dark:text-white">eMaktab (kundalik.com) Sinxronizatsiyasi Haqida:</h4>
        <p class="text-slate-600 dark:text-slate-300">
          Ushbu sahifa CHSB imtihon baholarini davlat <strong>eMaktab (kundalik.com)</strong> elektron jurnaliga 1-bosishda (Ctrl+V yoki CSV orqali) ko'chirib o'tkazish uchun xizmat qiladi. Sinfingizdagi barcha o'quvchilar va ularning baholari pastdagi solishtirish jadvalida avtomatik shakllantirilgan. Agar jurnal formatidagi alohida faylni solishtirmoqchi bo'lsangiz, quyidagi yuklash kartasidan foydalanishingiz mumkin.
        </p>
      </div>
    </div>

    <!-- 1. Ro'yxatni yuklash qismi (Roster Upload) -->
    <RosterUploadCard @import-roster="handleImportRoster" />

    <!-- 2. Statistika va Asosiy Amallar Paneli (Sync Actions Bar) -->
    <SyncActionsBar
      :stats="store.stats"
      :clipboard-copied="store.clipboardCopied"
      @copy-clipboard="store.copyClipboardGrades"
      @download-csv="store.downloadCsv"
      @open-thresholds="isThresholdsModalOpen = true"
    />

    <!-- 3. Ikki tomonlama solishtirish jadvali (Reconciliation Grid) -->
    <ReconciliationGrid
      :pairs="store.filteredPairs"
      :all-candidates="store.candidates"
      :active-filter="store.selectedFilter"
      @change-filter="handleFilterChange"
      @manual-match="handleManualMatch"
      @set-absence="handleSetAbsence"
    />

    <!-- 5 Ballik Mezonlarni Sozlash Modali -->
    <GradeThresholdsModal
      :is-open="isThresholdsModalOpen"
      :thresholds="store.thresholds"
      @close="isThresholdsModalOpen = false"
      @save="handleSaveThresholds"
    />
  </div>
</template>
