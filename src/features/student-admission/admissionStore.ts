import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { RosterMatch } from '../../entities/roster/model';
import { api } from '../../shared/api';

export type AdmissionState = 'idle' | 'looking_up' | 'match_found' | 'admitted' | 'error';

export const useStudentAdmissionStore = defineStore('studentAdmission', () => {
  const currentMatch = ref<RosterMatch | null>(null);
  const status = ref<AdmissionState>('idle');
  const errorMessage = ref<string | null>(null);
  const confirmedStudent = ref<RosterMatch | null>(null);
  const activeAssessmentId = ref<string | null>(null);

  async function lookup(tenantSlug: string, rosterCode: string): Promise<boolean> {
    const trimmed = rosterCode.trim().toUpperCase();
    if (!trimmed) {
      errorMessage.value = "Iltimos, o'quvchi kodingizni kiriting.";
      status.value = 'error';
      return false;
    }

    status.value = 'looking_up';
    errorMessage.value = null;
    currentMatch.value = null;

    try {
      const result = await api.roster.lookup({
        tenantSlug,
        rosterCode: trimmed,
      });

      if (result.status === 'success') {
        currentMatch.value = result.match;
        status.value = 'match_found';
        return true;
      }

      errorMessage.value = result.message;
      status.value = 'error';
      return false;
    } catch {
      errorMessage.value = "Kutilmagan xatolik yuz berdi. Qaytadan urinib ko'ring.";
      status.value = 'error';
      return false;
    }
  }

  function confirmIdentity(): boolean {
    if (!currentMatch.value) {
      errorMessage.value = "Tasdiqlash uchun o'quvchi ma'lumoti topilmadi.";
      status.value = 'error';
      return false;
    }

    confirmedStudent.value = currentMatch.value;
    const available = currentMatch.value.availableAssessmentIds;
    activeAssessmentId.value = available[0] ?? 'chsb-inf-11-q1';
    status.value = 'admitted';
    return true;
  }

  function reset() {
    currentMatch.value = null;
    status.value = 'idle';
    errorMessage.value = null;
    confirmedStudent.value = null;
    activeAssessmentId.value = null;
  }

  return {
    currentMatch,
    status,
    errorMessage,
    confirmedStudent,
    activeAssessmentId,
    lookup,
    confirmIdentity,
    reset,
  };
});
