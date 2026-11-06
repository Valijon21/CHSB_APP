import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ClassGroup } from '../../entities/class-group/model';
import type { StudentRosterRecord } from '../../entities/roster/model';
import type { AssessmentSummary } from '../../entities/assessment/model';
import type { AssessmentResult } from '../../entities/result/model';
import { api } from '../../shared/api';

export const useTeacherStore = defineStore('teacher', () => {
  const currentTenantId = ref<string | null>(null);
  const classes = ref<ClassGroup[]>([]);
  const roster = ref<StudentRosterRecord[]>([]);
  const selectedClassId = ref<string | null>(null);
  const assessments = ref<AssessmentSummary[]>([]);
  const results = ref<AssessmentResult[]>([]);
  const isLoading = ref(false);
  const errorMessage = ref<string | null>(null);

  const filteredRoster = computed(() => {
    if (!selectedClassId.value) return roster.value;
    return roster.value.filter((r) => r.classGroupId === selectedClassId.value);
  });

  const totalRosterCount = computed(() => roster.value.length);
  const totalClassesCount = computed(() => classes.value.length);
  const averageScore = computed(() => {
    if (results.value.length === 0) return 0;
    const sum = results.value.reduce((acc, r) => acc + r.score, 0);
    return Number((sum / results.value.length).toFixed(1));
  });

  async function loadTeacherData(tenantId: string): Promise<boolean> {
    if (currentTenantId.value === tenantId && classes.value.length > 0) {
      return true; // Already loaded for this tenant
    }

    // Reset when switching tenant
    currentTenantId.value = tenantId;
    classes.value = [];
    roster.value = [];
    selectedClassId.value = null;
    assessments.value = [];
    results.value = [];
    isLoading.value = true;
    errorMessage.value = null;

    try {
      const [classList, rosterList, assessmentList, resultList] = await Promise.all([
        api.teacher.getClasses(tenantId),
        api.teacher.getRoster(tenantId),
        api.teacher.getAssessments(tenantId),
        api.teacher.getResults(tenantId),
      ]);

      classes.value = classList;
      roster.value = rosterList;
      assessments.value = assessmentList;
      results.value = resultList;
      return true;
    } catch {
      errorMessage.value = "O'qituvchi ma'lumotlarini yuklashda xatolik yuz berdi.";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  function selectClass(classId: string | null) {
    selectedClassId.value = classId;
  }

  return {
    currentTenantId,
    classes,
    roster,
    selectedClassId,
    filteredRoster,
    assessments,
    results,
    totalRosterCount,
    totalClassesCount,
    averageScore,
    isLoading,
    errorMessage,
    loadTeacherData,
    selectClass,
  };
});
