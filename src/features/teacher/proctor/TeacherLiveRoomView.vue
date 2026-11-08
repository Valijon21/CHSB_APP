<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useLiveProctorStore } from './liveProctorStore';
import type { LiveStudentSession, ProctorActionType } from '../../../entities/proctor/model';
import StudentLiveCard from './components/StudentLiveCard.vue';
import ProctorActionModal from './components/ProctorActionModal.vue';
import LiveAuditTimeline from './components/LiveAuditTimeline.vue';

const route = useRoute();
const proctorStore = useLiveProctorStore();

const tenantSlug = (route?.params?.tenantSlug as string) || 'al-xorazmiy';
const assessmentId = (route?.params?.assessmentId as string) || 'chsb-inf-11-q1';

// Modal state
const isActionModalOpen = ref(false);
const selectedActionType = ref<ProctorActionType | null>(null);
const selectedStudent = ref<LiveStudentSession | null>(null);

function handleAction(studentId: string, actionType: ProctorActionType) {
  const student = proctorStore.sessions.find((s) => s.rosterRecordId === studentId);
  if (student) {
    selectedStudent.value = student;
    selectedActionType.value = actionType;
    isActionModalOpen.value = true;
  }
}

function handleConfirmAction(payload: {
  extraSeconds?: number;
  warningMessage?: string;
  reason: string;
}) {
  if (!selectedStudent.value || !selectedActionType.value) return;

  const studentId = selectedStudent.value.rosterRecordId;
  if (selectedActionType.value === 'grant_time' && payload.extraSeconds) {
    proctorStore.grantExtraTime(studentId, payload.extraSeconds, payload.reason);
  } else if (selectedActionType.value === 'send_warning' && payload.warningMessage) {
    proctorStore.sendWarning(studentId, payload.warningMessage);
  } else if (selectedActionType.value === 'force_submit') {
    proctorStore.forceSubmit(studentId, payload.reason);
  }

  isActionModalOpen.value = false;
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Breadcrumb and Live Indicator -->
    <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <router-link
            :to="`/t/${tenantSlug}/teacher/assessments`"
            class="text-xs text-slate-500 hover:text-teal-700 transition"
          >
            ← Testlar ro'yxatiga qaytish
          </router-link>
          <span class="text-slate-300">|</span>
          <router-link
            :to="`/t/${tenantSlug}/teacher/assessments/${assessmentId}/emaktab-sync`"
            class="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium flex items-center gap-1"
          >
            eMaktab Sinxronizatsiyasi →
          </router-link>
        </div>
        <div class="flex items-center gap-2.5">
          <span class="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Jonli Nazorat Zali (Live Proctoring)
          </h1>
        </div>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Informatika va axborot texnologiyalari — 11-A sinf. 1-ChSB ({{ assessmentId }})
        </p>
      </div>

      <!-- Quick stats summary pills -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          @click="proctorStore.setStatusFilter('all')"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border',
            proctorStore.activeStatusFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          ]"
        >
          Barchasi ({{ proctorStore.totalCount }})
        </button>

        <button
          type="button"
          @click="proctorStore.setStatusFilter('warning')"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border',
            proctorStore.activeStatusFilter === 'warning'
              ? 'bg-rose-700 text-white border-rose-700'
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          ]"
        >
          Xavf ostida ({{ proctorStore.warningCount }})
        </button>

        <button
          type="button"
          @click="proctorStore.setStatusFilter('offline')"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border',
            proctorStore.activeStatusFilter === 'offline'
              ? 'bg-slate-700 text-white border-slate-700'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
          ]"
        >
          Oflayn ({{ proctorStore.offlineCount }})
        </button>

        <button
          type="button"
          @click="proctorStore.setStatusFilter('submitted')"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border',
            proctorStore.activeStatusFilter === 'submitted'
              ? 'bg-teal-800 text-white border-teal-800'
              : 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800'
          ]"
        >
          Topshirganlar ({{ proctorStore.submittedCount }})
        </button>
      </div>
    </div>

    <!-- Search and Filter Bar -->
    <div class="flex items-center justify-between gap-4">
      <div class="relative max-w-sm w-full">
        <input
          :value="proctorStore.searchQuery"
          @input="(e) => proctorStore.setSearchQuery((e.target as HTMLInputElement).value)"
          type="text"
          placeholder="O'quvchini ismi bo'yicha qidirish..."
          class="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700 shadow-2xs"
        />
        <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div class="text-xs text-slate-500 font-mono">
        Ko'rsatilmoqda: <strong>{{ proctorStore.filteredSessions.length }}</strong> ta o'quvchi
      </div>
    </div>

    <!-- Main Live Workspace: 3 Cols Grid, 1 Col Timeline -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Students Live Grid (Col 1-3) -->
      <div class="lg:col-span-3">
        <div v-if="proctorStore.filteredSessions.length > 0" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <StudentLiveCard
            v-for="session in proctorStore.filteredSessions"
            :key="session.rosterRecordId"
            :session="session"
            @action="handleAction"
          />
        </div>

        <div v-else class="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <p class="text-slate-500 text-sm">Tanlangan filtr bo'yicha o'quvchilar topilmadi.</p>
        </div>
      </div>

      <!-- Live Audit Timeline (Col 4) -->
      <div class="lg:col-span-1">
        <LiveAuditTimeline :events="proctorStore.eventStream" />
      </div>
    </div>

    <!-- Proctor Action Modal -->
    <ProctorActionModal
      :is-open="isActionModalOpen"
      :action-type="selectedActionType"
      :student="selectedStudent"
      @confirm="handleConfirmAction"
      @close="isActionModalOpen = false"
    />
  </div>
</template>
