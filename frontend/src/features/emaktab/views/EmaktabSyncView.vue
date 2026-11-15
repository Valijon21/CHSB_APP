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

onMounted(async () => {
  const initialAsmId = (route?.params?.assessmentId as string) || 'asm-algebra-01';
  // Boshlang'ich shablonni o'rnatish
  if (store.emaktabStudents.length === 0) {
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

    const assessmentId = (route?.params?.assessmentId as string) || 'chsb-inf-11-q1';
    const asm = teacherStore.assessments.find((a) => a.id === assessmentId || a.title.includes(assessmentId));

    // Real assessment results
    const matchingResults = teacherStore.results.filter((r) => r.assessmentId === assessmentId);
    const effectiveResults = matchingResults.length > 0 ? matchingResults : teacherStore.results;

    if (effectiveResults.length > 0) {
      const realCandidates: AssessmentCandidate[] = effectiveResults.map((r) => ({
        candidateId: r.attemptId,
        fullName: r.studentName,
        normalizedName: r.studentName.toLowerCase().replace(/['`ʻ’]/g, ''),
        score: r.score,
        maxScore: r.maxScore,
        percentage: r.percentage,
        status: 'submitted',
      }));

      const activeClassName = asm ? `${asm.grade}-sinf` : '11-sinf';
      const activeSubject = asm ? asm.subject : 'Informatika va AT';
      const activeQuarter = asm ? asm.quarter : 1;

      store.setAssessmentContext({
        assessmentId,
        className: activeClassName,
        subjectName: activeSubject,
        quarter: activeQuarter,
        initialCandidates: realCandidates,
      });
    }
  } catch {
    // Keep initialized fallback
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
        </div>

        <p class="text-xs text-slate-500 dark:text-slate-400">
          CHSB natijalarini eMaktab jurnaliga avtomatik solishtirish, 5 ballik baholash shkalasiga o'tkazish va 1-bosishda eksport qilish
        </p>
      </div>

      <!-- Live Room ga o'tish tugmasi -->
      <router-link
        :to="`/t/${route?.params?.tenantSlug ?? 'xorazm-demo'}/teacher/assessments/${store.assessmentId}/live`"
        class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
      >
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Jonli Nazorat Zali
      </router-link>
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
