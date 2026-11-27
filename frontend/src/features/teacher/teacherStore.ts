import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ClassGroup } from '../../entities/class-group/model';
import type { StudentRosterRecord } from '../../entities/roster/model';
import type { AssessmentSummary, CreateAssessmentInput } from '../../entities/assessment/model';
import type { AssessmentResult } from '../../entities/result/model';
import type {
  TeacherProfile,
  ClassDetail,
  StudentDetail,
  AssessmentDetail,
  AnalyticsData,
  ReportItem,
  QuarterGradebookRow,
  GradeResultInput,
  FormativeScoreInput,
  StudentsMasteryResponse,
  StudentMasteryDetail,
} from '../../entities/teacher/model';
import { GRADING_SCALE_PRESETS, type GradingPresetKey } from '../../entities/emaktab/model';
import { api } from '../../shared/api';

export const useTeacherStore = defineStore('teacher', () => {
  const currentTenantId = ref<string | null>(null);
  const classes = ref<ClassGroup[]>([]);
  const roster = ref<StudentRosterRecord[]>([]);
  const selectedClassId = ref<string | null>(null);
  const selectedGroupFilter = ref<'ALL' | '1-guruh' | '2-guruh' | 'NONE'>('ALL');
  const studentSearchQuery = ref('');
  const assessments = ref<AssessmentSummary[]>([]);
  const results = ref<AssessmentResult[]>([]);
  const profile = ref<TeacherProfile | null>(null);
  const classDetail = ref<ClassDetail | null>(null);
  const studentDetail = ref<StudentDetail | null>(null);
  const assessmentDetail = ref<AssessmentDetail | null>(null);
  const analytics = ref<AnalyticsData | null>(null);
  const reportData = ref<ReportItem[]>([]);
  const quarterGradebookRows = ref<QuarterGradebookRow[]>([]);
  const gradebookPreset = ref<GradingPresetKey>('MMTV_STANDARD');
  const studentsMastery = ref<StudentsMasteryResponse | null>(null);
  const studentMasteryDetail = ref<StudentMasteryDetail | null>(null);
  const isLoading = ref(false);
  const isGradebookLoading = ref(false);
  const errorMessage = ref<string | null>(null);

  const filteredRoster = computed(() => {
    let list = roster.value;
    if (selectedClassId.value) {
      list = list.filter((r) => r.classGroupId === selectedClassId.value);
    }
    if (selectedGroupFilter.value !== 'ALL') {
      if (selectedGroupFilter.value === 'NONE') {
        list = list.filter((r) => !r.group || r.group === 'Guruhsiz');
      } else {
        list = list.filter((r) => r.group === selectedGroupFilter.value);
      }
    }
    const q = studentSearchQuery.value.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.firstName.toLowerCase().includes(q) ||
          r.lastName.toLowerCase().includes(q) ||
          r.rosterCode.toLowerCase().includes(q) ||
          (r.emaktabId && r.emaktabId.includes(q))
      );
    }
    return list;
  });

  const totalRosterCount = computed(() => roster.value.length);
  const totalClassesCount = computed(() => classes.value.length);
  const averageScore = computed(() => {
    if (results.value.length === 0) return 0;
    const sum = results.value.reduce((acc, r) => acc + r.score, 0);
    return Number((sum / results.value.length).toFixed(1));
  });

  async function loadTeacherData(tenantId: string, force = false): Promise<boolean> {
    if (!force && currentTenantId.value === tenantId && classes.value.length > 0) {
      return true;
    }

    currentTenantId.value = tenantId;
    classes.value = [];
    roster.value = [];
    selectedClassId.value = null;
    studentSearchQuery.value = '';
    assessments.value = [];
    results.value = [];
    profile.value = null;
    classDetail.value = null;
    studentDetail.value = null;
    assessmentDetail.value = null;
    analytics.value = null;
    reportData.value = [];
    isLoading.value = true;
    errorMessage.value = null;

    try {
      const [classList, rosterList, assessmentList, resultList, prof, an, rep] = await Promise.all([
        api.teacher.getClasses(tenantId),
        api.teacher.getRoster(tenantId),
        api.teacher.getAssessments(tenantId),
        api.teacher.getResults(tenantId),
        api.teacher.getProfile(tenantId),
        api.teacher.getAnalytics(tenantId),
        api.teacher.generateReportData(tenantId),
      ]);

      classes.value = classList;
      roster.value = rosterList;
      assessments.value = assessmentList;
      results.value = resultList;
      profile.value = prof;
      analytics.value = an;
      reportData.value = rep;
      return true;
    } catch {
      errorMessage.value = "O'qituvchi ma'lumotlarini yuklashda xatolik yuz berdi.";
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function loadClassDetail(tenantId: string, classId: string): Promise<boolean> {
    isLoading.value = true;
    classDetail.value = null;
    try {
      classDetail.value = await api.teacher.getClassDetail(tenantId, classId);
      return classDetail.value !== null;
    } catch {
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function loadStudentDetail(tenantId: string, studentId: string): Promise<boolean> {
    isLoading.value = true;
    studentDetail.value = null;
    try {
      studentDetail.value = await api.teacher.getStudentDetail(tenantId, studentId);
      return studentDetail.value !== null;
    } catch {
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function loadAssessmentDetail(tenantId: string, assessmentId: string): Promise<boolean> {
    isLoading.value = true;
    assessmentDetail.value = null;
    try {
      assessmentDetail.value = await api.teacher.getAssessmentDetail(tenantId, assessmentId);
      return assessmentDetail.value !== null;
    } catch {
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  function filterByClass(classGroupId: string | null) {
    selectedClassId.value = classGroupId;
  }

  function filterByGroup(group: 'ALL' | '1-guruh' | '2-guruh' | 'NONE') {
    selectedGroupFilter.value = group;
  }

  function selectClass(classGroupId: string | null) {
    selectedClassId.value = classGroupId;
  }

  function setSearchQuery(query: string) {
    studentSearchQuery.value = query;
  }

  function exportResultsCSV(): string {
    const headers = [
      '№',
      "O'quvchi F.I.SH.",
      'Sinf',
      'Roster Kodi',
      'Imtihon',
      'Ball',
      'Maksimal Ball',
      'Foiz (%)',
      'Topshirilgan Vaqt',
      'Holati',
    ];

    const rows = reportData.value.map((item, index) => [
      String(index + 1),
      `"${item.studentName.replace(/"/g, '""')}"`,
      `"${item.className}"`,
      item.rosterCode,
      `"${item.assessmentTitle}"`,
      item.score.toFixed(1),
      item.maxScore.toFixed(1),
      `${item.percentage}%`,
      item.submittedAt,
      item.status,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }

  function addClass(newCls: ClassGroup): void {
    const existing = classes.value.find((c) => c.id === newCls.id);
    if (!existing) {
      classes.value.push(newCls);
    }
  }

  function addRosterRecord(record: StudentRosterRecord): void {
    const existingIdx = roster.value.findIndex((r) => r.id === record.id || r.rosterCode === record.rosterCode);
    if (existingIdx !== -1) {
      roster.value[existingIdx] = record;
    } else {
      roster.value.push(record);
    }
  }

  function addRosterRecords(records: StudentRosterRecord[]): void {
    for (const rec of records) {
      addRosterRecord(rec);
    }
  }

  function removeRosterRecord(id: string): void {
    roster.value = roster.value.filter((r) => r.id !== id && r.rosterCode !== id);
  }

  function removeRosterRecordsByClass(classGroupId: string): void {
    roster.value = roster.value.filter((r) => r.classGroupId !== classGroupId);
  }

  function removeRosterRecordsByIds(ids: string[]): void {
    const set = new Set(ids);
    roster.value = roster.value.filter((r) => !set.has(r.id) && !set.has(r.rosterCode));
  }

  async function createAssessment(input: CreateAssessmentInput): Promise<AssessmentSummary> {
    isLoading.value = true;
    errorMessage.value = null;
    try {
      const created = await api.teacher.createAssessment(input);
      assessments.value.unshift(created);
      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Imtihon yaratishda xatolik yuz berdi.";
      errorMessage.value = msg;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function updateStudentScore(attemptId: string, newScore: number, isVerified = true): void {
    const resIdx = results.value.findIndex((r) => r.attemptId === attemptId);
    if (resIdx !== -1) {
      const current = results.value[resIdx]!;
      const pct = Math.round((newScore / current.maxScore) * 100);
      results.value[resIdx] = {
        ...current,
        score: newScore,
        percentage: pct,
        verifiedByTeacher: isVerified,
      };
    }
  }

  async function gradeStudentResult(attemptId: string, input: GradeResultInput): Promise<void> {
    const verified = input.verifiedByTeacher ?? true;
    updateStudentScore(attemptId, input.score, verified);
    if (api.teacher.gradeResult) {
      try {
        const persisted = await api.teacher.gradeResult(attemptId, input);
        const resIdx = results.value.findIndex((r) => r.attemptId === attemptId);
        if (resIdx !== -1) {
          results.value[resIdx] = {
            ...results.value[resIdx]!,
            score: persisted.score ?? input.score,
            percentage: persisted.percentage ?? results.value[resIdx]!.percentage,
            verifiedByTeacher: persisted.verifiedByTeacher ?? verified,
            teacherNote: input.feedback,
          };
        }
      } catch (err) {
        errorMessage.value = err instanceof Error ? err.message : "Bahoni saqlashda xatolik.";
        throw err;
      }
    }
  }

  function computeGrade5(total100: number, preset: GradingPresetKey): string {
    const t = GRADING_SCALE_PRESETS[preset].thresholds;
    if (total100 >= t.grade5Min) return '5';
    if (total100 >= t.grade4Min) return '4';
    if (total100 >= t.grade3Min) return '3';
    return '2';
  }

  async function loadQuarterGradebook(
    tenantId: string,
    options?: { classGroupId?: string; subjectCode?: string; quarter?: number; academicYear?: string }
  ): Promise<void> {
    if (!api.teacher.getQuarterGradebook) return;
    isGradebookLoading.value = true;
    errorMessage.value = null;
    try {
      const data = await api.teacher.getQuarterGradebook(tenantId, options);
      quarterGradebookRows.value = data.rows;
      gradebookPreset.value = data.preset;
    } catch (err) {
      errorMessage.value = err instanceof Error ? err.message : "Choraklik jurnalni yuklashda xatolik.";
    } finally {
      isGradebookLoading.value = false;
    }
  }

  async function saveFormativeScore(input: FormativeScoreInput): Promise<void> {
    const cw = Number(Math.min(6, Math.max(0, input.classwork)).toFixed(1));
    const hw = Number(Math.min(4, Math.max(0, input.homework)).toFixed(1));
    const fbTotal = Number(Math.min(10, cw + hw).toFixed(1));

    if (api.teacher.saveFormativeScore) {
      await api.teacher.saveFormativeScore({ ...input, classwork: cw, homework: hw });
    }

    const idx = quarterGradebookRows.value.findIndex((r) => r.studentId === input.studentId);
    if (idx !== -1) {
      const current = quarterGradebookRows.value[idx]!;
      const total100 = Number(Math.min(100, fbTotal + current.bsbScore + current.chsbScore).toFixed(1));
      quarterGradebookRows.value[idx] = {
        ...current,
        classwork: cw,
        homework: hw,
        formativeScore: fbTotal,
        totalScore100: total100,
        grade5: computeGrade5(total100, current.preset || gradebookPreset.value),
      };
    }
  }

  async function loadStudentsMastery(
    tenantId: string,
    options?: { classGroupId?: string; quarter?: number }
  ): Promise<void> {
    if (!api.teacher.getStudentsMastery) return;
    try {
      studentsMastery.value = await api.teacher.getStudentsMastery(tenantId, options);
    } catch {
      studentsMastery.value = null;
    }
  }

  async function loadStudentMastery(
    tenantId: string,
    studentId: string,
    quarter = 1
  ): Promise<void> {
    if (!api.teacher.getStudentMastery) return;
    try {
      studentMasteryDetail.value = await api.teacher.getStudentMastery(tenantId, studentId, quarter);
    } catch {
      studentMasteryDetail.value = null;
    }
  }

  return {
    currentTenantId,
    classes,
    addClass,
    updateStudentScore,
    gradeStudentResult,
    quarterGradebookRows,
    gradebookPreset,
    studentsMastery,
    studentMasteryDetail,
    isGradebookLoading,
    loadQuarterGradebook,
    saveFormativeScore,
    loadStudentsMastery,
    loadStudentMastery,
    roster,
    addRosterRecord,
    addRosterRecords,
    removeRosterRecord,
    removeRosterRecordsByClass,
    removeRosterRecordsByIds,
    selectedClassId,
    studentSearchQuery,
    assessments,
    createAssessment,
    results,
    profile,
    classDetail,
    studentDetail,
    assessmentDetail,
    analytics,
    reportData,
    filteredRoster,
    totalRosterCount,
    totalClassesCount,
    averageScore,
    isLoading,
    errorMessage,
    loadTeacherData,
    loadClassDetail,
    loadStudentDetail,
    loadAssessmentDetail,
    filterByClass,
    selectedGroupFilter,
    filterByGroup,
    selectClass,
    setSearchQuery,
    exportResultsCSV,
  };
});

