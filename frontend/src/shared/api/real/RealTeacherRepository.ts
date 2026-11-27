import { httpClient } from '../httpClient';
import type { TeacherRepository } from '../repositories/TeacherRepository';
import type { ClassGroup } from '../../../entities/class-group/model';
import type { StudentRosterRecord } from '../../../entities/roster/model';
import type { Assessment, AssessmentSummary, CreateAssessmentInput } from '../../../entities/assessment/model';
import type { AssessmentResult } from '../../../entities/result/model';
import type {
  TeacherProfile,
  ClassDetail,
  StudentDetail,
  AssessmentDetail,
  AnalyticsData,
  ReportItem,
  GradeResultInput,
  FormativeScoreInput,
  QuarterGradebookResponse,
  StudentsMasteryResponse,
  StudentMasteryDetail,
} from '../../../entities/teacher/model';
import type {
  BackendAnalyticsResponse,
  BackendAssessmentItem,
  BackendClassItem,
  BackendStudentItem,
} from './types';

export class RealTeacherRepository implements TeacherRepository {
  async getClasses(tenantId: string): Promise<ClassGroup[]> {
    try {
      const list = await httpClient.get<BackendClassItem[]>('/classes', { params: { tenantSlug: tenantId } });
      return list.map((c) => ({
        id: c.id,
        schoolId: c.schoolId,
        tenantId: c.tenantId,
        name: c.name,
        grade: c.grade || c.gradeLevel || 11,
        academicYear: c.academicYear,
        studentCount: c.studentCount,
        hasGroups: c.hasGroups ?? true,
        groupCounts: c.groupCounts,
      }));
    } catch {
      return [];
    }
  }

  async getRoster(tenantId: string, classGroupId?: string): Promise<StudentRosterRecord[]> {
    try {
      const list = await httpClient.get<BackendStudentItem[]>('/students', {
        params: { tenantSlug: tenantId, classGroupId },
      });
      return list.map((s) => ({
        id: s.id,
        tenantId: s.tenantId,
        schoolId: s.schoolId,
        classGroupId: s.classGroupId,
        rosterCode: s.rosterCode,
        firstName: s.firstName,
        lastName: s.lastName,
        middleName: s.middleName,
        group: s.group || null,
        emaktabId: s.emaktabId || null,
        status: (s.status === 'inactive' ? 'inactive' : 'eligible') as 'eligible' | 'inactive',
        availableAssessmentIds: s.availableAssessmentIds || [],
      }));
    } catch {
      return [];
    }
  }

  async getAssessments(tenantId: string): Promise<AssessmentSummary[]> {
    try {
      const list = await httpClient.get<BackendAssessmentItem[]>('/assessments', { params: { tenantId } });
      return list.map((a) => ({
        id: a.id,
        tenantId: tenantId || 'tenant-al-xorazmiy',
        title: a.title,
        subject: a.subject,
        grade: a.gradeLevel || 11,
        quarter: a.quarter || 1,
        assessmentNumber: 1,
        durationMinutes: a.durationMinutes || 45,
        durationSeconds: (a.durationMinutes || 45) * 60,
        questionCount: a.totalQuestions || 15,
        maxScore: a.maxScore || 40,
        targetGroup: a.targetGroup || 'all',
        status: 'available' as const,
      }));
    } catch {
      return [];
    }
  }

  async createAssessment(input: CreateAssessmentInput): Promise<AssessmentSummary> {
    const res = await httpClient.post<BackendAssessmentItem>('/assessments', input);
    return {
      id: res.id,
      tenantId: 'tenant-al-xorazmiy',
      title: res.title,
      subject: res.subject,
      grade: res.gradeLevel || input.gradeLevel,
      quarter: input.quarter || 1,
      assessmentNumber: 1,
      durationMinutes: res.durationMinutes || input.durationMinutes,
      durationSeconds: (res.durationMinutes || input.durationMinutes) * 60,
      questionCount: res.totalQuestions || input.totalQuestions,
      maxScore: res.maxScore || input.maxScore,
      targetGroup: res.targetGroup || input.targetGroup || 'all',
      status: 'available' as const,
    };
  }

  async getResults(tenantId: string): Promise<AssessmentResult[]> {
    try {
      return await httpClient.get<AssessmentResult[]>(`/results/tenant/${tenantId}`);
    } catch {
      return [];
    }
  }

  async gradeResult(attemptId: string, input: GradeResultInput): Promise<AssessmentResult> {
    return await httpClient.patch<AssessmentResult>(`/assessments/results/${attemptId}/grade`, {
      score: input.score,
      rubricScores: input.rubricScores,
      feedback: input.feedback,
      verifiedByTeacher: input.verifiedByTeacher ?? true,
    });
  }

  async getQuarterGradebook(
    tenantId: string,
    options?: { classGroupId?: string; subjectCode?: string; quarter?: number; academicYear?: string }
  ): Promise<QuarterGradebookResponse> {
    return await httpClient.get<QuarterGradebookResponse>('/gradebook/quarter', {
      params: {
        tenantId,
        classGroupId: options?.classGroupId,
        subjectCode: options?.subjectCode,
        quarter: options?.quarter ?? 1,
        academicYear: options?.academicYear ?? '2026-2027',
      },
    });
  }

  async saveFormativeScore(input: FormativeScoreInput): Promise<{ totalScore: number }> {
    return await httpClient.post<{ totalScore: number }>('/gradebook/formative', input);
  }

  async getStudentsMastery(
    tenantId: string,
    options?: { classGroupId?: string; quarter?: number }
  ): Promise<StudentsMasteryResponse> {
    return await httpClient.get<StudentsMasteryResponse>(`/analytics/${tenantId}/students-mastery`, {
      params: {
        classGroupId: options?.classGroupId,
        quarter: options?.quarter ?? 1,
      },
    });
  }

  async getStudentMastery(
    tenantId: string,
    studentId: string,
    quarter = 1
  ): Promise<StudentMasteryDetail | null> {
    try {
      return await httpClient.get<StudentMasteryDetail>(`/analytics/${tenantId}/students/${studentId}/mastery`, {
        params: { quarter },
      });
    } catch {
      return null;
    }
  }

  async getProfile(tenantId: string): Promise<TeacherProfile> {
    interface AuthMePayload {
      id: string;
      tenantId: string;
      schoolName?: string;
      username: string;
      fullName: string;
      role: string;
      email?: string;
    }
    const [me, classes] = await Promise.all([
      httpClient.get<AuthMePayload>('/auth/me'),
      this.getClasses(tenantId).catch(() => [] as ClassGroup[]),
    ]);
    return {
      id: me.id,
      tenantId: me.tenantId || tenantId,
      fullName: me.fullName,
      title: me.role === 'SCHOOL_ADMIN' ? 'Maktab ma’muri' : "Fan o'qituvchisi",
      email: me.email || `${me.username}@chsb.uz`,
      phone: '+998901234567',
      assignedSchoolName: me.schoolName || 'Ta’lim muassasasi',
      subjects: ['Informatika va AT'],
      assignedClassIds: classes.map((c) => c.id),
    };
  }

  async getClassDetail(_tenantId: string, classId: string): Promise<ClassDetail | null> {
    try {
      return await httpClient.get<ClassDetail>(`/classes/${classId}`);
    } catch {
      return null;
    }
  }

  async getStudentDetail(tenantId: string, studentId: string): Promise<StudentDetail | null> {
    try {
      const students = await httpClient.get<BackendStudentItem[]>('/students', { params: { tenantSlug: tenantId } });
      const found = students.find((s) => s.id === studentId || s.rosterCode === studentId);
      if (!found) return null;

      const results = await httpClient.get<AssessmentResult[]>(`/results/tenant/${tenantId}`);
      const studentResults = results.filter((r) => r.rosterRecordId === found.id);
      const avg =
        studentResults.length > 0
          ? Math.round(
              studentResults.reduce((acc, curr) => acc + (curr.score || 0), 0) /
                studentResults.length
            )
          : 0;

      return {
        roster: {
          id: found.id,
          tenantId: found.tenantId,
          schoolId: found.schoolId,
          classGroupId: found.classGroupId,
          rosterCode: found.rosterCode,
          firstName: found.firstName,
          lastName: found.lastName,
          middleName: found.middleName,
          status: (found.status === 'inactive' ? 'inactive' : 'eligible') as 'eligible' | 'inactive',
          availableAssessmentIds: found.availableAssessmentIds || [],
        },
        className: found.className || '11-sinf',
        schoolName: "Ta'lim muassasasi",
        results: studentResults,
        attendanceRate: 100,
        averageScore: avg,
      };
    } catch {
      return null;
    }
  }

  async getAssessmentDetail(
    tenantId: string,
    assessmentId: string
  ): Promise<AssessmentDetail | null> {
    try {
      interface StatsPayload {
        totalAssigned: number;
        totalCompleted: number;
        completionRate: number;
        averageScore: number;
        questionStats: Array<{ order: number; cognitiveLevel: string; points: number; correctRate: number }>;
      }
      const [assessment, stats] = await Promise.all([
        httpClient.get<Assessment>(`/assessments/${assessmentId}`),
        httpClient
          .get<StatsPayload>(`/assessments/${assessmentId}/stats`, { params: { tenantId } })
          .catch(() => ({
            totalAssigned: 0,
            totalCompleted: 0,
            completionRate: 0,
            averageScore: 0,
            questionStats: [],
          })),
      ]);
      if (!assessment) return null;

      return {
        summary: {
          id: assessment.id,
          tenantId: assessment.tenantId,
          title: assessment.title,
          subject: assessment.subject,
          grade: assessment.grade,
          quarter: assessment.quarter,
          assessmentNumber: assessment.assessmentNumber,
          durationMinutes: assessment.durationMinutes,
          durationSeconds: assessment.durationSeconds,
          questionCount: assessment.questionCount,
          maxScore: assessment.maxScore,
          status: assessment.status,
        },
        totalAssigned: stats.totalAssigned,
        totalCompleted: stats.totalCompleted,
        completionRate: stats.completionRate,
        averageScore: stats.averageScore,
        questionStats: stats.questionStats,
        questions: (assessment as unknown as { questions?: AssessmentDetail['questions'] }).questions || [],
      };
    } catch {
      return null;
    }
  }

  async getAnalytics(tenantId: string): Promise<AnalyticsData> {
    try {
      const data = await httpClient.get<BackendAnalyticsResponse>(`/analytics/${tenantId}`);
      return {
        classComparisons: data.classComparisons || [],
        scoreDistribution: {
          excellent: data.scoreDistribution?.excellent || 0,
          good: data.scoreDistribution?.good || 0,
          satisfactory: data.scoreDistribution?.satisfactory || 0,
          needsImprovement: data.scoreDistribution?.unsatisfactory || 0,
        },
        cognitiveBreakdown: {
          knowledge: {
            label: 'Bilish (B)',
            points: 10,
            averageAccuracy: data.cognitiveBreakdown?.knowledge ?? 0,
          },
          application: {
            label: "Qo'llash (Q)",
            points: 20,
            averageAccuracy: data.cognitiveBreakdown?.application ?? data.cognitiveBreakdown?.comprehension ?? 0,
          },
          reasoning: {
            label: 'Mulohaza (M)',
            points: 10,
            averageAccuracy: data.cognitiveBreakdown?.analysis ?? 0,
          },
        },
      };
    } catch {
      return {
        classComparisons: [],
        scoreDistribution: { excellent: 0, good: 0, satisfactory: 0, needsImprovement: 0 },
        cognitiveBreakdown: {
          knowledge: { label: 'Bilish (B)', points: 10, averageAccuracy: 0 },
          application: { label: "Qo'llash (Q)", points: 20, averageAccuracy: 0 },
          reasoning: { label: 'Mulohaza (M)', points: 10, averageAccuracy: 0 },
        },
      };
    }
  }

  async generateReportData(
    tenantId: string,
    _options?: { classGroupId?: string; assessmentId?: string }
  ): Promise<ReportItem[]> {
    try {
      interface ResultPayload {
        studentName?: string;
        className?: string;
        studentId?: string;
        assessmentId?: string;
        assessmentTitle?: string;
        score: number;
        maxScore?: number;
        percentage: number;
        grade: string;
        submittedAt: string;
        status: string;
      }
      const results = await httpClient.get<ResultPayload[]>(`/results/tenant/${tenantId}`);
      return results.map((r) => ({
        studentName: r.studentName || "O'quvchi",
        className: r.className || '11-sinf',
        rosterCode: r.studentId?.slice(0, 8) || 'STU-0001',
        assessmentTitle: r.assessmentTitle || 'CHSB Choraklik Baholash',
        score: r.score,
        maxScore: r.maxScore || 40,
        percentage: r.percentage,
        submittedAt: r.submittedAt,
        status: r.status === 'flagged' ? 'flagged' : 'verified',
      }));
    } catch {
      return [];
    }
  }
}

